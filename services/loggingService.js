const path = require('path');
const { EOL } = require('os');
const { appendFileSync, readFileSync } = require('fs');

let loggingLevel = [];

function logit(fileName, level, msg) {
	if (!loggingLevel.includes(level.toLowerCase())) return;
	const padding = ' '.repeat(5 - level.length);
	appendFileSync(fileName, `${Date()}: [${level}${padding}] ${msg}${EOL}`);
}

function loggingService(fileName) {
	if (typeof process.env.INSTALL_DIR === 'undefined') throw new Error('Environmental variable "INSTALL_DIR" is undefined');
	if (typeof fileName !== 'string') throw new TypeError('fileName parameter must be of type string');
	if (!fileName.endsWith('.js')) throw new Error('fileName parameter must end with ".js"');
	const pathToConfigFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'configurationStore.json');
	try {
		const config = readFileSync(pathToConfigFile, 'utf-8');
		loggingLevel = JSON.parse(config).loggingLevels;
	} catch (e) {
		throw new Error(`Error reading ${pathToConfigFile}: ${e.message}`);
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

module.exports = loggingService;
