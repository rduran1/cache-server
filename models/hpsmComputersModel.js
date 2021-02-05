const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

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

model.save = async (data, numOfColumns, bypassValidation) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = toolboxService.parseCsvToArray(data, numOfColumns, bypassValidation);
	await toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
};

model.getAll = () => store;

module.exports = model;
