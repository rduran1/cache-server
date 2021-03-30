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
	if (typeof store.server !== 'object') throw new Error('Cannot find server configuration!');
	const clone = toolboxService.clone(store.express);
	return clone;
};

model.getServerConfiguration = () => {
	if (typeof store.server !== 'object') throw new Error('Cannot find server configuration!');
	const clone = toolboxService.clone(store.server);
	return clone;
};

model.getServiceEnvironment = (serviceFileName) => {
	const service = basename(serviceFileName).split('.')[0];
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
	toolboxService.saveStoreToFile(storeFile, store);
};

model.getLoggingLevels = () => store.loggingLevels || [''];

module.exports = model;
