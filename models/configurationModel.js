const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = {
	express: {
		staticDirectory: 'static',
		viewsDirectory: 'views',
		bodyParserUrlencodedExtended: true,
		bodyParserJsonSizeLimit: '50mb',
		bodyParserTextSizeLimit: '50mb'
	},
	server: {
		port: 3000,
		key: 'bin/server.key',
		cert: 'bin/server.cert'
	},
	services: {
	},
	loggingLevels: [
		'error',
		'warn',
		'info'
	]
};

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.getExpressConfiguration = () => {
	if (typeof store.express !== 'object') throw new Error('Cannot find express configuration!');
	const clone = toolboxService.clone(store.express);
	return clone;
};

model.setExpressConfiguration = (config) => {
	const clone = toolboxService.clone(store);
	clone.express = config;
	toolboxService.saveStoreToFile(storeFile, clone, true);
	store.express = config;
};

model.getServerConfiguration = () => {
	if (typeof store.server !== 'object') throw new Error('Cannot find server configuration!');
	const clone = toolboxService.clone(store.server);
	return clone;
};

model.setServerConfiguration = (config) => {
	const clone = toolboxService.clone(store);
	clone.server = config;
	toolboxService.saveStoreToFile(storeFile, clone, true);
	store.express = config;
};

model.getServiceEnvironment = (serviceFileName) => {
	const service = basename(serviceFileName).split('.')[0];
	if (!Object.keys(store.services).includes(service)) throw new Error(`Service "${service}" does not exist in configuration store`);
	const env = store.services[service].environment;
	if (typeof env === 'undefined') throw new Error(`Service ${service} does not have an environment value`);
	return env;
};

model.setServiceEnvironment = (serviceName, value) => {
	const service = basename(serviceName).split('.')[0];
	if (!Object.keys(store.services).includes(service)) throw new Error(`Service "${service}" does not exist in configuration store`);
	const clone = toolboxService.clone(store);
	clone.services[service].environment = value;
	toolboxService.saveStoreToFile(storeFile, clone, true);
	store.services[service].environment = value;
};

model.getLoggingLevels = () => store.loggingLevels || [''];

model.setLoggingLevels = (config) => {
	const clone = toolboxService.clone(store);
	clone.loggingLevels = config;
	toolboxService.saveStoreToFile(storeFile, clone, true);
	store.loggingLevels = config;
};

module.exports = model;
