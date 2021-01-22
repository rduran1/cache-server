const http = require('./httpClientService');
const toolboxService = require('./toolboxService');
const bigfixService = require('./bigfixService');
const replaceStreamService = require('./replaceStreamService');

const rs = new replaceStreamService('Title', 'KING');

(async () => {
  const options = {
    host: 'onportal.net',
    port: 4000,
    username: 'rd',
    password: 'as',
    useTls: false,
    timeout: 100
  }

  try {
    const code = await bigfixService.authenticate(options);
    console.log(code);
  } catch (e) {
    console.log(e.message);
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
  

  // with returnHttpIncomingMessage = true;
  const { createWriteStream } = require('fs');
  const writeStream = createWriteStream('./output.txt');
  try {
    const httpIncomingMessage = await http.asyncRequest(options);
    console.log(httpIncomingMessage.statusCode);
    httpIncomingMessage.pipe(rs).pipe(writeStream);
    writeStream.on('close', async() => {
      await toolboxService.truncateFile('./output.txt', 1400, 'TRUNCATED');
    });
  } catch (e) {
    console.log(e.message);
  }
*/

})();
