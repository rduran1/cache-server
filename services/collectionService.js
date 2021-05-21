const fs = require('fs');
const qs = require('querystring');
const { join } = require('path');
const Emitter = require('events').EventEmitter;
const logger = require('./loggingService')(__filename);
const toolboxService = require('./toolboxService');
const transformService = require('./transformService');
const httpClientService = require('./httpClientService');
const configurationService = require('./configurationService')(__filename);
const serviceAccountService = require('./serviceAccountService')(__filename);
const collectionsModel = require('../models/collectionsModel');

const em = new Emitter();

let cacheDirectory = configurationService.get('cacheDirectory');
if (typeof cacheDirectory === 'undefined') {
	const cacheDir = join(process.env.INSTALL_DIR, 'collectionServiceCache');
	configurationService.set({ cacheDirectory: cacheDir });
	cacheDirectory = cacheDir;
}
if (!fs.existsSync(cacheDirectory)) fs.mkdirSync(cacheDirectory, { recursive: true });

logger.info(`collectionService::cacheDirectory value: "${cacheDirectory}"`);

const collectionService = {};

collectionService.timers = {};

function buildHttpRequestConfig(serviceAccount, collectionMetaData) {
	const config = toolboxService.clone(serviceAccount);
	if (typeof config.username === 'string') config.auth = `${config.username}:${config.password}`;
	const { path, body } = collectionMetaData;
	config.path = path;
	if (typeof body === 'object') config.body = qs.stringify(body);
	if (typeof body === 'string') config.body = body;
	config.returnClientRequest = true;
	delete config.username;
	delete config.password;
	return config;
}

function validationLogWrapper(obj, schemaName) {
	try {
		return toolboxService.cloneAndValidate(obj, schemaName);
	} catch (e) {
		logger.error(`${e} per schema "${schemaName}"`);
		throw e;
	}
}

async function setIntervalTimer(collectionName) {
	const metaData = await collectionService.getMetaData(collectionName);
	if (typeof collectionService.timers[collectionName] === 'object') {
		logger.info(`Interval timer already set for "${collectionName}" collection`);
		return;
	}
	logger.info(`Setting refresh interval for "${collectionName}" collection to every ${metaData.ttl} minute${metaData.ttl > 1 ? 's' : ''}`);
	collectionService.timers[collectionName] = setInterval(collectionService.refreshData, metaData.ttl * 1000 * 60, collectionName);
}

function clearIntervalTimer(collectionName) {
	if (collectionService.timers[collectionName]) {
		logger.debug(`Clearing interval timer for "${collectionName}"`);
		clearInterval(collectionService.timers[collectionName]);
		delete collectionService.timers[collectionName];
		return;
	}
	logger.error(`Request to clear interval timer for "${collectionName}" failed, timer for collection does not exist`);
}

function setMetaDataStatus(collectionName, status, errorMsg) {
	const statusInfo = {};
	statusInfo.status = status;
	logger.debug(`Setting status for "${collectionName}" collection to ${status}`);
	if (typeof errorMsg === 'string' && errorMsg.length > 0) {
		statusInfo.lastErrorMessage = errorMsg;
		statusInfo.lastErrorTimestamp = new Date().toISOString();
		logger.error(`Error in collection "${collectionName}": ${errorMsg}`);
	}
	collectionsModel.setMetaDataStatus(collectionName, statusInfo);
}

function checkIfTransformsExist(v, ancillaryTransform) {
	if (typeof v.incomingTransforms === 'string') {
		const t = transformService.get(v.incomingTransforms);
		if (typeof t === 'undefined') {
			const e = new Error(`Incoming transform label "${v.incomingTransforms}" does not exist`);
			logger.error(e.stack);
			throw e;
		}
	}
	if (typeof v.outgoingTransforms === 'string') {
		const t = transformService.get(v.outgoingTransforms);
		if (typeof t === 'undefined') {
			const e = new Error(`Outgoing transform label "${v.outgoingTransforms}" does not exist`);
			logger.error(e.stack);
			throw e;
		}
	}
	if (typeof ancillaryTransform === 'string') {
		const t = transformService.get(ancillaryTransform);
		if (typeof t === 'undefined') {
			const e = new Error(`Ancillary tansform label "${ancillaryTransform}" does not exist`);
			logger.error(e.stack);
			throw e;
		}
	}
}

const clientRequestHandler = (clientRequest, collectionName, processAsStream, body) => new Promise((resolve, reject) => {
	clientRequest.on('error', async (e) => {
		if (/routines:ssl3_get_record:wrong version number/.test(e.message)) {
			return reject(new Error('clientRequest error: Server does not appear to support HTTPS/TLS protocol'));
		}
		const eInfo = [];
		if (typeof e.code !== 'undefined') eInfo.push(`code: ${e.code}`);
		if (typeof e.errno !== 'undefined') eInfo.push(`errno: ${e.errno}`);
		if (typeof e.path !== 'undefined') eInfo.push(`path: ${e.path}`);
		if (typeof e.syscall !== 'undefined') eInfo.push(`syscall: ${e.syscall}`);
		if (typeof e.host !== 'undefined') eInfo.push(`host: ${e.host}`);
		if (typeof e.port !== 'undefined') eInfo.push(`port: ${e.port}`);
		const found = e.message.match(/:sslv3 alert (.+?):/);
		if (found) {
			return reject(new Error(`clientRequest error: ${found[1]}`));
		}
		return reject(new Error(`clientRequest error: ${e.message} (${eInfo.join(' ')})`));
	});

	clientRequest.on('abort', async (e) => reject(new Error(`clientRequest aborted: ${e.message}`)));

	clientRequest.on('timeout', async () => {
		clientRequest.destroy();
		return reject(new Error('clientRequest timeout: exceeded wait time for server response'));
	});

	// eslint-disable-next-line consistent-return
	clientRequest.on('response', async (httpIncomingMessage) => {
		const { statusCode, headers, statusMessage } = httpIncomingMessage;
		if (statusCode === 301 && typeof headers === 'object' && typeof headers.location === 'string') {
			return reject(new Error(`httpIncomingMessage error: Server responded with HTTP 301, URI permanently moved to ${headers.location}`));
		}
		if (/[345]\d\d/.test(statusCode)) {
			return reject(new Error(`httpIncomingMessage error: Server responded with HTTP ${statusCode} ${statusMessage}`));
		}
		let data = '';
		if (!processAsStream) {
			httpIncomingMessage.on('data', (chunk) => {
				data += chunk.toString();
			});
			httpIncomingMessage.on('end', async () => {
				try {
					collectionService.saveData(collectionName, data);
					resolve();
				} catch (e) {
					return reject(e);
				}
				return undefined;
			});
		}
		httpIncomingMessage.on('aborted', async (e) => reject(new Error(`httpIncomingMessage aborted: ${e.message}`)));
		httpIncomingMessage.on('error', async (e) => reject(new Error(`httpIncomingMessage error: ${e.message}`)));
		function destroySocket(collName) {
			if (collName !== collectionName) return;
			if (!httpIncomingMessage.complete) httpIncomingMessage.destroy();
		}
		em.addListener('stopCollectionProcess', destroySocket);
		if (processAsStream) {
			try {
				await collectionService.saveDataStream(collectionName, httpIncomingMessage);
				resolve();
			} catch (e) {
				return reject(e);
			}
		}
		em.removeListener('stopCollectionProcess', destroySocket);
	});

	if (body) {
		clientRequest.setHeader('Content-Length', body.length);
		clientRequest.end(body);
	} else {
		clientRequest.end();
	}
});

collectionService.increaseStreamCount = (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_increaseStreamCount');
	collectionsModel.increaseStreamCount(v.collectionName);
	const sc = collectionsModel.getStreamCount(collectionName);
	logger.debug(`Stream count for "${collectionName}" collection increased to ${sc}`);
};

collectionService.decreaseStreamCount = (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_decreaseStreamCount');
	let sc = collectionsModel.getStreamCount(collectionName);
	if (sc === 0) {
		const e = new Error(`Stream count for "${collectionName}" collection is already at 0`);
		return logger.error(e.stack);
	}
	collectionsModel.decreaseStreamCount(v.collectionName);
	sc = collectionsModel.getStreamCount(collectionName);
	return logger.debug(`Stream count for "${collectionName}" collection decreased to ${sc}`);
};

collectionService.createServiceAccount = async (config) => {
	const v = validationLogWrapper(config, 'collectionService_createServiceAccount');
	const serviceAccount = await serviceAccountService.get(v.name);
	if (serviceAccount) {
		const e = new Error(`Service account "${v.name}" already exists`);
		logger.error(e.stack);
		throw e;
	}
	logger.info(`Creating service account "${v.name}"`);
	const serviceAccountName = v.name;
	delete v.name; // name is the key so it doesnt need to exist as a property
	await serviceAccountService.set(serviceAccountName, v);
	logger.info(`Service account "${serviceAccountName}" successfully created`);
};

collectionService.updateServiceAccount = async (config) => {
	const v = validationLogWrapper(config, 'collectionService_updateServiceAccount');
	const serviceAccount = await serviceAccountService.get(v.name);
	if (!serviceAccount) throw new Error(`Service account "${v.name}" does not exist`);
	const serviceAccountName = v.name;
	logger.info(`Updating service account "${serviceAccountName}"`);
	Object.assign(serviceAccount, v);
	delete serviceAccount.name; // name is the key so it doesnt need to exist as a property
	await serviceAccountService.set(serviceAccountName, serviceAccount);
	logger.info(`Service account "${serviceAccountName}" successfully updated`);
};

collectionService.deleteServiceAccount = async (serviceAccountName) => {
	const v = validationLogWrapper({ serviceAccountName }, 'collectionService_deleteServiceAccount');
	const serviceAccount = await serviceAccountService.get(v.serviceAccountName);
	if (!serviceAccount) {
		const e = new Error(`Service account "${v.serviceAccountName}" does not exist`);
		logger.error(e.stack);
		throw e;
	}
	logger.info(`Deleting service account "${v.serviceAccountName}"`);
	await serviceAccountService.delete(v.serviceAccountName);
	logger.info(`Service account "${v.serviceAccountName}" successfully deleted`);
};

collectionService.getServiceAccount = async (serviceAccountName) => {
	const v = validationLogWrapper({ serviceAccountName }, 'collectionService_getServiceAccount');
	logger.debug(`Retrieving service account "${serviceAccountName}"`);
	const serviceAccount = await serviceAccountService.get(v.serviceAccountName);
	if (!serviceAccount) throw new Error(`Service account "${serviceAccountName}" does not exist`);
	return serviceAccount;
};

collectionService.createMetaData = async (config) => {
	const v = validationLogWrapper(config, 'collectionService_createMetaData');
	const metaData = await collectionsModel.getMetaData(v.name);
	if (metaData) {
		const e = new Error(`Collection meta data for "${v.name}" already exists`);
		logger.error(e.stack);
		throw e;
	}
	await collectionService.getServiceAccount(v.serviceAccountName); // throws error if account does not exist
	checkIfTransformsExist(v); // throws error if transforms requested do not exist
	const collectionMetaDataName = v.name;
	v.cacheFile = join(cacheDirectory, v.name);
	/// ///////////////////////////////////////////////////////////
	// Custom code for Bigfix relevance file
	if (typeof v.bodyFile === 'string') {
		try {
			const relevance = fs.readFileSync(v.bodyFile, 'utf8');
			v.body = { relevance, output: 'json' };
		} catch (e) {
			logger.error(`Failed to read bodyFile for "${v.name}" collection: ${e.message}`);
			throw e;
		}
	}
	// ////////////////////////////////////////////////////////////
	delete v.name;
	logger.info(`Creating meta data for "${collectionMetaDataName}" collection`);
	await collectionsModel.setMetaData(collectionMetaDataName, v);
	logger.info(`Meta data for "${collectionMetaDataName}" collection successfully created`);
};

collectionService.updateMetaData = async (config) => {
	const v = validationLogWrapper(config, 'collectionService_updateMetaData');
	const metaData = await collectionService.getMetaData(v.name);
	if (!metaData) {
		const e = new Error(`Collection meta data for "${v.name}" does not exist`);
		logger.error(e.stack);
		throw e;
	}
	if (typeof v.serviceAccountName !== 'undefined') await collectionService.getServiceAccount(v.serviceAccountName);
	checkIfTransformsExist(v);
	Object.assign(metaData, v);
	const collectionMetaDataName = v.name;
	/// ///////////////////////////////////////////////////////////
	// Custom code for Bigfix relevance file
	if (typeof v.bodyFile === 'string') {
		try {
			const relevance = fs.readFileSync(v.bodyFile, 'utf8');
			v.body = { relevance, output: 'json' };
		} catch (e) {
			logger.error(`Failed to read bodyFile for "${v.name}" collection: ${e.message}`);
			throw e;
		}
	}
	// ////////////////////////////////////////////////////////////
	delete metaData.name;
	logger.info(`Updating meta data for "${collectionMetaDataName}" collection`);
	await collectionsModel.setMetaData(collectionMetaDataName, metaData);
	logger.info(`Meta data for "${collectionMetaDataName}" collection successfully updated`);
};

collectionService.deleteMetaData = async (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_deleteMetaData');
	await collectionService.getMetaData(v.collectionName);
	logger.info(`Deleting meta data for "${collectionName}" collection`);
	await collectionService.stopInterval(v.collectionName);
	await collectionsModel.deleteMetaData(v.collectionName);
	logger.info(`Meta data for "${collectionName}" collection successfully deleted`);
};

collectionService.getMetaData = async (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_getMetaData');
	const metaData = await collectionsModel.getMetaData(v.collectionName);
	if (typeof metaData === 'undefined') {
		const e = new Error(`Collection meta data for "${v.collectionName}" does not exist`);
		logger.error(e.stack);
		throw e;
	}
	return metaData;
};

collectionService.getAllMetaData = async () => {
	const metaData = await collectionsModel.getAllMetaData();
	return metaData;
};

collectionService.getAllServiceAccounts = async () => {
	const sa = await collectionsModel.getAllServiceAccounts();
	return sa;
};

collectionService.getDataStream = async (collectionName, ancillaryTransform) => {
	const v = validationLogWrapper({ collectionName, ancillaryTransform }, 'collectionService_getDataStream');
	const metaData = await collectionsModel.getMetaData(v.collectionName);
	if (!metaData) throw new Error(`Collection meta data for "${v.collectionName}" does not exist`);
	checkIfTransformsExist(metaData, ancillaryTransform);
	// Get outgoing transforms and add any transforms requested in the params
	const transforms = transformService.get(metaData.outgoingTransforms);
	const transformsParam = transformService.get(ancillaryTransform);
	if (transformsParam) transforms.push(...transformsParam);
	let dataStream;
	try {
		dataStream = await collectionsModel.getDataStream(collectionName);
	} catch (e) {
		throw new Error(`Failed to get data stream for "${collectionName}": ${e.message}`);
	}
	const result = { dataStream, transforms };
	return result;
};

collectionService.saveDataStream = async (collectionName, dataStream) => {
	const v = toolboxService.validate({ collectionName, dataStream }, 'collectionService_saveDataStream');
	const metaData = await collectionsModel.getMetaData(v.collectionName);
	if (!metaData) throw new Error(`Collection meta data for "${v.collectionName}" does not exist`);
	checkIfTransformsExist(metaData);
	const transforms = transformService.get(metaData.incomingTransforms);
	await collectionsModel.saveDataStream(v.collectionName, dataStream, transforms);
};

collectionService.refreshData = async (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_refreshData');
	let metaData;
	let serviceAccount;
	let clientRequest;
	let config;
	try {
		metaData = await collectionService.getMetaData(v.collectionName);
		if (metaData.status === 'running') return; // Dont do anything if data refresh is currently underway
		setMetaDataStatus(v.collectionName, 'running');
		serviceAccount = await collectionService.getServiceAccount(metaData.serviceAccountName);
		config = buildHttpRequestConfig(serviceAccount, metaData);
		clientRequest = await httpClientService.asyncRequest(config);
		logger.info(`Refreshing "${v.collectionName}" collection cache`);
		await clientRequestHandler(clientRequest, v.collectionName, metaData.processAsStream, config.body);
		logger.info(`Collection "${v.collectionName}" cache refresh completed successfully`);
		setMetaDataStatus(v.collectionName, 'waiting');
	} catch (e) {
		setMetaDataStatus(v.collectionName, 'error', e.message);
		// Throwing error on start will stop interval from being set
		if (typeof metaData === 'undefined' || metaData.status === 'starting') {
			logger.error(`Collection "${v.collectionName}" cache refresh failed on startup: ${e.message}`);
			throw e;
		}
	}
};

collectionService.stopInterval = async (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_stopInterval');
	if (typeof collectionService.timers[v.collectionName] === 'undefined') return;
	logger.info(`Stopping collection interval for "${collectionName}"`);
	clearIntervalTimer(v.collectionName);
	em.emit('stopCollectionProcess', v.collectionName);
	setMetaDataStatus(v.collectionName, 'stopped');
	logger.info(`Collection interval for "${collectionName}" successfully stopped`);
};

collectionService.startInterval = async (collectionName) => {
	const v = validationLogWrapper({ collectionName }, 'collectionService_startInterval');
	// Return if timer is already set, if not then set timer property to temporary empty object so that
	// additional calls to startInterval for this collection are ignored while this collection is starting
	// collectionService.timers[v.collectionName] = {};
	logger.info(`Starting collection interval for "${collectionName}"`);
	setMetaDataStatus(v.collectionName, 'starting', '');
	await collectionService.refreshData(v.collectionName);
	await setIntervalTimer(v.collectionName);
	logger.info(`Collection interval for "${collectionName}" successfully started`);
};

collectionService.autoStartOnStartup = async () => {
	const collectionNames = await collectionsModel.getAllCollectionNamesWithAutoStartTrue();
	logger.info('Starting up all collections with autoStart set to true');
	for (let i = 0; i < collectionNames.length; i++) {
		// Use await in loop to avoid starting a bunch of collections at the same time and potential hammering the target
		try {
			logger.info(`Auto starting collection interval for "${collectionNames[i]}" collection`);
			// eslint-disable-next-line no-await-in-loop
			await collectionService.startInterval(collectionNames[i]);
			logger.info(`Auto start of collection "${collectionNames[i]}" collection successful`);
		} catch (e) {
			logger.error(e.stack);
		}
	}
};

module.exports = collectionService;
