/* eslint-disable comma-dangle */
const { basename } = require('path');
const logger = require('./loggingService')(__filename);
const toolboxService = require('./toolboxService');
const configurationService = require('./configurationService');

const serviceAccountsModel = require('../models/serviceAccountsModel');

function serviceAccountsService(serviceFileName) {
	const callMsg = `accountsService(serviceFileName = "${serviceFileName}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		logger.debug('Calling toolboxService.validate');
		v = toolboxService.validate({ serviceFileName }, 'accountsService');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	if (!serviceAccountsModel.serviceEntryExists(v.serviceFileName)) {
		serviceAccountsModel.createDefaultServiceEntry(v.serviceFileName);
		configurationService.createDefaultServiceEnvironment(v.serviceFileName);
	}
	const serviceName = basename(v.serviceFileName).split(/\.js$/)[0];
	let env = configurationService.getServiceEnvironment(serviceName);
	logger.debug(`Exiting ${callMsg}`);
	return {
		setServiceEnvironment: (newEnv) => {
			// Check if environment value exists in store, throw error if it doesnt
			env = newEnv;
		},
		setCredentials: (env, creds) => {

		},
		getAccessControlList: (subject, subjectType) => {
			const v2 = toolboxService.validate({ subject, subjectType }, 'accountsService_getAccessControlList');
			return serviceAccountsModel.getAccessControlList(serviceName, env, v2.subjectType, v2.subject);
		},
		getCredentials: () => serviceAccountsModel.getCredentials(serviceName, env),
		createNewEnvironmentCredentials: async (credentials) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await serviceAccountsModel.createNewEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		updateEnvironmentCredentials: async (credentials) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await serviceAccountsModel.updateEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		deleteServiceEntryEnvironment: async () => {
			const v2 = toolboxService.validate({ env }, 'accountService_deleteAccountEnvironment');
			await serviceAccountsModel.deleteAccountEnvironment(account, v2.env);
		},
		deleteServiceEntry: async () => {
			await serviceAccountsModel.deleteServiceEntry(serviceName);
		}
	};
}

module.exports = serviceAccountsService;
