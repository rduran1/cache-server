const fs = require('fs');
const schemaService = require('../services/schemaService');

const toolboxService = {};

toolboxService.truncateFile = (strFileName, len, strAppend) => new Promise(async (resolve, reject) => {
	let stats;
	try {
		stats = fs.statSync(strFileName);
	} catch(e) {
		return reject(new Error(`Error getting file size of ${strFileName}: ${e.message}`));
	}
	const trim = stats.size - len;
	if (trim < 1) return resolve();
	fs.truncate(strFileName, trim, (e) => {
		const s = trim === 1 ? '' : 's'
		if (e) return reject(new Error(`Error truncating ${strFileName} by ${len} character${s}: ${e.message}`));
		if (strAppend) {
			fs.appendFile(strFileName, strAppend, (err) => {
				if (err) return reject(new Error(`Error appending "${strAppend}" to ${strFileName}: ${e.message}`));
				return resolve();
			});
		} else {
			return resolve();
		}
	});
});

toolboxService.clone = (object) => {
	if (typeof object === 'undefined') throw new Error('Error cloning object: Object is undefined');
	try {
		const clone = JSON.parse(JSON.stringify(object));
		return clone;
	} catch (e) {
		throw new Error(`Error cloning object: ${e.message}`);
	}
};

toolboxService.validate = (object, schemaName) => {
		schemaService.validate(object, schemaName);
};

toolboxService.cloneAndValidate = (config, schemaName) => {
  const configCopy = toolboxService.clone(config);
	schemaService.validate(configCopy, schemaName);
	return configCopy;
}

module.exports = toolboxService;