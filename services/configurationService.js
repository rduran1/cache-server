const configurationModel = require('../models/configurationModel');

const configurationService = {};

configurationService.getServiceEnvironment = (serviceName) => configurationModel.getServiceEnvironment(serviceName);

module.exports = configurationService;
