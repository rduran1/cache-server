/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const schemaService = require('./schemaService');

const toolboxService = {};

toolboxService.truncateFile = (strFileName, len, strAppend) => new Promise((resolve, reject) => {
	let stats;
	try {
		stats = fs.statSync(strFileName);
	} catch (e) {
		return reject(new Error(`Error getting file size of ${strFileName}: ${e.message}`));
	}
	const trim = stats.size - len;
	if (trim < 1) return resolve();
	try {
		fs.truncateSync(strFileName, trim);
	} catch (e) {
		const s = trim === 1 ? '' : 's';
		return reject(new Error(`Error truncating ${strFileName} by ${len} character${s}: ${e.message}`));
	}
	if (strAppend) {
		try {
			fs.appendFileSync(strFileName, strAppend);
		} catch (e) {
			return reject(new Error(`Error appending "${strAppend}" to ${strFileName}: ${e.message}`));
		}
	}
	return resolve();
});

toolboxService.clone = (object) => {
	if (typeof object === 'undefined') throw new Error('Error cloning object: Object is undefined');
	try {
		const clone = JSON.parse(JSON.stringify(object));
		return clone;
	} catch (e) {
		throw new Error(`Error cloning object: ${e.message}`);
	}
};

toolboxService.validate = (object, schemaName) => {
	schemaService.validate(object, schemaName);
};

toolboxService.cloneAndValidate = (config, schemaName) => {
	const configCopy = toolboxService.clone(config);
	schemaService.validate(configCopy, schemaName);
	return configCopy;
};

const testSummary = {
	numberOfTests: 0,
	numberPassing: 0,
	numberFailing: 0,
	runTime: 0
};
toolboxService.test = (desc) => {
	const defaultWidth = 105;
	const spaceForTime = 11;
	if (typeof desc === 'undefined') throw new Error('Test description is required');
	if (typeof desc !== 'string') throw new Error('Test description must be of type string');
	const hrstart = process.hrtime();
	const width = defaultWidth >= desc.length + spaceForTime ? defaultWidth : desc.length + spaceForTime;
	let padding = width - (desc.length + spaceForTime);
	testSummary.numberOfTests += 1;
	function getMessage() {
		const hrend = process.hrtime(hrstart)[1] / 1000000;
		const hrendLen = hrend.toFixed(3).toString().length;
		if (padding > hrendLen) padding -= hrendLen;
		return `${desc}: ${' '.repeat(padding)} ${hrend.toFixed(3)}ms `;
	}

	return {
		pass: (result) => {
			const descWithDuration = getMessage();
			console.log('\t%s\x1b[92m%s\x1b[0m', descWithDuration, 'Pass', result || '');
			testSummary.numberPassing += 1;
		},
		fail: (result) => {
			const descWithDuration = getMessage();
			console.log('\t%s\x1b[91m%s\x1b[0m', descWithDuration, 'Fail', result || '');
			testSummary.numberFailing += 1;
		}
	};
};

toolboxService.servicesTestHeader = () => {
	console.log('##### Services Unit Testing #####');
	const hrstart = process.hrtime();
	return {
		finish: () => {
			const hrend = process.hrtime(hrstart)[1] / 1000000;
			testSummary.runTime = `${hrend.toFixed(3)}ms`;
		}
	};
};

toolboxService.serviceTesting = (serviceName) => console.log(`    ${serviceName}`);

toolboxService.ModelsTestHeader = () => console.log('##### Models Unit Testing #####');

toolboxService.modelTesting = (modelName) => console.log(`    ${modelName}`);

toolboxService.testSummary = () => {
	// eslint-disable-next-line object-curly-newline
	const { numberOfTests: total, numberPassing: passing, numberFailing: failing, runTime } = testSummary;
	console.log(`\n\nSummary:\n\tPassing:  ${passing}\n\tFailing:  ${failing}\n\tTotal:    ${total}\n\tRun Time: ${runTime}`);
};

toolboxService.initializeStore = (modelFileName, initValue) => {
	if (typeof process.env.INSTALL_DIR === 'undefined') throw new Error('Environmental variable INSTALL_DIR is undefined');
	if (typeof modelFileName !== 'string' || typeof initValue !== 'string') throw new Error('Parameters must be of type string');
	if (!modelFileName.includes('Model.js')) throw new Error('Model file name must end with "Model.js"');
	const modelName = path.basename(modelFileName).split('.')[0];
	let storeFile = '';
	const secured = ['accountsModel']; // These models have encrypted stores
	if (secured.includes(modelName)) {
		storeFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'encrypted', modelName.replace('Model', 'Store.json'));
	} else {
		storeFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', modelName.replace('Model', 'Store.json'));
	}

	let storeContent;
	let tempStore; // Temporary store location while initializing. Once initialized we load store into a const variable

	try {
		if (fs.existsSync(storeFile)) {
			storeContent = fs.readFileSync(storeFile);
		} else {
			fs.writeFileSync(storeFile, initValue);
			storeContent = initValue;
		}
		tempStore = JSON.parse(storeContent);
	} catch (e) {
		throw new Error(`Error initializing store for model ${modelName}: ${e.message}`);
	}
	const store = toolboxService.clone(tempStore);
	return { store, storeFile };
};

toolboxService.saveStoreToFile = async (fileName, store, withTabFormat) => {
	const tab = withTabFormat ? '\t' : '';
	if (fs.existsSync(fileName)) {
		try {
			if (withTabFormat) fs.writeFileSync(fileName, JSON.stringify(store, null, tab));
		} catch (e) {
			throw new Error(`Error saving store to ${fileName}: ${e.message}`);
		}
	} else {
		throw new Error(`Store for file '${fileName}' has not been initialized`);
	}
};

module.exports = toolboxService;
