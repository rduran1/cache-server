const path = require('path');
const helmet = require('helmet');
const express	= require('express');

const app		= express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('../services/loggingService')(__filename);
const config = require('../services/configurationService')().getExpressConfiguration();
// eslint-disable-next-line no-unused-vars
const scheduler = require('../scheduler');

app.set('view engine', 'ejs');
app.set('views', path.join(process.env.INSTALL_DIR, config.viewsDirectory));

app.use(cookieParser());
app.use(express.static(config.staticDirectory));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: config.bodyParserJsonSizeLimit }));
app.use(bodyParser.text({ limit: config.bodyParserTextSizeLimit }));
app.use(helmet());

function logIncomingRequest(req, res, next) {
	const { connection: { remoteAddress }, originalUrl, method } = req;
	logger.info(`${remoteAddress} ${method} ${originalUrl.split('?')[0]}`);
	next();
}

app.use(logIncomingRequest);
app.use('/', require('../routes/hpsm'));

// Error handler for middleware
app.use((e, req, res, next) => {
	if (!e) return next();
	const { connection: { remoteAddress }, originalUrl } = req;
	if (/^Failed to decode param/.test(e.message)) {
		logger.error(`Request from ${remoteAddress} contains malformed URL: ${originalUrl.replace(/token=[0-9a-z]+/, 'token=[FILTERED]')}`);
		return res.status(400).send(`${e.message}. Check URL encoding`);
	}
	if (/request entity too large/.test(e.message)) {
		logger.error(`Request from ${remoteAddress} generated HTTP 413 error: ${e.message}`);
		return res.status(413).send('e.message');
	}
	logger.error(`Request from ${remoteAddress} generated uncaught exception: ${e.message}`);
	return res.status(500).send('Uncaught exception, check app.log and server.log for details');
});

app.disable('x-powered-by');

module.exports = app;
