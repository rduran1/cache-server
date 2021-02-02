const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[]');

const model = {};

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = [];
	data.GlobalListsAPI.ValueList.replace(/"|\{|}/g, '').split(/, /g).map((e) => tempStore.push(e));
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
};

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.validateCombinationTest = (incident) => {
	if (typeof incident.Area === 'undefined' && typeof incident.Category === 'undefined' && typeof incident.Subcategory === 'undefined') return;
	let validEntries = store.filter((e) => e.Area === incident.Area);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter((e) => e.Category === incident.Category);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
	validEntries = validEntries.filter((e) => e.SubCategory === incident.Subcategory);
	if (validEntries.length === 0) throw new Error('Area, Category, Subcategory combination is invalid');
};

model.getAll = () => store;

module.exports = model;
