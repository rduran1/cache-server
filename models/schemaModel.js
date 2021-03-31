/* eslint-disable comma-dangle */
const Joi = require('joi');

const schemas = {};

schemas.bigfixAuthentication = Joi.object().keys({
	username: Joi.string().min(2).required(),
	password: Joi.string().min(2).required()
});

schemas.bigfixOperator = Joi.object().keys({
	opName: Joi.string().min(2).required()
});

schemas.hpsmAssignmentGroupName = Joi.object().keys({
	assignmentGroupName: Joi.string().min(2).max(100).required()
});

schemas.hpsmIncidentID = Joi.object().keys({
	IncidentID: Joi.string().min(2).max(20)
});

schemas.hpsmNewIncident = Joi.object().keys({
	Area: Joi.string().required(),
	AssignmentGroup: Joi.string().required(),
	Assignee: Joi.string(),
	Subcategory: Joi.string().required(),
	AutoAssignType: Joi.string().required(),
	AffectedCI: Joi.string().required(),
	Category: Joi.string().required().allow(''),
	Contact: Joi.string().required(),
	Description: Joi.string().required(),
	Impact: Joi.string().required().valid('3', '4', '5'),
	Service: Joi.string().required(),
	Title: Joi.string().required(),
	Urgency: Joi.string().required().valid('3', '4', '5'),
	Status: Joi.string(),
	JournalUpdates: Joi.string()
});

schemas.hpsmExistingIncident = Joi.object().keys({
	Area: Joi.string(),
	AssignmentGroup: Joi.string(),
	Assignee: Joi.string(),
	AutoAssignType: Joi.string(),
	Subcategory: Joi.string().required(),
	OutageStartTime: Joi.date().iso(),
	OutageEndTime: Joi.date().iso(),
	AffectedCI: Joi.string().required(),
	Phase: Joi.string(),
	Priority: Joi.string(),
	JournalUpdates: Joi.string().required(),
	Category: Joi.string().required().allow(''),
	Contact: Joi.string().required(),
	Description: Joi.string().required(),
	Impact: Joi.string().required().valid('3', '4', '5'),
	Service: Joi.string().required(),
	Title: Joi.string().required(),
	Urgency: Joi.string().required().valid('3', '4', '5'),
	Status: Joi.string(),
	IncidentID: Joi.string().required(),
	CauseCode: Joi.string(),
	Solution: Joi.string(),
	ClosureCode: Joi.string()
});

schemas.hpsmContacts = Joi.array().items(Joi.array().length(9).items(Joi.string().allow('')));

schemas.hpsmComputers = Joi.array().items(Joi.array().length(19).items(Joi.string().allow('')));

schemas.hpsmPrimaryAffectedServices = Joi.array().items(Joi.array().length(6).items(Joi.string().allow('')));

schemas.mssqlServiceDbNameAndBackupFile = Joi.object().keys({
	databaseName: Joi.string().required().regex(/^[\w]+$/),
	backupFileLocation: Joi.string().required().regex(/^[\w\\:.]+$/),
	timeout: Joi.number().min(0)
});

/** ***********************************
 Global Schema key definitions
************************************* */
const credentials = Joi.string();
const env = Joi.string().default('default');
const serviceFileName = Joi.string().regex(/Service\.js$/).required();

/** ***********************************
 configurationService methods Schema
************************************* */
schemas.configurationService_setExpressConfiguration = Joi.object().keys({
	staticDirectory: Joi.string(),
	viewsDirectory: Joi.string(),
	bodyParserUrlencodedExtended: Joi.boolean(),
	bodyParserJsonSizeLimit: Joi.string(),
	bodyParserTextSizeLimit: Joi.string()
});

schemas.configurationService_setServerConfiguration = Joi.object().keys({
	port: Joi.number().default(3000),
	key: Joi.string().required(),
	cert: Joi.string().required()
});

schemas.configurationService_getServiceEnvironment = Joi.object().keys({
	serviceFileName
});

schemas.configurationService_setServiceEnvironment = Joi.object().keys({
	serviceFileName,
	env
});

schemas.configurationService_setLoggingLevels = Joi.object().keys({
	loggingLevels: Joi.array().items(Joi.string().lowercase().valid('debug', 'error', 'warn', 'info'))
});

/** ***********************************
 toolboxService methods Schema
************************************* */
schemas.toolboxService_truncateFile = Joi.object().keys({
	strFileName: Joi.string().max(120).required(),
	len: Joi.number().default(0),
	strAppend: Joi.string()
});

schemas.toolboxService_initializeStore = Joi.object().keys({
	modelFileName: Joi.string().max(120).required(),
	initValue: Joi.alternatives().try(
		Joi.object(),
		Joi.array()
	).required()
});

schemas.toolboxService_saveStoreToFile = Joi.object().keys({
	fileName: Joi.string().max(90).required(),
	store: Joi.object().required(),
	withTabFormat: Joi.boolean().default(false)
});

schemas.toolboxService_parseCsvToArray = Joi.object().keys({
	content: Joi.string().required()
});

/** ***********************************
 httpClientService methods Schema
************************************* */
schemas.httpClientService_asyncRequest = Joi.object().keys({
	host: Joi.string().hostname().required(),
	path: Joi.string().default('/'),
	method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'get', 'post', 'put', 'delete').default('GET'),
	port: Joi.number().min(80).max(65534),
	rejectUnauthorized: Joi.boolean().default(true),
	timeout: Joi.number(),
	useTls: Joi.boolean().default(true),
	body: Joi.string().allow('').allow(null),
	returnClientRequest: Joi.boolean().default(false),
	returnHttpIncomingMessage: Joi.boolean().default(false),
	key: Joi.string().regex(/^[/\w\\:.]+$/),
	cert: Joi.string().regex(/^[/\w\\:.]+$/),
	// auth: Joi.string().regex(/:/, { invert: true }) // DO NOT USE or will leak credentials
	auth: Joi.string()
});

/** ***********************************
 accessControlService methods Schema
************************************* */
schemas.accessControlService_isAllowed = Joi.object().keys({
	token: Joi.string().token(),
	accountId: Joi.string(),
	resource: Joi.string().required(),
	request: Joi.string().required()
})
	.xor('token', 'accountId');

/** ***********************************
 accountsService methods Schema
************************************* */
schemas.accountsService = Joi.object().keys({
	serviceFileName
});

schemas.accountService_getAccessByToken = Joi.object().keys({
	token: Joi.string().token(),
	env
});

schemas.accountService_getAccessByAccount = Joi.object().keys({
	subject: Joi.string().required(),
	env
});

schemas.accountService_getCredentials = Joi.object().keys({
	env
});

schemas.accountService_createNewEnvironmentCredentials = Joi.object().keys({
	credentials,
	env
});

schemas.accountService_updateEnvironmentCredentials = Joi.object().keys({
	credentials,
	env
});

schemas.accountService_deleteAccountEnvironment = Joi.object().keys({
	env
});

module.exports = schemas;
