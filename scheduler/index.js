const incidentService = require('../services/hpsmIncidentService');
const logger = require('../services/loggingService')('scheduler.js');

setInterval(async () => {
	try {
		await incidentService.syncModels();
	} catch (e) {
		logger.error(`Failed to sync models: ${e.message}`);
	}
}, 600000);
