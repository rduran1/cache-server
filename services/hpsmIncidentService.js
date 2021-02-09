/* eslint-disable no-return-await */
const accountService = require('./accountService')(__filename);
const toolboxService = require('./toolboxService');
const httpClientService = require('./httpClientService');
const configurationService = require('./configurationService');

const env = configurationService.getServiceEnvironment(__filename);

// Load data models
const hpsmAATypesModel = require('../models/hpsmAATypesModel');
const hpsmContactsModel = require('../models/hpsmContactsModel');
const hpsmIncidentsModel = require('../models/hpsmIncidentsModel');
const hpsmComputersModel = require('../models/hpsmComputersModel');
const hpsmClosureCodesModel = require('../models/hpsmClosureCodesModel');
const hpsmAssignmentgroupsModel = require('../models/hpsmAssignmentgroupsModel');
const hpsmIncidentCauseCodesModel = require('../models/hpsmIncidentCauseCodesModel');
const hpsmIncidentStatusesModel = require('../models/hpsmIncidentStatusesModel');
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
	await hpsmComputersModel.save(arr);
};

incidentService.saveToHpsmPrimaryAffectedServicesModel = async (data) => {
	const arr = toolboxService.parseCsvToArray(data);
	await hpsmPrimaryAffectedServicesModel.save(arr);
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

// Refresh models data with HPSM API service
incidentService.syncModelState = async (model) => {
	if (typeof model !== 'object') throw new Error('Parameter must be of type model object');
	const accountInfo = accountService.getCredentials(env);
	let path;
	try {
		path = model.getApiDataPath();
	} catch (e) {
		throw new Error('Model does not support syncModelState method');
	}
	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET',
		useTls: accountInfo.useTls
	};
	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode === 200) {
		const data = JSON.parse(response.data);
		await model.save(data);
	}
	if (response.message.statusCode === 404) {
		const data = JSON.parse(response.data);
		throw new Error(`404 ReturnCode: ${data.ReturnCode} ${data.Messages.join(' ')}`);
	}
};

incidentService.syncModels = async () => {
	await incidentService.syncModelState(hpsmAATypesModel);
	await incidentService.syncModelState(hpsmClosureCodesModel);
	await incidentService.syncModelState(hpsmIncidentStatusesModel);
	await incidentService.syncModelState(hpsmAssignmentgroupsModel);
	await incidentService.syncModelState(hpsmIncidentCauseCodesModel);
	await incidentService.syncModelState(hpsmAreaCategorySubCategoryModel);
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
	const openIncidents = await hpsmIncidentsModel.getAllNonClosedIncidents();
	if (typeof openIncidents === 'undefined') return;
	const potentialDuplicateDetected = openIncidents.find((el) => {
		if (el.IncidentID !== incident.IncidentID
			&& el.AffectedCI === incident.AffectedCI
			&& el.Title === incident.Title
		) return true;
		return false;
	});
	// Call HPSM to get the latest status incase the incident was closed by someone else
	if (potentialDuplicateDetected) {
		const id = potentialDuplicateDetected.IncidentID;
		const latest = await incidentService.getIncidentById(id);
		if (latest.Incident.Status !== 'Closed') throw new Error(`Request is a duplicate of ${latest.Incident.IncidentID}`);
	}
}

function checkForOutageEndTimeBeforeOutageStartTime(incident) {
	if (!incident.OutageEndTime) return;
	if (incident.IncidentID && !incident.OutageStartTime) throw new Error('OutageStartTime not provided');
	const startTime = new Date(incident.OutageStartTime) - 0;
	const endTime = new Date(incident.OutageEndTime) - 0;
	if (startTime > endTime) throw new Error('OutageEndTime cannot occur before OutageStartTime');
}

function checkForOutageEndTimeOnResolveOrClose(incident) {
	if (incident.Status === 'Resolved' && (typeof incident.OutageEndTime === 'undefined' || incident.OutageEndTime === '')) {
		throw new Error('OutageEndTime is required when resolving incident');
	}
	if (incident.Status === 'Closed' && (typeof incident.OutageEndTime === 'undefined' || incident.OutageEndTime === '')) {
		throw new Error('OutageEndTime is required when closing incident');
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
	if (incident.Assignee === '' || typeof incident.Assignee === 'undefined') {
		if (typeof incident.Status !== 'undefined' && incident.Status.toLowerCase() === 'resolved') {
			throw new Error('Assignee is required when resolving incident');
		}
		if (typeof incident.Status !== 'undefined' && incident.Status.toLowerCase() === 'closed') {
			throw new Error('Assignee is required when closing incident');
		}
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
	checkForOutageEndTimeBeforeOutageStartTime(incident);
	checkForOutageEndTimeOnResolveOrClose(incident);
	await checkForValidAssignee(incident);
}

incidentService.getEligibleAssigneesByGroup = async (groupName) => {
	toolboxService.validate({ assignmentGroupName: groupName }, 'hpsmAssignmentGroupName');
	const accountInfo = accountService.getCredentials(env);

	const uri1 = `/SM/9/rest/OperatorAPI/?query=AssignmentGroups=%22${encodeURI(groupName.replace(/&/g, '%26'))}%22`;
	const uri2 = encodeURI(' and EssOnly="false" and TemplateOperator="false"');

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `${uri1}${uri2}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET',
		useTls: accountInfo.useTls
	};

	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode === 200) {
		response.data = JSON.parse(response.data);
		if (response.data['@totalcount'] === 0) return [];
		return response.data.content.map((e) => e.OperatorAPI.Name);
	}
	throw new Error(`${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(response.data)}`);
};

incidentService.getIncidentById = async (id) => {
	toolboxService.validate({ IncidentID: id }, 'hpsmIncidentID');
	const accountInfo = accountService.getCredentials(env);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `/SM/9/rest/incidents/${id}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET',
		useTls: accountInfo.useTls
	};

	const response = await httpClientService.asyncRequest(config);
	let data;
	if (response.message.statusCode === 200) {
		data = JSON.parse(response.data).Incident;
		await hpsmIncidentsModel.save(data);
		return data;
	}
	if (response.message.statusCode === 404) {
		data = JSON.parse(response.data);
		throw new Error(`404 ReturnCode: ${data.ReturnCode} ${data.Messages.join(' ')}`);
	}
	throw new Error(`${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(data)}`);
};

incidentService.createIncident = async (incident) => {
	const newIncident = toolboxService.cloneAndValidate(incident, 'hpsmNewIncident');
	const accountInfo = accountService.getCredentials(env);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: '/SM/9/rest/incidents',
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'POST',
		useTls: accountInfo.useTls
	};

	await validateFieldValues(newIncident);
	await duplicateOpenIncidentDetection(newIncident);
	config.body = JSON.stringify({ Incident: newIncident });

	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode === 200) {
		let data;
		try {
			data = JSON.parse(response.data);
		} catch (e) {
			throw new Error(`Received JSON data from HPSM server that was not well formed: ${e.message}`);
		}
		await hpsmIncidentsModel.save(data);
		return data;
	}
	throw new Error(`HTTP ${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(response.data)}`);
};

incidentService.updateIncident = async (incident) => {
	toolboxService.validate({ incidentID: incident.IncidentID }, 'hpsmIncidentID');
	const accountInfo = accountService.getCredentials(env);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `/SM/9/rest/incidents/${incident.IncidentID}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'POST',
		useTls: accountInfo.useTls
	};

	const { Incident: retrievedIncident } = await incidentService.getIncidentById(incident.IncidentID);

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
	Object.assign(mergedIncident, retrievedIncident);

	toolboxService.validate(mergedIncident, 'hpsmExistingIncident');
	await validateFieldValues(mergedIncident);
	config.body = JSON.stringify({ Incident: mergedIncident });

	if (mergedIncident.Status.toLowerCase() === 'resolved') config.path = `${config.path}/action/resolve`;
	if (mergedIncident.Status.toLowerCase() === 'closed') config.path = `${config.path}/action/close`;

	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode > 0) {
		const data = JSON.parse(response.data);
		response.message.returnCode = data.ReturnCode;
		// read data.Messages (its an array of strings) for application response
	}
	return response;
};

module.exports = incidentService;
