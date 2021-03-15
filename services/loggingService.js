const path = require('path');
const { EOL } = require('os');
const { appendFileSync } = require('fs');
const configurationService = require('./configurationService');

function logit(fileName, level, msg) {
	const loggingLevel = configurationService.getLoggingLevels().map((e) => e.toUpperCase());
	if (!loggingLevel.includes(level)) return;
	const padding = ' '.repeat(5 - level.length);
	appendFileSync(fileName, `${Date()}: [${level}${padding}] ${msg}${EOL}`);
}

function loggingService(fileName) {
	if (typeof fileName !== 'string') throw new Error('Parameter must be of type string');
	if (!fileName.endsWith('.js')) throw new Error('File name must end with ".js"');
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
