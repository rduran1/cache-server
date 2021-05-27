/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('incident-form', {
	template: `
    <div>
      <div class="grid-headers">
        <label for="Title">Title:</label>
        <input id="Title" :value="selectedIncident.Title" readonly>
        
        <label for="Description">Description:</label>
        <textarea id="Description" :value="description" readonly></textarea>

        <label for="Update">Journal Updates:</label>
        <textarea id="Update" :value="journalUpdates" readonly></textarea>

        <label for="Solution">Solution:</label>
        <textarea id="Solution" :value="solution" readonly></textarea>
      </div>

      <div class="grid-container">
        <label for="IncidentID">Incident ID:</label>
        <input 
					id="IncidentID"
					v-on:keyup="lookupIncident"
					@click="clear"
					v-model="selectedIncident.IncidentID" :readonly="isReadOnly"
				>

				<label for="Status">Status:</label>
        <input id="Status" :value="selectedIncident.Status" readonly>

				<label for="Assignee">Assignee:</label>
        <input id="Assignee" :value="selectedIncident.Assignee" readonly>

				<label for="AssignmentGroup">Assignment Group:</label>
        <input id="AssignmentGroup" :value="selectedIncident.AssignmentGroup" readonly>

				<label for="OpenedBy">Opened By:</label>
        <input id="OpenedBy" :value="selectedIncident.OpenedBy" readonly>

        <label for="OpenTime" class="nowrap">Open Time:</label>
        <input id="OpenTime" :value="openTime" readonly>

        <label for="UpdatedBy" class="nowrap">Updated By:</label>
        <input id="UpdatedBy" :value="selectedIncident.UpdatedBy" readonly>

        <label for="UpdatedTime">Updated Time:</label>
        <input id="UpdatedTime" :value="updatedTime" readonly>

        <label for="Impact">Impact:</label>
        <input id="Impact" :value="selectedIncident.Impact" readonly>

        <label for="Contact">Contact:</label>
        <input id="Contact" :value="selectedIncident.Contact" readonly>

      </div>
    </div>
  `,
	data: function () {
		return {};
	},
	props: [
		'selectedIncident'
	],
	computed: {
		openTime: function openTime() {
			if (this.selectedIncident.OpenTime) {
				return new Date(this.selectedIncident.OpenTime);
			}
			return '';
		},
		updatedTime: function updatedTime() {
			if (this.selectedIncident.UpdatedTime) {
				return new Date(this.selectedIncident.UpdatedTime);
			}
			return '';
		},
		isReadOnly: function isReadOnly() {
			return this.selectedIncident.Title.length > 0;
		},
		description: function description() {
			return this.arrayToString('Description');
		},
		journalUpdates: function journalUpdates() {
			return this.arrayToString('JournalUpdates');
		},
		solution: function solution() {
			return this.arrayToString('Solution');
		}
	},
	methods: {
		arrayToString: function _arrayToString(propertyName) {
			if (typeof this.selectedIncident !== 'object') return '';
			if (typeof this.selectedIncident[propertyName] !== 'object') return '';
			return this.selectedIncident[propertyName].join('\n');
		},
		clear: function clear() {
			return this.$emit('clear-selected-incident');
		},
		lookupIncident: function lookupIncident(event) {
			if (event.keyCode === 13) {
				if (this.selectedIncident.IncidentID.length < 3) return;
				this.$emit('lookup-incident', this.selectedIncident.IncidentID);
			}
		}
	}
});
