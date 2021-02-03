const verboseLogging = true;

const path		= require('path');
const config	= require(path.join(__dirname, '..', '..', 'data_store', 'appSettings'));
const logFile	= path.join(config.logDirectory, 'accessService.log'); 
const logger	= require('logger')({ outfile: logFile, verbose: verboseLogging});

const accounts = require('../models/accountsModel');

const accessService = {};

accessService.isAllowed = async(token, subject, resource, request) => {
	logger.debug(`Entering accessService.isAllowed(token=${token},subject=${subject},resource=${resource},request=${request}) service method`);
	if (typeof token !== 'string' && typeof subject !== 'string') {
		logger.error('Called isAllowed service method without required token or subject parameter, request not allowed');
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (typeof resource !== 'string' || typeof request !== 'string') {
		logger.error(`Called accessService.isAllowed service method without required resource and request parameters, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (typeof token === 'string' && typeof subject === 'string') {
		logger.error(`Called accessService.isAllowed service method with token and subject parameters but only one is required, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}

	logger.debug(`Performing account lookup in accountStore based on ${token ? 'token' : 'subject'} provided`);

	const access = token ? await accounts.getByToken(token): await accounts.getByAccount(subject);
	if (typeof access === 'undefined') {
		logger.error(`Account lookup returned no results, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;	
	}
	if (!access.auth) {
		logger.error(`${access.identifier} is missing auth property, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	const resourceAccess = access.auth.find(e => e[resource]);
	if (!resourceAccess) {
		logger.debug(`${access.identifier} has not been granted access to ${resource}, request not allowed`);
		logger.debug('Exiting accessService.isAllowed service method');
		return false;
	}
	if (resourceAccess[resource].includes(request)) {
		logger.debug(`${access.identifier} is authorized to ${request} ${resource}`);
		logger.debug('Exiting accessService.isAllowed service method');
		return true;
	}
	logger.debug(`${access.identifier} is not authorized to ${request} ${resource}, request not allowed`);
	logger.debug('Exiting accessService.isAllowed service method');
	return false;
}


module.exports = accessService;
