/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
const zlib = require('zlib');
const ReplaceStreamService = require('./replaceStreamService');

const transformService = {};

transformService.get = (keyName, prefixString) => {
	let result;
	switch (keyName) {
	case 'bigfix_inventory_api_incoming': {
		const rs1 = new ReplaceStreamService(/\{"total":\d+,"rows":/, '', prefixString);
		const rs2 = new ReplaceStreamService('"catalog_dimension":{', '');
		const rs3 = new ReplaceStreamService('}},{', '},{');
		const rs4 = new ReplaceStreamService('}}]}', '}]');
		result = [rs1, rs2, rs3, rs4];
		break;
	}
	case 'bigfix_restapi_incoming': {
		const rs1 = new ReplaceStreamService('{"result":\\[\\[', '', prefixString);
		const rs2 = new ReplaceStreamService(/\\u002f/, '/');
		const rs3 = new ReplaceStreamService('"N/A"', '"No Data"');
		const rs4 = new ReplaceStreamService('\n', '\\n');
		const rs5 = new ReplaceStreamService(/]],"plural":\w+,"type":"\( .*?evaltime_ms":\d+\}/, ']]');
		const rs6 = new ReplaceStreamService(/\\ufffd/, '');
		const rs7 = new ReplaceStreamService(/\\u0000/, '');
		result = [rs1, rs2, rs3, rs4, rs5, rs6, rs7];
		break;
	}
	case 'array_of_array_to_csv_outgoing': {
		const rs1 = new ReplaceStreamService('\\[\\[', '');
		const rs2 = new ReplaceStreamService(']]', '');
		const rs3 = new ReplaceStreamService('],\\[', '\n');
		result = [rs1, rs2, rs3];
		break;
	}
	case 'compress': {
		const gzip = zlib.createGzip();
		result = [gzip];
		break;
	}
	case 'flatten_compliance_json_to_array_of_arrays': {
		result = (data) => {
			// extract headers
			const processed = [];
			for (const prop in data[0]) {
				if (prop === 'rollup') {
					for (const innerProp in data[0].rollup) {
						processed.push(innerProp);
					}
				} else {
					processed.push(prop);
				}
			}
			// eslint-disable-next-line array-callback-return
			const dataArray = data.map((elem) => {
				const arr = [];
				for (const prop in elem) {
					if (prop in elem) {
						for (const innerProp in elem.rollup) {
							arr.push(elem.rollup[innerProp]);
						}
					} else {
						arr.push(elem[prop]);
					}
				}
			});
			for (let i = 0; i < dataArray.length; i++) {
				processed.push(dataArray[i]);
			}
		};
		break;
	}
	default:
	}
	return result;
};

transformService.list = () => {
	const transforms = {
		incoming: {
			stream: [
				'bigfix_inventory_api_incoming',
				'bigfix_restapi_incoming',
				'compress'
			],
			nonstream: [
				'flatten_compliance_json_to_array_of_arrays'
			]
		},
		outgoing: {
			stream: [
				'array_of_array_to_csv_outgoing',
				'compress'
			],
			nonstream: [

			]
		}
	};
	return transforms;
};
module.exports = transformService;
