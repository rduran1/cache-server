const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.bigfixService_authentication = Joi.object().keys({
	username: Joi.string().min(2).required(),
	password: Joi.string().min(2).required()
});

schemas.bigfixService_operator = Joi.object().keys({
	opName: Joi.string().min(2).required()
});

module.exports = schemas;
