const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = [];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.getApiDataPath = () => '/SM/9/rest/IncidentCategorizationAPI/?category=incident';

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = [];
	data.content.map((e) => tempStore.push(e.IncidentCategorizationAPI));
	toolboxService.saveStoreToFile(storeFile, tempStore, true);
	store.length = 0;
	const len = tempStore.length;
	for (let i = 0; i < len; i++) {
		store.push(tempStore[i]);
	}
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
