const Joi = require('joi');

const tokenName = Joi.string().max(50);
const issuedTo = Joi.string();
const authorizedIps = Joi.array();
const collections = Joi.array();
const accessType = Joi.string().valid('readonly', 'writeonly', 'readwrite').default('readonly');
const serviceAccountName = Joi.string().max(50);
const host = Joi.string().max(75);
const port = Joi.number().min(80).max(65534);
const username = Joi.string().max(50);
const password = Joi.string();
const timeout = Joi.number().max(43200);
const rejectUnauthorized = Joi.boolean();
const method = Joi.string().lowercase().valid('get', 'post');
const collectionName = Joi.string().max(75);
const description = Joi.string().max(150);
const ttl = Joi.number();
const minValidCacheSizeInBytes = Joi.number();
const lastCacheUpdate = Joi.date().iso();
const path = Joi.string();
const body = Joi.alternatives().try(Joi.string().max(5000), Joi.object());
const bodyFile = Joi.string();
const stringPrefix = Joi.string().allow('');
const processAsStream = Joi.boolean();
const sourceType = Joi.string().valid('bigfix_compliance_inventory_api', 'bigfix_root_api', 'basic auth', 'listener');

const schemas = {};

schemas.collectionService_increaseStreamCount = Joi.object().keys({
	collectionName: collectionName.required()
});

schemas.collectionService_decreaseStreamCount = Joi.object().keys({
	collectionName: collectionName.required()
});

schemas.collectionService_isTokenAuthorizedToAccessCollection = Joi.object().keys({
	tokenName: tokenName.required(),
	collectionName: collectionName.required(),
	method: Joi.string()
});

schemas.collectionService_createToken = Joi.object().keys({
	tokenName: tokenName.required(),
	description: description.required(),
	issuedTo: issuedTo.required(),
	authorizedIps,
	collections,
	accessType
});

schemas.collectionService_getToken = Joi.object().keys({
	tokenName: tokenName.required()
});

schemas.collectionService_updateToken = Joi.object().keys({
	tokenName: tokenName.required(),
	description,
	issuedTo,
	authorizedIps,
	collections,
	accessType
});

schemas.collectionService_deleteToken = Joi.object().keys({
	tokenName: tokenName.required()
});

schemas.collectionService_createServiceAccount = Joi.object().keys({
	name: serviceAccountName.required(),
	host: host.required(),
	port: port.required(),
	username,
	password,
	timeout: timeout.default(0),
	rejectUnauthorized: rejectUnauthorized.default(false),
	method,
	apiToken: Joi.string()
})
	.with('password', 'username')
	.with('username', 'password');

schemas.collectionService_updateServiceAccount = Joi.object().keys({
	name: serviceAccountName.required(),
	host,
	port,
	username,
	password,
	timeout,
	rejectUnauthorized,
	method,
	apiToken: Joi.string()
})
	.with('password', 'username')
	.with('username', 'password');

schemas.collectionService_deleteServiceAccount = Joi.object().keys({
	serviceAccountName
});

schemas.collectionService_getServiceAccount = Joi.object().keys({
	serviceAccountName
});

schemas.collectionService_createMetaData = Joi.object().keys({
	name: collectionName.required(),
	description: description.required(),
	ttl: ttl.default(1440),
	minValidCacheSizeInBytes: minValidCacheSizeInBytes.default(0),
	serviceAccountName,
	path: path.required(),
	sourceType: sourceType.required(),
	body,
	bodyFile,
	incomingTransforms: Joi.string().allow(''),
	outgoingTransforms: Joi.string().allow(''),
	stringPrefix,
	processAsStream: processAsStream.default(true),
	autoStart: Joi.boolean().default(true)
});

schemas.collectionService_updateMetaData = Joi.object().keys({
	name: collectionName.required(),
	description,
	ttl,
	minValidCacheSizeInBytes: Joi.number(),
	lastCacheUpdate,
	serviceAccountName,
	path,
	sourceType,
	body,
	bodyFile,
	lastErrorMessage: Joi.string().allow(''),
	lastErrorTimestamp: Joi.date().iso(),
	incomingTransforms: Joi.string().allow(''),
	outgoingTransforms: Joi.string().allow(''),
	cacheFile: Joi.string(),
	stringPrefix,
	processAsStream,
	autoStart: Joi.boolean().default(true)
});

schemas.collectionService_deleteMetaData = Joi.object().keys({
	collectionName
});

schemas.collectionService_getMetaData = Joi.object().keys({
	collectionName
});

schemas.collectionService_getDataStream = Joi.object().keys({
	collectionName,
	ancillaryTransform: Joi.string()
});

schemas.collectionService_saveCollectionData = Joi.object().keys({
	collectionName,
	dataStream: Joi.object().required()
});

schemas.collectionService_refreshData = Joi.object().keys({
	collectionName
});

schemas.collectionService_stopInterval = Joi.object().keys({
	collectionName
});

schemas.collectionService_startInterval = Joi.object().keys({
	collectionName
});

module.exports = schemas;
