const schemaService = require('./schemaService');
const accountService = require('./accountService');
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
	const accountInfo = accountService.getCreds(appConfig.HPSMServiceAcctId);

	const uri1 = `/SM/9/rest/OperatorAPI/?query=AssignmentGroups=%22${encodeURI(groupName)}%22`;
	const uri2 = encodeURI(` and EssOnly="false" and TemplateOperator="false"`);

	const config = {
		host: accountInfo.host,
		port: accountInfo.port,
		path: `${uri1}${uri2}`,
		auth: `${accountInfo.username}:${accountInfo.password}`,
		method: 'GET'
	};

	const response = await httpClientService.asyncRequest(config);
	const { message, data } = response;
	console.log(message, JSON.parse(data));
	/* if (result.ReturnCode === 0 && result['@totalcount'] === 0) request returned 0 results
	try {
			const operators = result.content.map(e => e.OperatorAPI.Name);
			return operators;	
    } catch(e) {
			logger.error(`Mapping of results returned error: ${e.message}`);
			logger.debug(`Exiting incidentService.getEligibleAssigneesByGroup(${group}) service method`);
      throw (e);
		}
	*/
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
