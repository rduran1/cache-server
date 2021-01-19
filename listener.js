const pipelineAsync = promisify(pipeline);

function logit(strMsg) { console.log(`${Date()}: ${strMsg}`) }

const truncateFile = (strFileName, len, strAppend) => new Promise(async (resolve, reject) => {
	let stats;
	try {
		stats = fs.statSync(strFileName);
	} catch(e) {
		return reject(new Error(`Error getting file size of ${strFileName}: ${e.message}`));
	}
	const trim = stats.size - len;
	if (trim < 1) return resolve();
	fs.truncate(strFileName, trim, (e) => {
		if (e) return reject(new Error(`Error truncating ${strFileName} by ${len} characters: ${e.message}`));
		if (strAppend) {
			fs.appendFile(strFileName, strAppend, (err) => {
				if (err) return reject(new Error(`Error appending "${strAppend}" to ${strFileName}: ${e.message}`));
				return resolve();
			});
		} else {
			return resolve();
		}
	});
});

async function connectionHandler(req, res) {
	const { remoteAddress, remotePort } = req.connection;
	if (!config.allowedIps.includes(remoteAddress)) {
		logit(`Client connection attempt from ${remoteAddress} denied, IP is not in the allowed IP addresses list`);
		return req.destroy();
	} else {
		logit(`Client connected from IP ${remoteAddress}:${remotePort}`);
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
	const collector = await collectorStore.getByName(datasetName);
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
		await truncateFile(tFile, 5, '"]]');
		fs.renameSync(tFile, `${collector.cacheFile}_`);
	} catch (e) {
		logit(`Pipeline error processing "${datasetName}" from ${remoteAddress}: ${e.message}`);
		return;
	}
}

const options = { key: fs.readFileSync(config.sslKey), cert: fs.readFileSync(config.sslCert) };
const server = createServer(options, connectionHandler);
server.listen(config.port);
