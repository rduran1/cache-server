const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[]');

const model = {};

model.getApiDataPath = () => encodeURI('/SM/9/rest/GlobalListsAPI/Incident Closure Codes');

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = [];
	data.GlobalListsAPI.ValueList.replace(/"|\{|}/g, '').split(/,/g).map((e) => tempStore.push(e));
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
};

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.getAll = () => store;

module.exports = model;
