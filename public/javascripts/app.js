/* eslint-disable object-shorthand */
/* eslint-disable no-undef */
// eslint-disable-next-line no-unused-vars
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
