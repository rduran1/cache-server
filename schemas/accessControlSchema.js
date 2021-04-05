const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.accessControlService_isAllowed = Joi.object().keys({
	token: Joi.string().token(),
	accountId: Joi.string(),
	resource: Joi.string().required(),
	request: Joi.string().required()
})
	.xor('token', 'accountId');

module.exports = schemas;
