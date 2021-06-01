const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = [[]];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.save = async (data) => {
	await toolboxService.saveStoreToFile(storeFile, data);
	store.length = 0;
	const len = data.length;
	for (let i = 0; i < len; i++) {
		store.push(data[i]);
	}
};

model.find = (val) => {
	store.find((el) => el.toLowerCase() === val.toLowerCase());
};

model.includes = (val) => {
	const len = store.length;
	for (let i = 0; i < len; i++) {
		if (store[i].includes(val)) return true;
	}
	return false;
};

function searchStoreAndReturnAsObject(value, idx) {
	const found = store.find((e) => e[idx].toLowerCase() === value.toLowerCase());
	if (found) {
		const obj = {};
		// eslint-disable-next-line no-return-assign
		store[0].forEach((el, index) => obj[el] = found[index]);
		return obj;
	}
	return undefined;
}

model.getContactByOperatorId = (value) => searchStoreAndReturnAsObject(value, 1);
model.getContactByEmail = (value) => searchStoreAndReturnAsObject(value, 6);

model.getAll = () => store;

module.exports = model;
