const accountService = require('./accountService')(__filename);
const toolboxService = require('./toolboxService');
const httpClientService = require('./httpClientService');

// Load stores
const hpsmAATypesStore = require('../models/hpsmAATypesModel');
const hpsmContactsStore = require('../models/hpsmContactsModel');
const hpsmIncidentsStore = require('../models/hpsmIncidentsModel');
const hpsmComputersStore = require('../models/hpsmComputersModel');
const hpsmClosureCodesStore = require('../models/hpsmClosureCodesModel');
const hpsmAssignmentsStore = require('../models/hpsmAssignmentgroupsModel');
const hpsmCauseCodesStore	= require('../models/hpsmIncidentCauseCodesModel');
const hpsmIncidentStatusesStore	= require('../models/hpsmIncidentStatusesModel');
const hpsmAreaCategorySubCategoryStore = require('../models/hpsmAreaCategorySubCategoryModel');
const hpsmPrimaryAffectedServicesStore = require('../models/hpsmPrimaryAffectedServicesModel');

const incidentService = {};

// The following methods return an array of objects
incidentService.getAllNonClosedIncidents = async () => await hpsmIncidentsStore.getAllNonClosedIncidents();
//incidentService.getCauseCodes = async() => await hpsmCauseCodesStore.getCauseCodes();

// The following methods return a single object if found
incidentService.getContactByOperatorId = async (operatorId) => await hpsmIncidentsStore.getContactByOperatorId(operatorId);
incidentService.getContactByEmailAddress = async (emailAddress) => await hpsmIncidentsStore.getContactByEmail(emailAddress);
incidentService.getComputerPropertiesByIRSBarcode = async (IRSBarcode) => await hpsmIncidentsStore.getComputerPropertiesByIRSBarcode(IRSBarcode);
incidentService.getComputerPropertiesByDisplayName = async (displayName) => await hpsmIncidentsStore.getComputerPropertiesByDisplayName(displayName);
incidentService.getComputerPropertiesByLogicalName = async (logicalName) => await hpsmIncidentsStore.getComputerPropertiesByLogicalName(logicalName);

// The following methods return a single string value if found
incidentService.getIRSRespOrgByComputerDisplayName = async (displayName) => await hpsmIncidentsStore.getIRSRespOrgByComputerDisplayName(displayName);

// The following methods return a array of strings
incidentService.getAutoAssignTypes = async () => await hpsmAATypesStore.getAll();
incidentService.getStatuses = async () => await hpsmIncidentStatusesStore.getAll();
incidentService.getClosureCodes = async () => await hpsmClosureCodesStore.getAll();
incidentService.getAssignmentGroups = async () => await hpsmAssignmentsStore.getAll();

// The following methods return an array of arrays of string types

incidentService.getAreaCategorySubCategory = async() => {
	return await _modelCall('getAreaCategorySubCategory', hpsmAreaCategorySubCategoryStore, 'hpsmAreaCategorySubCategoryStore', undefined, 'getAll');
};
incidentService.getPrimaryAffectedServices = async() => {
	return await _modelCall('getPrimaryAffectedServices', hpsmPrimaryAffectedServicesStore, 'hpsmPrimaryAffectedServicesStore', undefined, 'getAll');
};

incidentService.getEligibleAssigneesByGroup = async (groupName) => {
	toolboxService.validate({ assignmentGroupName: groupName }, 'hpsmAssignmentGroupName');
	const accountInfo = accountService.getCreds();

	const uri1 = `/SM/9/rest/OperatorAPI/?query=AssignmentGroups=%22${encodeURI(groupName)}%22`;
	const uri2 = encodeURI(` and EssOnly="false" and TemplateOperator="false"`);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `${uri1}${uri2}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET',
		useTls: accountInfo.useTls
	};

	let response;
	try {
		response = await httpClientService.asyncRequest(config);
	} catch (e) {
		throw new Error(`Error encountered while attempting to contact HPSM server: ${e.message}`);
	}
	if (response.message.statusCode === 200) {
		response.data = JSON.parse(response.data);
		if (response.data['@totalcount'] === 0) return [];
		return data.content.map(e => e.OperatorAPI.Name);
	} 
	throw new Error(`HTTP ${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(data)}`);
};

incidentService.getIncidentById = async(id) => {
	toolboxService.validate({ IncidentID: id }, 'hpsmIncidentId');
	const accountInfo = accountService.getCreds();

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `/SM/9/rest/incidents/${id}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET'
	};

	let response;
	try {
		response = await httpClientService.asyncRequest(config);
	} catch (e) {
		throw new Error(`Error encountered while retrieving incident from ${host}: ${e.message}`);
	}
	if (response.message.statusCode === 200 && response.data.ReturnCode === 0) {
		const data = JSON.parse(response.data);
		return data.Incident;
	}
	throw new Error(`HTTP ${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(data)}`);
}

incidentService.createIncident = async(incident) => {
	const newIncident = toolboxService.cloneAndValidate(incident, 'hpsmNewIncident');
	const accountInfo = accountService.getCreds();
	
	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: '/SM/9/rest/incidents',
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'POST'
	};
	
	await _validateFieldValues(newIncident);
	await _duplicateOpenIncidentDetection(newIncident);
	config.body = jSON.stringify({ Incident: newIncident });
		
	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode === 200 && response.data.ReturnCode === 0) {
		try {
			const data = JSON.parse(response.data);
			return data;
		} catch (e) {
			throw new Error(`Received JSON data from HPSM server that was not well formed: ${e.message}`)
		}
	}
	throw new Error(`HTTP ${response.message.statusCode} ${response.message.statusMessage} ${JSON.stringify(data)}`);
}

incidentService.updateIncident = async(incident) => {
	toolboxService.validate({ incidentID: incident.IncidentID }, 'hpsmIncidentId');
	const accountInfo = accountService.getCreds(appConfig.HPSMServiceAcctId);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `/SM/9/rest/incidents/${incident.IncidentID}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'POST'
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
	delete retrievedIncident.JournalUpdates;	delete retrievedIncident.OpenTime;
	delete retrievedIncident.OpenedBy;				delete retrievedIncident.UpdatedBy;
	delete retrievedIncident.UpdatedTime;			delete retrievedIncident.AlertStatus;
	delete retrievedIncident.MajorIncident;		delete retrievedIncident['problem.type'];
	delete retrievedIncident.ClosedBy;				delete retrievedIncident.ClosedTime;
	
	let mergedIncident = {};
	Object.assign(mergedIncident, retrievedIncident, incidentUpdate);
	
	toolboxService.validate(mergedIncident, 'hpsmExistingIncident');
	await _validateFieldValues(mergedIncident);
	body = jSON.stringify(toolbox.clone({ Incident: mergedIncident }));
	
	if (mergedIncident.Status.toLowerCase() === 'resolved') config.path = `${config.path}/action/resolve`;
	if (mergedIncident.Status.toLowerCase() === 'closed')   config.path = `${config.path}/action/close`;
	
	const response = await httpClientService.asyncRequest(config);
	if (response.message.statusCode > 0) {
		const data = JSON.parse(response.data);
		response.message.returnCode = data.ReturnCode;
		// read data.Messages (its an array of strings) for application response
	}
	return response;
};

//######################################################################//
// Top Level Private Functions (Called by methods upstairs)				//
//######################################################################//

async function _validateFieldValues(incident) {
	_isFieldValueValid(incident, 'Status', hpsmIncidentStatusesStore);
	_isFieldValueValid(incident, 'ClosureCode', hpsmClosureCodesStore);
	_isFieldValueValid(incident, 'AutoAssignType', hpsmAATypesStore);
	_isFieldValueValid(incident, 'AssignmentGroup', hpsmAssignmentsStore);
	_isFieldValueValid(incident, 'Service', hpsmPrimaryAffectedServicesStore, 0);
	_isFieldValueValid(incident, 'Contact', hpsmContactsStore, 0);
	_checkForValidAreaCategorySubCategory(incident);
	await _checkForValidAssignee(incident);
	_checkForValidCauseCode(incident);
	_checkForOutageEndTimeBeforeOutageStartTime(incident);
	_checkForOutageEndTimeOnResolveOrClose(incident);
}

//######################################################################//
// Incident Object Validation Rules										//
//######################################################################//

function _isFieldValueValid(incident, field, store, index) {
	let validEntries;
	if (typeof incident[field] === 'undefined') return;
	const data = store.getAll();
	if (typeof index === 'number') {
		validEntries = data.filter(e=> e[index] === incident[field]);
	} else {
		validEntries = data.filter(e=> e === incident[field]);
	}
	if (validEntries.length === 0) throw new Error(`${field} is invalid`);
}

function _checkForOutageEndTimeBeforeOutageStartTime(incident) {
	if (!incident.OutageEndTime) return;
	if (incident.IncidentID && !incident.OutageStartTime) throw new Error('OutageStartTime not provided');
	const startTime = new Date(incident.OutageStartTime) - 0;
	const endTime = new Date(incident.OutageEndTime) - 0;
	if (startTime > endTime) throw new Error('OutageEndTime cannot occur before OutageStartTime');
}

function _checkForOutageEndTimeOnResolveOrClose(incident) {
	if (incident.Status === 'Resolved' && (typeof incident.OutageEndTime === 'undefined' || incident.OutageEndTime === '')) {
		throw new Error('OutageEndTime is required when resolving incident');
	}
	if (incident.Status === 'Closed' && (typeof incident.OutageEndTime === 'undefined' || incident.OutageEndTime === '')) {
		throw new Error('OutageEndTime is required when closing incident');
	}
}

function _checkForValidCauseCode(incident) {
	if (typeof(incident.CauseCode) === 'string' && incident.CauseCode.length > 0) {
		if (typeof(incident.Area) 		 === 'undefined' || 
			typeof(incident.Subcategory) === 'undefined' ||
			typeof(incident.Category) 	 === 'undefined'
		) throw new Error('CauseCode requires Area and Category and Subcategory values'); 
		const data = hpsmCauseCodesStore.getAll();
		let validEntries = data.filter(e => e.Area === incident.Area || e.Area === 'ALL');
		validEntries = validEntries.filter(e => e.SubCategory === incident.Subcategory);
		validEntries = validEntries.filter(e => e.CauseCode === incident.CauseCode);
		if (validEntries.length === 0) throw new Error('CauseCode is invalid');
	}
}

async function _checkForValidAssignee(incident) {
	// IncidentID means an update request, If AG or assignee are missing call HPSM to set values if necessary
	if (typeof incident.IncidentID === 'string' && typeof incident.Assignee !== 'string') {
		try {
			const hpsmIncident = await incidentService.getIncidentById(incident.IncidentID);
			if (typeof(incident.AssignmentGroup) === 'undefined') incident.AssignmentGroup = hpsmIncident.AssignmentGroup;
			if (hpsmIncident.AssignmentGroup === incident.AssignmentGroup) {
				incident.Assignee = hpsmIncident.Assignee;
			} else {
				incident.Assignee = ''; // If assignment group changed then clear out Assignee
			}
		} catch(e) {
			throw new Error(e.message);
		}
	}
	if (incident.Assignee === '' || typeof(incident.Assignee) === 'undefined') {
		if (typeof(incident.Status) !== 'undefined' && incident.Status.toLowerCase() === 'resolved') throw new Error('Assignee is required when resolving incident');
		if (typeof(incident.Status) !== 'undefined' && incident.Status.toLowerCase() === 'closed') throw new Error('Assignee is required when closing incident');
	}
	if (incident.Assignee === '' || typeof incident.Assignee === 'undefined') return;
	const data = await incidentService.getEligibleAssigneesByGroup(incident.AssignmentGroup);
	let validEntries = data.filter(e => e.toUpperCase() === incident.Assignee.toUpperCase());
	if (validEntries.length === 0) throw new Error('Assignee is invalid');
}

function _isValidAreaCategorySubCategoryCombination(incident) {
	if (typeof incident.Area === 'undefined' && typeof incident.Category === 'undefined' && typeof incident.Subcategory === 'undefined') return;
	const acs = hpsmAreaCategorySubCategoryStore.getAll();
	let validEntries = acs.filter(e => e.Area === incident.Area);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter(e => e.Category === incident.Category);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter(e => e.SubCategory === incident.Subcategory);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
}

async function _duplicateOpenIncidentDetection(incident) {
	// Dups have the following matching fields: AffectedCI and Title
	const openIncidents = hpsmIncidentsStore.getAllNonClosedIncidents();
	const potentialDuplicateDetected = openIncidents.find( e => {
		const stored = e.Incident;
		if ( 
			   stored.IncidentID !== incident.IncidentID
			&& stored.AffectedCI === incident.AffectedCI 
			     && stored.Title === incident.Title
		) return true;
	});
	// Call HPSM to get the latest status incase the incident was closed by someone else
	if (potentialDuplicateDetected) {
		const id = potentialDuplicateDetected.Incident.IncidentID;
		let latest;
		try {
			latest = await incidentService.getIncidentById(id);
		} catch (e) {
			throw new Error(`Error encountered while querying HPSM for incident ${id}`);
		}
		if (latest.Incident.Status !== 'Closed') throw new Error(`Request is a duplicate of ${latest.Incident.IncidentID}`);
	}
}

module.exports = incidentService;
