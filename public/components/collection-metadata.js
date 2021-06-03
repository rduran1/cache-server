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
						<input class="first-row" id="name" v-model=selectedMetadata.name :readonly="metadataUpdateMode"/>
						<label for="description">Description:</label>
						<input id="description" v-model=selectedMetadata.description></input>
						<label for="port">Minimum valid size in bytes:</label>
						<input id="port" v-model=selectedMetadata.minValidCacheSizeInBytes></input>
						<label for="ttl">TTL:</label>
						<input id="ttl" v-model=selectedMetadata.ttl></input>
						<label for="process-as-stream">Process as stream:</label>
						<select id="process-as-stream" v-model=selectedMetadata.processAsStream>
							<option>True</option>
							<option>False</option>
						</select>
						<label for="auto-start">Auto Start:</label>
						<select id="auto-start" v-model=selectedMetadata.autoStart>
							<option>True</option>
							<option>False</option>
						</select>
						<label for="service-account">Service Account:</label>
						<select id="auto-start" v-model=selectedMetadata.autoStart>
							<option>True</option>
							<option>False</option>
						</select>

						<label for="password">Password:</label>
						<input id="password" type="password" v-model=selectedMetadata.password></input>
						
						<label for="timeout">HTTP Timeout:</label>
						<input id="timeout" v-model=selectedMetadata.timeout></input>
						<label for="method">HTTP Method:</label>
						<select id="method" v-model=selectedMetadata.method>
							<option>GET</option>
							<option>POST</option>
						</select>
						<div/>
						<div>
							<button @click="createOrUpdateMetadata">{{ buttonName }}</button>
							<button @click="clearSelectedMetadata">Clear</button>
							<button v-if="buttonName === 'Update'" @click="deleteMetadata(selectedMetadata.name)">Delete</button>
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
