const accountService = require('./accountService')(__filename);
const logger = require('./loggingService')(__filename);

const accessService = {};

accessService.isAllowed = async (token, subject, resource, request) => {
	logger.debug(`Entering accessService.isAllowed(token=${token},subject=${subject},resource=${resource},request=${request}) service method`);
	if (typeof token !== 'string' && typeof subject !== 'string') {
		logger.error('Called isAllowed service method without required token or subject parameter, request not allowed');
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (typeof resource !== 'string' || typeof request !== 'string') {
		logger.error('Called accessService.isAllowed service method without required resource and request parameters, request not allowed');
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (typeof token === 'string' && typeof subject === 'string') {
		logger.error('Called accessService.isAllowed service method with token and subject parameters but only one is required, request not allowed');
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}

	logger.debug(`Performing account lookup based on ${token ? 'token' : 'subject'} provided`);

	const access = token ? await accountService.getAccessByToken(token) : await accountService.getAccessByAccount(subject);
	const identifier = token ? `Token ${token}` : `Subject ${subject}`;

	if (typeof access === 'undefined') {
		logger.error('Account lookup returned no results, request not allowed');
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	const resourceAccess = access.find((e) => e[resource]); // returns an array of permissions to resource
	if (typeof resourceAccess === 'undefined') {
		logger.debug(`${identifier} has not been granted access to ${resource}, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (resourceAccess[resource].includes(request)) {
		logger.debug(`${identifier} is authorized to ${request} ${resource}`);
		logger.debug('Exiting accessService.isAllowed service method');
		return true;
	}
	logger.debug(`${identifier} is not authorized to ${request} ${resource}, request not allowed`);
	logger.debug('Exiting accessService.isAllowed service method');
	return false;
};

module.exports = accessService;
