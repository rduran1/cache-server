const verboseLogging = true;
const logJSONObjects = false;

const path		= require('path');
const appConfig	= require(path.join(__dirname, '..', '..', 'data_store', 'appSettings'));
const logFile	= path.join(appConfig.logDirectory, 'incidentService.log'); 
const logger	= require('logger')({ outfile: logFile, verbose: verboseLogging});

const maxIncidentIdLength = 12;  // Protect the HPSM REST API from overflows due to long incident params
const maxGroupNameLength  = 100; // Protect the HPSM REST API from long URLS by limiting the length of the group name

// Load stores
const hpsmAATypesStore					= require('../models/hpsmAATypesModel');
const hpsmContactsStore					= require('../models/hpsmContactsModel');
const hpsmLocationsStore				= require('../models/hpsmLocationsModel');
const hpsmIncidentsStore				= require('../models/hpsmIncidentsModel');
const hpsmComputersStore				= require('../models/hpsmComputersModel');
const hpsmGlobalListsStore 				= require('../models/hpsmGlobalListsModel');
const hpsmClosureCodesStore				= require('../models/hpsmClosureCodesModel');
const hpsmAssignmentsStore				= require('../models/hpsmAssignmentgroupsModel');
const hpsmIncidentStatusesStore			= require('../models/hpsmIncidentStatusesModel');
const hpsmCauseCodesStore				= require('../models/hpsmIncidentCauseCodesModel');
const hpsmAreaCategorySubCategoryStore	= require('../models/hpsmAreaCategorySubCategoryModel');
const hpsmPrimaryAffectedServicesStore	= require('../models/hpsmPrimaryAffectedServicesModel');

// Load schemas
const hpsmNewIncidentSchema				= require('../schemas/hpsmNewIncidentSchema');
const hpsmExistingIncidentSchema		= require('../schemas/hpsmExistingIncidentSchema');

// Load services and utilities
const accountService					= require('../services/accountService');
const utils								= require('apis-utils');

const incidentService = {};

incidentService.getAllIncidents = async() => {
	return await _modelCall('getAllIncidents', hpsmIncidentsStore, 'hpsmIncidentsStore', undefined, 'getAll');
};

incidentService.getStatuses = async() => {
	return await _modelCall('getStatuses', hpsmIncidentStatusesStore, 'hpsmIncidentStatusesStore', undefined, 'getAll');
};

incidentService.getCauseCodes = async() => {
	return await _modelCall('getCauseCodes', hpsmCauseCodesStore, 'hpsmCauseCodesStore', undefined, 'getAll');
};

incidentService.getClosureCodes = async() => {
	return await _modelCall('getClosureCodes', hpsmClosureCodesStore, 'hpsmClosureCodesStore', undefined, 'getAll');
};

incidentService.getAutoAssignTypes = async() => {
	return await _modelCall('getAutoAssignTypes', hpsmAATypesStore, 'hpsmAATypesStore', undefined, 'getAll');
};

incidentService.getAssignmentGroups = async() => {
	return await _modelCall('getAssignmentGroups', hpsmAssignmentsStore, 'hpsmAssignmentsStore', undefined, 'getAll');
};

incidentService.getAreaCategorySubCategory = async() => {
	return await _modelCall('getAreaCategorySubCategory', hpsmAreaCategorySubCategoryStore, 'hpsmAreaCategorySubCategoryStore', undefined, 'getAll');
};

incidentService.getPrimaryAffectedServices = async() => {
	return await _modelCall('getPrimaryAffectedServices', hpsmPrimaryAffectedServicesStore, 'hpsmPrimaryAffectedServicesStore', undefined, 'getAll');
};

incidentService.getContact = async(requester) => {
	_validateStringArgProvided(requester, 'getContact', 'requester');
	return await _modelCall('getContact', hpsmContactsStore, 'hpsmContactsStore', requester);
};

incidentService.getComputerProperties = async(computer) => {
	_validateStringArgProvided(computer, 'getComputerProperties', 'computer');
	return await _modelCall('getComputerProperties', hpsmComputersStore, 'hpsmComputersStore', computer);
};

incidentService.getComputerPropertiesJson = async(computer) => {
	_validateStringArgProvided(computer, 'getComputerProperties', 'computer');
	return await _modelCall('getComputerPropertiesJson', hpsmComputersStore, 'hpsmComputersStore', computer);
};

incidentService.getComputerLogicalName = async(computer) => {
	_validateStringArgProvided(computer, 'getComputerLogicalName', 'computer');
	return await _modelCall('getComputerLogicalName', hpsmComputersStore, 'hpsmComputersStore', computer);
};

incidentService.getIRSRespOrgGroupByComputer = async(computer) => {
	_validateStringArgProvided(computer, 'getIRSRespOrgGroupByComputer', 'computer');
	return await _modelCall('getIRSRespOrgGroupByComputer', hpsmComputersStore, 'hpsmComputersStore', computer);
};

incidentService.getEligibleAssigneesByGroup = async(group) => {
	_validateStringArgProvided(group, 'getEligibleAssigneesByGroup', 'group');
	
	if (group.length >= maxGroupNameLength) {
		const e = new Error(`incidentService.getEligibleAssigneesByGroup argument exceeds maxGroupNameLength of ${maxGroupNameLength} characters`);
		logger.error(e.message);
		throw(e);
	}
	
	logger.debug(`Entering incidentService.getEligibleAssigneesByGroup(${group}) service method`);
	
	let configForFetch = {};
	try {
		configForFetch = await _getServiceAccount(appConfig.HPSMServiceAcctId);
	} catch(e) {
		logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
		throw(e);
	}
	
	const grp = encodeURIComponent(group);
	const uri1 = `/SM/9/rest/OperatorAPI/?query=AssignmentGroups=%22${grp}%22`;
	const uri2 = encodeURI(` and EssOnly="false" and TemplateOperator="false"`);
	configForFetch.path = `${uri1}${uri2}`;
	configForFetch.method = 'GET';
	
	let result;
	
	try {
		result = await _fetchParseAppErrorCheckAndReturn(configForFetch);
		if (result.ReturnCode === 0 && result['@totalcount'] === 0) {
			logger.info('Fetch request returned 0 results');
			logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
			return [];
		}
	} catch(e) {
		logger.error(e.message);
		logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
	}
	
	try {
		logger.debug('Mapping through content.OperatorAPI namespace of fetched results');
		const operators = result.content.map(e => e.OperatorAPI.Name);
		logger.debug(`Fetch request returned ${operators.length} operator${operators.length > 1 ? 's' : ''}`);
		logger.debug(operators);
		logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
		return operators;	
    } catch(e) {
		logger.error(`Mapping of results returned error: ${e.message}`);
		logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
        throw (e);
    }
};

incidentService.getIncidentById = async(id) => {
	_validateStringArgProvided(id, 'getIncidentById', 'id');
	
	if (id.length > maxIncidentIdLength) {
		const e = new Error(`incidentService.getIncidentById argument exceeds maxIncidentIdLength of ${maxIncidentIdLength} characters`);
		logger.error(e.message);
		logger.debug(`Exiting incidentService.getIncidentById(${id}) service method`);
		throw(e);
	}
	
	logger.debug(`Entering incidentService.getIncidentById(${id}) service method`);
	
	let configForFetch;
	try {
		configForFetch = await _getServiceAccount(appConfig.HPSMServiceAcctId);
	} catch(e) {
		logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
		throw(e);
	}
		
	configForFetch.path   = `/SM/9/rest/incidents/${id}`;
	configForFetch.method = 'GET';
	
	let result;
	
	try { 
		result = await _fetchParseAppErrorCheckAndReturn(configForFetch, hpsmIncidentsStore, 'update');
		logger.debug(`Exiting incidentService.getIncidentById(${id}) service method`);
		return result;
	} catch(e) {
		logger.error(e.message);
		logger.debug(`Exiting incidentService.getIncidentById(${id}) service method`);
		throw(e);
	}
}

incidentService.createIncident = async(incident) => {
	logger.debug(`Entering incidentService.createIncident(incidentObject) service method`);
	
	let newIncident;
	
	let configForFetch;
	try {
		configForFetch = await _getServiceAccount(appConfig.HPSMServiceAcctId);
	} catch(e) {
		logger.debug(`Exiting incidentService.createIncident(incidentObject) service method`);
		throw(e);
	}
	
	try {
		newIncident = utils.clone(incident);
	} catch(e) {
		const err = new Error(`utils.clone method returned an error: ${e.message}`);
		logger.error(err.message);
		logger.debug(`Exiting incidentService.createIncident(incidentObject) service method`);
		throw(err);
	}
	
	configForFetch.method  = 'POST';
	configForFetch.path    = '/SM/9/rest/incidents';
	
	try {
		utils.validate(newIncident, hpsmNewIncidentSchema);
		await _validateFieldValues(newIncident);
		const ciLookupResult = _lookupValidCI(newIncident.AffectedCI);
		const affectedCI = ciLookupResult ? ciLookupResult : newIncident.AffectedCI;
		newIncident.AffectedCI = affectedCI;
		await _duplicateOpenIncidentDetection(newIncident);
		configForFetch.payload = { Incident: newIncident };
	} catch(e) {
		logger.error(e.message);
		logger.debug(`Exiting incidentService.createIncident(incidentObject) service method`);
		throw(e);
	}
	
	let result;
		
	try { 
		result = await _fetchParseAppErrorCheckAndReturn(configForFetch, hpsmIncidentsStore, 'create');
		logger.info(`Incident ${result.Incident.IncidentID} created`);
		logger.debug(`Exiting incidentService.createIncident(incidentObject) service method`);
		return result;
	} catch(e) {
		logger.error(e);
		logger.debug(`Exiting incidentService.createIncident(${result.Incident.IncidentID}) service method`);
		throw(e);
	}
}

incidentService.updateIncident = async(incident) => {
	logger.debug(`Entering incidentService.updateIncident(incidentObject) service method`);
	
	if (typeof incident !== 'object' || typeof incident.IncidentID !== 'string') {
		throw new Error('Called incidentService.updateIncident service method without incident object or object is missing IncidentID property');
	}
	
	let configForFetch;
	try {
		configForFetch = await _getServiceAccount(appConfig.HPSMServiceAcctId);
	} catch(e) {
		logger.debug(`Exiting incidentService.updateIncident(incidentObject) service method`);
		throw(e);
	}
	
	configForFetch.method = 'POST';
	configForFetch.path   = `/SM/9/rest/incidents/${incident.IncidentID}`;
	
	let retrievedIncident;
	try {
		retrievedIncident = await incidentService.getIncidentById(incident.IncidentID);
		retrievedIncident = retrievedIncident.Incident;
	} catch(e) {
		logger.error(e.message);
		logger.debug(`Exiting incidentService.updateIncident(incidentObject) service method`);
		throw(e);
	}
		
	// Convert Description and Solution array to a string type if necessary
	if (Array.isArray(retrievedIncident.Description)) retrievedIncident.Description = retrievedIncident.Description.join();
	if (Array.isArray(retrievedIncident.Solution)) retrievedIncident.Solution = retrievedIncident.Solution.join();
	
	// Remove unecesary fields from retrieved incident object
	delete retrievedIncident.JournalUpdates;	delete retrievedIncident.OpenTime;
	delete retrievedIncident.OpenedBy;			delete retrievedIncident.UpdatedBy;
	delete retrievedIncident.UpdatedTime;		delete retrievedIncident.AlertStatus;
	delete retrievedIncident.MajorIncident;		delete retrievedIncident['problem.type'];
	delete retrievedIncident.ClosedBy;			delete retrievedIncident.ClosedTime;
	
	let mergedIncident = {};
	Object.assign(mergedIncident, retrievedIncident, incident);
	
	try {
		utils.validate(mergedIncident, hpsmExistingIncidentSchema);
		await _validateFieldValues(mergedIncident);
		const ciLookupResult = _lookupValidCI(mergedIncident.AffectedCI);
		const affectedCI = ciLookupResult ? ciLookupResult : mergedIncident.AffectedCI;
		mergedIncident.AffectedCI = affectedCI;
		configForFetch.payload = { Incident: mergedIncident };
	} catch(e) {
		logger.error(e.message);
		logger.debug(`Exiting incidentService.updateIncident(${mergedIncident.IncidentID}) service method`);
		throw(e);
	}
	
	if (mergedIncident.Status.toLowerCase() === 'resolved') configForFetch.path = `${configForFetch.path}/action/resolve`;
	if (mergedIncident.Status.toLowerCase() === 'closed')   configForFetch.path = `${configForFetch.path}/action/close`;

	const incidentUpdate = utils.clone(mergedIncident);
	configForFetch.payload = { Incident: incidentUpdate };
	
	try { 
		result = await _fetchParseAppErrorCheckAndReturn(configForFetch, hpsmIncidentsStore, 'update');
		logger.debug(`Incident ${result.Incident.IncidentID} updated`);
		logger.debug(`Exiting incidentService.updateIncident(${mergedIncident.IncidentID}) service method`);
		return result;
	} catch(e) {
		logger.error(e);
		logger.debug(`Exiting incidentService.updateIncident(${mergedIncident.IncidentID}) service method`);
		throw(e);
	}
};

//######################################################################//
// Top Level Private Functions (Called by methods upstairs)				//
//######################################################################//

async function _modelCall(serviceName, model, modelName, param, modelMethodName) {
	// If no modelMethodName is provided then serviceName is assumed to be same as modelMethodName
	if (typeof modelMethodName === 'undefined') modelMethodName = serviceName;
	const p = param ? param : '';
	logger.debug(`Entering incidentService.${serviceName}(${p}) service method`);
	try {
		logger.debug(`Calling ${modelName}.${modelMethodName}(${p}) model method`);
		const retval = await model[modelMethodName](p);
		logger.debug(`Exiting ${modelName}.${modelMethodName}`);
		logger.debug(`Returning results from ${modelName}.${modelMethodName}(${p}) to caller`);
		logger.debug(`Exiting incidentService.${serviceName} service model`);
		return retval;
	} catch(e) {
		logger.error(`${modelName}.${modelMethodName}(${p}) returned error: ${e.message}`);
		logger.debug(`Exiting incidentService.${serviceName} service method`);
	}
}

async function _fetchParseAppErrorCheckAndReturn(configForFetch, store, storeMethod) {
	let serverResponse;
	
	if (verboseLogging && logJSONObjects) utils.logObject(configForFetch, 'configForFetch', logger);
	
	try { // Get data
		logger.debug(`Fetching data from ${configForFetch.useTls ? 'https' : 'http'}://${configForFetch.host}:${configForFetch.port}${configForFetch.path}`);
        serverResponse = await utils.fetch(configForFetch);
		logger.debug(`Fetch request to ${configForFetch.host} successful`);
    } catch(e) {
		const err = new Error(`Fetch request to ${configForFetch.host} returned an error: ${e.message}`);
        throw(err);
    }
	
	try {  // Parse data
		logger.debug(`Parsing response from ${configForFetch.host} into JSON`);
		serverResponse = utils.parseToJson(serverResponse);
		if (verboseLogging && logJSONObjects) utils.logObject(serverResponse, 'serverResponse', logger);
    } catch(e) {
		const err = new Error(`utils.parseToJson method returned an error: ${e.message}`);
        throw(err);
    }
	
	if (serverResponse.ReturnCode !== 0) {  // Check for application level errors
		logger.info(`HP Service Manager application level return code: ${serverResponse.ReturnCode}`);
		const err = new Error(`HP Service Manager application message: ${serverResponse.Messages.join('\n')}`);
		throw(err);
	}
	
	if (store) {
		try {  // Save result to store if store was provided
			logger.debug(`Calling hpsmIncidentsStore.${storeMethod}(serverResponse) to save results to store`);
			await store[storeMethod](serverResponse);
			return serverResponse;
		} catch(e) {
			const err = new Error(`Calling hpsmIncidentsStore.${storeMethod}(serverResponse) returned error: ${e.message}`);
			throw(err);
		}		
	} else {
		return serverResponse;
	}
}

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

function _lookupValidCI(AffectedCI) {
	let result;
	if (typeof AffectedCI === 'string') {
		if (/^CI\d{7,}/.test(AffectedCI)) {
			result = hpsmComputersStore.getAll().find(e => e[7] === AffectedCI.toUpperCase());
		} else {
			result = hpsmComputersStore.getAll().find(e => e[1].toUpperCase() === AffectedCI.toUpperCase());
		} 
		if (!result) {
			result = hpsmComputersStore.getAll().find(e => e[1].toUpperCase() === AffectedCI.split('.')[0].toUpperCase());
		}
		if (Array.isArray(result) && result.length > 7) return result[7];
	}	
}

function _validateStringArgProvided(param, serviceMethodName, parameterName) {
	if (typeof param !== 'string' || (typeof param === 'string' && param.length < 1)) {
		const e = new Error(`Called incidentService.${serviceMethodName} without providing ${parameterName}`);
		logger.error(e.message);
		throw(e);
	}	
}

async function _getServiceAccount(svcAcct) {
	logger.debug(`Calling accountService.getByActiveId(${svcAcct})`);
	const configForFetch = await accountService.getByActiveId(svcAcct);
	if (typeof configForFetch !== 'object') {
		const e = new Error(`accountService.getByActiveId(${svcAcct}) did not return a match`);
		logger.error(e.message);
		throw(e);
	}
	const clone = utils.clone(configForFetch);
	return clone;
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
	if (incident.IncidentID && (typeof(incident.Assignee) === 'undefined')) {
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

function _checkForValidAreaCategorySubCategory(incident) {
	if (typeof incident.Area === 'undefined' && typeof incident.Category === 'undefined' && typeof incident.Subcategory === 'undefined') return;
	const data = hpsmAreaCategorySubCategoryStore.getAll();
	let validEntries = data.filter(e => e.Area === incident.Area);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter(e => e.Category === incident.Category);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter(e => e.SubCategory === incident.Subcategory);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
}

async function _duplicateOpenIncidentDetection(incident) {
	// Dups have the following matching fields: AffectedCI and Title
	const openIncidents = hpsmIncidentsStore.getAll().filter(e => e.Incident.Status !== 'Closed');
	const potentialDup = openIncidents.find( e => {
		const stored = e.Incident;
		if ( 
			   stored.IncidentID !== incident.IncidentID
			&& stored.AffectedCI === incident.AffectedCI 
			     && stored.Title === incident.Title
		) return true;
	});
	// The dup is locally stored, if we find a dup that has a status not equal to closed, call HPSM
	// to get the latest status incase the incident was closed by someone else
	if (potentialDup) {
		logger.info(`Potential duplicate incident ${potentialDup.Incident.IncidentID} found in local store, querying HPSM to see if incident has been closed`);
		try {
			const latest = await incidentService.getIncidentById(potentialDup.Incident.IncidentID);
			if (latest.Incident.Status !== 'Closed') {
				throw new Error(`Request is a duplicate of ${potentialDup.Incident.IncidentID}`);
			}
		} catch(e) {
			// While uncommon it is possible for a incident to get purged from the HPSM database or a new environment is
			// setup in which case the locally stored incident will not be found when querying HPSM so check for condition here
			if (/No \(more\) records found/.test(e.message)) {
				logger.debug(`Local store copy of incident ${potentialDup.Incident.IncidentID} does not exist in HPSM, no dup detected`);
				return;
			} else {
				throw new Error(e.message);
			}
		}	
	}
}

module.exports = incidentService;
