/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('incident-form', {
	template: `
    <div>
      <div class="grid-headers">
        <label for="Title">Title:</label>
        <input id="Title" v-model="selectedIncident.Title">
        
        <label for="Description">Description:</label>
        <textarea id="Description" v-model="selectedIncident.Description"></textarea>

        <label v-if="selectedIncident.IncidentID" for="Update">Update:</label>
        <textarea v-if="selectedIncident.IncidentID" id="Update" v-model="selectedIncident.Update"></textarea>

        <label v-if="selectedIncident.IncidentID" for="Solution">Solution:</label>
        <textarea v-if="selectedIncident.IncidentID" id="Solution" v-model="selectedIncident.Solution"></textarea>
      </div>

      <div class="grid-container">
        <label v-if="selectedIncident.IncidentID" for="IncidentID" class="nowrap">Incident ID:</label>
        <input v-if="selectedIncident.IncidentID" id="IncidentID" :value="selectedIncident.IncidentID" readonly>

        <label v-if="selectedIncident.IncidentID" for="OpenTime" class="nowrap">Open Time:</label>
        <input v-if="selectedIncident.IncidentID" id="OpenTime" :value="new Date(selectedIncident.OpenTime)" readonly>

        <label v-if="selectedIncident.IncidentID" for="OpenedBy">Opened By:</label>
        <input v-if="selectedIncident.IncidentID" id="OpenedBy" :value="selectedIncident.OpenedBy" readonly>

        <label v-if="selectedIncident.IncidentID" for="UpdatedBy" class="nowrap">Updated By:</label>
        <input v-if="selectedIncident.IncidentID" id="UpdatedBy" :value="selectedIncident.UpdatedBy" readonly>

        <label v-if="selectedIncident.IncidentID" for="UpdatedTime">Updated Time:</label>
        <input v-if="selectedIncident.IncidentID" id="UpdatedTime" :value="new Date(selectedIncident.UpdatedTime)" readonly>

        <label for="Service">Service:</label>
        <input id="Service" v-model="selectedIncident.Service">

        <label for="Contact">Contact:</label>
        <input id="Contact" v-model="selectedIncident.Contact">

        <label for="Status">Status:</label>
        <input id="Status" v-model="selectedIncident.Status">
        
        <label for="AssignmentGroup">Assignment Group:</label>
        <input id="AssignmentGroup" v-model="selectedIncident.AssignmentGroup">

        <label for="Impact">Impact:</label>
        <input id="Impact" v-model="selectedIncident.Impact">

      </div>
      <button @click="submit" :disabled="buttonDisabled">{{ buttonLabel }}</button>
      <button @click="clear">Clear Fields</button>
    </div>
  `,
	data: function () {
		return {};
	},

	props: [
		'selectedIncident'
	],

	computed: {
		buttonLabel: function buttonLabel() {
			return this.selectedIncident.IncidentID ? 'Update' : 'Create';
		},
		buttonDisabled: function buttonDisabled() {
			if (this.selectedIncident.Title.length < 1) return true;
			if (this.selectedIncident.Description.length < 1) return true;
			if (this.selectedIncident.Service.length < 1) return true;
			if (this.selectedIncident.Contact.length < 1) return true;
			if (this.selectedIncident.Status.length < 1) return true;
			if (this.selectedIncident.AssignmentGroup.length < 1) return true;
			return false;
		}
	},

	methods: {
		submit: function submit() {
			if (this.buttonLabel === 'Update') return this.update();
			return this.create();
		},
		update: function update() {
			return this.$emit('update-incident', this.selectedIncident);
		},
		create: function create() {
			return this.$emit('create-incident', this.selectedIncident);
		},
		clear: function clear() {
			return this.$emit('clear-incident-fields');
		}
	}
});
