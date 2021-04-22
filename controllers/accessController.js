const accessControlService = require('../services/accessControlService');
const logger = require('../services/loggingService')(__filename);

const accessController = {};

const request = {
	post: 'create',
	get: 'read',
	put: 'update',
	delete: 'delete'
};

accessController.isAllowed = async (req, res, next) => {
	const { remoteAddress } = req.connection;
	logger.debug(`${remoteAddress}: Entering isAllowed`);
	logger.debug(`${remoteAddress}: isAllowed::req.method value: ${req.method}`);
	logger.debug(`${remoteAddress}: isAllowed::req.originalUrl value: ${req.originalUrl}`);
	logger.debug(`${remoteAddress}: isAllowed::req.path value: ${req.path}`);
	logger.debug(`${remoteAddress}: isAllowed::req.query.token value: ${req.query.token}`);
	logger.debug(`${remoteAddress}: isAllowed::req.body.token value: ${req.body.token}`);
	logger.debug(`${remoteAddress}: isAllowed::req.session.accountId value: ${req.session ? req.session.accountId : undefined}`);

	const token = req.query.token || req.body.token;
	const reqOriginalUrl = req.originalUrl;
	const accountId = req.session ? req.session.accountId : undefined;
	const method = request[req.method.toLowerCase()];

	// Extract the resource from the URL
	const resource = /^\/api\/(.+?)(\/|$|\?)/.test(reqOriginalUrl) ? /^\/api\/(.+?)(\/|$|\?)/.exec(reqOriginalUrl)[1] : undefined;
	logger.debug(`${remoteAddress}: isAllowed::resource value: ${resource}`);
	let accessAllowed = false;
	try {
		const callmsg = `accessControlService.isAllowed(token=${token}, accountId=${accountId}, resource=${resource}, request=${method})`;
		logger.debug(`${remoteAddress}: Calling ${callmsg}`);
		accessAllowed = await accessControlService.isAllowed(token, accountId, resource, method);
	} catch (e) {
		if (/Validation failure: "value" must contain at least one of \[token, accountId\]/.test(e.message)) {
			logger.error(`${remoteAddress}: ${e.message}, responding with HTTP 400`);
			res.statusMessage = 'A token or authenticated accountId is required';
			res.status(400).send();
			return logger.debug(`${remoteAddress}: Exiting isAllowed`);
		}
		if (/Schema definition for ".+?" does not exist in the schema model/.test(e.message)) {
			logger.error(`${remoteAddress}: ${e.message}, responding with HTTP 500`);
			res.statusMessage = 'A problem has been detected and reported to the administrator. Please try again later.';
			res.status(500).send();
			return logger.debug(`${remoteAddress}: Exiting isAllowed`);
		}
		logger.error(`${remoteAddress}: ${e.message}, responding with HTTP 400`);
		res.statusMessage = e.message;
		res.status(400).send();
		return logger.debug(`${remoteAddress}: Exiting isAllowed`);
	}
	const subject = token ? 'token based' : 'subject based';
	if (accessAllowed) {
		logger.info(`${remoteAddress}: ${subject} request to ${method} ${resource} allowed`);
		logger.debug(`${remoteAddress}: Exiting isAllowed`);
		return next();
	}
	logger.info(`${remoteAddress}: ${subject} request to ${method} ${resource} denied, responding with HTTP 401`);
	logger.debug(`${remoteAddress}: Exiting isAllowed`);
	return res.status(401).send();
};

module.exports = accessController;
