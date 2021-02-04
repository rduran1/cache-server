const configurationModel = require('../models/configurationModel');

const configurationService = {};

configurationService.getServiceEnvironment = (serviceName) => configurationModel.getServiceEnvironment(serviceName);
configurationService.getLoggingLevels = () => configurationModel.getLoggingLevels();

module.exports = configurationService;
