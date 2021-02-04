const incidentService 				= require('../services/incidentService');
const loggingService				= require('../services/loggingService');

const MISSING_INCIDENT_ID			= 'Missing Incident ID in request';
const MISSING_INCIDENT_DATA			= 'Missing Incident properties in request';
const MISSING_ASSIGNMENT_GROUP 		= 'Missing Assignment Group in request';
const MISSING_MODEL					= 'Missing model identifier in request';
const MISSING_COMPUTER_NAME			= 'Missing computer name in request';
const MISSING_BASE64_ENCODED_UOC	= 'Missing base64 encoded (U)ser, (O)s, and/or (C)omputer information in request';

const incidentController = {};
const logger = loggingService(__filename);

async function noArgumentServiceCall(req, res, controllerMethodName, serviceMethodName) {
	// Assume service method name is same as controller method name if no service method name is provided
	if (typeof serviceMethodName === 'undefined') serviceMethodName = controllerMethodName;
	const { remoteAddress } = req.connection;
	logger.debug(`Entering ${controllerMethodName} method`);
	logger.info(`Request from ${remoteAddress} to controller method ${controllerMethodName}`);
	try {
		logger.debug(`Calling incidentService.${serviceMethodName}() service method`);
		const retval = await incidentService[serviceMethodName]();
		if (typeof retval === 'object' && Array.isArray(retval)) {
			const s = retval.length > 1 ? 's' : '';
			logger.debug(`incidentService.${serviceMethodName} service method returned ${retval.length} element${s}`);	
		} else if (typeof retval === 'object') {
			logger.debug(`incidentService.${serviceMethodName} service method returned a JSON object`);
		}
		logger.info(`Sending controller method ${controllerMethodName} response to ${remoteAddress}`);
		res.send(retval);
	} catch(e) {
		logger.error(`incidentService.${serviceMethodName} service returned an error. Check incidentService.log for details.`);
		logger.info(`Responding to ${remoteAddress} with HTTP 500`);
		res.status(500).send();
	}
	logger.debug(`Exiting ${controllerMethodName} method`);
}

async function singleStringArgumentServiceCall(req, res, controllerMethodName, propName, errConst, serviceMethodName) {
	if (typeof serviceMethodName === 'undefined') serviceMethodName = controllerMethodName;
	const { remoteAddress } = req.connection;
	logger.debug(`Entering ${controllerMethodName} method`);
	logger.info(`Request from ${remoteAddress} to controller method ${controllerMethodName}`);
	const propValue = req.params[propName];
	if (typeof propValue !== 'string') {
		logger.error(`Error processing request from ${remoteAddress}: ${errConst}`);
		logger.info(`Responding to ${remoteAddress} with HTTP 400`);
		res.status(400).send(errConst);
		return logger.debug(`Exiting ${controllerMethodName} method`);
	}
	try {
		logger.debug(`Calling incidentService.${serviceMethodName}(${propValue}) service method`);
		const retval = await incidentService[serviceMethodName](propValue);
		if (typeof retval === 'object' && Array.isArray(retval)) {
			const s = retval.length > 1 ? 's' : '';
			logger.debug(`incidentService.${serviceMethodName} service method returned ${retval.length} element${s}`);	
		} else if (typeof retval === 'object') {
			logger.debug(`incidentService.${serviceMethodName} service method returned a JSON object`);
		}
		logger.info(`Sending controller method ${controllerMethodName} response to ${remoteAddress}`);
		res.send(retval);
	} catch(e) {
		logger.error(`incidentService.${serviceMethodName} service returned an error. Check incidentService.log for details.`);
		logger.info(`Responding to ${remoteAddress} with HTTP 500`);
		res.status(500).send(e.message);
	}
	logger.debug(`Exiting ${controllerMethodName} method`);
}

async function objectArgumentServiceCall(req, res, controllerMethodName, clientErrorMessage, serviceMethodName) {
	if (typeof serviceMethodName === 'undefined') serviceMethodName = controllerMethodName;
	const { remoteAddress } = req.connection;
	logger.debug(`Entering ${controllerMethodName} method`);
	logger.info(`Request from ${remoteAddress} to controller method ${controllerMethodName}`);
	const obj = req.body;
	if (typeof obj !== 'object') {
		logger.error(`Error processing request from ${remoteAddress}: ${clientErrorMessage}`);
		logger.info(`Responding to ${remoteAddress} with HTTP 400`);
		res.status(400).send(clientErrorMessage);
		return logger.debug(`Exiting ${controllerMethodName} method`);
	}
	try {
		logger.debug(`Calling incidentService.${serviceMethodName}(object) service method`);
		const incident = await incidentService[serviceMethodName](obj);
		logger.info(`Sending controller method ${controllerMethodName} response to ${remoteAddress}`);
		res.send(incident);
	} catch(e) {
		logger.error(`incidentService.${serviceMethodName} service returned an error. Check incidentService.log for details.`);
		logger.info(`Responding to ${remoteAddress} with HTTP 500`);
		res.status(500).send(e.message);
	}
	logger.debug(`Exiting ${controllerMethodName} method`);
}

incidentController.incidentRequestForm = async(req, res) => {
	const { remoteAddress } = req.connection;
	const encodedString = req.params.user_and_computer_base64;
	if (typeof encodedString !== 'string') {
		logger.error(`Error processing request from ${remoteAddress}: ${MISSING_BASE64_ENCODED_UOC}`);
		logger.info(`Responding to ${remoteAddress} with HTTP 400`);
		return res.send(400).send(MISSING_BASE64_ENCODED_UOC);
	}
	const [user, os, computer] = new Buffer.from(encodedString, 'base64').toString('ascii').split('_#!#_');
	if (typeof user !== 'string' || typeof os === 'string' || typeof computer !== 'string') {
		logger.error(`Error processing request from ${remoteAddress}: ${MISSING_BASE64_ENCODED_UOC}`);
		logger.info(`Responding to ${remoteAddress} with HTTP 400`);
		return res.send(400).send(MISSING_BASE64_ENCODED_UOC);
	}
	const contact 			= incidentService.getContact(user);
	const assignmentGroup 	= incidentService.getIRSRespOrgGroupByComputer(computer);
	//const incidentStore 	= await incidentService.getState('Incidents'); 
	//const incidents 		= incidentStore.map(e => e.Incident);
	const payload 			= {
		target: 		 computer,
		incidents: 		 incidents,
		contact: 		 contact,
		assignmentGroup: assignmentGroup,
		os: 			 os
	};
	res.render('serviceManagerIncidentInterface', payload);
};
	
incidentController.getAssignmentGroups = (req, res) => {
	noArgumentServiceCall(req, res, 'getAssignmentGroups');
}

incidentController.getAutoAssignTypes = (req, res) => {
	noArgumentServiceCall(req, res, 'getAutoAssignTypes');
}

incidentController.getClosureCodes = (req, res) => {
	noArgumentServiceCall(req, res, 'getClosureCodes');
}

incidentController.getStatuses = (req, res) => {
	noArgumentServiceCall(req, res, 'getStatuses');
}

incidentController.getCauseCodes = (req, res) => {
	noArgumentServiceCall(req, res, 'getCauseCodes');
}

incidentController.getAreaCategorySubCategory = (req, res) => {
	noArgumentServiceCall(req, res, 'getAreaCategorySubCategory');
}

incidentController.getPrimaryAffectedServices = (req, res) => {
	noArgumentServiceCall(req, res, 'getPrimaryAffectedServices'); 
}

incidentController.getAllIncidents = (req, res) => {
	noArgumentServiceCall(req, res, 'getAllIncidents');
}

incidentController.getComputerProperties = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getComputerProperties', 'computerName', MISSING_COMPUTER_NAME);
}

incidentController.getComputerPropertiesJson = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getComputerPropertiesJson', 'computerName', MISSING_COMPUTER_NAME);
}

incidentController.getIncidentById = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getIncidentById', 'id', MISSING_INCIDENT_ID);
}

incidentController.getEligibleAssigneesByGroup = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getEligibleAssigneesByGroup', 'groupName', MISSING_ASSIGNMENT_GROUP);
}

incidentController.getIRSRespOrgGroupByComputer = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getIRSRespOrgGroupByComputer', 'computerName', MISSING_COMPUTER_NAME);
}

incidentController.getComputerLogicalName = (req, res) => {
	singleStringArgumentServiceCall(req, res, 'getComputerLogicalName', 'computerName', MISSING_COMPUTER_NAME);
}

incidentController.createIncident = (req, res) => {
	objectArgumentServiceCall(req, res, 'createIncident', MISSING_INCIDENT_DATA);
}

incidentController.updateIncident = (req, res) => {
	objectArgumentServiceCall(req, res, 'updateIncident', MISSING_INCIDENT_DATA);
}

module.exports = incidentController;
