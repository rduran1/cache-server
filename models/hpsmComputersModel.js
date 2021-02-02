const toolboxService = require('../services/toolboxService');

const { store } = toolboxService.initializeStore(__filename, '[[]]');

const model = {};

model.find = (value) => {
	store.find((el) => el.toLowerCase() === value.toLowerCase());
};

model.includes = (value) => store.includes(value);

model.getAll = () => store;

module.exports = model;
