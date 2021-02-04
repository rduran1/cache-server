const configurationModel = require('../models/configurationModel');

const configurationService = {};

configurationService.getAppConfiguration = () => configurationModel.getAppConfiguration();
configurationService.getServiceEnvironment = (serviceName) => configurationModel.getServiceEnvironment(serviceName);
configurationService.getServerConfiguration = () => configurationModel.getServerConfiguration();
configurationService.getLoggingLevels = () => configurationModel.getLoggingLevels();

module.exports = configurationService;
