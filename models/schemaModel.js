const { JSONCookie } = require('cookie-parser');
const Joi = require('joi');

const schemas = {};

schemas.httpClient = Joi.object().keys({
  host: Joi.string().min(2).required(),
  path: Joi.string().required(),
  method: Joi.string().valid("GET","POST","PUT","DELETE","get","post","put","delete").required(),
  port: Joi.number().min(80).max(65534).required(),
  rejectUnauthorized: Joi.boolean().required(),
  timeout: Joi.number(),
  useTls: Joi.boolean().required(),
  body: Joi.string().allow('').allow(null),
  returnClientRequest: Joi.boolean(),
  returnHttpIncomingMessage: Joi.boolean(),
  auth: Joi.string().regex(/.+?:.+?/) // Basic authentication i.e. 'user:password'
});

schemas.bigfix_restapi = Joi.object().keys({
  hostname: Joi.string()
});

schemas.bigfixAuthentication = Joi.object().keys({
  hostname: Joi.string().min(2).required(),
  userId: Joi.string().min(2).required(),
  password: Joi.string().required(),
  rejectUnauthorized: Joi.boolean().required(),
  port: Joi.number().min(80).max(65534).required()
});

schemas.bigfixOperator = Joi.object().keys({
  hostname: Joi.string().min(2).required(),
  userId: Joi.string().min(2).required(),
  password: Joi.string().required(),
  rejectUnauthorized: Joi.boolean().required(),
  port: Joi.number().min(80).max(65534).required(),
  opName: Joi.string().min(2).required()
});

module.exports = schemas;