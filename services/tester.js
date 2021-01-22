const http = require('./httpClientService');
const toolboxService = require('./toolboxService');

(async () => {
  const options = {
    host: 'onportal.net',
    path: '/incidents',
    method: 'get',
    port: 4000,
    rejectUnauthorized: false,
    timeout: 5000,
    useTls: false,
    body: null,
    returnClientRequest: false,
    returnHttpIncomingMessage: true
  }

  /*
  try {
    const { message, data } = await http.asyncRequest(options);
    //response.on('data', (chunk) => console.log(chunk.toString()))
    console.log(message.statusCode);
    console.log(JSON.parse(data));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
  */

  // with returnHttpIncomingMessage = true;
  const { createWriteStream } = require('fs');
  const writeStream = createWriteStream('./output.txt');
  try {
    const httpIncomingMessage = await http.asyncRequest(options);
    console.log(httpIncomingMessage.statusCode);
    httpIncomingMessage.pipe(writeStream);
    writeStream.on('close', async() => {
      await toolboxService.truncateFile('./output.txt', 1400, 'TRUNCATED');
    });
  } catch (e) {
    console.log(e.message);
  }


})();
