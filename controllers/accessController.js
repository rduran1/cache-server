const accessService = require('../services/accessService');
const loggingService = require('../services/loggingService');

const accessController = {};
const logger = loggingService(__filename);

const request = {
	post: 	'create',
	get:  	'read',
	put:  	'update',
	delete: 'delete'
};

accessController.isAllowed = async(req, res, next) => {
	logger.debug(`Entering isAllowed controller method`);
	const token    = req.query.token || req.body.token;
	const reqPath  = req.originalUrl;
	const subject  = req.session ? req.session.userId : undefined;

	// Extract the resource from the URL
	const resource = /^\/(.+?)(\/|\?)/.exec(reqPath) ? /^\/(.+?)(\/|\?)/.exec(reqPath)[1] : undefined;
	const { remoteAddress } = req.connection;
	const method = request[req.method.toLowerCase()];
	logger.debug(`Request from ${remoteAddress} to authenticate and authorize (${token}, ${subject}, ${resource}, ${method})`);
	logger.debug('Calling accessService.isAllowed service method');
	if (await accessService.isAllowed(token, subject, resource, method)) {
		logger.debug(`Request to ${method} ${resource} is allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return next();
	}
	logger.info(`Request from ${remoteAddress} denied, responding with HTTP 401`);
	res.status(401).send();
	logger.debug('Exiting isAllowed controller method');
};

module.exports = accessController;
