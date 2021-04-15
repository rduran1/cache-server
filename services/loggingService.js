const path = require('path');
const { EOL } = require('os');
const { appendFileSync, readFileSync, readFile, readdir } = require('fs');

let loggingLevel = [];
let exitOnWriteToLogFailure = false;

function logit(fileName, level, msg) {
	if (!loggingLevel.includes(level.toLowerCase())) return;
	const padding = ' '.repeat(5 - level.length);
	let emsg;
	try {
		emsg = `${Date()}: [${level}${padding}] ${msg}${EOL}`;
		appendFileSync(fileName, `${emsg}`);
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(`A critical error occurred, failed to append msg to ${fileName} -> ${emsg}: ${e.message}`);
		if (exitOnWriteToLogFailure) process.exit(1000);
	}
}

const readDirAsync = (dir) => new Promise((resolve, reject) => {
	readdir(dir, (err, files) => {
		if (err) return reject(new Error(err.message));
		const logFiles = files.filter((e) => e.endsWith('.log'));
		return resolve(logFiles);
	});
});

const readFileAsync = (fileName) => new Promise((resolve, reject) => {
	readFile(fileName, (err, data) => {
		if (err) return reject(new Error(err.message));
		return resolve(data.toString());
	});
});

function loggingService(fileName) {
	if (typeof process.env.INSTALL_DIR === 'undefined') throw new Error('Environmental variable "INSTALL_DIR" is undefined');
	const pathToConfigFile = path.join(process.env.INSTALL_DIR, 'models', 'stores', 'configurationStore.json');
	const logFilesDirectory = path.join(process.env.INSTALL_DIR, 'logs');
	if (typeof fileName === 'undefined') {
		return {
			getLogFileNames: async () => {
				const logFiles = await readDirAsync(logFilesDirectory);
				return logFiles;
			},
			getFileContent: async (logName, limit = 1000) => {
				const content = await readFileAsync(path.join(logFilesDirectory, logName));
				const arr = content.split('\n');
				const logContent = arr.slice(Math.max(arr.length - (limit + 1), 0)).join('\n');
				return logContent;
			}
		};
	}
	if (typeof fileName !== 'string') throw new TypeError('fileName parameter must be of type string');
	if (!fileName.endsWith('.js')) throw new Error('fileName parameter must end with ".js"');
	try {
		const config = readFileSync(pathToConfigFile, 'utf-8');
		const configuration = JSON.parse(config);
		loggingLevel = configuration.loggingLevels;
		exitOnWriteToLogFailure = configuration.express.exitOnWriteToLogFailure;
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
