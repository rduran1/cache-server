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
		setCredentials: async (credentials, environment) => {
			callmsg = `setCredentials(credentials = ${typeof credentials}, environment = "${environment}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ credentials, environment }, 'serviceAccountService_setCredentials');
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`setCredentials::credentials value: ${typeof v2.credentials}`);
			logger.debug(`setCredentials::environment value: "${v2.environment}"`);
			try {
				await serviceAccountsModel.setCredentials(v.serviceName, v2.credentials, v2.environment);
			} catch (e) {
				logger.error(`${callmsg} ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
		},
		getCredentials: (environment) => {
			callmsg = `serviceAccountService["${v.serviceName}"].getCredentials(environment = "${environment}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ environment }, 'serviceAccountService_getCredentials');
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
			return serviceAccountsModel.getCredentials(v.serviceName, v2.environment);
		},
		getEnvironments: () => {
			callmsg = 'getEnvironments()';
			logger.debug(`Entering ${callmsg}`);
			logger.debug('Exiting getEnvironments()');
			return serviceAccountsModel.getEnvironments(v.serviceName);
		},
		deleteEnvironment: async (environment) => {
			callmsg = `deleteEnvironment(environment = "${environment}")`;
			logger.debug(`Entering ${callmsg}`);
			try {
				await serviceAccountsModel.deleteEnvironment(v.serviceName, environment);
			} catch (e) {
				logger.error(`${callmsg} ${e.stack}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
		}
	};
}

module.exports = serviceAccountService;
