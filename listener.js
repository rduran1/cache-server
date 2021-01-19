const fs = require('fs');
const zlib = require('zlib');
const { promisify } = require('util');
const { pipeline } = require('stream');
const { createServer } = require('https');
const config = require('./app.config').listener;
const toolboxService = require('./services/toolboxService');
const loggingService = require('./services/loggingService');
const replaceStream = require('./services/replaceStreamService');
const collectionService = require('./services/collectionService');

const logger = loggingService(__filename);
const pipelineAsync = promisify(pipeline);

async function connectionHandler(req, res) {
	const { remoteAddress, remotePort } = req.connection;
	if (!config.allowedIps.includes(remoteAddress)) {
		logger.warn(`Client connection attempt from ${remoteAddress} denied, IP is not in the allowed IP addresses list`);
		return req.destroy();
	} else {
		logger.info(`Client connected from IP ${remoteAddress}:${remotePort}`);
	}
	const datasetName = req.headers['x-dataset-name'];
	if (typeof datasetName != 'string') {
		logit('Dataset name was not provided in request');
		return req.destroy();
	}
	const datasetSize = req.headers['x-dataset-size'];
	if (typeof datasetSize != 'string') {
		logit('Dataset size was not provided in request');
		return req.destroy();
	}
	logit(`${remoteAddress} is requesting to upload dataset "${datasetName}" size: ${datasetSize} bytes`);
	logit(`Searching collector store for "${datasetName}" configuration`);
	const collector = await collectionService.getByName(datasetName);
	if (typeof collector.name !== 'string') {  
        logit(`${remoteAddress} attempted to upload unknown dataset "${datasetName}"`);
        return req.destroy(); 
    }
	if (collector.minValidCacheSizeInBytes) {
			if (collector.minValidCacheSizeInBytes > datasetSize) {
				logit(`${remoteAddress} attempted to upload undersized dataset for "${datasetName}". x-dataset-size: ${datasetSize} minValidCacheSizeInBytes: ${collector.minValidCacheSizeInBytes}`);
				return req.destroy();
			}
	}
	logit(`${remoteAddress} saving "${datasetName}"`);
	const transforms = [];
	if (collector.provider && typeof collector.provider.headers === 'object') {
		const headers = '[["' + collector.provider.headers.join('","') + '"],["';
		transforms.push(new replaceStream('\u0000', '', headers));
	} else {
		transforms.push(new replaceStream('\u0000', '', '[["'));
	}

	transforms.push(new replaceStream('\n','\\n'));
	transforms.push(new replaceStream('\ufffd','/'));

	try {
		const tFile = `${collector.cacheFile}.receiving`;
		const writeStream = fs.createWriteStream(tFile);
		await pipelineAsync(req, zlib.Gunzip(), ...transforms, writeStream);
		await toolboxService.truncateFile(tFile, 5, '"]]');
		fs.renameSync(tFile, `${collector.cacheFile}_`);
	} catch (e) {
		logit(`Pipeline error processing "${datasetName}" from ${remoteAddress}: ${e.message}`);
		return;
	}
}

const options = { key: fs.readFileSync(config.sslKey), cert: fs.readFileSync(config.sslCert) };
const server = createServer(options, connectionHandler);
server.listen(config.port);
