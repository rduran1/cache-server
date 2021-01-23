const toolboxService = require('../services/toolboxService');
const httpClientService = require('../services/httpClientService');

async function _makeHttpRequest(config) {
  // Set defaults for httpClient
  if (typeof config.useTls === 'undefined') config.useTls = true;
  if (typeof config.rejectUnauthorized === 'undefined') config.rejectUnauthorized = false;
  if (typeof config.returnClientRequest === 'undefined') config.returnClientRequest = false;
  if (typeof config.returnHttpIncomingMessage === 'undefined') config.returnHttpIncomingMessage = false;
  const response = await httpClientService.asyncRequest(config);
  return response;
}

function validateUserAndPassProvided(config) {
  const configCopy = toolboxService.clone(config);
  toolboxService.validate({ username: configCopy.username, password: configCopy.password }, 'bigfixAuthentication');
  configCopy.auth = `${configCopy.username}:${configCopy.password}`;
  delete configCopy.username;
  delete configCopy.password;
  return configCopy;
}

function validateUserPassAndOpNameProvided(config) {
  const configCopy = toolboxService.clone(config);
  configCopy.auth = validateUserAndPassProvided(configCopy);
  toolboxService.validate({ opName: configCopy.opName }, 'bigfixOperator');
  delete configCopy.username;
  delete configCopy.password;
  return configCopy;
}

const bigfixService = {};

bigfixService.authenticate = async(config) => {
  configCopy = validateUserAndPassProvided(config);
  configCopy.path = '/api/login';
  configCopy.method = 'GET';
  const { message } = await _makeHttpRequest(configCopy);
  return message.statusCode;
};

bigfixService.getOperator = async(config) => {
  const configCopy = validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'GET';
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data };
};

bigfixService.deleteOperator = async(config) => {
  const configCopy = validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'DELETE';
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data };
};

bigfixService.disableOperator = async(config) => {
  const configCopy = validateUserPassAndOpNameProvided(config);
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'PUT';
  const { m, d } = await bigfixService.getOperator(configCopy);
  configCopy.body = operatorXml
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
  configCopy = validateUserAndPassProvided(config);
  configCopy.path = `/api/query`;
  configCopy.method = 'POST';
  const response = await _makeHttpRequest(configCopy);
  pipeline( response, ...TransformStream, outputFile );
  return response ? true : false;
};

module.exports = bigfixService;