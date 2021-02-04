const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.save = async (data, numOfColumns, bypassValidation) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = toolboxService.parseCsvToArray(data, numOfColumns, bypassValidation);
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
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
