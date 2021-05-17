const Joi = require('joi');
const { serviceFileName } = require('./globalSchema');

const identifier = Joi.string().required();

const schemas = {};

schemas.serviceAccountService = Joi.object().keys({
	serviceFileName
});

schemas.serviceAccountService_set = Joi.object().keys({
	identifier,
	accountInfo: Joi.object().required()
});

schemas.serviceAccountService_get = Joi.object().keys({
	identifier
});

schemas.serviceAccountService_delete = Joi.object().keys({
	identifier
});

module.exports = schemas;
