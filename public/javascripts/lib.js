/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const toast = (function toast() {
	function genToast(msg, timeout, toastrFn) {
		const originaltimeoutValue = toastr.options.timeOut;
		const date = Date().toString().replace(/\(.+?\)/, '<br><br>');
		toastr.options.timeOut = timeout;
		toastrFn(`${date}${msg}`);
		toastr.options.timeOut = originaltimeoutValue;
	}
	return {
		error: (msg, timeout = 30000) => genToast(msg, timeout, toastr.error),
		warn: (msg, timeout = 0) => genToast(msg, timeout, toastr.error),
		info: (msg, timeout = 0) => genToast(msg, timeout, toastr.error),
		success: (msg, timeout = 0) => genToast(msg, timeout, toastr.error)
	};
}());

function toggleSidebar(e) {
	e.preventDefault();
	const el = document.getElementById('sidebar-toggle');
	if (el.classList.contains('rotate45')) {
		el.classList.remove('rotate45');
		document.getElementById('sidebar').style.width = '200px';
		document.getElementById('workspace').style.marginLeft = '168px';
	} else {
		el.classList.add('rotate45');
		document.getElementById('sidebar').style.width = '32px';
		document.getElementById('workspace').style.marginLeft = '0px';
	}
}

function showSelectedApplication(e) {
	let innerText;
	if (typeof e !== 'object' || !Array.isArray(e.path) || typeof e.path[1] === 'undefined') {
		innerText = 'UNKNOWN';
	} else {
		innerText = e.path[1].innerText || 'UNKNOWN';
	}
	const appName = innerText.replace(/\s+/, '_');
	document.getElementById('active-app-header').innerText = innerText;
	Object.keys(app.$data).filter((el) => /^Show_/.test(el)).forEach((el) => {
		app.$data[el] = false;
	}); // Hide all apps first
	app.$data[`Show_${appName}`] = true; // Only show selected app
}

function logout() {
	window.location = '/app/login';
}

async function apiFetch(config) {
	const cfg = typeof config === 'object' && !Array.isArray(config) ? config : {};
	const { apipath = '/', method = 'GET', type = 'text', headers, body } = cfg;
	let parsedBody = '';
	if (typeof body === 'object') parsedBody = JSON.stringify(body);
	const fetchConfig = { apipath, method, headers, credentials: 'same-origin' };
	if (body) fetchConfig.body = parsedBody;
	const response = await fetch(apipath, fetchConfig);
	if (response.statusText.includes('token or authenticated accountId is required')) {
		window.location = '/app/login';
		return undefined;
	}
	if (!/20\d/.test(response.status)) throw new Error(response.statusText);
	let data = '';
	try {
		data = await response[type]();
		return data;
	} catch (e) {
		throw new Error(`Error parsing response as ${type}: ${e.message}`);
	}
}
