const { basename } = require('path');
const { randomBytes } = require('crypto');
const toolboxService = require('../services/toolboxService');

const randomByteSize = 24;

const storeTemplate = [];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

function isUniqueTokenValue(value) {
	const result = store.find((e) => e.value === value);
	if (result) return false;
	return true;
}

function generateUniqueToken() {
	let uniqueToken = randomBytes(randomByteSize).toString('hex');
	while (!isUniqueTokenValue(uniqueToken)) {
		uniqueToken = randomBytes(randomByteSize).toString('hex');
	}
	return uniqueToken;
}

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.isTokenAuthorizedToAccessCollection = async (tokenName, collectionName) => {
	const token = await model.getToken(tokenName);
	if (token) return token.collections.include(collectionName);
	return false;
};

model.getToken = async (tokenName) => {
	const token = store.find((e) => e.tokenName === tokenName);
	if (typeof token === 'object') {
		const clone = toolboxService.clone(token);
		return clone;
	}
	return undefined;
};

model.getAllTokens = async () => {
	const clone = toolboxService.clone(store);
	return clone.filter((o) => o.status !== 'deleted');
};

model.createToken = async (config) => {
	const cfg = toolboxService.clone(config);
	const clone = toolboxService.clone(store);
	cfg.value = generateUniqueToken();
	cfg.dateIssued = Date();
	clone.push(cfg);
	await toolboxService.saveStoreToFile(storeFile, clone);
	store.push(cfg);
};

model.updateToken = async (config) => {
	const clone = toolboxService.clone(store);
	let token = clone.find((e) => e.tokenName === config.tokenName);
	if (typeof token !== 'object') return;
	Object.assign(token, config);
	await toolboxService.saveStoreToFile(storeFile, clone);
	token = store.find((e) => e.tokenName === config.tokenName);
	Object.assign(token, config);
};

model.deleteToken = async (tokenName) => {
	const clone = toolboxService.clone(store);
	let token = clone.find((e) => (e.tokenName === tokenName && e.status !== 'deleted'));
	if (typeof token !== 'object') return;
	if (typeof token === 'object') token.status = 'deleted';
	await toolboxService.saveStoreToFile(storeFile, clone);
	token = store.find((e) => e.tokenName === tokenName);
	token.status = 'deleted';
};

module.exports = model;
