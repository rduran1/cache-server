const Joi = require('joi');
const { serviceFileName, environment } = require('./globalSchema');

const schemas = {};

schemas.configurationService = Joi.object().keys({
	serviceFileName
});

schemas.configurationService_setExpressConfiguration = Joi.object().keys({
	staticDirectory: Joi.string(),
	viewsDirectory: Joi.string(),
	bodyParserUrlencodedExtended: Joi.boolean(),
	bodyParserJsonSizeLimit: Joi.string(),
	bodyParserTextSizeLimit: Joi.string()
});

schemas.configurationService_setServerConfiguration = Joi.object().keys({
	port: Joi.number().default(3000),
	key: Joi.string().required(),
	cert: Joi.string().required()
});

schemas.configurationService_getServiceEnvironment = Joi.object().keys({
	serviceFileName
});

schemas.configurationService_setServiceEnvironment = Joi.object().keys({
	serviceFileName,
	environment
});

schemas.configurationService_createDefaultServiceEnvironment = Joi.object().keys({
	serviceFileName
});

schemas.configurationService_setLoggingLevels = Joi.object().keys({
	loggingLevels: Joi.array().items(Joi.string().lowercase().valid('debug', 'error', 'warn', 'info'))
});

schemas.configurationService_get = Joi.object().keys({
	propertyName: Joi.string()
});

module.exports = schemas;
