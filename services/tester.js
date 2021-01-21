const http = require('./httpClientService');

(async () => {
  const options = {
    host: 'onportal.net',
    path: '/incidents',
    method: 'get',
    port: 4000,
    rejectUnauthorized: false,
    timeout: 10000,
    useTls: true,
    body: null,
    returnClientRequest: false,
    returnHttpIncomingMessage: false
  }
  try {
    const { message, data } = await http.asyncRequest(options);
    //response.on('data', (chunk) => console.log(chunk.toString()))
    console.log(message.statusCode);
    console.log(JSON.parse(data));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
})();