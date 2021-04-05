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
		logger.error(e.message);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	v.serviceName = basename(v.serviceFileName).replace(/\.js$/i, '');
	if (!serviceAccountsModel.serviceEntryExists(v.serviceName)) {
		const callmsg2 = `serviceAccountsModel.createDefaultServiceEntry(v.serviceName = ${v.serviceName})`;
		try {
			logger.debug(`Calling ${callmsg2}`);
			serviceAccountsModel.createDefaultServiceEntry(v.serviceName);
		} catch (e) {
			const msg = `${callmsg2} returned error: ${e.message}`;
			logger.error(msg);
			logger.debug(`Exiting ${callmsg}`);
			throw e;
		}
	}
	return {
		setCredentials: async (credentials, environment) => {
			callmsg = `setCredentials(credentials = ${typeof credentials}, environment = ${environment})`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ environment, credentials }, 'serviceAccountService_setCredentials');
			} catch (e) {
				logger.error(e.message);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			const args = `serviceName = ${v.serviceName}, environment = ${v2.environment}, credentials = ${typeof v2.credentials}`;
			const callmsg2 = `serviceAccountsModel.setCredentials(${args})`;
			try {
				logger.debug(`Calling ${callmsg2}`);
				await serviceAccountsModel.setCredentials(v.serviceName, v2.environment, v2.credentials);
			} catch (e) {
				logger.error(`${callmsg2} returned error: ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw new Error(e.message);
			}
		},
		getCredentials: (environment) => {
			callmsg = `getCredentials(environment = ${environment})`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ environment }, 'serviceAccountService_getCredentials');
			} catch (e) {
				logger.error(e.message);
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
			await serviceAccountsModel.deleteEnvironment(v.serviceName, environment);
		}
	};
}

module.exports = serviceAccountService;
