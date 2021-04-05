const Joi = require('joi');
const { serviceFileName, environment, credentials } = require('./globals');

const schemas = {};

schemas.serviceAccountService = Joi.object().keys({
	serviceFileName
});

schemas.servicesAccountService_getAccessByToken = Joi.object().keys({
	token: Joi.string().token(),
	env: environment
});

schemas.servicesAccountService_setServiceEnvironment = Joi.object().keys({
	newEnv: environment
});

schemas.serviceAccountService_getCredentials = Joi.object().keys({
	environment
});

schemas.serviceAccountService_setCredentials = Joi.object().keys({
	environment,
	credentials: Joi.object()
});

schemas.serviceAccountService_createNewEnvironmentCredentials = Joi.object().keys({
	credentials,
	env: environment
});

schemas.serviceAccountService_updateEnvironmentCredentials = Joi.object().keys({
	credentials,
	env: environment
});

schemas.serviceAccountService_deleteAccountEnvironment = Joi.object().keys({
	env: environment
});

module.exports = schemas;
