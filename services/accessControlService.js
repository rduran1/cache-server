const toolboxService = require('./toolboxService');
const logger = require('./loggingService')(__filename);
const accessControlModel = require('../models/accessControlModel');

const accessControlService = {};

accessControlService.isAllowed = async (token, accountId, resource, request) => {
	const callMsg = `isAllowed(token = "${token}", accountId = "${accountId}", resource = "${resource}", request = "${request}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		logger.debug('Calling toolboxService.validate');
		v = toolboxService.validate({
			token,
			accountId,
			resource,
			request
		}, 'accessControlService_isAllowed');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}

	const subject = v.token || v.accountId;
	const subjectType = v.token ? 'token' : 'accountId';
	const identifier = `${subjectType} "${subject}"`;
	let acl;
	try {
		logger.debug('Calling accountsService.getAccessControlList');
		acl = await accessControlModel.getAccessControlList(subject, subjectType);
	} catch (e) {
		logger.error(e.message);
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	if (typeof acl === 'undefined') {
		logger.info(`ACL does not exist for ${identifier}, request to ${v.request} ${v.resource} denied`);
		logger.debug(`Exiting ${callMsg}`);
		return false;
	}
	const permissions = acl.find((e) => e[v.resource]); // returns an array of resources and access type granted to each
	if (typeof permissions === 'undefined') {
		logger.info(`${identifier} has not been granted access to ${v.resource}, request denied`);
		logger.debug(`Exiting ${callMsg}`);
		return false;
	}
	if (permissions[v.resource].includes(v.request)) {
		logger.debug(`${identifier} is authorized to ${v.request} ${v.resource}`);
		logger.debug(`Exiting ${callMsg}`);
		return true;
	}
	logger.info(`${identifier} is not authorized to ${v.request} ${v.resource}, request denied`);
	logger.debug(`Exiting ${callMsg}`);
	return false;
};

module.exports = accessControlService;
