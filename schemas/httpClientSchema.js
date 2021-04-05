const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.httpClientService_asyncRequest = Joi.object().keys({
	host: Joi.string().hostname().required(),
	path: Joi.string().default('/'),
	method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'get', 'post', 'put', 'delete').default('GET'),
	port: Joi.number().min(80).max(65534),
	rejectUnauthorized: Joi.boolean().default(true),
	timeout: Joi.number(),
	useTls: Joi.boolean().default(true),
	body: Joi.string().allow('').allow(null),
	returnClientRequest: Joi.boolean().default(false),
	returnHttpIncomingMessage: Joi.boolean().default(false),
	key: Joi.string().regex(/^[/\w\\:.]+$/),
	cert: Joi.string().regex(/^[/\w\\:.]+$/),
	// auth: Joi.string().regex(/:/, { invert: true }) // DO NOT USE or will leak credentials
	auth: Joi.string()
});

module.exports = schemas;
