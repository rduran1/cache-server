const schemas = require('./models/schemaModel');

const schemaService = {};

schemaService.validate = (object, schemaName) => {
  if (typeof object !== 'object') throw new Error('first parameter of validate method must be of type object');
  if (typeof schemaName !== 'string') throw new Error('second parameter of validate method must be of type string');
  if (typeof schemas[schemaName] === 'undefined') throw new Error(`Schema definition for '${schemaName}' does not exist in the schema model`);
  const validationResult = Joi.validate(object, schemas[schemaName]);
  if (validationResult.error != null) {
    const validateErrorMessage = validationResult.error.message.replace(/.+?\[/,'').replace(/\]$/,'');
    throw new Error(validateErrorMessage);
  }
};