const accessService = require('../services/accessService');
const logger = require('../services/loggingService')(__filename);

const accessController = {};

const request = {
	post: 'create',
	get: 'read',
	put: 'update',
	delete: 'delete'
};

accessController.isAllowed = async (req, res, next) => {
	logger.debug('Entering accessController.isAllowed');
	const token = req.query.token || req.body.token;
	const reqOriginalUrl = req.originalUrl;
	const subject = req.session ? req.session.userId : undefined;
	const { remoteAddress } = req.connection;
	const method = request[req.method.toLowerCase()];

	// Extract the resource from the URL
	const resource = /^\/(.+?)(\/|\?)/.exec(reqOriginalUrl) ? /^\/(.+?)(\/|\?)/.exec(reqOriginalUrl)[1] : undefined;
	const pre = `${remoteAddress}: Request`;
	logger.info(`${pre} (token=${token}, subject=${subject}, resource=${resource}, request=${method})`);
	logger.debug(`Calling accessService.isAllowed(${token}, ${subject}, ${resource}, ${method})`);
	if (await accessService.isAllowed(token, subject, resource, method)) {
		logger.info(`${pre} for ${token ? `token=${token}` : `subject=${subject}`} to ${method} ${resource} allowed`);
		logger.debug('Exiting accessController.isAllowed');
		return next();
	}
	logger.info(`${pre} for ${token ? `token=${token}` : `subject=${subject}`} to ${method} ${resource} denied, responding with HTTP 401`);
	logger.debug('Exiting accessController.isAllowed');
	return res.status(401).send();
};

module.exports = accessController;
