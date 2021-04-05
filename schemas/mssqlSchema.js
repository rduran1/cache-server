const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.mssqlService_dbNameAndBackupFile = Joi.object().keys({
	databaseName: Joi.string().required().regex(/^[\w]+$/),
	backupFileLocation: Joi.string().required().regex(/^[\w\\:.]+$/),
	timeout: Joi.number().min(0)
});

module.exports = schemas;
