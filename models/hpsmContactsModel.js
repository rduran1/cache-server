/* eslint-disable no-plusplus */
/* eslint-disable comma-dangle */
const { EOL } = require('os');
const Joi = require('joi');
const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

function parseCsvToArray(content, cols, bypass) {
	const arr = [];
	const schema = Joi.array().items(
		Joi.array().length(cols).items(Joi.string().allow(''))
	);
	const rows = content.toString().split(EOL);
	const len = rows.length;
	for (let i = 0; i < len; i++) {
		if (rows[i].length > 0) {
			let el = rows[i].replace(/",(\d)/g, '","$1');
			el = el.replace(/(\d),"/g, '$1","');
			el = el.replace(/", "/g, '","');
			const row = el.split('","');
			row[0] = row[0].replace(/^"/, '');
			row[row.length - 1] = row[row.length - 1].replace(/"$/, '');
			arr.push(row);
		}
	}
	if (bypass) return arr;
	toolboxService.validate(arr, schema);
	return arr;
}

model.save = async (data, numOfColumns, bypassValidation) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = parseCsvToArray(data, numOfColumns, bypassValidation);
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
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
