const Joi = require('joi');

const serviceAccountName = Joi.string().max(50);
const host = Joi.string().max(75);
const port = Joi.number().min(80).max(65534);
const username = Joi.string().max(50);
const password = Joi.string();
const timeout = Joi.number().default(0).max(43200);
const rejectUnauthorized = Joi.boolean().default(false);
const method = Joi.string().lowercase().valid('get', 'post');
const collectionName = Joi.string().max(75);
const description = Joi.string().max(150);
const ttl = Joi.number().default(1440);
const minValidCacheSizeInBytes = Joi.number().default(0);
const path = Joi.string();
const body = Joi.string().max(5000);
const headerString = Joi.string();
const status = Joi.string().valid('stopped', 'starting', 'running', 'waiting', 'receiving', 'error');

const schemas = {};

schemas.collectionService_createServiceAccount = Joi.object().keys({
	name: serviceAccountName.required(),
	host: host.required(),
	port: port.required(),
	username,
	password,
	timeout,
	rejectUnauthorized,
	method
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
	method
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
	ttl,
	minValidCacheSizeInBytes,
	serviceAccountName: serviceAccountName.required(),
	path: path.required(),
	body,
	incomingTransforms: Joi.string(),
	outgoingTransforms: Joi.string(),
	headerString,
	processAsStream: Joi.boolean().default(true),
	autoStart: Joi.boolean().default(true)
});

schemas.collectionService_updateMetaData = Joi.object().keys({
	name: collectionName.required(),
	description,
	ttl,
	minValidCacheSizeInBytes,
	serviceAccountName,
	path,
	body,
	status,
	streamingCount: Joi.number().default(0),
	lastErrorMessage: Joi.string().allow(''),
	lastErrorTimestamp: Joi.date().iso(),
	incomingTransforms: Joi.string(),
	outgoingTransforms: Joi.string(),
	cacheFile: Joi.string(),
	headerString,
	processAsStream: Joi.boolean(),
	autoStart: Joi.boolean().default(true)
});

schemas.collectionService_deleteMetaData = Joi.object().keys({
	collectionName
});

schemas.collectionService_getMetaData = Joi.object().keys({
	collectionName
});

schemas.collectionService_getDataStream = Joi.object().keys({
	collectionName
});

schemas.collectionService_refreshData = Joi.object().keys({
	collectionName
});

schemas.collectionService_saveDataStream = Joi.object().keys({
	collectionName,
	dataStream: Joi.object().required()
});

schemas.collectionService_startInterval = Joi.object().keys({
	collectionName
});

schemas.collectionService_increaseStreamCount = Joi.object().keys({
	collectionName
});

schemas.collectionService_decreaseStreamCount = Joi.object().keys({
	collectionName
});

module.exports = schemas;
