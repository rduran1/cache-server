const { basename } = require('path');
const { randomBytes } = require('crypto');
const toolboxService = require('../services/toolboxService');

const randomByteSize = 24;

const storeTemplate = [];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.getAccessControlList = (subject, subjectType) => {
	const found = store.find((e) => e[subjectType] === subject && e.status === 'active');
	if (found) return found.accessControlList;
	return undefined;
};

model.getSubjectByAlias = (aliasName) => store.find((e) => e.alias === aliasName);

model.getSubjectByAccountId = (accountId) => store.find((e) => e.accountId === accountId);

model.getSubjectByToken = (token) => store.find((e) => e.token === token);

model.createSubject = async (config) => {
	const cfg = toolboxService.clone(config);
	const clone = toolboxService.clone(store);
	clone.push(cfg);
	await toolboxService.saveStoreToFile(storeFile, clone);
	store.push(cfg);
};

model.updateSubject = async (config) => {
	const clone = toolboxService.clone(store);
	const { alias } = config;
	const subject = model.getSubjectByAlias(alias);
	if (typeof subject === 'undefined') throw new Error(`Subject alias "${alias}" does not exist`);
	Object.assign(subject, config);
	const idx = clone.findIndex((e) => e.alias === alias);
	clone.splice(idx, 1, subject);
	await toolboxService.saveStoreToFile(storeFile, clone);
	store.splice(idx, 1, subject);
};

model.deleteSubject = async (alias) => {
	const clone = toolboxService.clone(store);
	const idx = clone.findIndex((e) => e.alias === alias);
	if (idx < 0) throw new Error(`Subject alias "${alias}" does not exist`);
	clone.splice(idx, 1);
	await toolboxService.saveStoreToFile(storeFile, clone);
	store.splice(idx, 1);
};

model.generateUniqueToken = () => {
	let uniqueToken = randomBytes(randomByteSize).toString('hex');
	while (model.getSubjectByToken(uniqueToken)) uniqueToken = randomBytes(randomByteSize).toString('hex');
	return uniqueToken;
};

module.exports = model;
