const toolboxService = require('./toolboxService');
const logger = require('./loggingService')(__filename);
const accountService = require('./accountService')(__filename);

const accessService = {};

accessService.isAllowed = async (token, subject, resource, request) => {
	const callMsg = `isAllowed(token = "${token}", subject = "${subject}", resource = "${resource}", request = "${request}")`;
	logger.debug(`Entering ${callMsg}`);
	let v; // validated Object holder;
	try {
		// eslint-disable-next-line object-curly-newline
		v = toolboxService.validate({ token, subject, resource, request }, 'accessService_isAllowed');
	} catch (e) {
		logger.debug(`Exiting ${callMsg}`);
		throw e;
	}
	logger.debug(`Performing account lookup based on ${v.token ? 'token' : 'subject'} provided`);
	const access = token ? await accountService.getAccessByToken(v.token) : await accountService.getAccessByAccount(v.subject);
	const identifier = v.token ? `Token ${v.token}` : `Subject ${v.subject}`;
	if (typeof access === 'undefined') {
		logger.info('Account lookup returned no results, request not allowed');
		logger.debug(`Exiting ${callMsg}`);
		return false;
	}
	const resourceAccess = access.find((e) => e[resource]); // returns an array of permissions to resource
	if (typeof resourceAccess === 'undefined') {
		logger.info(`${identifier} has not been granted access to ${v.resource}, request not allowed`);
		logger.debug(`Exiting ${callMsg}`);
		return false;
	}
	if (resourceAccess[v.resource].includes(v.request)) {
		logger.debug(`${identifier} is authorized to ${v.request} ${v.resource}`);
		logger.debug(`Exiting ${callMsg}`);
		return true;
	}
	logger.info(`${identifier} is not authorized to ${v.request} ${v.resource}, request not allowed`);
	logger.debug(`Exiting ${callMsg}`);
	return false;
};

module.exports = accessService;
