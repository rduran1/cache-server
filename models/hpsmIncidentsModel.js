/* eslint-disable no-plusplus */
/* eslint-disable comma-dangle */
const toolboxService = require('../services/toolboxService');

const { store, storeFile } = toolboxService.initializeStore(__filename, '[]'); // Array of objects

const model = {};

model.save = async (data) => {
	let incidentObject = {};
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	incidentObject = 'Incident' in data ? data.Incident : data;
	if ((!'IncidentID') in incidentObject) throw new Error('Parameter passed to save method does not contain incident properties');
	const incidentIDExists = store.find((el) => el.IncidentID === incidentObject.IncidentID);
	if (incidentIDExists) throw new Error(`Cannot save Incident ID ${incidentObject.IncidentID}. ID already exists`);
	store.push(incidentObject);
	const tempStore = await model.getAllNonClosedIncidents();
	toolboxService.saveStoreToFile(storeFile, tempStore);
	store.length = 0;
	store.push(...tempStore);
};

model.update = async (data) => {
	let incidentObject = {};
	if (typeof data !== 'object') throw new Error('Parameter passed to save method must be a JSON object');
	incidentObject = 'Incident' in data ? data.Incident : data;
	if ((!'IncidentID') in incidentObject) throw new Error('Parameter passed to save method does not contain incident properties');
	const len = store.length;
	for (let i = 0; i < len; i++) {
		if (store[i].IncidentID === data.IncidentID) {
			store[i] = data;
			// eslint-disable-next-line no-await-in-loop
			const tempStore = await model.getAllNonClosedIncidents();
			toolboxService.saveStoreToFile(storeFile, tempStore);
			store.length = 0;
			return store.push(...tempStore);
		}
	}
	throw new Error();
};

model.getAllNonClosedIncidents = async () => {
	store.filter((el) => el.Status !== 'Closed');
};

model.findByIncidentID = (id) => {
	store.find((el) => el.IncidentID.toLowerCase() === id.toLowerCase());
};

model.getAll = () => store;

module.exports = model;
