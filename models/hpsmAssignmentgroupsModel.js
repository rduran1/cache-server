const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const storeTemplate = [];

const { store, storeFile } = toolboxService.initializeStore(__filename, storeTemplate);

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.getApiDataPath = () => '/SM/9/rest/AssignmentAPI/?Active=true&ServiceOrg=IT';

model.save = async (data) => {
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	const tempStore = [];
	data.content.map((e) => tempStore.push(e.AssignmentAPI.Name));
	toolboxService.saveStoreToFile(storeFile, tempStore);
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

model.getAll = () => store;

module.exports = model;
