const incidentService = require('../services/hpsmIncidentService');
const logger = require('../services/loggingService')(__filename);

const hpsmIncidentController = {};

async function dispatcher(req, res, controllerMethodName, serviceMethodName, paramName, paramType) {
	const { remoteAddress } = req.connection;
	logger.debug(`${remoteAddress}: Entering ${controllerMethodName}`);
	let parameter;
	if (paramType === 'string' && typeof req.params === 'object') parameter = req.params[paramName];
	if (paramType === 'object') parameter = req.body;
	const paramValue = (typeof parameter === 'object' ? 'object' : parameter);
	const serviceParam = (typeof paramName === 'string' ? `${paramName} = ${paramValue}` : '');
	try {
		logger.debug(`Calling hpsmIncidentService.${serviceMethodName}(${serviceParam})`);
		const results = await incidentService[serviceMethodName](parameter);
		res.send(results);
		let payloadLength = 0;
		if (typeof results === 'object') payloadLength = JSON.stringify(results).length;
		if (typeof results === 'string') payloadLength = results.length;
		return logger.info(`${remoteAddress}: Responded with HTTP 200 and ${payloadLength} bytes of data`);
	} catch (e) {
		logger.error(`${remoteAddress}: ${controllerMethodName} failed: ${e.stack}`);
		if (
			e.message.match(/Schema definition for ".+?" does not exist/)
			|| e.message.match(/Cannot read key and or cert file from config/)
			|| e.message.match(/Model file name must end with "Model.js"/)
			|| e.message.match(/Failed to initialize local store file for model/)
			|| e.message.match(/Environmental variable INSTALL_DIR is undefined/)
		) {
			res.statusMessage = e.message;
			res.status(500).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 500: ${res.statusMessage}`);
		}

		if (
			e.message.match(/Validation failure(s)?:/)
			|| e.message.match(/Request is a duplicate of/)
			|| e.message.match(/OutageEndTime cannot occur before OutageStartTime/)
			|| e.message.match(/OutageStartTime not provided/)
			|| e.message.match(/OutageEndTime is required when resolving incident/)
			|| e.message.match(/OutageEndTime is required when closing incident/)
			|| e.message.match(/Assignee is invalid/)
			|| e.message.match(/combination is invalid/)
			|| e.message.match(/ is not a valid entry/)
			|| e.message.match(/Incident must be resolved before closing/)
		) {
			res.statusMessage = e.message;
			res.status(400).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 400: ${res.statusMessage}`);
		}

		// This message is truncated because for some reason HPSM server sometimes
		// responds with "cannot" and sometimes with "cannnot" in the error message
		if (e.message.match(/This incident was closed. You cann/)) {
			res.statusMessage = 'This incident has already been closed';
			res.status(400).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 400: ${res.statusMessage}`);
		}

		if (e.message.match(/Server does not appear to support HTTPS/)) {
			res.statusMessage = e.message;
			res.status(503).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 503: ${res.statusMessage}`);
		}

		if (e.message.match(/clientRequest error: (.+?) \(/)) {
			const regMatch = e.message.match(/clientRequest error: (.+?) \(/);
			res.statusMessage = `Failed to contact HPSM server: ${regMatch[1]}`;
			res.status(503).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 503: ${res.statusMessage}`);
		}

		if (e.message.match(/responded with HTTP 404 /)) {
			res.statusMessage = 'Not Found';
			if (controllerMethodName === 'getIncidentById') res.statusMessage = `HPSM could not find incident ${paramValue}`;
			res.status(404).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 404: ${res.statusMessage}`);
		}

		if (e.message.match(/responded with HTTP 401 Unauthorized/)) {
			res.statusMessage = 'Service account is unauthorized to access the HPSM server';
			res.status(401).send();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 401: ${res.statusMessage}`);
		}

		// HPSM returns a 500 HTTP when closing an incident if it is not properyly resolved first
		if (e.message.match(/Record (.+?) has been closed by/)) {
			res.statusMessage = 'incident closed incorrectly';
			res.status(500).send();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 500: ${res.statusMessage}`);
		}

		res.statusMessage = 'Unknown error occurred, see hpsmIncidentController.log for details';
		res.status(500).end();
		return logger.info(`${remoteAddress}: Responded to client with HTTP 500: ${res.statusMessage}`);
	}
}

hpsmIncidentController.processPayload = async (req, res) => {
	const { remoteAddress } = req.connection;
	const tag = req.params.contentTag;
	const content = req.body;
	const msg = `${remoteAddress}: Request to upload "${tag}" ${content.length} bytes`;
	logger.info(msg);
	try {
		switch (tag) {
		case 'export_bizServices.csv':
			await incidentService.saveToHpsmPrimaryAffectedServicesModel(content);
			break;
		case 'export_computer.csv':
			await incidentService.saveToHpsmComputersModel(content);
			break;
		case 'export_contacts.csv':
			await incidentService.saveToHpsmContactsModel(content);
			break;
		default:
			logger.error(`${msg} failed: No storage location defined`);
			res.statusMessage = `No storage location defined for "${tag}"`;
			res.status(400).end();
			return logger.info(`${remoteAddress}: Responded to client with HTTP 400`);
		}
	} catch (e) {
		logger.error(`${msg} failed: ${e.message}`);
		res.statusMessage = `Failed to process "${tag}": ${e.message}`;
		res.status(500).end();
		return logger.info(`${remoteAddress}: Responded to client with HTTP 500`);
	}
	res.status(201).send();
	return logger.info(`${msg} processed, responded to client with HTTP 201`);
};

hpsmIncidentController.getAssignmentGroups = async (req, res) => {
	dispatcher(req, res, 'getAssignmentGroups', 'getAllAssignmentGroups');
};

hpsmIncidentController.getAutoAssignTypes = async (req, res) => {
	dispatcher(req, res, 'getAutoAssignTypes', 'getAllAutoAssignTypes');
};

hpsmIncidentController.getClosureCodes = async (req, res) => {
	dispatcher(req, res, 'getClosureCodes', 'getAllClosureCodes');
};

hpsmIncidentController.getStatuses = async (req, res) => {
	dispatcher(req, res, 'getStatuses', 'getAllStatuses');
};

hpsmIncidentController.getCauseCodes = async (req, res) => {
	dispatcher(req, res, 'getCauseCodes', 'getAllCauseCodes');
};

hpsmIncidentController.getAreaCategorySubCategory = async (req, res) => {
	dispatcher(req, res, 'getAreaCategorySubCategory', 'getAllAreaCategorySubCategory');
};

hpsmIncidentController.getPrimaryAffectedServices = async (req, res) => {
	dispatcher(req, res, 'getPrimaryAffectedServices', 'getAllPrimaryAffectedServices');
};

hpsmIncidentController.getAllIncidents = async (req, res) => {
	dispatcher(req, res, 'getAllIncidents', 'getAllNonClosedIncidents');
};

hpsmIncidentController.getComputerProperties = (req, res) => {
	dispatcher(req, res, 'getComputerProperties', 'getComputerPropertiesByDisplayName', 'computerName', 'string');
};

hpsmIncidentController.getIncidentById = (req, res) => {
	dispatcher(req, res, 'getIncidentById', 'getIncidentById', 'id', 'string');
};

hpsmIncidentController.getEligibleAssigneesByGroup = (req, res) => {
	dispatcher(req, res, 'getEligibleAssigneesByGroup', 'getEligibleAssigneesByGroup', 'groupName', 'string');
};

hpsmIncidentController.getIRSRespOrgGroupByComputer = (req, res) => {
	dispatcher(req, res, 'getIRSRespOrgGroupByComputer', 'getIRSRespOrgGroupByComputerDisplayName', 'computerName', 'string');
};

hpsmIncidentController.getComputerLogicalName = (req, res) => {
	dispatcher(req, res, 'getComputerLogicalName', 'getLogicalNameByComputerDisplayName', 'computerName', 'string');
};

hpsmIncidentController.createIncident = (req, res) => {
	dispatcher(req, res, 'createIncident', 'createIncident', 'incident', 'object');
};

hpsmIncidentController.updateIncident = async (req, res) => {
	dispatcher(req, res, 'updateIncident', 'updateIncident', 'incident', 'object');
};

module.exports = hpsmIncidentController;
