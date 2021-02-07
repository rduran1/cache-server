const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[]'); // Array of objects

const model = {};

model.getApiDataPath = () => '/SM/9/rest/IncidentProbCauseAPI/?category=incident';

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = [];
	data.content.map((e) => tempStore.push(e.IncidentProbCauseAPI));
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	const len = tempStore.length;
	for (let i; i < len; i++) {
		store.push(tempStore[i]);
	}
};

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.validateCombinationTest = (incident) => {
	if (typeof incident.CauseCode === 'string' && incident.CauseCode.length > 0) {
		if (typeof incident.Area === 'undefined'
			|| typeof incident.Subcategory === 'undefined'
			|| typeof incident.Category === 'undefined'
		) throw new Error('CauseCode requires Area and Category and Subcategory values');
		let validEntries = store.filter((e) => e.Area === incident.Area || e.Area === 'ALL');
		validEntries = validEntries.filter((e) => e.SubCategory === incident.Subcategory);
		validEntries = validEntries.filter((e) => e.CauseCode === incident.CauseCode);
		if (validEntries.length === 0) throw new Error('CauseCode is invalid');
	}
};

model.getAll = () => store;

module.exports = model;
