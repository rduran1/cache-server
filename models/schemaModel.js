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
  returnClientRequest: Joi.boolean().required(),
  returnHttpIncomingMessage: Joi.boolean().required(),
  auth: Joi.string().regex(/.+?:.+?/) // Basic authentication i.e. 'user:password'
});

schemas.bigfixAuthentication = Joi.object().keys({
  username: Joi.string().min(2).required(),
  password: Joi.string().min(2).required()
});

schemas.bigfixOperator = Joi.object().keys({
  opName: Joi.string().min(2).required()
});

schemas.hpsmAssignmentGroupName = Joi.object().keys({
  assignmentGroup: Joi.string().min(2).max(100).required()
});

module.exports = schemas;