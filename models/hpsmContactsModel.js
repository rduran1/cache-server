const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

model.save = async (data, numOfColumns, bypassValidation) => {
	// if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = toolboxService.parseCsvToArray(data, numOfColumns, bypassValidation);
	await toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	const len = tempStore.length;
	for (let i; i < len; i++) {
		store.push(tempStore[i]);
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
