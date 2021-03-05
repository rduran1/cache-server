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
	const msg = `${remoteAddress}: Request to ${controllerMethod}`;
	logger.info(msg);
	const param = typeof parameter === 'object' ? 'object' : parameter;
	try {
		logger.debug(`Calling incidentService.${serviceMethod}(${param})`);
		const results = await incidentService[serviceMethod](parameter);
		res.send(results);
		logger.info(`${msg} successful, responded to client with HTTP 200 and ${results.length} bytes of data`);
	} catch (e) {
		logger.error(`${msg} failed: ${e.message}`);
		if (e.message.match(/^Error contacting /)) {
			res.statusCode(503).send(e.message);
			logger.info(`${remoteAddress}: Responded to client with HTTP 503, ${e.message}`);
		}
		if (e.message.match(/^404/)) {
			res.statusCode(404).send(e.message);
			logger.info(`${remoteAddress}: Responded to client with HTTP 404, ${e.message}`);
		}
	}
}

function checkForParameter(req, res, controllerMethodName, paramName, paramType, errConstant) {
	let param;
	if (paramType === 'string') param = req.params[paramName];
	if (paramType === 'object') param = req.body;
	const { remoteAddress } = req.connection;
	// eslint-disable-next-line valid-typeof
	if (typeof param !== paramType) {
		const msg = `${remoteAddress}: Request to ${controllerMethodName}`;
		logger.info(msg);
		logger.error(`${msg} failed: ${errConstant}`);
		res.status(400).send(errConstant);
		logger.info(`${remoteAddress}: Responded to client with HTTP 400, ${errConstant}`);
	}
	return param;
}

incidentController.processPayload = async (req, res) => {
	const { remoteAddress } = req.connection;
	const tag = req.params.contentTag;
	const content = req.body;
	const msg = `${remoteAddress}: Request to upload "${tag}" ${content.length} bytes`;
	logger.info(msg);
	try {
		switch (tag) {
		case 'export_bizServices.csv':
			await incidentService.saveToHpsmPrimaryAffectedServicesModel(content);
			res.status(201).send();
			break;
		case 'export_computer.csv':
			await incidentService.saveToHpsmComputersModel(content);
			res.status(201).send();
			break;
		case 'export_contacts.csv':
			await incidentService.saveToHpsmContactsModel(content);
			res.status(201).send();
			break;
		default:
			logger.error(`${msg} failed: No storage defined for "${tag}"`);
			res.status(400).send(`No storage defined for "${tag}"`);
			logger.info(`${remoteAddress}: Responded to client with HTTP 400`);
			return undefined;
		}
	} catch (e) {
		logger.error(`${remoteAddress}: Failed to process "${tag}": ${e.message}`);
		res.status(400).send(e.message);
		logger.info(`${remoteAddress}: Responded to client with HTTP 400`);
		return undefined;
	}
	logger.info(`${remoteAddress}: Successfully processed ${tag}, responded to client with HTTP 201`);
};

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
	await processRequest(req, res, 'getAreaCategorySubCategory', 'getAllAreaCategorySubCategory');
};

incidentController.getPrimaryAffectedServices = async (req, res) => {
	await processRequest(req, res, 'getPrimaryAffectedServices', 'getAllPrimaryAffectedServices');
};

incidentController.getAllIncidents = async (req, res) => {
	await processRequest(req, res, 'getAllIncidents', 'getAllNonClosedIncidents');
};

incidentController.getComputerProperties = async (req, res) => {
	const computerName = checkForParameter(req, res, 'getComputerProperties', 'computerName', 'string', MISSING_COMPUTER_NAME);
	if (computerName) await processRequest(req, res, 'getComputerProperties', 'getComputerPropertiesByDisplayName', computerName);
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
