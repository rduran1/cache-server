/* eslint-disable consistent-return */
const incidentService = require('../services/hpsmIncidentService');
const logger = require('../services/loggingService')(__filename);

const MISSING_INCIDENT_ID	= 'Missing Incident ID in request';
const MISSING_COMPUTER_NAME = 'Missing computer name in request';
const MISSING_INCIDENT_DATA	= 'Missing Incident properties in request';
const MISSING_ASSIGNMENT_GROUP = 'Missing Assignment Group in request';

const incidentController = {};

async function processRequest(req, res, controllerMethod, serviceMethod, parameter) {
	const { remoteAddress } = req.connection;
	logger.info(`Received request from ${remoteAddress}`);
	logger.debug(`Entering ${controllerMethod} method`);
	try {
		const results = await incidentService[serviceMethod](parameter);
		res.send(results);
	} catch (e) {
		// competse
	}
}

function checkForParameter(req, res, controllerMethodName, paramName, paramType, errConstant) {
	let param;
	if (paramType === 'string') param = req.params[paramName];
	if (paramType === 'object') param = req.body;
	const { remoteAddress } = req.connection;
	// eslint-disable-next-line valid-typeof
	if (typeof param !== paramType) {
		logger.debug(`Entering ${controllerMethodName} method`);
		logger.error(`Error processing request from ${remoteAddress}: ${errConstant}`);
		logger.info(`Responding to ${remoteAddress} with HTTP 400 "${errConstant}"`);
		res.status(400).send(errConstant);
		logger.debug(`Exiting ${controllerMethodName} method`);
	}
	return param;
}

incidentController.getAssignmentGroups = async (req, res) => {
	await processRequest(req, res, 'getAssignmentGroups', 'getAllAssignmentGroups');
};

incidentController.getAutoAssignTypes = async (req, res) => {
	await processRequest(req, res, 'getAutoAssignTypes', 'getAllAutoAssignTypes');
};

incidentController.getClosureCodes = async (req, res) => {
	await processRequest(req, res, 'getClosureCodes', 'getAllClosureCodes');
};

incidentController.getStatuses = async (req, res) => {
	await processRequest(req, res, 'getStatuses', 'getAllStatuses');
};

incidentController.getCauseCodes = async (req, res) => {
	await processRequest(req, res, 'getCauseCodes', 'getAllCauseCodes');
};

incidentController.getAreaCategorySubCategory = async (req, res) => {
	await processRequest(req, res, 'getAreaCategorySubCategory', 'getAllAreaCategorySubCategorys');
};

incidentController.getPrimaryAffectedServices = async (req, res) => {
	await processRequest(req, res, 'getPrimaryAffectedServices', 'getAllPrimaryAffectedServices');
};

incidentController.getAllIncidents = async (req, res) => {
	await processRequest(req, res, 'getAllIncidents', 'getAllNonClosedIncidents');
};

incidentController.getComputerProperties = async (req, res) => {
	const computerName = checkForParameter(req, res, 'getComputerProperties', 'computerName', 'string', MISSING_COMPUTER_NAME);
	if (computerName) await processRequest(req, res, 'getComputerProperties', 'getComputerProperties', computerName);
};

incidentController.getIncidentById = async (req, res) => {
	const id = checkForParameter(req, res, 'getIncidentById', 'id', 'string', MISSING_INCIDENT_ID);
	if (id) await processRequest(req, res, 'getIncidentById', 'getIncidentById', id);
};

incidentController.getEligibleAssigneesByGroup = async (req, res) => {
	const groupName = checkForParameter(req, res, 'getEligibleAssigneesByGroup', 'groupName', 'string', MISSING_ASSIGNMENT_GROUP);
	if (groupName) await processRequest(req, res, 'getEligibleAssigneesByGroup', 'getEligibleAssigneesByGroup', groupName);
};

incidentController.getIRSRespOrgGroupByComputer = async (req, res) => {
	const computerName = checkForParameter(req, res, 'getIRSRespOrgGroupByComputer', 'computerName', 'string', MISSING_COMPUTER_NAME);
	if (computerName) await processRequest(req, res, 'getIRSRespOrgGroupByComputer', 'getIRSRespOrgGroupByComputerDisplayName', computerName);
};

incidentController.getComputerLogicalName = async (req, res) => {
	const computerName = checkForParameter(req, res, 'getComputerLogicalName', 'computerName', 'string', MISSING_COMPUTER_NAME);
	if (computerName) await processRequest(req, res, 'getComputerLogicalName', 'getLogicalNameByComputerDisplayName', computerName);
};

incidentController.createIncident = async (req, res) => {
	const incident = checkForParameter(req, res, 'createIncident', 'body', 'object', MISSING_INCIDENT_DATA);
	if (incident) await processRequest(req, res, 'createIncident', 'createIncident', incident);
};

incidentController.updateIncident = async (req, res) => {
	const incident = checkForParameter(req, res, 'updateIncident', 'body', 'object', MISSING_INCIDENT_DATA);
	if (incident) await processRequest(req, res, 'updateIncident', 'updateIncident', incident);
};

module.exports = incidentController;
