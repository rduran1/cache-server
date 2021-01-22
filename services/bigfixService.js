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

const bigfixService = {};

bigfixService.authenticate = async(config) => {
  const configCopy = toolboxService.clone(config);
  configCopy.path = '/api/login';
  configCopy.method = 'GET';
  toolboxService.validate({ username: configCopy.username, password: configCopy.password }, 'bigfixAuthentication');
  configCopy.auth = `${configCopy.username}:${configCopy.password}`;
  delete configCopy.username;
  delete configCopy.password;
  const { message } = await _makeHttpRequest(configCopy);
  return message.statusCode;
};

bigfixService.getOperator = async(config) => {
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'GET';
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data };
};

bigfixService.deleteOperator = async(config) => {
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'DELETE';
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  const { message, data } = await _makeHttpRequest(configCopy);
  return { message, data }
};

bigfixService.disableOperator = async(config) => {
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'PUT';
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  const operatorXml = await bigfixService.getOperator(configCopy);
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
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'POST';
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  const response = await _makeHttpRequest(configCopy);
  pipeline( response, ...TransformStream, outputFile );
  return response ? true : false;
};

module.exports = bigfixService;