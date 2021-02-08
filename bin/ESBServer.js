process.env.INSTALL_DIR = '';

const { readFileSync } = require('fs');
const https = require('https');
const app = require('./app');
const logger = require('../services/loggingService')(__filename);
const config = require('../services/configurationService').getServerConfiguration();

let keyFile;
let	certFile;
try {
	keyFile = readFileSync(config.key);
} catch (e) {
	logger.error(`Failed to read key file: ${e.message}`);
}
try {
	certFile = readFileSync(config.cert);
} catch (e) {
	logger.error(`Failed to read cert file(s): ${e.message}`);
}

const options = {
	key: keyFile,
	cert: certFile
};

const server = https.createServer(options, app);

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string'
		? `Pipe ${config.port}`
		: `Port ${config.port}`;

	// handle specific listen errors with friendly messages

	switch (error.code) {
	case 'EACCES':
		logger.error(`${bind} requires elevated privileges`);
		break;

	case 'EADDRINUSE':
		logger.error(`${bind} is already in use`);
		break;

	default:
		throw error;
	}
	logger.error(error.message);
	process.exit(1);
}

function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
	logger.info(`Server listening on ${bind}`);
}

if (config.timeout) server.setTimeout(config.timeout);
server.listen(config.port);
server.on('listening', onListening);
server.on('error', onError);
