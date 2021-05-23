const util = require('util');
const stream = require('stream');
const collectionService = require('../services/collectionService');
const toolboxService = require('../services/toolboxService');
const logger = require('../services/loggingService')(__filename);

const pipeline = util.promisify(stream.pipeline);

const collectionController = {};

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

collectionController.saveDataStream = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.saveDataStream(name, req);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
	}
};

collectionController.startCollection = async (req, res) => {
	const { name } = req.params;
	try {
		await collectionService.startInterval(name);
		res.status(200).send();
		return logger.info('responded with HTTP 200');
	} catch (e) {
		res.statusMessage = e.message;
		res.status(400).end();
		return logger.info(`responded with HTTP 400: ${res.statusMessage}`);
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
