/* eslint-disable no-unused-vars */
const zlib = require('zlib');
const ReplaceStreamService = require('./replaceStreamService');

const transformService = {};

transformService.get = (keyName, prefixString) => {
	let result;
	switch (keyName) {
	case 'uppercase_google': {
		const rs1 = new ReplaceStreamService(/Google/, 'GGOOOOGGLLEE');
		result = [rs1];
		break;
	}
	case 'bigfix_inventory_api_incoming': {
		const rs1 = new ReplaceStreamService(/\{"total":\d+,"rows":/, '');
		const rs2 = new ReplaceStreamService('"catalog_dimension":{', '');
		const rs3 = new ReplaceStreamService('}},{', '},{');
		const rs4 = new ReplaceStreamService('}}]}', '}]');
		result = [rs1, rs2, rs3, rs4];
		break;
	}
	case 'bigfix_restapi_incoming': {
		const rs1 = new ReplaceStreamService('"N\\u002fA"', '"No Data"');
		const rs2 = new ReplaceStreamService('\\u002f', '/');
		result = [rs1, rs2];
		break;
	}
	case 'bigfix_restapi_outgoing': {
		const rs1 = new ReplaceStreamService('"N\\u002fA"', '"No Data"');
		const rs2 = new ReplaceStreamService('\\u002f', '/');
		const rs3 = new ReplaceStreamService('\n', '\\n');
		const rs4 = new ReplaceStreamService(/]],"plural":\w+,"type":"\( .*?evaltime_ms":\d+\}/, ']]');
		const rs5 = new ReplaceStreamService(/\\ufffd/, '');
		const rs6 = new ReplaceStreamService(/\\u0000/, '');
		result = [rs1, rs2, rs3, rs4];
		break;
	}
	case 'array_of_array_to_csv_outgoing': {
		const rs1 = new ReplaceStreamService('[["N\\u002fA"]]', '');
		const rs2 = new ReplaceStreamService(']]', '');
		const rs3 = new ReplaceStreamService('],[', '\n');
		result = [rs1, rs2, rs3];
		break;
	}
	case 'zipit': {
		const gzip = zlib.createGzip();
		result = [gzip];
		break;
	}
	default:
	}
	return result;
};

transformService.list = () => {
	const transforms = [
		'bigfix_inventory_api_incoming',
		'bigfix_restapi_incoming',
		'bigfix_restapi_outgoing',
		'array_of_array_to_csv_outgoing',
		'zipit'
	];
	return transforms;
};
module.exports = transformService;
