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
      delete config.tranforms;
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
  const configCopy = toolboxService.clone(config);
  const { username, password } = configCopy;
  toolboxService.validate({ username, password }, 'bigfixAuthentication');
  configCopy.auth = `${username}:${password}`;
  return configCopy;
}

function _validateUserPassAndOpNameProvided(config) {
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
  const { message } = await _makeHttpRequest(configCopy);
  return message.statusCode;
};

bigfixService.getOperator = async(config) => {
  const configCopy = _validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'GET';
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data };
};

bigfixService.deleteOperator = async(config) => {
  const configCopy = _validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'DELETE';
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data };
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
  const { message, data } = await _makeHttpRequest(configCopy); 
  return { message, data };
};

bigfixService.query = async(config) => {
  // TODO: if output file is provided then only return statusCode
  configCopy = _validateUserAndPassProvided(config);
  configCopy.path = `/api/query`;
  configCopy.method = 'POST';
  const { relevance, output } = configCopy;
  configCopy.body = `relevance='${relevance}'&output='${output}'`;
  const response = await _makeHttpRequest(configCopy);
  
};

module.exports = bigfixService;