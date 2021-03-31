const accessService = require('../services/accessControlService');
const logger = require('../services/loggingService')(__filename);

const collectionController = {};

const request = {
	post: 'create',
	get: 'read',
	put: 'update',
	delete: 'delete'
};

collectionController.isAllowed = async (req, res, next) => {
	logger.debug('Entering isAllowed controller method');
	const token = req.query.token || req.body.token;
	const reqOriginalUrl = req.originalUrl;
	const subject = req.session ? req.session.userId : undefined;
	const { remoteAddress } = req.connection;
	const method = request[req.method.toLowerCase()];

	// Extract the resource from the URL
	const resource = /^\/(.+?)(\/|\?)/.exec(reqOriginalUrl) ? /^\/(.+?)(\/|\?)/.exec(reqOriginalUrl)[1] : undefined;

	logger.debug(`Request from ${remoteAddress} to authenticate and authorize (${token}, ${subject}, ${resource}, ${method})`);
	logger.debug('Calling accessService.isAllowed');
	if (await accessService.isAllowed(token, subject, resource, method)) {
		logger.debug(`Request to ${method} ${resource} is allowed`);
		return next();
	}
	logger.info(`Request from ${remoteAddress} denied, responding with HTTP 401`);
	logger.debug('Exiting isAllowed controller method');
	return res.status(401).send();
};

module.exports = collectionController;
