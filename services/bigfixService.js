const { promisify } = require('util'); 
const { pipeline } = require('stream'); 
const pipelineAsync = promisify(pipeline);
const { createWriteStream } = require('fs');
const toolboxService = require('../services/toolboxService');
const httpClientService = require('../services/httpClientService');

async function _makeHttpRequest(config) {
  // Set defaults for httpClient
  if (typeof config.useTls === 'undefined') config.useTls = true;
  if (typeof config.rejectUnauthorized === 'undefined') config.rejectUnauthorized = false;
  if (typeof config.returnClientRequest === 'undefined') config.returnClientRequest = false;
  if (typeof config.returnHttpIncomingMessage === 'undefined') config.returnHttpIncomingMessage = false;
  // delete unecessary properties
  delete config.opName;
  delete config.username;
  delete config.password;

  if (typeof config.relevance === 'string') {
    if (typeof config.transforms === 'object' || typeof config.outputFile === 'string') {
      config.returnHttpIncomingMessage = true;
    }
    delete config.relevance;
    delete config.output;
    let transforms;
    if (typeof config.transforms === 'object') {
      transforms = config.transforms;
      delete config.transforms;
    }
    if (typeof config.outputFile === 'string') {
      const writable = createWriteStream(config.outputFile);
      delete config.outputFile;
      const httpIncomingMessage = await httpClientService.asyncRequest(config);
      try {
        if (transforms) await pipelineAsync(httpIncomingMessage, ...transforms, writable);
        if (!transforms) await pipelineAsync(httpIncomingMessage, writable);
        return httpIncomingMessage;
      } catch (e) {
        throw new Error(`Pipeline error: ${e.message}`);
      }
    } else {
      if (typeof transforms === 'object') {
        throw new Error('Output file parameter is required when using transforms');
      }
      const response = await httpClientService.asyncRequest(config);
      return response;
    }
  }
  const response = await httpClientService.asyncRequest(config);
  return response;
}

function _validateUserAndPassProvided(config) {
  if (typeof config === 'undefined') throw new Error('username and password parameters are required');
  const configCopy = toolboxService.clone(config);
  const { username, password } = configCopy;
  toolboxService.validate({ username, password }, 'bigfixAuthentication');
  configCopy.auth = `${username}:${password}`;
  return configCopy;
}

function _validateUserPassAndOpNameProvided(config) {
  if (typeof config === 'undefined') throw new Error('username and password parameters are required');
  let configCopy = toolboxService.clone(config);
  configCopy = _validateUserAndPassProvided(configCopy);
  toolboxService.validate({ opName: configCopy.opName }, 'bigfixOperator');
  return configCopy;
}

const bigfixService = {};

bigfixService.authenticate = async(config) => {
  configCopy = _validateUserAndPassProvided(config);
  configCopy.path = '/api/login';
  configCopy.method = 'GET';
  const response = await _makeHttpRequest(configCopy);
  return response;
};

bigfixService.getOperator = async(config) => {
  const configCopy = _validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'GET';
  const response = await _makeHttpRequest(configCopy);
  return response;
};

bigfixService.deleteOperator = async(config) => {
  const configCopy = _validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'DELETE';
  const response = await _makeHttpRequest(configCopy);
  return response;
};

bigfixService.disableOperator = async(config) => {
  const configCopy = _validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'PUT';
  const { m, d } = await bigfixService.getOperator(configCopy);
  if (m.statusCode !== 200) throw new Error(`Operator lookup failed, server returned status code ${m.statusCode}: ${data}`);
  configCopy.body = d
  .replace(/\<LastLoginTime\>.+?\<\/LastLoginTime\>/,'')
  .replace(/\<LoginPermission\>.+?\<\/LoginPermission\>/,'<LoginPermission>Disabled</LoginPermission>')
  .replace(/\<Console\>.+?\<\/Console\>/,'<Console>false</Console>')
  .replace(/\<WebUI\>.+?\<\/WebUI\>/,'<WebUI>false</WebUI>')
  .replace(/\<API\>.+?\<\/API\>/,'<API>false</API>')
  .replace(/\n/g,'')
  .replace(/^\<.+?\?\>/,'');
  const response = await _makeHttpRequest(configCopy);
  return response;
};

bigfixService.query = async(config) => {
  if (typeof config.relevance !== 'string') throw new Error('Relevance is required and must be of type string');
  if (typeof config.output !== 'undefined') {
    if (typeof config.output !== 'string') throw new Error('output parameter must be of type string');
    if (config.output.toLowerCase() !== 'json' && config.output.toLowerCase() !== 'xml') {
      throw new Error('Valid options for output parameter are "json" or "xml"');
    }
  }
  // Cant clone transforms so we copy then to a temp variable then reassign back after cloning
  const transforms = config.transforms;
  configCopy = _validateUserAndPassProvided(config);
  configCopy.transforms = transforms;
  configCopy.path = `/api/query`;
  configCopy.method = 'POST';
  const { relevance, output } = configCopy;
  const format = (typeof output === 'string' ? `output=${output}&` : '');
  configCopy.body = `${format}relevance=${encodeURI(relevance)}`;
  const response = await _makeHttpRequest(configCopy);
  return response;
};

module.exports = bigfixService;