const http = require('http');
const https = require('https');
const toolboxService = require('../services/toolboxService');

const httpClientService = {};

httpClientService.asyncRequest = options => new Promise((resolve, reject) => {
  let opts = {};
  Object.assign(opts, options);

  // Set defaults for httpClient
  if (typeof opts.useTls === 'undefined') opts.useTls = true;
  if (typeof opts.rejectUnauthorized === 'undefined') opts.rejectUnauthorized = false;
  if (typeof opts.returnClientRequest === 'undefined') opts.returnClientRequest = false;
  if (typeof opts.returnHttpIncomingMessage === 'undefined') opts.returnHttpIncomingMessage = false;

  toolboxService.validate(opts, 'httpClient');

  const httpClient = opts.useTls ? https : http;
  const body = opts.body || null;
  const timeout = opts.timeout || null;
  const returnClientRequest = opts.returnClientRequest;
  const returnHttpIncomingMessage = opts.returnHttpIncomingMessage;
  delete opts.body;
  delete opts.returnClientRequest;

  const clientRequest = httpClient.request(opts);
  if (timeout) clientRequest.setTimeout(timeout);

  if (returnClientRequest) return resolve(clientRequest);

  clientRequest.on('response', httpIncomingMessage => {

    if (returnHttpIncomingMessage) return resolve(httpIncomingMessage);

    httpIncomingMessage.on('aborted', (e) => { 
      return reject(new Error(`httpIncomingMessage aborted: ${e.message}`));
    });

    let data = '';
    httpIncomingMessage.on('data', (chunk) => {
      data += chunk;
    });

    httpIncomingMessage.on('end', () => {
      return resolve({ message: httpIncomingMessage, data: data });
    });
  });

  clientRequest.on('error', e => { 
    const eInfo = [];
    if (e.code) eInfo.push(`code: ${e.code}`);
    if (e.path || e.path === null) eInfo.push(`path: ${e.path}`);
    if (e.host) eInfo.push(`host: ${e.host}`);
    if (e.port) eInfo.push(`port: ${e.port}`);
    return reject(new Error(`${e.message}: (${eInfo.join(' ')})`));
  });

  clientRequest.on('abort', (e) => { 
    return reject(new Error(`ClientRequest aborted: ${e.message}`)); 
  });

  clientRequest.on('timeout', (e) => {
    clientRequest.destroy();
    return reject(new Error('Request timed out waiting for server response'));
  });

  body ? clientRequest.end(body) : clientRequest.end();
});

module.exports = httpClientService;