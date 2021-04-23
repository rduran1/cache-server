/* eslint-disable no-return-await */
const { readFileSync } = require('fs');
const logger = require('./loggingService')(__filename);
const serviceAccountService = require('./serviceAccountService')(__filename);
const toolboxService = require('./toolboxService');

const httpClientService = require('./httpClientService');
const configurationService = require('./configurationService')(__filename);

let environment = configurationService.get('environment');
if (typeof environment === 'undefined') {
	configurationService.set({ environment: 'default' });
	environment = 'default';
}
logger.info(`hpsmIncidentService::environment value: "${environment}"`);
let accountInfo = serviceAccountService.getCredentials(environment);
if (typeof accountInfo === 'undefined' && environment === 'default') {
	accountInfo = { host: 'defaultserver', port: 80, username: 'username', password: 'secret' };
	serviceAccountService.setCredentials(accountInfo, 'default');
}

toolboxService.validate(accountInfo, 'hpsmIncidentService_serviceAccount');
const serviceAccount = {
	host: accountInfo.host,
	port: accountInfo.port,
	auth: `${accountInfo.username}:${accountInfo.password}`,
	useTls: accountInfo.useTls,
	rejectUnauthorized: accountInfo.rejectUnauthorized
};

try { // Used when client authentication is required for REST API call, passed to httpclient request config
	if (typeof accountInfo.keyFileName === 'string') {
		serviceAccount.key = readFileSync(accountInfo.keyFileName).toString();
		serviceAccount.cert = readFileSync(accountInfo.certFileName).toString();
	}
} catch (e) {
	throw new Error(`Cannot read key and or cert file from config: ${e.message}`);
}

// Load data models
const hpsmAATypesModel = require('../models/hpsmAATypesModel');
const hpsmContactsModel = require('../models/hpsmContactsModel');
const hpsmIncidentsModel = require('../models/hpsmIncidentsModel');
const hpsmComputersModel = require('../models/hpsmComputersModel');
const hpsmClosureCodesModel = require('../models/hpsmClosureCodesModel');
const hpsmAssignmentgroupsModel = require('../models/hpsmAssignmentgroupsModel');
const hpsmIncidentStatusesModel = require('../models/hpsmIncidentStatusesModel');
const hpsmIncidentCauseCodesModel = require('../models/hpsmIncidentCauseCodesModel');
const hpsmAreaCategorySubCategoryModel = require('../models/hpsmAreaCategorySubCategoryModel');
const hpsmPrimaryAffectedServicesModel = require('../models/hpsmPrimaryAffectedServicesModel');

const incidentService = {};

// ########################################## //
// Beginning of Custom client service methods //
// ########################################## //
incidentService.saveToHpsmContactsModel = async (data) => {
	const arr = toolboxService.parseCsvToArray(data);
	await hpsmContactsModel.save(arr);
};

incidentService.saveToHpsmComputersModel = async (data) => {
	const arr = toolboxService.parseCsvToArray(data);
	const validatedData = toolboxService.cloneAndValidate(arr, 'hpsmIncidentService_computers');
	await hpsmComputersModel.save(validatedData);
};

incidentService.saveToHpsmPrimaryAffectedServicesModel = async (data) => {
	const arr = toolboxService.parseCsvToArray(data);
	const validatedData = toolboxService.cloneAndValidate(arr, 'hpsmIncidentService_primaryAffectedServices');
	await hpsmPrimaryAffectedServicesModel.save(validatedData);
};

incidentService.getIRSRespOrgGroupByComputerDisplayName = async (computerName) => {
	const computer = await incidentService.getComputerPropertiesByDisplayName(computerName);
	if (computer) return computer.IRS_RESP_ORG;
	return undefined;
};

incidentService.getLogicalNameByComputerDisplayName = async (computerName) => {
	const computer = await incidentService.getComputerPropertiesByDisplayName(computerName);
	if (computer) return computer.LOGICAL_NAME;
	return undefined;
};
// #################################### //
// End of Custom client service methods //
// #################################### //

const clientCall = async function clientCall(config) {
	let response;
	try {
		response = await httpClientService.asyncRequest(config);
	} catch (e) {
		throw new Error(`Error contacting ${config.host}: ${e.message}`);
	}
	const emsg = [];
	emsg.push(`HPSM server ${config.host} responded with HTTP ${response.message.statusCode} ${response.message.statusMessage}`);
	if (response.data && response.data.ReturnCode) emsg.push(`ReturnCode: ${response.data.ReturnCode}`);
	if (Array.isArray(response.data.Messages)) emsg.push(response.data.Messages.join(' '));
	if (response.message.statusCode !== 200) throw new Error(emsg.join(' '));
	const data = JSON.parse(response.data);
	return toolboxService.clone(data);
};

// Refresh models data with HPSM API service
incidentService.syncModelState = async (model) => {
	if (typeof model !== 'object') throw new Error('Parameter must be of type model object');
	let path;
	try {
		path = model.getApiDataPath();
	} catch (e) {
		throw new Error('Model does not support syncModelState method');
	}
	const config = toolboxService.clone(serviceAccount);
	config.path = path;
	config.method = 'GET';
	const data = await clientCall(config);
	await model.save(data);
};

incidentService.syncModels = async () => {
	try {
		await incidentService.syncModelState(hpsmAATypesModel);
		await incidentService.syncModelState(hpsmClosureCodesModel);
		await incidentService.syncModelState(hpsmIncidentStatusesModel);
		await incidentService.syncModelState(hpsmAssignmentgroupsModel);
		await incidentService.syncModelState(hpsmIncidentCauseCodesModel);
		await incidentService.syncModelState(hpsmAreaCategorySubCategoryModel);
	} catch (e) {
		logger.error(e.message);
	}
};

// The following methods return an array of objects or undefined if nothing is found
incidentService.getAllCauseCodes = async () => await hpsmIncidentCauseCodesModel.getAll();
incidentService.getAllNonClosedIncidents = async () => await hpsmIncidentsModel.getAllNonClosedIncidents();
incidentService.getAllAreaCategorySubCategory = async () => await hpsmAreaCategorySubCategoryModel.getAll();
incidentService.getAllPrimaryAffectedServices = async () => await hpsmPrimaryAffectedServicesModel.getAll();

// The following methods return a single object if found
incidentService.getContactByOperatorId = async (operatorId) => await hpsmContactsModel.getContactByOperatorId(operatorId);
incidentService.getContactByEmail = async (emailAddress) => await hpsmContactsModel.getContactByEmail(emailAddress);
incidentService.getComputerPropertiesByIRSBarcode = async (IRSBarcode) => await hpsmComputersModel.getComputerPropertiesByIRSBarcode(IRSBarcode);
incidentService.getComputerPropertiesByDisplayName = async (displayName) => await hpsmComputersModel.getComputerPropertiesByDisplayName(displayName);
incidentService.getComputerPropertiesByLogicalName = async (logicalName) => await hpsmComputersModel.getComputerPropertiesByLogicalName(logicalName);

// The following methods return a array of strings
incidentService.getAllAutoAssignTypes = async () => await hpsmAATypesModel.getAll();
incidentService.getAllStatuses = async () => await hpsmIncidentStatusesModel.getAll();
incidentService.getAllClosureCodes = async () => await hpsmClosureCodesModel.getAll();
incidentService.getAllAssignmentGroups = async () => await hpsmAssignmentgroupsModel.getAll();

async function duplicateOpenIncidentDetection(incident) {
	// Dups have the following matching fields: AffectedCI and Title
	// Need to convert CI displayname to logical name before AffectedCI comparison
	const openIncidents = await hpsmIncidentsModel.getAllNonClosedIncidents();
	if (openIncidents.length === 0) return;
	let logicalName = '';
	if (/CI\d\d\d\d\d\d\d/.test(incident.AffectedCI)) {
		logicalName = incident.AffectedCI;
	} else {
		logicalName = await incidentService.getLogicalNameByComputerDisplayName(incident.AffectedCI.split('.')[0]);
		if (!logicalName) logicalName = incident.AffectedCI;
	}
	const potentialDuplicateDetected = openIncidents.filter((el) => {
		if (el.IncidentID !== incident.IncidentID
			&& (el.AffectedCI === incident.AffectedCI || el.AffectedCI === logicalName)
			&& el.Title === incident.Title
		) return true;
		return false;
	});
	// Call HPSM to get the latest status incase the incident was closed by someone else
	for (let i = 0; i < potentialDuplicateDetected.length; i++) {
		const id = potentialDuplicateDetected[i].IncidentID;
		let latest;
		try {
			// eslint-disable-next-line no-await-in-loop
			latest = await incidentService.getIncidentById(id);
		} catch (e) {
			if (!e.message.includes('404 ReturnCode: 9 ')) throw new Error(e.message);
		}
		if (typeof latest !== 'undefined' && latest.Status !== 'Closed') throw new Error(`Request is a duplicate of ${latest.IncidentID}`);
	}
}

async function checkForValidAssignee(incident) {
	// IncidentID means an update request, If AG or assignee are missing call HPSM to set values if necessary
	if (typeof incident.IncidentID === 'string' && typeof incident.Assignee !== 'string') {
		const hpsmIncident = await incidentService.getIncidentById(incident.IncidentID);
		if (typeof incident.AssignmentGroup === 'undefined' && incident.AssignmentGroup === '') {
			// eslint-disable-next-line no-param-reassign
			incident.AssignmentGroup = hpsmIncident.AssignmentGroup;
		}
		// eslint-disable-next-line no-param-reassign
		incident.Assignee = hpsmIncident.AssignmentGroup === incident.AssignmentGroup ? hpsmIncident.Assignee : '';
	}
	if (incident.Assignee === '' || typeof incident.Assignee === 'undefined') return;
	const eligibleAssignees = await incidentService.getEligibleAssigneesByGroup(incident.AssignmentGroup);
	if (!eligibleAssignees.includes(incident.Assignee)) throw new Error('Assignee is invalid');
}

async function validateFieldValues(incident) {
	if (typeof incident.Status !== 'undefined' && !hpsmIncidentStatusesModel.includes(incident.Status)) {
		throw new Error('Status is not a valid entry');
	}
	if (typeof incident.ClosureCode !== 'undefined' && !hpsmClosureCodesModel.includes(incident.ClosureCode)) {
		throw new Error('ClosureCode is not a valid entry');
	}
	if (typeof incident.AutoAssignType !== 'undefined' && !hpsmAATypesModel.includes(incident.AutoAssignType)) {
		throw new Error('AutoAssignType is not a valid entry');
	}
	if (typeof incident.AssignmentGroup !== 'undefined' && !hpsmAssignmentgroupsModel.includes(incident.AssignmentGroup)) {
		throw new Error('AssignmentGroup is not a valid entry');
	}
	if (typeof incident.Service !== 'undefined' && !hpsmPrimaryAffectedServicesModel.includes(incident.Service)) {
		throw new Error('Service is not a valid entry');
	}
	if (typeof incident.Contact !== 'undefined' && !hpsmContactsModel.includes(incident.Contact)) {
		throw new Error('Contact is not a valid entry');
	}
	hpsmAreaCategorySubCategoryModel.validateCombinationTest(incident);
	hpsmIncidentCauseCodesModel.validateCombinationTest(incident);
	await checkForValidAssignee(incident);
}

incidentService.getEligibleAssigneesByGroup = async (groupName) => {
	toolboxService.validate({ assignmentGroupName: groupName }, 'hpsmIncidentService_assignmentGroupName');

	const uri1 = `/SM/9/rest/OperatorAPI/?query=AssignmentGroups=%22${encodeURI(groupName.replace(/&/g, '%26'))}%22`;
	const uri2 = encodeURI(' and EssOnly="false" and TemplateOperator="false"');

	const config = toolboxService.clone(serviceAccount);
	config.path = `${uri1}${uri2}`;
	config.method = 'GET';
	const data = await clientCall(config);
	if (data['@totalcount'] === 0) return [];
	return data.content.map((e) => e.OperatorAPI.Name);
};

incidentService.getIncidentById = async (id) => {
	toolboxService.validate({ IncidentID: id }, 'hpsmIncidentService_incidentId');
	const config = toolboxService.clone(serviceAccount);
	config.path = `/SM/9/rest/incidents/${id}`;
	config.method = 'GET';
	const data = await clientCall(config);
	await hpsmIncidentsModel.save(data.Incident);
	return data.Incident;
};

incidentService.createIncident = async (incident) => {
	const newIncident = toolboxService.cloneAndValidate(incident, 'hpsmIncidentService_incident');

	const config = toolboxService.clone(serviceAccount);
	config.path = '/SM/9/rest/incidents';
	config.method = 'POST';

	await validateFieldValues(newIncident);
	await duplicateOpenIncidentDetection(newIncident);
	config.body = JSON.stringify({ Incident: newIncident });

	const data = await clientCall(config);
	await hpsmIncidentsModel.save(data);
	return data;
};

incidentService.updateIncident = async (incident) => {
	toolboxService.validate({ IncidentID: incident.IncidentID }, 'hpsmIncidentService_incidentId');

	const config = toolboxService.clone(serviceAccount);
	config.path = `/SM/9/rest/incidents/${incident.IncidentID}`;
	config.method = 'POST';

	const retrievedIncident = await incidentService.getIncidentById(incident.IncidentID);

	// Convert Description and Solution array to a string type if necessary
	if (Array.isArray(retrievedIncident.Description)) {
		retrievedIncident.Description = retrievedIncident.Description.join();
	}
	if (Array.isArray(retrievedIncident.Solution)) {
		retrievedIncident.Solution = retrievedIncident.Solution.join();
	}

	// Remove properties that are not used by HPSM when performing an update
	delete retrievedIncident.JournalUpdates;
	delete retrievedIncident.OpenTime;
	delete retrievedIncident.OpenedBy;
	delete retrievedIncident.UpdatedBy;
	delete retrievedIncident.UpdatedTime;
	delete retrievedIncident.AlertStatus;
	delete retrievedIncident.MajorIncident;
	delete retrievedIncident['problem.type'];
	delete retrievedIncident.ClosedBy;
	delete retrievedIncident.ClosedTime;

	const mergedIncident = {};
	Object.assign(mergedIncident, retrievedIncident, incident);
	toolboxService.validate(mergedIncident, 'hpsmIncidentService_incident');
	await validateFieldValues(mergedIncident);
	config.body = JSON.stringify({ Incident: mergedIncident });
	if (mergedIncident.Status.toLowerCase() === 'resolved') config.path = `${config.path}/action/resolve`;
	if (mergedIncident.Status.toLowerCase() === 'closed') config.path = `${config.path}/action/close`;
	const data = await clientCall(config);
	await hpsmIncidentsModel.save(data);
	return data;
};

module.exports = incidentService;
