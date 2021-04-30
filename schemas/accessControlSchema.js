const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const alias = Joi.string().max(20).lowercase().trim().regex(/^\w+$/).required();
const description = Joi.string().max(120);
const status = Joi.string().valid('active', 'disabled');
const issuedTo = Joi.string().email();
const accessControlList = Joi.array();

const schemas = {};

schemas.accessControlService_isAllowed = Joi.object().keys({
	token: Joi.string().token(),
	accountId: Joi.string(),
	resource: Joi.string().required(),
	request: Joi.string().required()
})
	.xor('token', 'accountId');

schemas.accessControlService_createSubject = Joi.object().keys({
	alias,
	createDate: Joi.date().iso().default(Date()),
	description,
	issuedTo: issuedTo.required(),
	status: status.default('active'),
	accountId: Joi.string(),
	accessControlList: accessControlList.default([])
});

schemas.accessControlService_updateSubject = Joi.object().keys({
	alias,
	description,
	status,
	accessControlList
});

schemas.accessControlService_deleteSubject = Joi.object().keys({
	alias
});

module.exports = schemas;
