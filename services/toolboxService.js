/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { EOL } = require('os');
const schemaService = require('./schemaService');

const secured = ['serviceAccountsModel', 'accessControlModel']; // These models use encrypted stores
let loggingLevel = [];

const toolboxService = {};

function logit(fileName, level, msg) {
	if (!loggingLevel.includes(level)) return;
	const padding = ' '.repeat(5 - level.length);
	fs.appendFileSync(fileName, `${Date()}: [${level}${padding}] ${msg.replace(/\n/g, EOL)}${EOL}`);
}

function loggingService(fileName) {
	if (typeof process.env.INSTALL_DIR === 'undefined') throw new Error('Environmental variable "INSTALL_DIR" is undefined');
	if (typeof fileName !== 'string') throw new TypeError('fileName parameter must be of type string');
	if (!fileName.endsWith('.js')) throw new Error('fileName parameter must end with ".js"');
	const pathToConfigFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'configurationStore.json');
	try {
		const config = fs.readFileSync(pathToConfigFile, 'utf-8');
		loggingLevel = JSON.parse(config).loggingLevels;
	} catch (e) {
		if (e.code === 'ENOENT') {
			loggingLevel = ['error, warning, info'];
		} else {
			throw new Error(`Error reading ${pathToConfigFile}: ${e.message}`);
		}
	}
	if (!Array.isArray(loggingLevel)) throw new TypeError(`"loggingLevels" is not an Array:  Typeof loggingLevels "${typeof loggingLevel}"`);
	const baseName = path.basename(fileName).replace(/\.js$/i, '.log');
	const fileLocation = path.join(process.env.INSTALL_DIR, 'logs', baseName);
	return {
		info: (message) => { logit(fileLocation, 'INFO', message); },
		warn: (message) => { logit(fileLocation, 'WARN', message); },
		error: (message) => { logit(fileLocation, 'ERROR', message); },
		debug: (message) => { logit(fileLocation, 'DEBUG', message); }
	};
}

const logger = loggingService(__filename);

toolboxService.sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

toolboxService.truncateFile = (strFileName, len, strAppend) => new Promise((resolve, reject) => {
	const callMsg = `truncateFile(strFileName = "${strFileName}", len = ${len}, strAppend = "${strAppend}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		v = toolboxService.validate({ strFileName, len, strAppend }, 'toolboxService_truncateFile');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		return reject(e);
	}
	let stats;
	try {
		stats = fs.statSync(v.strFileName);
	} catch (e) {
		const msg = `truncateFile::fs.statSync(strFileName = "${v.strFileName}") returned an error: ${e.message}`;
		logger.error(msg);
		logger.debug(`Exiting ${callMsg}`);
		return reject(e);
	}
	const trim = stats.size - v.len;
	logger.debug(`truncateFile::trim variable value: ${trim}`);
	if (trim < 1) {
		logger.debug(`Exiting ${callMsg}`);
		return resolve();
	}
	try {
		fs.truncateSync(v.strFileName, trim);
	} catch (e) {
		const msg = `truncateFile::fs.truncateSync(strFileName = "${v.strFileName}", trim = ${trim}) returned an error: ${e.message}`;
		logger.error(msg);
		logger.debug(`Exiting ${callMsg}`);
		return reject(e);
	}
	if (v.strAppend) {
		try {
			fs.appendFileSync(v.strFileName, v.strAppend);
		} catch (e) {
			const msg = `truncateFile::fs.appendFileSync(strFileName = "${v.strFileName}", strAppend = "${v.strAppend}") returned an error: ${e.message}`;
			logger.error(msg);
			logger.debug(`Exiting ${callMsg}`);
			return reject(e);
		}
	}
	logger.debug(`Exiting ${callMsg}`);
	return resolve();
});

toolboxService.clone = (object) => {
	const callMsg = `clone(object = ${typeof object})`;
	logger.debug(`Entering ${callMsg}`);
	try {
		const clone = JSON.parse(JSON.stringify(object));
		logger.debug(`Exiting ${callMsg}`);
		return clone;
	} catch (e) {
		const msg = `clone::JSON.parse(object) returned an error: ${e.message}`;
		logger.error(msg);
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
};

toolboxService.validate = (object, schemaName) => {
	const callMsg = `validate(object = ${typeof object}, schemaName = "${schemaName}")`;
	logger.debug(`Entering ${callMsg}`);
	try {
		const validatedObject = schemaService.validate(object, schemaName);
		logger.debug(`Exiting ${callMsg}`);
		return validatedObject;
	} catch (e) {
		const msg = `validate::schemaService.validate(object, "${schemaName}") returned an error: ${e.message}`;
		logger.error(msg);
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
};

toolboxService.cloneAndValidate = (config, schemaName) => {
	const callMsg = `cloneAndValidate(config = ${typeof config}, schemaName = "${schemaName}")`;
	logger.debug(`Entering ${callMsg}`);
	try {
		const configCopy = toolboxService.clone(config);
		const validatedObject = schemaService.validate(configCopy, schemaName);
		return validatedObject;
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw (e);
	}
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
	const callMsg = `initializeStore(modelFileName = "${modelFileName}", initValue = ${typeof initValue})`;
	logger.debug(`Entering ${callMsg}`);
	let v;
	try {
		v = toolboxService.validate({ modelFileName, initValue }, 'toolboxService_initializeStore');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	if (typeof process.env.INSTALL_DIR === 'undefined') {
		const emsg = 'Environmental variable INSTALL_DIR is undefined';
		logger.error(emsg);
		logger.debug(`Exiting ${callMsg}`);
		throw new Error(emsg);
	}
	if (!v.modelFileName.endsWith('Model.js')) {
		const emsg = 'Model file name must end with "Model.js"';
		logger.error(emsg);
		logger.debug(`Exiting ${callMsg}`);
		throw new Error(emsg);
	}
	const modelName = path.basename(v.modelFileName).split('.')[0];
	let storeFile = '';
	// Create paths if they dont exist
	const storesDir = path.join(process.env.INSTALL_DIR, 'models', 'stores');
	const encryptedDir = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'encrypted');
	if (!fs.existsSync(storesDir)) fs.mkdirSync(storesDir);
	if (!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir);
	if (secured.includes(modelName)) {
		storeFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'encrypted', modelName.replace(/Model$/, 'Store.json'));
	} else {
		storeFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', modelName.replace(/Model$/, 'Store.json'));
	}
	logger.debug(`initializeStore::storeFile variable value: ${storeFile}`);
	let storeContent;
	let tempStore; // Temporary store location while initializing. Once initialized we load store into a const variable
	try {
		if (fs.existsSync(storeFile)) {
			storeContent = fs.readFileSync(storeFile);
		} else {
			const initStoreContent = JSON.stringify(v.initValue, null, '\t');
			fs.writeFileSync(storeFile, initStoreContent);
			storeContent = initStoreContent;
		}
		tempStore = JSON.parse(storeContent);
	} catch (e) {
		const emsg = `Failed to initialize local store file for model ${modelName}: ${e.message}`;
		logger.error(emsg);
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	const store = toolboxService.clone(tempStore);
	logger.debug(`Exiting ${callMsg}`);
	return { store, storeFile };
};

toolboxService.saveStoreToFile = async (fileName, store, withTabFormat) => {
	const callMsg = `saveStoreToFile(fileName = "${fileName}", store = ${typeof store}, withTabFormat = ${withTabFormat})`;
	logger.debug(`Entering ${callMsg}`);
	let v;
	try {
		v = toolboxService.validate({ fileName, store, withTabFormat }, 'toolboxService_saveStoreToFile');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	const tab = v.withTabFormat ? '\t' : '';
	if (fs.existsSync(v.fileName)) {
		try {
			fs.writeFileSync(v.fileName, JSON.stringify(store, null, tab));
		} catch (e) {
			const emsg = `saveStoreToFile::fs.writeFileSync(fileName = "${v.fileName}") returned an error: ${e.message}`;
			logger.error(emsg);
			logger.debug(`Exiting ${callMsg}`);
			throw e;
		}
	} else {
		const emsg = `Store file "${v.fileName}" has not been initialized`;
		logger.error(emsg);
		logger.debug(`Exiting ${callMsg}`);
		throw new Error(emsg);
	}
};

toolboxService.parseCsvToArray = (content) => {
	const callMsg = `parseCsvToArray("${typeof content}")`;
	logger.debug(`Entering ${callMsg}`);
	let v;
	try {
		v = toolboxService.validate({ content }, 'toolboxService_parseCsvToArray');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	logger.debug(`parseCsvToArray::EOL variable value: "${EOL}"`);
	const arr = [];
	const rows = v.content.toString().split(EOL);
	const len = rows.length;
	logger.debug(`parseCsvToArray::len variable value: ${len}`);
	for (let i = 0; i < len; i++) {
		if (rows[i].length > 0) {
			let el = rows[i].replace(/",(\d)/g, '","$1');
			el = el.replace(/(\d),"/g, '$1","');
			el = el.replace(/", "/g, '","');
			const row = el.split('","');
			row[0] = row[0].replace(/^"/, '');
			row[row.length - 1] = row[row.length - 1].replace(/"$/, '');
			arr.push(row);
		}
	}
	logger.debug(`Exiting ${callMsg}`);
	return arr;
};

module.exports = toolboxService;
