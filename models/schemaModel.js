const schemaDefinitions = [];

schemaDefinitions.push(require('../schemas/serviceAccountSchema'));
schemaDefinitions.push(require('../schemas/configurationSchema'));
schemaDefinitions.push(require('../schemas/bigfixSchema'));
schemaDefinitions.push(require('../schemas/hpsmIncidentSchema'));
schemaDefinitions.push(require('../schemas/toolboxSchema'));
schemaDefinitions.push(require('../schemas/httpClientSchema'));
schemaDefinitions.push(require('../schemas/accessControlSchema'));

const schemas = {};

Object.assign(schemas, ...schemaDefinitions);

module.exports = schemas;
