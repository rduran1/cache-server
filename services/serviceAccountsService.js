/* eslint-disable comma-dangle */
const { basename } = require('path');
const logger = require('./loggingService')(__filename);
const toolboxService = require('./toolboxService');
const configurationService = require('./configurationService');

const accountsModel = require('../models/serviceAccountsModel');

function accountsService(serviceFileName) {
	const callMsg = `accountsService(serviceFileName = "${serviceFileName}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		logger.error('Calling toolboxService.validate');
		v = toolboxService.validate({ serviceFileName }, 'accountsService');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	if (!accountsModel.serviceEntryExists(v.serviceFileName)) {
		accountsModel.createDefaultServiceEntry(v.serviceFileName);
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
			return accountsModel.getAccessControlList(serviceName, env, v2.subjectType, v2.subject);
		},
		getCredentials: () => accountsModel.getCredentials(serviceName, env),
		createNewEnvironmentCredentials: async (credentials) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await accountsModel.createNewEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		updateEnvironmentCredentials: async (credentials) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await accountsModel.updateEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		deleteServiceEntryEnvironment: async () => {
			const v2 = toolboxService.validate({ env }, 'accountService_deleteAccountEnvironment');
			await accountsModel.deleteAccountEnvironment(account, v2.env);
		},
		deleteServiceEntry: async () => {
			await accountsModel.deleteServiceEntry(serviceName);
		}
	};
}

module.exports = accountsService;
