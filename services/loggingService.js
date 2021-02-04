const path = require('path');
const { EOL } = require('os');
const { writeFileSync } = require('fs');
const configurationService = require('./configurationService');

function logit(fileName, level, msg) {
	const loggingLevel = configurationService.getLoggingLevels().map((e) => e.toUpperCase());
	if (!loggingLevel.includes(level)) return;
	writeFileSync(fileName, `${Date()}: [${level}] ${msg}${EOL}`);
}

function loggingService(fileName) {
	if (typeof fileName !== 'string') throw new Error('Parameter must be of type string');
	if (!fileName.includes('.js')) throw new Error('File name must end in ".js"');
	const baseName = path.basename(fileName).replace('.js', '.log');
	const fileLocation = path(process.env.INSTALL_DIR, 'logs', baseName);
	return {
		info: (message) => { logit(fileLocation, 'INFO ', message); },
		warn: (message) => { logit(fileLocation, 'WARN ', message); },
		error: (message) => { logit(fileLocation, 'ERROR', message); },
		debug: (message) => { logit(fileLocation, 'DEBUG', message); }
	};
}

module.exports = loggingService;
