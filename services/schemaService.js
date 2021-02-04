const schemas = require('../models/schemaModel');

const schemaService = {};

schemaService.validate = (object, schemaName) => {
	if (typeof object !== 'object') throw new Error('Validation target must be of type object');
	if (typeof schemaName !== 'string') throw new Error('Schema identifier must be of type string');
	if (typeof schemas[schemaName] === 'undefined') throw new Error(`Schema definition for "${schemaName}" does not exist in the schema model`);
	const validationResult = schemas[schemaName].validate(object);
	if (validationResult.error != null) {
		const validateErrorMessage = validationResult.error.message.replace(/.+?\[/, '').replace(/\]$/, '');
		throw new Error(`Error: Validation failure: ${validateErrorMessage}`);
	}
};

module.exports = schemaService;
