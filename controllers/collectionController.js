const util = require('util');
const stream = require('stream');
const transformService = require('../services/transformService');
const collectionService = require('../services/collectionService');
const toolboxService = require('../services/toolboxService');
const logger = require('../services/loggingService')(__filename);

const pipeline = util.promisify(stream.pipeline);

const collectionController = {};

collectionController.getTransforms = (req, res) => {
	res.send(transformService.list());
};

collectionController.getAllTokens = async (req, res) => {
	try {
		const tokens = await collectionService.getAllTokens();
		res.send(tokens);
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).send();
	}
};

collectionController.getToken = async (req, res) => {
	const { name } = req.params;
	try {
		const token = await collectionService.getTokenByName(name);
		res.send(token);
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).send();
	}
};

collectionController.createToken = async (req, res) => {
	const config = req.body;
	try {
		await collectionService.createToken(config);
		res.send();
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).send();
	}
};

collectionController.updateToken = async (req, res) => {
	const { name } = req.params;
	const config = req.body;
	config.tokenName = name;
	try {
		await collectionService.updateToken(config);
		res.send();
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).send();
	}
};

collectionController.deleteToken = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.deleteToken(name);
		res.send();
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).send();
	}
};

collectionController.getAllMetaData = async (req, res) => {
	const md = await collectionService.getAllMetaData();
	res.status(200).send(md);
	return logger.info('responded with HTTP 200');
};

collectionController.getMetaDataByName = async (req, res) => {
	const { name } = req.params;
	try {
		const md = await collectionService.getMetaData(name);
		res.status(200).send(md);
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(404).end();
		return logger.info(`responded with HTTP 404: ${res.statusMessage}`);
	}
};

collectionController.getAllServiceAccounts = async (req, res) => {
	const sa = await collectionService.getAllServiceAccounts();
	res.status(200).send(sa);
	return logger.info('responded with HTTP 200');
};

collectionController.getServiceAccountByName = async (req, res) => {
	const { name } = req.params;
	try {
		const sa = await collectionService.getServiceAccount(name);
		res.status(200).send(sa);
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(404).end();
		return logger.info(`responded with HTTP 404: ${res.statusMessage}`);
	}
};

collectionController.getDataSetByName = async (req, res) => {
	const { name } = req.params;
	if (typeof req.query !== 'object' || typeof req.query.token !== 'string') {
		const emsg = 'Token is required';
		logger.warn(emsg);
		res.statusMessage = emsg;
		res.status(403).end();
		return logger.info(`responded with HTTP 403: ${res.statusMessage}`);
	}
	const isAllowed = await collectionService.isTokenAuthorizedToAccessCollection(req.query.token, name, req.method);
	if (!isAllowed) {
		const emsg = `Token provided does not have permission to access "${name}"`;
		logger.warn(emsg);
		res.statusMessage = emsg;
		res.status(403).end();
		return logger.info(`responded with HTTP 403: ${res.statusMessage}`);
	}
	try {
		const { dataStream, transforms } = await collectionService.getDataStream(name);
		collectionService.increaseStreamCount(name);
		logger.info(`Streaming ${name}`);
		if (transforms) await pipeline(dataStream, ...transforms, res);
		if (!transforms) await pipeline(dataStream, res);
		collectionService.decreaseStreamCount(name);
		logger.info(`Streaming of ${name} successful`);
		return logger.info('responded with HTTP 200');
	} catch (e) {
		collectionService.decreaseStreamCount(name);
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`Streaming of ${name} failed: ${res.statusMessage}`);
	}
};

collectionController.createMetaData = async (req, res) => {
	const { name } = req.params;
	const { body } = req;
	try {
		const clone = toolboxService.clone(body);
		clone.name = name;
		await collectionService.createMetaData(clone);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.createServiceAccount = async (req, res) => {
	const { name } = req.params;
	const { body } = req;
	try {
		const clone = toolboxService.clone(body);
		clone.name = name;
		await collectionService.createServiceAccount(clone);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.updateMetaData = async (req, res) => {
	const { name } = req.params;
	const { body } = req;
	try {
		const clone = toolboxService.clone(body);
		clone.name = name;
		await collectionService.updateMetaData(clone);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.updateServiceAccount = async (req, res) => {
	const { name } = req.params;
	const { body } = req;
	try {
		const clone = toolboxService.clone(body);
		clone.name = name;
		await collectionService.updateServiceAccount(clone);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.deleteMetaData = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.deleteMetaData(name);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.deleteServiceAccount = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.deleteServiceAccount(name);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.saveCollectionData = async (req, res) => {
	const { name } = req.params;
	logger.debug(`Checking token has permission to update ${name}`);
	const isAllowed = await collectionService.isTokenAuthorizedToAccessCollection(req.query.token, name, req.method);
	if (!isAllowed) {
		const emsg = `Token provided does not have permission to access "${name}"`;
		logger.warn(emsg);
		res.statusMessage = emsg;
		res.status(403).end();
		return logger.info(`responded with HTTP 403: ${res.statusMessage}`);
	}
	logger.debug(`Token is authorized to access ${name}`);
	try {
		logger.debug(`Saving ${name} to storage`);
		await collectionService.saveCollectionData(name, req);
		logger.debug(`${name} successfully saved to storage`);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		logger.error(e.stack);
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.startCollection = async (req, res) => {
	const { name } = req.params;
	try {
		res.status(200).send();
		await collectionService.startInterval(name);
		return logger.info('responded with HTTP 200');
	} catch (e) {
		return logger.info(`Failed to start "${name} collection: ${e.stack}`);
	}
};

collectionController.stopCollection = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.stopInterval(name);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

module.exports = collectionController;
