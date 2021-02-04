const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const { store, fileName } = toolboxService.initializeStore(__filename, '{}');

const model = {};

model.getServiceEnvironment = (serviceName) => {
	if (typeof serviceName !== 'string') throw new Error('Service name or service file name is required');
	if (serviceName.length < 1) throw new Error('Service name cannot be an empty string');
	const service = basename(serviceName).split('.')[0];
	if (!Object.keys(store).includes('services')) throw new Error('Services are not defined in configuration store');
	if (!Object.keys(store.services).includes(service)) throw new Error(`Service "${service}" does not exist in configuration store`);
	const env = store.services[service].environment;
	if (typeof env === 'undefined') throw new Error(`Service ${service} does not have an environment value`);
	if (typeof env !== 'string') throw new Error(`Environment value for Service ${service} is not of type string`);
	return env;
};

model.setServiceEnvironment = (serviceName, value) => {
	if (typeof serviceName !== 'string') throw new Error('Service name or service file name is required');
	if (serviceName.length < 1) throw new Error('Service name cannot be an empty string');
	const service = basename(serviceName).split('.')[0];
	if (!Object.keys(store.services).includes(service)) throw new Error(`Service "${service}" does not exist in configuration store`);
	store.services[service].environment = value;
	toolboxService.saveStoreToFile(fileName, store);
};

model.getLoggingLevels = () => store.loggingLevels || [''];

model.getServerConfiguration = () => {
	const config = toolboxService.clone(store.server);
	if (typeof config !== 'object') throw new Error('Server configuration is missing');
	return config;
};

module.exports = model;
