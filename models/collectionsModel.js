const fs = require('fs');
const util = require('util');
const stream = require('stream');
const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const pipeline = util.promisify(stream.pipeline);

const storeTemplate = {};

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

function checkForDeletionInProgress(collectionName) {
	// eslint-disable-next-line valid-typeof
	if (typeof store[collectionName] === 'undefined') throw new Error(`Collection ${collectionName} does not exist`);
	// eslint-disable-next-line valid-typeof
	if (typeof store[collectionName].streamingCount === 'deleting') throw new Error(`Collection ${collectionName} queued for deletion`);
}

function checkIfCacheFileExistsInMetaData(collectionName, metaData) {
	if (typeof metaData.cacheFile === 'undefined') {
		throw new Error(`Collection "${collectionName}" is missing cacheFile property`);
	}
}

model.setMetaData = async (name, config) => {
	const clone = toolboxService.clone(store);
	const cfg = toolboxService.clone(config);
	if (typeof store[name] === 'object') cfg.cacheFile = store[name].cacheFile;
	clone[name] = cfg;
	const collectionNames = Object.keys(clone);
	for (let i = 0; i < collectionNames.length; i++) {
		// The following properties are only maintained in memory so delete before saving to file
		delete clone[collectionNames[i]].streamingCount;
		delete clone[collectionNames[i]].status;
	}
	await toolboxService.saveStoreToFile(storeFile, clone);
	if (typeof store[name] !== 'object') { // Check if object doesnt exist in store before creating
		try {
			// Attempt to create empty cache file when collection is first created
			if (!fs.existsSync(cfg.cacheFile)) fs.closeSync(fs.openSync(cfg.cacheFile, 'a'));
		} catch (e) {
			throw new Error(`Failed to initialize cache file: ${e.message}`);
		}
		store[name] = cfg;
		clone[name].streamingCount = 0;
		store[name].streamingCount = 0;
		clone[name].status = 'stopped';
		store[name].status = 'stopped';
		return;
	}
	Object.assign(store[name], cfg);
};

model.getMetaData = async (collectionName) => {
	if (typeof store[collectionName] === 'object') {
		// On restarts the streamingCount and status are undefined so set them here
		if (typeof store[collectionName].streamingCount !== 'number') store[collectionName].streamingCount = 0;
		if (typeof store[collectionName].status !== 'string') store[collectionName].status = 'stopped';
		const clone = toolboxService.clone(store[collectionName]);
		return clone;
	}
	return undefined;
};

model.getAllMetaData = async () => {
	const clone = toolboxService.clone(store);
	const keyNames = Object.keys(clone);
	for (let i = 0; i < keyNames.length; i++) {
		if (typeof clone[keyNames[i]].status === 'undefined') clone[keyNames[i]].status = 'stopped';
	}
	return clone;
};

model.getAllCollectionNamesWithAutoStartTrue = async () => {
	const autoStartableCollectors = [];
	Object.keys(store).forEach((collectorName) => {
		if (store[collectorName].autoStart) autoStartableCollectors.push(collectorName);
	});
	return autoStartableCollectors;
};

model.deleteMetaData = async (collectionName) => {
	const clone = toolboxService.clone(store);
	const { cacheFile } = clone[collectionName];
	delete clone[collectionName];
	// streamCount eq 'deleting' will only occur when a previous deletion failed
	if (typeof store[collectionName].streamingCount === 'undefined'
			|| store[collectionName].streamingCount === 'deleting') store[collectionName].streamingCount = 0;
	while (store[collectionName].streamingCount !== 0) {
		// eslint-disable-next-line no-await-in-loop
		await toolboxService.sleep(100);
	}
	store[collectionName].streamingCount = 'deleting'; // Blocks further getDataStream() fulfillments
	await toolboxService.saveStoreToFile(storeFile, clone);
	delete store[collectionName];
	if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
	return undefined;
};

model.saveData = async (collectionName, data, transforms) => {
	const metaData = await model.getMetaData(collectionName);
	if (typeof metaData === 'undefined') throw new Error(`Collection ${collectionName} does not exist`);
	checkIfCacheFileExistsInMetaData(collectionName, metaData);
	checkForDeletionInProgress(collectionName);
	try {
		fs.writeFileSync(`${metaData.cacheFile}.tmp`, data, { encoding: 'utf-8' });
		if (typeof transforms !== 'undefined') {
			// perform transform
		}
		checkForDeletionInProgress(collectionName);
		if (store[collectionName].status === 'stopped') {
			if (fs.existsSync(`${metaData.cacheFile}.tmp`)) fs.unlinkSync(`${metaData.cacheFile}.tmp`);
			return;
		}
	} catch (e) {
		if (fs.existsSync(`${metaData.cacheFile}.tmp`)) fs.unlinkSync(`${metaData.cacheFile}.tmp`);
		throw new Error(`Pipeline error: ${e.message}`);
	}
	const { size, mtime } = fs.statSync(`${metaData.cacheFile}.tmp`);
	if (size < metaData.minValidCacheSizeInBytes) {
		fs.unlinkSync(`${metaData.cacheFile}.tmp`);
		throw new Error(`Data received for "${collectionName}" is undersized: Received ${size} bytes`);
	}
	store[collectionName].lastCacheUpdate = mtime;
	// Only rename if collection is not being streamed
	while (store[collectionName].streamingCount !== 0) {
		// eslint-disable-next-line no-await-in-loop
		await toolboxService.sleep(100);
	}
	fs.renameSync(`${metaData.cacheFile}.tmp`, metaData.cacheFile);
};

model.saveDataStream = async (collectionName, dataStream, transforms) => {
	const metaData = await model.getMetaData(collectionName);
	if (typeof metaData === 'undefined') throw new Error(`Collection ${collectionName} does not exist`);
	checkIfCacheFileExistsInMetaData(collectionName, metaData);
	checkForDeletionInProgress(collectionName);
	try {
		const writeStream = fs.createWriteStream(`${metaData.cacheFile}.tmp`, 'utf-8');
		if (typeof transforms !== 'undefined') {
			await pipeline(dataStream, ...transforms, writeStream);
		} else {
			await pipeline(dataStream, writeStream);
		}
		checkForDeletionInProgress(collectionName);
		if (store[collectionName].status === 'stopped') {
			if (fs.existsSync(`${metaData.cacheFile}.tmp`)) fs.unlinkSync(`${metaData.cacheFile}.tmp`);
			return;
		}
	} catch (e) {
		if (fs.existsSync(`${metaData.cacheFile}.tmp`)) fs.unlinkSync(`${metaData.cacheFile}.tmp`);
		throw new Error(`Pipeline error: ${e.message}`);
	}
	const { size, mtime } = fs.statSync(`${metaData.cacheFile}.tmp`);
	if (size < metaData.minValidCacheSizeInBytes) {
		fs.unlinkSync(`${metaData.cacheFile}.tmp`);
		throw new Error(`Data received for "${collectionName}" is undersized: Received ${size} bytes`);
	}
	store[collectionName].lastCacheUpdate = mtime;
	// Only rename if collection is not being streamed
	while (store[collectionName].streamingCount !== 0) {
		// eslint-disable-next-line no-await-in-loop
		await toolboxService.sleep(100);
	}
	fs.renameSync(`${metaData.cacheFile}.tmp`, metaData.cacheFile);
};

model.getDataStream = async (collectionName) => {
	const metaData = await model.getMetaData(collectionName);
	checkIfCacheFileExistsInMetaData(collectionName, metaData);
	try {
		// eslint-disable-next-line no-bitwise
		fs.accessSync(metaData.cacheFile, fs.constants.R_OK | fs.constants.W_OK);
		checkForDeletionInProgress(collectionName);
		const readStream = fs.createReadStream(metaData.cacheFile, 'utf-8');
		return readStream;
	} catch (e) {
		throw new Error(e.message);
	}
};

function streamCountValidation(collectionName) {
	if (typeof store[collectionName].streamingCount !== 'number') store[collectionName].streamingCount = 0;
	if (store[collectionName].streamingCount < 0) store[collectionName].streamingCount = 0;
}

model.setMetaDataStatus = (collectionName, statusInfo) => {
	if (typeof store[collectionName] === 'object') Object.assign(store[collectionName], statusInfo);
};

model.increaseStreamCount = (collectionName) => {
	checkForDeletionInProgress(collectionName);
	if (typeof store[collectionName] === 'object') {
		streamCountValidation(collectionName);
		// eslint-disable-next-line no-plusplus
		store[collectionName].streamingCount++;
	}
};

model.decreaseStreamCount = (collectionName) => {
	checkForDeletionInProgress(collectionName);
	if (typeof store[collectionName] === 'object') {
		streamCountValidation(collectionName);
		// eslint-disable-next-line no-plusplus
		store[collectionName].streamingCount--;
	}
};

model.getStreamCount = (collectionName) => {
	let streamCount;
	if (typeof store[collectionName] === 'object') streamCount = store[collectionName].streamingCount;
	if (typeof streamCount === 'undefined') return 0;
	return streamCount;
};

module.exports = model;
