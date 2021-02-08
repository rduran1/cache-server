process.env.INSTALL_DIR = '';

const fs     	= require('fs');
const https  	= require('https');
const app    	= require('./app');
const logger	= require('../services/loggingService')(__filename);
const config	= require('../services/configurationService').getServerConfiguration();

const options = {
    key:  fs.readFileSync(config.key),
    cert: fs.readFileSync(config.cert)
};

const server = https.createServer(options, app);
if (config.timeout) server.setTimeout(config.timeout);
server.listen(config.port);
server.on('listening', onListening);
server.on('error', onError);

function onError(e) {
	logger.error(e.message);
	console.error(`${Date()}: ${e.message}`);
	process.exit(1);
}

function onListening() {
	let addr = server.address();
	let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	logger.info(`${Date()}: Server listening on ${bind}`);
	console.log(`${Date()}: Server listening on ${bind}`);
}
