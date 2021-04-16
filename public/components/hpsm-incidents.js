/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

const BASE_URL = '/api/hpsm-incidents';

Vue.component('hpsm-incidents', {
	template: `
	<div>
		<incidents-list id="incidents-list"
			:incidents="incidents" 
			@set-selected-incident="setSelectedIncident"
		></incidents-list>
		<incident-form
			:selected-incident="currentIncident"
			@create-incident="createIncident"
			@update-incident="updateIncident"
			@clear-incident-fields="clearIncidentFormFields"
		></incident-form>
	</div>
	`,
	data: function data() {
		return {
			incidents: [],
			currentIncident: {
				Title: '',
				Description: '',
				IncidentID: '',
				Solution: '',
				Update: [],
				OpenTime: '',
				OpenedBy: '',
				UpdatedBy: '',
				UpdatedTime: '',
				Service: '',
				Contact: '',
				Status: '',
				AssignmentGroup: '',
				Impact: ''
			}
		};
	},
	created: async function created() {
		try {
			this.incidents = await apiFetch({ apipath: BASE_URL, type: 'json' });
		} catch (e) {
			toast.error(`Failed to get list of incidents: ${e.message}`);
		}
	},
	methods: {
		setSelectedIncident: async function setSelectedIncident(id) {
			try {
				this.currentIncident = await apiFetch({ apipath: `${BASE_URL}/${id}`, type: 'json' });
			} catch (e) {
				toast.error(e.message);
			}
		},
		refreshList: async function refreshList() {
			try {
				this.incidents = await apiFetch({ apipath: BASE_URL, type: 'json' });
			} catch (e) {
				toast.error(`Failed to refresh list of incidents: ${e.message}`);
			}
		},
		createIncident: async function createIncident(obj) {
			const headers = { 'Content-type': 'application/json' };
			try {
				await apiFetch({ apipath: BASE_URL, method: 'post', headers, body: obj });
			} catch (e) {
				toast.error(e.message);
			}
			this.clearIncidentFormFields();
			await this.refreshList();
		},
		updateIncident: async function updateIncident(obj) {
			const headers = { 'Content-type': 'application/json' };
			try {
				await apiFetch({ apipath: `${BASE_URL}/${obj.IncidentID}`, method: 'put', headers, body: obj });
			} catch (e) {
				toast.error(e.message);
			}
			this.clearIncidentFormFields();
			await this.refreshList();
		},
		clearIncidentFormFields: function clearIncidentFormFields() {
			const fields = Object.keys(this.currentIncident);
			fields.forEach((propertyName) => {
				if (typeof this.currentIncident[propertyName] === 'string') this.currentIncident[propertyName] = '';
				if (Array.isArray(this.currentIncident[propertyName])) this.currentIncident[propertyName] = [];
			});
		}
	}
});
