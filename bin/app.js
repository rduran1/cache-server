const VERSION = '00.10.00';
const path = require('path');
const helmet = require('helmet');
const express	= require('express');
const session = require('express-session');

const app	= express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('../services/loggingService')(__filename);
const config = require('../services/configurationService')().getExpressConfiguration();
// TODO: const healthchecker = require('../services/healthCheckerService');

logger.info(`Initializing Application Server v${VERSION}`);
logger.info(`process.env.INSTALL_DIR value: "${process.env.INSTALL_DIR}"`);
logger.info('Running boot sequence health check tests');
// TODO: healthchecker.runTests(logger); <- pass logger so hc can write to app.log

app.set('view engine', config.viewEngine);
app.set('views', path.join(process.env.INSTALL_DIR, config.viewsDirectory));

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				...helmet.contentSecurityPolicy.getDefaultDirectives(),
				'script-src': ["'self'", "'unsafe-eval'"]
			}
		}
	})
);

app.use(cookieParser());
app.use(express.static(path.join(process.env.INSTALL_DIR, config.staticDirectory)));
app.use(bodyParser.urlencoded({ extended: config.bodyParserUrlencodedExtended }));
app.use(bodyParser.json({ limit: config.bodyParserJsonSizeLimit }));
app.use(bodyParser.text({ limit: config.bodyParserTextSizeLimit }));

app.use(session({
	key: 'user_sid',
	secret: config.sessionSecret,
	resave: config.sessionResave,
	rolling: config.sessionRolling,
	saveUninitialized: config.sessionSaveUninitialized,
	cookie: {
		secure: true,
		httpOnly: true,
		maxAge: config.sessionMaxAge
	}
}));

function logIncomingRequest(req, res, next) {
	const { connection: { remoteAddress }, method } = req;
	logger.info(`${remoteAddress} ${method} ${req.path}`);
	next();
}
app.use(logIncomingRequest);

const pc = require('../routes/appPreChecks');
const appMain = require('../routes/appMain');
const appLogin = require('../routes/appLogin');

app.get('/favicon.ico', (req, res) => res.sendStatus(204));
app.get('/', (req, res) => res.redirect('/app'));
app.use('/app', pc.supportedBrowserCheck, pc.directBrowserToClearStaleSessionCookie, pc.checkForActiveSession, appMain);
app.use('/app/login', appLogin);
app.use('/', require('../routes/hpsm'));

// Error handler for middleware
app.use((e, req, res, next) => {
	if (!e) return next();
	// eslint-disable-next-line object-curly-newline
	const { method, connection: { remoteAddress }, originalUrl, headers: { 'content-type': ct, 'content-length': cl } } = req;
	let url = originalUrl;
	if (config.filterTokenFromUrl) url = originalUrl.replace(/token=[0-9a-z]+/, 'token=[FILTERED]');
	const contentType = `content-type "${ct}"`;
	const contentLength = typeof cl !== 'undefined' ? `content-length ${cl}B` : '';
	const emsg = `${remoteAddress} ${method} ${url} ${contentType} ${contentLength}`;
	if (/^Failed to decode param/.test(e.message)) {
		logger.error(`${emsg}: Responding with HTTP 400: ${e.message}`);
		return res.status(400).send(e.message);
	}
	if (/^Unexpected token /.test(e.message)) {
		logger.error(`${emsg}: Responding with HTTP 400: ${e.message}`);
		return res.status(400).send(e.message);
	}
	if (/request entity too large/.test(e.message)) {
		logger.error(`${emsg}: Responding with HTTP 413: ${e.message}`);
		return res.status(413).send(e.message);
	}
	logger.error(`${emsg}: Unhandled exception: ${e.message}`);
	return res.status(500).send('Administrator notified of error, try again later');
});

module.exports = app;
