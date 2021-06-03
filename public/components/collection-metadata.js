/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('collection-metadata', {
	template: `
    <div class="grid-container">
			<div>
				<div id="title">Collection Metadata</div>
				<ul>
					<li @click="getMetadata(md.name)" v-for="md in metadata">{{md.name}}</li>
				</ul>
			</div>
			<div>
				<div id="title">Metadata Details</div>
					<div class="service-account-details-grid">
						<label class="first-row" for="name">Name:</label>
						<input class="first-row" id="name" v-model=md.name :readonly="metadataUpdateMode"/>
						<label for="host">Host Name:</label>
						<input id="host" v-model=md.host></input>
						<label for="port">Port Number:</label>
						<input id="port" v-model=md.port></input>
						<label for="username">User Name:</label>
						<input id="username" v-model=md.username></input>
						<label for="password">Password:</label>
						<input id="password" type="password" v-model=md.password></input>
						<label for="reject-unauthorized">Reject Unauthorized:</label>
						<select id="reject-unauthorized" v-model=md.rejectUnauthorized>
							<option>True</option>
							<option>False</option>
						</select>
						<label for="timeout">HTTP Timeout:</label>
						<input id="timeout" v-model=md.timeout></input>
						<label for="method">HTTP Method:</label>
						<select id="method" v-model=selectedServicmdeAccount.method>
							<option>GET</option>
							<option>POST</option>
						</select>
						<div/>
						<div>
							<button @click="createOrUpdateMetadata">{{ buttonName }}</button>
							<button @click="clearSelectedMetadata">Clear</button>
							<button v-if="buttonName === 'Update'" @click="deleteMetadata(md.name)">Delete</button>
						</div>
					</div>
				</div>
			</div>
    </div>
  `,
	data: function () {
		return {};
	},

	props: [
		'metadata',
		'selectedMetadata',
		'metadataUpdateMode'
	],

	computed: {
		buttonName: function buttonName() {
			if (this.metadataUpdateMode) return 'Update';
			return 'Create';
		}
	},

	methods: {
		clearSelectedMetadata: function clearSelectedMetadata() {
			this.$emit('clear-selected-metadata');
		},
		getMetadata: function getMetadata(name) {
			this.$emit('get-metadata', name);
		},
		createOrUpdateMetadata: function createOrUpdateMetadata() {
			if (this.buttonName === 'Update') return this.$emit('set-metadata', this.selectedMetadata, 'update');
			if (this.buttonName === 'Create') return this.$emit('set-metadata', this.selectedMetadata, 'create');
			return undefined;
		},
		deleteMetadata: function deleteMetadata(name) {
			this.$emit('delete-metadata', name);
		}
	}
});
