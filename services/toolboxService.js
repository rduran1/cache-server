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
		if (e) return reject(new Error(`Error truncating ${strFileName} by ${len} characters: ${e.message}`));
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
	try {
		const clone = JSON.parse(JSON.stringify(object));
		return clone;
	} catch (e) {
		throw new Error(`toolboxService.clone: ${e.message}`);
	}
};

toolboxService.cloneAndValidate = (config, schemaName) => {
  const configCopy = toolboxService.clone(config);
  try {
		schemaService.validate(configCopy, schemaName);
		return configCopy;
  } catch (e) {
    throw new Error(`schemaService.validate: ${e.message}`);
  }
  return configCopy;
}

module.exports = toolboxService;