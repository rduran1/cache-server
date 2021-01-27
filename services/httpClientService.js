const http = require('http');
const https = require('https');
const toolboxService = require('../services/toolboxService');

const httpClientService = {};

httpClientService.asyncRequest = options => new Promise((resolve, reject) => {
  let opts = {};
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
  const returnClientRequest = opts.returnClientRequest;
  const returnHttpIncomingMessage = opts.returnHttpIncomingMessage;
  delete opts.body;
  delete opts.returnClientRequest;
  delete opts.returnHttpIncomingMessage;

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
    if (typeof e.code !== 'undefined') eInfo.push(`code: ${e.code}`);
    if (typeof e.errno !== 'undefined') eInfo.push(`errno: ${e.errno}`);
    if (typeof e.path !== 'undefined') eInfo.push(`path: ${e.path}`);
    if (typeof e.syscall !== 'undefined') eInfo.push(`syscall: ${e.syscall}`);
    if (typeof e.host !== 'undefined') eInfo.push(`host: ${e.host}`);
    if (typeof e.port !== 'undefined') eInfo.push(`port: ${e.port}`);
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