const configurationModel = require('../models/configurationModel');
const toolboxService = require('./toolboxService');
const logger = require('./loggingService')(__filename);

const configurationService = {};

configurationService.getExpressConfiguration = () => {
	const callMsg = 'getExpressConfiguration()';
	logger.debug(`Entering ${callMsg}`);
	logger.debug(`Exiting ${callMsg}`);
	return configurationModel.getExpressConfiguration();
};

configurationService.setExpressConfiguration = (config) => {
	const callMsg = `setExpressConfiguration(config = ${typeof config})`;
	logger.debug(`Entering ${callMsg}`);
	const v = toolboxService.validate(config, 'configurationService_setExpressConfiguration');
	try {
		const storedConfig = configurationService.getExpressConfiguration();
		configurationModel.setExpressConfiguration(Object.assign(storedConfig, v));
	} catch (e) {
		logger.error(`Failed to set express configuration: ${e.message}`);
		logger.debug(`Exiting ${callMsg}`);
	}
	logger.debug(`Exiting ${callMsg}`);
};

configurationService.getServerConfiguration = () => {
	const callMsg = 'getServerConfiguration()';
	logger.debug(`Entering ${callMsg}`);
	logger.debug(`Exiting ${callMsg}`);
	return configurationModel.getServerConfiguration();
};

configurationService.setServerConfiguration = (config) => {
	const callMsg = `setServerConfiguration(config = ${typeof config})`;
	const v = toolboxService.validate(config, 'configurationService_setServerConfiguration');
	try {
		const storedConfig = configurationService.getServerConfiguration();
		configurationModel.setServerConfiguration(Object.assign(storedConfig, v));
	} catch (e) {
		logger.error(`Failed to set server configuration: ${e.message}`);
		logger.debug(`Exiting ${callMsg}`);
	}
	logger.debug(`Exiting ${callMsg}`);
};

configurationService.getServiceEnvironment = (serviceFileName) => {
	const callMsg = `getServiceEnvironment(serviceFileName = ${serviceFileName})`;
	logger.debug(`Entering ${callMsg}`);
	const v = toolboxService.validate({ serviceFileName }, 'configurationService_getServiceEnvironment');
	logger.debug(`Exiting ${callMsg}`);
	return configurationModel.getServiceEnvironment(v.serviceFileName);
};

configurationService.setServiceEnvironment = (config) => {
	const callMsg = `setServiceEnvironment(config = ${typeof config})`;
	const v = toolboxService.validate(config, 'configurationService_setServiceEnvironment');
	try {
		configurationModel.setServiceEnvironment(v);
	} catch (e) {
		logger.error(`Failed to set service environment: ${e.message}`);
		logger.debug(`Exiting ${callMsg}`);
	}
	logger.debug(`Exiting ${callMsg}`);
};

configurationService.getLoggingLevels = () => {
	const callMsg = 'getLoggingLevels()';
	logger.debug(`Entering ${callMsg}`);
	logger.debug(`Exiting ${callMsg}`);
	configurationModel.getLoggingLevels();
};

configurationService.setLoggingLevels = (config) => {
	const callMsg = `setLoggingLevels(config = ${typeof config})`;
	const v = toolboxService.validate(config, 'configurationService_setLoggingLevels');
	try {
		configurationModel.setLoggingLevels(v);
	} catch (e) {
		logger.error(`Failed to set logging levels: ${e.message}`);
		logger.debug(`Exiting ${callMsg}`);
	}
	logger.debug(`Exiting ${callMsg}`);
};

module.exports = configurationService;
