const { basename } = require('path');
const configurationModel = require('../models/configurationModel');
const toolboxService = require('./toolboxService');
const logger = require('./loggingService')(__filename);

const CONFIG_OBJECT_MERGE = true; // When true merges with existing object properties vs replacing with current object

const staticMethods = {};

function configurationService(serviceFileName) {
	const params = (typeof serviceFileName === 'undefined' ? '' : `serviceFileName = "${serviceFileName}"`);
	let callmsg = `configurationService(${params})`;
	logger.debug(`Entering ${callmsg}`);
	let v;
	try {
		v = toolboxService.validate({ serviceFileName }, 'configurationService');
		if (serviceFileName) v.serviceName = (basename(serviceFileName).replace(/\.js$/i, ''));
	} catch (e) {
		logger.error(e.message);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	logger.debug(`Exiting ${callmsg}`);
	if (typeof v.serviceFileName === 'undefined') return staticMethods;
	configurationModel.set(v.serviceName);
	return {
		get: (propertyName) => {
			callmsg = `configurationService["${v.serviceName}"].get(propertyName = "${propertyName}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ propertyName }, 'configurationService_get');
			} catch (e) {
				logger.error(`${callmsg} returned error: ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
			return configurationModel.get(v.serviceName, v2.propertyName);
		},
		set: async (config) => {
			callmsg = `configurationService["${v.serviceName}"].set(config = ${typeof config})`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate(config, 'configurationService_set');
			} catch (e) {
				logger.error(`${callmsg} returned error: ${e.messaga}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			try {
				const storedConfig = configurationModel.get(v.serviceName);
				const arg = CONFIG_OBJECT_MERGE ? Object.assign(storedConfig, v2) : v2;
				configurationModel.set(v.serviceName, arg);
			} catch (e) {
				logger.error(`configurationModel.set(serviceName = ${v.serviceName}, config = ${typeof arg}) returned error: ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
		},
		exists: (propertyName) => {
			callmsg = `configurationService["${v.serviceName}"].exists(propertyName = "${propertyName}")`;
			logger.debug(`Entering ${callmsg}`);
			let v2;
			try {
				v2 = toolboxService.validate({ propertyName }, 'configurationService_exists');
			} catch (e) {
				logger.error(`${callmsg} returned error: ${e.message}`);
				logger.debug(`Exiting ${callmsg}`);
				throw e;
			}
			logger.debug(`Exiting ${callmsg}`);
			const retval = configurationModel.get(v.serviceName, v2.propertyName);
			return (!!retval);
		}
	};
}

staticMethods.getExpressConfiguration = () => {
	const callmsg = 'getExpressConfiguration()';
	logger.debug(`Entering ${callmsg}`);
	logger.debug(`Exiting ${callmsg}`);
	return configurationModel.getExpressConfiguration();
};

staticMethods.setExpressConfiguration = (config) => {
	const callmsg = `setExpressConfiguration(config = ${typeof config})`;
	logger.debug(`Entering ${callmsg}`);
	let v2;
	try {
		v2 = toolboxService.validate(config, 'configurationService_setExpressConfiguration');
	} catch (e) {
		logger.error(e.message);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	try {
		const storedConfig = configurationModel.getExpressConfiguration();
		const arg = CONFIG_OBJECT_MERGE ? Object.assign(storedConfig, v2) : v2;
		configurationModel.setExpressConfiguration(arg);
	} catch (e) {
		logger.error(`configurationModel.setExpressConfiguration(${typeof arg}) returned error: ${e.message}`);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	logger.debug(`Exiting ${callmsg}`);
};

staticMethods.getServerConfiguration = () => {
	const callmsg = 'getServerConfiguration()';
	logger.debug(`Entering ${callmsg}`);
	logger.debug(`Exiting ${callmsg}`);
	return configurationModel.getServerConfiguration();
};

staticMethods.setServerConfiguration = (config) => {
	const callmsg = `setServerConfiguration(config = ${typeof config})`;
	logger.debug(`Entering ${callmsg}`);
	let v2;
	try {
		v2 = toolboxService.validate(config, 'configurationService_setServerConfiguration');
	} catch (e) {
		logger.error(e.message);
		logger.debug(`Exiting ${callmsg}`);
		throw e;
	}
	try {
		const storedConfig = configurationService.getServerConfiguration();
		const arg = CONFIG_OBJECT_MERGE ? Object.assign(storedConfig, v2) : v2;
		configurationModel.setServerConfiguration(arg);
	} catch (e) {
		logger.error(`configurationModel.setServerConfiguration(${typeof storedConfig}) returned error: ${e.message}`);
		logger.debug(`Exiting ${callmsg}`);
	}
	logger.debug(`Exiting ${callmsg}`);
};

staticMethods.getLoggingLevels = () => {
	const callMsg = 'getLoggingLevels()';
	logger.debug(`Entering ${callMsg}`);
	const loggingLevels = configurationModel.getLoggingLevels();
	logger.debug(`getLoggingLevels::logginglevels value: ${JSON.stringify(loggingLevels)}`);
	logger.debug(`Exiting ${callMsg}`);
	return loggingLevels;
};

staticMethods.setLoggingLevels = (config) => {
	const callMsg = `setLoggingLevels(config = ${typeof config})`;
	const v = toolboxService.validate(config, 'configurationService_setLoggingLevels');
	try {
		configurationModel.setLoggingLevels(v);
	} catch (e) {
		logger.error(`configurationModel.setLoggingLevels(${JSON.stringify(v)}) returned error: ${e.message}`);
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	logger.debug(`Exiting ${callMsg}`);
};

module.exports = configurationService;
