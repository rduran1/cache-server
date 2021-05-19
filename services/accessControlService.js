const toolboxService = require('./toolboxService');
const logger = require('./loggingService')(__filename);
const accessControlModel = require('../models/accessControlModel');

const accessControlService = {};

accessControlService.isAllowed = async (token, accountId, resource, request) => {
	const callmsg = `isAllowed(token = "${token}", accountId = "${accountId}", resource = "${resource}", request = "${request}")`;
	logger.debug(`Entering ${callmsg}`);
	let v; // validated Object holder;
	try {
		// eslint-disable-next-line object-curly-newline
		v = toolboxService.validate({ token, accountId, resource, request }, 'accessControlService_isAllowed');
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	const subject = v.token || v.accountId;
	const subjectType = v.token ? 'token' : 'accountId';
	logger.debug(`isAllowed::subject value: ${subject}`);
	logger.debug(`isAllowed::subjectType value: ${subjectType}`);
	let acl;
	let alias;
	try {
		const acmObj = await accessControlModel.getAccessControlList(subject, subjectType);
		acl = acmObj.acl;
		alias = acmObj.alias;
	} catch (e) {
		logger.error(e.stack);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	if (typeof acl === 'undefined') {
		logger.info(`ACL does not exist for ${alias}, request to ${v.request} ${v.resource} denied`);
		logger.debug(`Exiting ${callmsg}`);
		return false;
	}
	const permissions = acl.find((e) => e[v.resource]); // returns an array of resources and access type granted to each
	if (typeof permissions === 'undefined') {
		logger.info(`${alias} has not been granted access to ${v.resource}, request denied`);
		logger.debug(`Exiting ${callmsg}`);
		return false;
	}
	if (permissions[v.resource].includes(v.request)) {
		logger.debug(`${alias} is authorized to ${v.request} ${v.resource}`);
		logger.debug(`Exiting ${callmsg}`);
		return true;
	}
	logger.info(`${alias} is not authorized to ${v.request} ${v.resource}, request denied`);
	logger.debug(`Exiting ${callmsg}`);
	return false;
};

accessControlService.createSubject = async (config) => {
	const callmsg = `createSubject(config = "${typeof config}")`;
	logger.debug(`Entering ${callmsg}`);
	let cfg;
	try {
		cfg = toolboxService.clone(config);
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	delete cfg.createDate; // Validation will set this value
	try {
		const v = toolboxService.validate(cfg, 'accessControlService_createSubject');
		if (accessControlModel.getSubjectByAlias(v.alias)) throw new Error(`Alias ${v.alias} already exists`);
		if (v.accountId && accessControlModel.getSubjectByAccountId(v.accountId)) {
			throw new Error(`accountId ${v.accountId} already exists`);
		}
		if (typeof v.accountId === 'undefined') v.token = accessControlModel.generateUniqueToken();
		await accessControlModel.createSubject(v);
		logger.debug(`Exiting ${callmsg}`);
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
};

accessControlService.updateSubject = async (config) => {
	const callmsg = `updateSubject(config = "${typeof config}")`;
	logger.debug(`Entering ${callmsg}`);
	try {
		const v = toolboxService.validate(config, 'accessControlService_updateSubject');
		await accessControlModel.updateSubject(v);
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
};

accessControlService.deleteSubject = async (alias) => {
	const callmsg = `deleteSubject(alias = "${alias}")`;
	logger.debug(`Entering ${callmsg}`);
	try {
		const v = toolboxService.validate({ alias }, 'accessControlService_deleteSubject');
		await accessControlModel.deleteSubject(v.alias);
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
};

module.exports = accessControlService;
