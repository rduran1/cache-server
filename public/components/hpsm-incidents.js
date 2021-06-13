/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('hpsm-incidents', {
	template: `
	<div>
		<incident-form id="incident-form"
			:selected-incident="selectedIncident"
			@clear-selected-incident="clearSelectedIncident"
			@lookup-incident="lookupIncident"
		></incident-form>
		<div class="h-divider-med"/>
		<incidents-list id="incidents-list"
			:incidents="incidents" 
			:sm-server="SM_SERVER"
			@set-selected-incident="setSelectedIncident"
			v-show=showIncidentsList
		></incidents-list>
		<div v-if=!showIncidentsList>No Incidents To Display</div>
	</div>
	`,
	data: function data() {
		return {
			BASE_URL: '/api/hpsm-incidents',
			SM_SERVER: 'https://www.onportal.com',
			incidents: [],
			selectedIncident: {
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
				Assignee: '',
				Impact: ''
			}
		};
	},
	created: async function created() {
		try {
			this.incidents = await apiFetch({ apipath: this.BASE_URL, type: 'json' });
		} catch (e) {
			toast.error(`Failed to get list of incidents: ${e.message}`);
		}
	},
	computed: {
		showIncidentsList: function showIncidentsList() {
			return this.incidents.length > 0;
		}
	},
	methods: {
		setSelectedIncident: async function setSelectedIncident(id) {
			try {
				document.body.style.cursor = 'progress';
				this.selectedIncident = await apiFetch({ apipath: `${this.BASE_URL}/query/${id}`, type: 'json' });
			} catch (e) {
				toast.error(e.message);
			}
			await this.refreshList();
			document.body.style.cursor = 'default';
		},
		refreshList: async function refreshList() {
			try {
				this.incidents = await apiFetch({ apipath: this.BASE_URL, type: 'json' });
			} catch (e) {
				toast.error(`Failed to refresh list of incidents: ${e.message}`);
			}
		},
		lookupIncident: async function lookupIncident(id) {
			await this.setSelectedIncident(id);
			await this.refreshList();
		},
		clearSelectedIncident: function clearSelectedIncident() {
			const fields = Object.keys(this.selectedIncident);
			fields.forEach((propertyName) => {
				if (typeof this.selectedIncident[propertyName] === 'string') this.selectedIncident[propertyName] = '';
				if (Array.isArray(this.selectedIncident[propertyName])) this.selectedIncident[propertyName] = [];
			});
		}
	}
});
