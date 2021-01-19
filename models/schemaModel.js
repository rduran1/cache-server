const Joi = require('joi');

const schemas = {};

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