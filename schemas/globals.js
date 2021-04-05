const Joi = require('joi');

const g = {};

g.credentials = Joi.string();
g.environment = Joi.string().default('default');
g.serviceFileName = Joi.string().regex(/Service\.js$/);

module.exports = g;
