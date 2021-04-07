const path = require('path');
const helmet = require('helmet');
const express	= require('express');

const app		= express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('../services/loggingService')(__filename);
const config = require('../services/configurationService')().getExpressConfiguration();

logger.debug(`process.env.INSTALL_DIR value: "${process.env.INSTALL_DIR}"`);

app.set('view engine', config.viewEngine);
app.set('views', path.join(process.env.INSTALL_DIR, config.viewsDirectory));

app.use(cookieParser());
app.use(express.static(config.staticDirectory));
app.use(bodyParser.urlencoded({ extended: config.bodyParserUrlencodedExtended }));
app.use(bodyParser.json({ limit: config.bodyParserJsonSizeLimit }));
app.use(bodyParser.text({ limit: config.bodyParserTextSizeLimit }));
app.use(helmet());

app.disable('x-powered-by');

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
	const { connection: { remoteAddress }, originalUrl, headers: { 'content-type': ct, 'content-length': cl } } = req;
	let url = originalUrl;
	if (config.filterTokenFromUrl) url = originalUrl.replace(/token=[0-9a-z]+/, 'token=[FILTERED]');
	if (/^Failed to decode param/.test(e.message)) {
		logger.error(`${remoteAddress} url "${url}" type "${ct}" length ${cl}B: Responding with HTTP 400: ${e.message}`);
		return res.status(400).send(e.message);
	}
	if (/^Unexpected token /.test(e.message)) {
		logger.error(`${remoteAddress} url "${url}" type "${ct}" length ${cl}B: Responding with HTTP 400: ${e.message}`);
		return res.status(400).send(e.message);
	}
	if (/request entity too large/.test(e.message)) {
		logger.error(`${remoteAddress} url "${url}" type "${ct}" length ${cl}B: Responding with HTTP 413: ${e.message}`);
		return res.status(413).send(e.message);
	}
	logger.error(`${remoteAddress} url "${url}" type "${ct}" length ${cl}B: Unhandled exception: ${e.message}`);
	return res.status(500).send('Administrator notified of error, try again later');
});

module.exports = app;
