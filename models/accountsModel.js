const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '{}');

const model = {};

model.getAccessByToken = (account, token, env) => {
	let found;
	let clone = {};
	if (typeof env === 'string' && env.length > 0) {
		found = store[account][env].find((e) => e.token === token);
	} else {
		found = store[account].default.find((e) => e.token === token);
	}
	if (found) clone = toolboxService.clone(found);
	return clone.access;
};

model.getAccessByAccount = (account, subject, env) => {
	let found;
	let clone = {};
	if (typeof env === 'string' && env.length > 0) {
		found = store[account][env].find((e) => e.subject === subject);
	} else {
		found = store[account].default.find((e) => e.subject === subject);
	}
	if (found) clone = toolboxService.clone(found);
	return clone.access;
};

model.getAccountByName = (serviceFileName, create) => {
	let storeModified = false;
	if (typeof serviceFileName !== 'string') throw new Error('First paramter must be of type string');
	if (typeof create !== 'undefined' && typeof create !== 'boolean') throw new Error('Second parameter must be of type boolean');
	// eslint-disable-next-line no-unneeded-ternary
	const forceCreate = create ? true : false;
	const account = basename(serviceFileName).split('.')[0];
	const accountExists = Object.keys(store).includes(account);
	if (!accountExists && !forceCreate) throw new Error(`Account "${account}" does not exist in store`);
	if (accountExists && forceCreate) throw new Error(`Account "${account}" already exists in store`);
	if (!accountExists && forceCreate) {
		store[account] = {};
		storeModified = true;
	}
	if (storeModified) toolboxService.saveStoreToFile(storeFile, store);
	return account;
};

model.getCredentials = (account, env) => {
	if (typeof env === 'string' && env.length > 0) {
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
