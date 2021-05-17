/* eslint-disable comma-dangle */
const { basename } = require('path');
const logger = require('./loggingService')(__filename);
const toolboxService = require('./toolboxService');

const serviceAccountsModel = require('../models/serviceAccountsModel');

function serviceAccountService(serviceFileName) {
	let callmsg = `serviceAccountService(serviceFileName = "${serviceFileName}")`;
	logger.debug(`Entering ${callmsg}`);
	let v; // validated Object holder;
	try {
		v = toolboxService.validate({ serviceFileName }, 'serviceAccountService');
	} catch (e) {
		logger.error(`${callmsg} ${e.stack}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	v.serviceName = basename(v.serviceFileName).replace(/\.js$/i, '');
	if (!serviceAccountsModel.serviceEntryExists(v.serviceName)) {
		try {
			serviceAccountsModel.createDefaultServiceEntry(v.serviceName);
		} catch (e) {
			logger.error(`${callmsg} ${e.stack}`);
			logger.debug(`Exiting ${callmsg}`);
			throw e;
		}
	}
	logger.debug(`Exiting ${callmsg}`);
	return {
		set: async (identifier, accountInfo) => {
			callmsg = `serviceAccountService["${v.serviceName}"].set(identifier = "${identifier}", accountInfo = ${typeof accountInfo})`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ identifier, accountInfo }, 'serviceAccountService_set');
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`set::identifier value: "${identifier}"`);
			logger.debug(`set::accountInfo value: "${typeof accountInfo}"`);
			try {
				await serviceAccountsModel.set(v.serviceName, v2.identifier, v2.accountInfo);
			} catch (e) {
				logger.error(`${callmsg} ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
		},
		get: async (identifier) => {
			callmsg = `serviceAccountService["${v.serviceName}"].get(identifier = "${identifier}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ identifier }, 'serviceAccountService_get');
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
			const serviceAccount = await serviceAccountsModel.get(v.serviceName, v2.identifier);
			return serviceAccount;
		},
		delete: async (identifier) => {
			callmsg = `serviceAccountService["${v.serviceName}"].delete(identifier = "${identifier}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ identifier }, 'serviceAccountService_delete');
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
			await serviceAccountsModel.delete(v.serviceName, v2.identifier);
		}
	};
}

module.exports = serviceAccountService;
