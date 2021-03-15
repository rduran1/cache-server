const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => {
	let result = false;
	store.forEach((row) => {
		if (row[0].toLowerCase() === value.toLowerCase()) result = true;
	});
	return result;
};

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = toolboxService.cloneAndValidate(data, 'hpsmPrimaryAffectedServices');
	await toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	const len = tempStore.length;
	for (let i; i < len; i++) {
		store.push(tempStore[i]);
	}
};

model.getAll = async () => {
	const clone = toolboxService.clone(store);
	const keys = clone[0];
	const results = [];
	clone.forEach((element, index) => {
		if (index === 0) return;
		const obj = {};
		// eslint-disable-next-line no-return-assign
		element.forEach((e, i) => obj[keys[i]] = e);
		results.push(obj);
	});
	return results;
};

module.exports = model;
