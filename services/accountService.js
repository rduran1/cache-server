/* eslint-disable comma-dangle */
const accountsModel = require('../models/accountsModel');

function accountService(serviceFileName, forceCreate) {
	const account = accountsModel.getAccountByName(serviceFileName, forceCreate);
	return {
		getAccessByToken: (token, env) => accountsModel.getAccessByToken(account, token, env),

		getAccessByAccount: (subject, env) => accountsModel.getAccessByAccount(account, subject, env),

		getCredentials: (env) => accountsModel.getCredentials(account, env),

		createNewEnvironmentCredentials: async (credentials, env) => {
			let environment = env;
			if (typeof environment === 'undefined' || typeof environmnent !== 'string') environment = 'default';
			await accountsModel.createNewEnvironmentCredentials(account, credentials, environment);
		},

		updateEnvironmentCredentials: async (credentials, env) => {
			await accountsModel.updateEnvironmentCredentials(account, credentials, env);
		},

		deleteAccountEnvironment: async (env) => {
			await accountsModel.deleteAccountEnvironment(account, env);
		},

		// eslint-disable-next-line no-return-await
		deleteAccount: async () => await accountsModel.deleteAccount(account)
	};
}

module.exports = accountService;
