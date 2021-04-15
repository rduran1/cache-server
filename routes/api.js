const express = require('express');
const l = require('../services/loggingService')();
const logger = require('../services/loggingService')(__filename);
const accessController = require('../controllers/accessController');

const router = express.Router();

async function getLogFileNames(req, res) {
	try {
		const logFileNames = await l.getLogFileNames();
		res.send(JSON.stringify(logFileNames));
	} catch (e) {
		logger.error(e.stack);
		res.statusMessage = `Failed to get log file names: ${e.message}`;
		res.status(500).send();
	}
}

async function getFileContent(req, res) {
	const logfileName = req.params.logname;
	try {
		const logfileContent = await l.getFileContent(logfileName);
		res.send(logfileContent);
	} catch (e) {
		logger.error(e.stack);
		let sm = '';
		if (e.message.includes('no such file or directory')) sm = `Cannot find ${logfileName} on server`;
		if (e.code === 'EACCES') sm = `Server does not have permission to read ${logfileName}`;
		res.statusMessage = sm;
		res.status(500).end();
	}
}

router.get('/application-logs', accessController.isAllowed, getLogFileNames);
router.get('/application-logs/:logname', accessController.isAllowed, getFileContent);

module.exports = router;
