const http = require('http');
const https = require('https');
const toolboxService = require('./toolboxService');

const httpClientService = {};

// eslint-disable-next-line consistent-return
httpClientService.asyncRequest = (options) => new Promise((resolve, reject) => {
	const opts = {};
	Object.assign(opts, options);

	// Set defaults for httpClient
	if (typeof opts.useTls === 'undefined') opts.useTls = true;
	if (typeof opts.rejectUnauthorized === 'undefined') opts.rejectUnauthorized = true;
	if (typeof opts.returnClientRequest === 'undefined') opts.returnClientRequest = false;
	if (typeof opts.returnHttpIncomingMessage === 'undefined') opts.returnHttpIncomingMessage = false;

	toolboxService.validate(opts, 'httpClient');

	const httpClient = opts.useTls ? https : http;
	const body = opts.body || null;
	const timeout = opts.timeout || null;
	const { returnClientRequest } = opts;
	const { returnHttpIncomingMessage } = opts;
	delete opts.body;
	delete opts.returnClientRequest;
	delete opts.returnHttpIncomingMessage;

	const clientRequest = httpClient.request(opts);
	if (timeout) clientRequest.setTimeout(timeout);

	if (returnClientRequest) return resolve(clientRequest);

	// eslint-disable-next-line consistent-return
	clientRequest.on('response', (httpIncomingMessage) => {
		if (returnHttpIncomingMessage) return resolve(httpIncomingMessage);

		httpIncomingMessage.on('aborted', (e) => reject(new Error(`httpIncomingMessage aborted: ${e.message}`)));

		let data = '';
		httpIncomingMessage.on('data', (chunk) => {
			data += chunk;
		});

		httpIncomingMessage.on('end', () => resolve({ message: httpIncomingMessage, data }));
	});

	clientRequest.on('error', (e) => {
		const eInfo = [];
		if (typeof e.code !== 'undefined') eInfo.push(`code: ${e.code}`);
		if (typeof e.errno !== 'undefined') eInfo.push(`errno: ${e.errno}`);
		if (typeof e.path !== 'undefined') eInfo.push(`path: ${e.path}`);
		if (typeof e.syscall !== 'undefined') eInfo.push(`syscall: ${e.syscall}`);
		if (typeof e.host !== 'undefined') eInfo.push(`host: ${e.host}`);
		if (typeof e.port !== 'undefined') eInfo.push(`port: ${e.port}`);
		if (/routines:ssl3_get_record:wrong version number/.test(e.message)) {
			return reject(new Error('Error: Server does not appear to support HTTPS/TLS protocol'));
		}
		const found = e.messsage.match(/:sslv3 (.+?):/)[0];
		if (found) return reject(new Error(`Error: ${found}`));
		return reject(new Error(`${e.message}: (${eInfo.join(' ')})`));
	});

	clientRequest.on('abort', (e) => reject(new Error(`ClientRequest aborted: ${e.message}`)));

	clientRequest.on('timeout', () => {
		clientRequest.destroy();
		return reject(new Error('Request timed out waiting for server response'));
	});

	if (body) {
		clientRequest.end(body);
	} else {
		clientRequest.end();
	}
});

module.exports = httpClientService;
