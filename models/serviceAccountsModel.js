const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = {};

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.serviceEntryExists = (serviceName) => Object.keys(store).includes(serviceName);

model.createDefaultServiceEntry = async (serviceName) => {
	const clone = toolboxService.clone(store);
	if (model.serviceEntryExists(serviceName)) {
		if (typeof store[serviceName].default === 'object') return;
		clone[serviceName].default = {};
	} else {
		clone[serviceName] = { default: {} };
	}
	await toolboxService.saveStoreToFile(storeFile, clone);
	store[serviceName] = clone[serviceName];
};

model.setCredentials = async (serviceName, environment, credentials) => {
	const clone = toolboxService.clone(store);
	if (typeof clone[serviceName] === 'undefined') clone[serviceName] = {};
	clone[serviceName][environment] = credentials;
	await toolboxService.saveStoreToFile(storeFile, clone);
	store[serviceName][environment] = clone[serviceName][environment];
};

model.getCredentials = (serviceName, environment) => {
	if (model.getEnvironments(serviceName).includes(environment)) {
		return store[serviceName][environment];
	}
	return undefined;
};

model.getEnvironments = (serviceName) => {
	if (!model.serviceEntryExists(serviceName)) return [];
	return Object.keys(store[serviceName]);
};

model.deleteEnvironment = async (serviceName, environment) => {
	const clone = toolboxService.clone(store);
	delete clone[serviceName][environment];
	await toolboxService.saveStoreToFile(storeFile, clone);
	delete store[serviceName][environment];
};

module.exports = model;
