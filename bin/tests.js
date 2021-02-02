/* eslint-disable global-require */
// eslint-disable-next-line object-curly-newline
const { test, testSummary: summary, servicesTestHeader, serviceTesting } = require('../services/toolboxService');

process.env.INSTALL_DIR = 'C:/Users/rovin/Documents/Projects/cache-server';

const hpsmIncidentService = require('../services/hpsmIncidentService');

const credentials = {
	host: 'defaultserver',
	port: 9000,
	username: 'produser',
	password: 'secret'
};

(async function UnitTesting() {
	// Services
	let t;
	let accountService;
	const sth = servicesTestHeader();
	serviceTesting('AccountService');

	t = test('001 Initialize using non-existent "_TESTACCOUNT" account without forceCreate option');
	try {
		accountService = require('../services/accountService')('_TESTACCOUNT');
		t.fail('Initializing with a nonexistent account should throw error');
	} catch (e) {
		t.pass(e.message);
	}

	t = test('002 Initialize using non-existent "_TESTACCOUNT" account with forceCreate option');
	try {
	// eslint-disable-next-line no-unused-vars
		accountService = require('../services/accountService')('_TESTACCOUNT', true);
		t.pass();
	} catch (e) {
		t.fail(e.message);
	}

	t = test('003 Initialize using existing "_TESTACCOUNT" account with forceCreate option');
	try {
	// eslint-disable-next-line no-unused-vars
		accountService = require('../services/accountService')('_TESTACCOUNT', true);
		t.fail('Attempt to create existing account with forceCreate should fail');
	} catch (e) {
		t.pass(e.message);
	}

	accountService = require('../services/accountService')('_TESTACCOUNT');
	t = test('004 Explicitly create new "default" environment for account "_TESTACCOUNT"');
	try {
		await accountService.createNewEnvironmentCredentials(credentials, 'default');
		t.pass();
	} catch (e) {
		t.fail(e.message);
	}

	accountService = require('../services/accountService')('_TESTACCOUNT');
	t = test('005 Delete existing "default" environment for account "_TESTACCOUNT"');
	try {
		await accountService.deleteAccountEnvironment('default');
		t.pass();
	} catch (e) {
		t.fail(e.message);
	}

	accountService = require('../services/accountService')('_TESTACCOUNT');
	t = test('006 Implicitly create new "default" environment for account "_TESTACCOUNT"');

	try {
		await accountService.createNewEnvironmentCredentials(credentials);
		t.pass();
	} catch (e) {
		t.fail(e.message);
	}

	accountService = require('../services/accountService')('_TESTACCOUNT');
	t = test('007 Implicitly create existing "default" environment for account "_TESTACCOUNT"');
	try {
		await accountService.createNewEnvironmentCredentials(credentials);
		t.fail('createNewEnvironmentCredentials should block creating existing environment');
	} catch (e) {
		t.pass(e.message);
	}

	t = test('008 Get default credentials for "_TESTACCOUNT" using getCreds()');
	try {
		const creds = accountService.getCredentials();
		if (typeof creds === 'object' && creds.host === 'defaultserver') {
			t.pass();
		} else {
			t.fail(`Expected object with host value of 'defaultserver', got ${creds.host}`);
		}
	} catch (e) {
		t.fail(e.message);
	}

	t = test('009 Get non-existent "dev" environment from "_TESTACCOUNT" account using getCreds(\'dev\')');
	try {
		const creds = accountService.getCredentials('dev');
		if (typeof creds.host === 'string') t.fail('Did not expect to find credentials, maybe created by user?');
	} catch (e) {
		t.pass(e.message);
	}

	t = test('010 Delete "_TESTACCOUNT" account');
	try {
		accountService.deleteAccount();
		t.pass();
	} catch (e) {
		t.fail(e.message);
	}
	sth.finish();
	summary();
}());

// const config = require('app.config')
// const as = accountService('tester');
/*
(async function runit() {
	try {
		const creds = accountService.getCreds();
		console.log(creds);
	} catch (e) {
		console.log(e.message);
	}
}());
*/
/*
const rs1 = new replaceStreamService('Title', 'KING');
const rs2 = new replaceStreamService('MR', 'MRS');

(async () => {
  const options = {
    host: 'onportal.net',
    port: 4000,
    username: 'rd',
    password: 'as',
    //opName: 'rduran',
    relevance: 'lines of file whose (name of it contains "test")',
    transforms: [rs1,rs2],
    outputFile: '/path/to/outputfile',
    output: 'json'
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

})(); */
