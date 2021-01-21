const toolboxService = require('./services/toolboxService');
const httpClientService = require('./services/httpClientService');

async function makeHttpRequest(config) {
  try {
    const response = await httpClientService.request(configCopy);
    if (response.statusCode === 200) return true;
    return false;
  } catch (e) {
    throw new Error(`httpClientService returned an error: ${e.message}`);
  }
}

const bigfixService = {};

bigfixService.authenticate = async(config) => {
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixAuthentication');
  configCopy.path = '/api/login';
  configCopy.method = 'GET';
  const response = await makeHttpRequest(configCopy);
  return response ? true : false;
};

bigfixService.getOperator = async(config) => {
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'GET';
  const response = await makeHttpRequest(configCopy);
  return response;
};

bigfixService.deleteOperator = async(config) => {
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'DELETE';
  const response = await makeHttpRequest(configCopy);
  return response ? true : false;
};

bigfixService.disableOperator = async(config) => {
  const configCopy = toolboxService.cloneAndValidate(config, 'bigfixOperator');
  configCopy.path = `/api/operator/${configCopy.opName}`;
  configCopy.method = 'PUT';
  const operatorXml = await bigfixService.getOperator(configCopy);
  configCopy.payload = operatorXml
  .replace(/\<LastLoginTime\>.+?\<\/LastLoginTime\>/,'')
  .replace(/\<LoginPermission\>.+?\<\/LoginPermission\>/,'<LoginPermission>Disabled</LoginPermission>')
  .replace(/\<Console\>.+?\<\/Console\>/,'<Console>false</Console>')
  .replace(/\<WebUI\>.+?\<\/WebUI\>/,'<WebUI>false</WebUI>')
  .replace(/\<API\>.+?\<\/API\>/,'<API>false</API>')
  .replace(/\n/g,'')
  .replace(/^\<.+?\?\>/,'');
  const response = await makeHttpRequest(configCopy);
  return response ? true : false;
};