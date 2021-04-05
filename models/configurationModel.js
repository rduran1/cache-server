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
	services: {},
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
	toolboxService.saveStoreToFile(storeFile, clone);
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
	toolboxService.saveStoreToFile(storeFile, clone);
	store.express = config;
};

model.getLoggingLevels = () => store.loggingLevels || [''];

model.setLoggingLevels = (config) => {
	const clone = toolboxService.clone(store);
	clone.loggingLevels = config;
	toolboxService.saveStoreToFile(storeFile, clone);
	store.loggingLevels = config;
};

model.get = (serviceName, propertyName) => {
	if (typeof store.services === 'undefined') throw new Error('Cannot find services configuration!');
	if (typeof store.services[serviceName] === 'undefined') return undefined;
	if (typeof propertyName === 'string') return store.services[serviceName][propertyName];
	return store.services[serviceName];
};

model.set = (serviceName, config) => {
	const clone = toolboxService.clone(store);
	if (typeof clone.services === 'undefined') clone.services = {};
	clone.services[serviceName] = config || {};
	toolboxService.saveStoreToFile(storeFile, clone);
	if (typeof store.services === 'undefined') store.services = {};
	store.services = clone.services;
};

module.exports = model;
