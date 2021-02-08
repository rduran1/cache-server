const incidentService = require('../services/hpsmIncidentService');
const logger = require('../services/loggingService')(__filename);

setInterval(async () => {
	try {
		await incidentService.syncModels();
	} catch (e) {
		logger.error(`Failed to sync models: ${e.message}`);
	}
});
