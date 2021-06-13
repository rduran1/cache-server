const VERSION = '01.00.00';
const path = require('path');
const { randomBytes } = require('crypto');
const helmet = require('helmet');
const express	= require('express');
const session = require('express-session');

const app	= express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('../services/configurationService')().getExpressConfiguration();
const logger = require('../services/loggingService')(__filename);
// TODO: const healthchecker = require('../services/healthCheckerService');

logger.info(`Initializing Application Server v${VERSION}`);
logger.info(`process.env.INSTALL_DIR value: "${process.env.INSTALL_DIR}"`);
// logger.info('Running boot sequence health check tests');
// TODO: healthchecker.runTests(logger); <- pass logger so hc can write to app.log

app.set('view engine', config.viewEngine);
app.set('views', path.join(process.env.INSTALL_DIR, config.viewsDirectory));

// Allow unsafe eval: Required for vue template compiler to work
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
	secret: randomBytes(32).toString('hex'),
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

app.get('/favicon.ico', (req, res) => res.sendStatus(204));
app.get('/', (req, res) => res.redirect('/app'));

// Application router mount points
app.use('/app', require('../routes/appRouter'));
app.use('/api/application-logs', require('../routes/applicationLogsRouter'));
app.use('/api/hpsm-incidents', require('../routes/hpsmIncidentsRouter'));
app.use('/api/collections', require('../routes/collectionRouter'));

app.use('/api/session-check', (req, res) => {
	const msg = 'token or authenticated accountId is required';
	if (typeof res.session === 'undefined' || typeof req.session.accountId === 'undefined') {
		res.statusMessage = msg;
		res.end();
	}
});

// Error handler for middleware
app.use((e, req, res, next) => {
	if (!e) return next();
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
	if (/^Unexpected end of JSON input/.test(e.message)) {
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

app.use('/api', (req, res) => {
	res.statusMessage = `API route /api${req.path} does not exist`;
	res.status(404).end();
});

module.exports = app;
