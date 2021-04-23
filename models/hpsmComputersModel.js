const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = [[]];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

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

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.getComputerPropertiesByIRSBarcode = (barcode) => searchStoreAndReturnAsObject(barcode, 2);
model.getComputerPropertiesByDisplayName = (displayName) => searchStoreAndReturnAsObject(displayName, 1);
model.getComputerPropertiesByLogicalName = (logicalName) => searchStoreAndReturnAsObject(logicalName, 7);

model.save = async (data) => {
	await toolboxService.saveStoreToFile(storeFile, data);
	store.length = 0;
	const len = data.length;
	for (let i; i < len; i++) {
		store.push(data[i]);
	}
};

model.getAll = () => store;

module.exports = model;
