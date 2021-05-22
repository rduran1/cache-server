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

model.set = async (serviceName, identifier, accountInfo) => {
	const clone = toolboxService.clone(store);
	if (typeof clone[serviceName] !== 'object') clone[serviceName] = {};
	clone[serviceName][identifier] = accountInfo;
	await toolboxService.saveStoreToFile(storeFile, clone);
	store[serviceName][identifier] = clone[serviceName][identifier];
};

model.getAll = async (serviceName) => {
	if (typeof store[serviceName] !== 'object') return undefined;
	const clone = toolboxService.clone(store[serviceName]);
	return clone;
};

model.get = async (serviceName, identifier) => {
	if (typeof store[serviceName] !== 'object') return undefined;
	if (Object.keys(store[serviceName]).includes(identifier)) {
		const clone = toolboxService.clone(store[serviceName][identifier]);
		return clone;
	}
	return undefined;
};

model.delete = async (serviceName, identifier) => {
	const clone = toolboxService.clone(store);
	if (typeof clone[serviceName] !== 'object') return undefined;
	if (Object.keys(clone[serviceName]).includes(identifier)) delete clone[serviceName][identifier];
	await toolboxService.saveStoreToFile(storeFile, clone);
	return delete store[serviceName][identifier];
};

module.exports = model;
