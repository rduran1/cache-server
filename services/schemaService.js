const schemas = require('../models/schemaModel');

const ABORT_EARLY = false;

const schemaService = {};

schemaService.validate = (object, schemaName) => {
	if (typeof object !== 'object') throw new Error('Validation target must be of type object');
	if (typeof schemaName !== 'string') throw new Error('Schema identifier must be of type string');
	if (typeof schemas[schemaName] === 'undefined') throw new Error(`Schema definition for "${schemaName}" does not exist in the schema model`);
	const validationResult = schemas[schemaName].validate(object, { abortEarly: ABORT_EARLY });
	if (validationResult.error != null) {
		if (typeof validationResult.error.details === 'object' && typeof validationResult.error.details[0].message === 'string') {
			const errors = validationResult.error.details.map((el) => el.message);
			const s = errors.length > 1 ? 's' : '';
			throw new Error(`Validation failure${s}: ${errors.join(' and ')}`);
		}
		const validateErrorMessage = validationResult.error.message.replace(/.+?\[/, '').replace(/\]$/, '');
		throw new Error(`Validation failureX: ${validateErrorMessage}`);
	}
	return validationResult.value;
};

module.exports = schemaService;
