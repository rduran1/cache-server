//const http = require('./httpClientService');
const bigfixService = require('./bigfixService');
const toolboxService = require('./toolboxService');
const replaceStreamService = require('./replaceStreamService');

const rs = new replaceStreamService('Title', 'KING');

(async () => {
  const options = {
    host: 'onportal.net',
    port: 4000,
    username: 'rd',
    password: 'as',
    relevance: 'lines of file whose (name of it contains "test")',
    transforms: [rs1,rs2,rs3],
    outputFile: '/path/to/outputfile'
  }

  try {
    const code = await bigfixService.query(options);
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
