/* eslint-disable comma-dangle */
const logger = require('./loggingService')(__filename);
const toolboxService = require('./toolboxService');
const accountsModel = require('../models/accountsModel');

function accountService(serviceFileName, forceCreate) {
	const callMsg = `accountService(serviceFileName = "${serviceFileName}", forceCreate = "${forceCreate}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		v = toolboxService.validate({ serviceFileName, forceCreate }, 'accountService');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	const account = accountsModel.getAccountByName(v.serviceFileName, v.forceCreate);
	logger.debug(`Exiting ${callMsg}`);
	return {
		getAccessByToken: (token, env) => {
			const v2 = toolboxService.validate({ token, env }, 'accountService_getAccessByToken');
			return accountsModel.getAccessByToken(account, v2.token, v2.env);
		},
		getAccessByAccount: (subject, env) => {
			const v2 = toolboxService.validate({ subject, env }, 'accountService_getAccessByAccount');
			return accountsModel.getAccessByAccount(account, v2.subject, v2.env);
		},
		getCredentials: (env) => {
			const v2 = toolboxService.validate({ env }, 'accountService_getCredentials');
			return accountsModel.getCredentials(account, v2.env);
		},
		createNewEnvironmentCredentials: async (credentials, env) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await accountsModel.createNewEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		updateEnvironmentCredentials: async (credentials, env) => {
			const v2 = toolboxService.validate({ credentials, env }, 'accountService_createNewEnvironmentCredentials');
			await accountsModel.updateEnvironmentCredentials(account, v2.credentials, v2.env);
		},
		deleteAccountEnvironment: async (env) => {
			const v2 = toolboxService.validate({ env }, 'accountService_deleteAccountEnvironment');
			await accountsModel.deleteAccountEnvironment(account, v2.env);
		},
		deleteAccount: async () => {
			await accountsModel.deleteAccount(account);
		}
	};
}

module.exports = accountService;
