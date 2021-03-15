const { basename } = require('path');
const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[]'); // Array of objects

const model = {};

const mName = (basename(__filename).replace(/\.js$/i, ''));
model.name = mName;

model.save = async (data) => {
	let incidentObject = {};
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	incidentObject = 'Incident' in data ? data.Incident : data;
	if ((!'IncidentID') in incidentObject) throw new Error('Parameter passed to save method does not contain incident properties');
	const tempStore = toolboxService.clone(store);
	const incidentIdx = tempStore.findIndex((el) => el.IncidentID === incidentObject.IncidentID);
	if (incidentIdx === -1) {
		tempStore.push(incidentObject);
	} else {
		tempStore[incidentIdx] = incidentObject;
	}
	const tempStore2 = tempStore.filter((el) => el.Status !== 'Closed');
	toolboxService.saveStoreToFile(storeFile, tempStore2, true);
	store.length = 0;
	const len = tempStore2.length;
	for (let i; i < len; i++) {
		store.push(tempStore2[i]);
	}
};

// eslint-disable-next-line arrow-body-style
model.getAllNonClosedIncidents = async () => {
	// eslint-disable-next-line no-return-await
	return await store.filter((el) => el.Status !== 'Closed');
};

model.getAll = () => store;

module.exports = model;
