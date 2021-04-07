const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.toolboxService_truncateFile = Joi.object().keys({
	strFileName: Joi.string().max(120).required(),
	len: Joi.number().default(0),
	strAppend: Joi.string()
});

schemas.toolboxService_initializeStore = Joi.object().keys({
	modelFileName: Joi.string().max(120).regex(/Model.js$/).required(),
	initValue: Joi.alternatives().try(
		Joi.object(),
		Joi.array()
	).required()
});

schemas.toolboxService_saveStoreToFile = Joi.object().keys({
	fileName: Joi.string().max(120).required(),
	store: Joi.array().required(),
	withTabFormat: Joi.boolean().default(true)
});

schemas.toolboxService_parseCsvToArray = Joi.object().keys({
	content: Joi.string().required()
});

module.exports = schemas;
