const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = {};

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.getAccessControlList = (serviceName, env, subjectType, subject) => {
	let found;
	let clone = {};
	if (env === 'default') {
		found = store[serviceName].default.find((e) => e[subjectType] === subject);
	} else {
		found = store[serviceName][env].find((e) => e[subjectType] === subject);
	}
	if (found) clone = toolboxService.clone(found);
	return clone.getAccessControlList;
};

model.accountExists = (serviceFileName) => {
	const account = basename(serviceFileName).split('.')[0];
	return Object.keys(store).includes(account);
};

model.getAccountByName = (serviceFileName) => {
	const account = basename(serviceFileName).split('.')[0];
	if (!model.accountExists(serviceFileName)) throw new Error(`Account "${account}" does not exist in store`);
	return account;
};

model.createAccount = (serviceFileName) => {
	const account = basename(serviceFileName).split('.')[0];
	const accountExists = Object.keys(store).includes(account);
	if (accountExists) throw new Error(`Account "${account}" already exists in store`);
	store[account] = {};
	toolboxService.saveStoreToFile(storeFile, store);
};

model.getCredentials = (account, env) => {
	if (env !== 'default') {
		if (env in store[account]) return store[account][env];
		throw new Error(`Environment "${env}" for "${account}" does not exist in store`);
	}
	if (typeof store[account].default !== 'object') throw new Error(`Default environment for "${account}" does not exist in store`);
	return store[account].default;
};

model.createNewEnvironmentCredentials = async (account, credentials, env) => {
	let storeModified = false;
	model.getAccountByName(account);
	if (typeof credentials !== 'object') throw new Error(`credentials must be of type 'object', got ${typeof credentials}`);
	if (typeof env === 'string' && env.length > 1) {
		if (typeof store[account][env] === 'object') throw new Error(`Cannot create environment '${env}', environment already exists`);
		store[account][env] = credentials;
		storeModified = true;
	} else {
		store[account].default = credentials;
		storeModified = true;
	}
	if (storeModified) toolboxService.saveStoreToFile(storeFile, store);
};

model.updateEnvironmentCredentials = async (account, credentials, env) => {
	let storeModified = false;
	model.getAccountByName(account);
	if (typeof credentials !== 'object') throw new Error(`credentials must be of type 'object', got ${typeof credentials}`);
	if (typeof env === 'string' && env.length > 1) {
		store[account][env] = credentials;
		storeModified = true;
	} else {
		store[account].default = credentials;
		storeModified = true;
	}
	if (storeModified) toolboxService.saveStoreToFile(storeFile, store);
};

model.deleteAccountEnvironment = async (account, env) => {
	model.getCredentials(account, env);
	delete store[account][env];
	toolboxService.saveStoreToFile(storeFile, store);
};

model.deleteAccount = async (account) => {
	model.getAccountByName(account);
	delete store[account];
	toolboxService.saveStoreToFile(storeFile, store);
};

module.exports = model;
