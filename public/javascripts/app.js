/* eslint-disable object-shorthand */
/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
const socket = io();

const app = new Vue({
	el: '#app',
	data: {
		Show_Data_Collections: false,
		Show_Application_Logs: false,
		Show_HPSM_Incidents: false
	},
	created() {
		document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar, true);
		document.querySelectorAll('.sidebar-item').forEach((item) => item.addEventListener('click', showSelectedApplication, false));
		document.getElementById('logout-item').addEventListener('click', logout, false);
		// Set toastr defaults
		toastr.options.preventDuplicates = true;
		toastr.options.timeOut = 0;
	}
});

socket.on('error', (msg) => {
	toast.error(msg);
});

setInterval(async () => {
	try {
		await apiFetch({ apipath: '/api/session-check' });
	} catch (e) {
		toast.error(e.message);
	}
}, 1800000);
