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
						<label for="port">Minimum size in bytes:</label>
						<input id="port" v-model=selectedMetadata.minValidCacheSizeInBytes></input>
						<label for="ttl">TTL:</label>
						<input id="ttl" v-model=selectedMetadata.ttl></input>
						<label for="process-as-stream">Process as stream:</label>
						<select id="process-as-stream" v-model=selectedMetadata.processAsStream>
							<option value=true>True</option>
							<option value=false>False</option>
						</select>
						<label for="auto-start">Auto Start:</label>
						<select id="auto-start" v-model=selectedMetadata.autoStart>
							<option value=true>True</option>
							<option value=false>False</option>
						</select>
						<label for="source-type">Source Type:</label>
						<select id="source-type" v-model=selectedMetadata.sourceType>
							<option value="bigfix_root_api">BigFix Root REST API</option>
							<option value="bigfix_compliance_inventory_api">BigFix Inventory/Compliance REST API</option>
							<option value="basic auth">Basic HTTP Authentication</option>
							<option value="listener">Incomming Listener</option>
						</select>

						<label for="service-account">Service Account:</label>
						<select id="auto-start" v-model=selectedMetadata.serviceAccountName>
							<option v-for="serviceAccount in serviceAccounts">{{ serviceAccount.name }}</option>
						</select>

						<label for="path">Path:</label>
						<input id="path" v-model=selectedMetadata.path></input>

						<label v-show="showBFRelevanceSection" for="incoming-transform">Output:</label>
						<select v-show="showBFRelevanceSection" id="incoming-transform" :selected="this.output" @change="updateOutput">
							<option value="xml">XML</option>
							<option value="json">JSON</option>
						</select>

						<label v-show="showBFRelevanceSection" for="incoming-transform">Relevance:</label>
						<textarea v-show="showBFRelevanceSection" id="incoming-transform" :selected="this.rel"></textarea>

						<label for="incoming-transform">Incoming Transform:</label>
						<select id="incoming-transform" v-model=selectedMetadata.incomingTransforms>
							<option v-for="transform in transforms.incoming" :value=transform>{{ transform }}</option>
						</select>

						<label for="outgoing-transform">Outgoing Transform:</label>
						<select id="outgoing-transform" v-model=selectedMetadata.outgoingTransform>
							<option v-for="transform in transforms.outgoing" :value=transform>{{ transform }}</option>
						</select>
						
						<label for="string-prefix">String Prefix:</label>
						<input id="string-prefix" v-model=selectedMetadata.stringPrefix></input>
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
		'metadataUpdateMode',
		'serviceAccounts',
		'transforms',
		'rel',
		'output'
	],

	computed: {
		buttonName: function buttonName() {
			if (this.metadataUpdateMode) return 'Update';
			return 'Create';
		},
		showBFRelevanceSection: function showBFRelevanceSection() {
			return this.selectedMetadata.sourceType === 'bigfix_root_api';
		}
		// outputType: {
		// 	get() {
		// 		if (typeof this.selectedMetadata.body === 'object') {
		// 			if (typeof this.selectedMetadata.body.output === 'string') return this.selectedMetadata.body.output;
		// 		}
		// 		return undefined;
		// 	},
		// 	set(val) {
		// 		this.$emit('set-output', val);
		// 	}
		// },
		// relevance: {
		// 	get() {
		// 		if (typeof this.selectedMetadata.body === 'object') {
		// 			if (typeof this.selectedMetadata.body.relevance === 'string') return this.selectedMetadata.body.relevance;
		// 		}
		// 		return undefined;
		// 	},
		// 	set(val) {
		// 		this.$emit('set-rel', val);
		// 	}
		// }
	},

	methods: {
		updateOutput: function updateOutput(val) {
			this.$emit('set-output', val);
		},
		clearSelectedMetadata: function clearSelectedMetadata() {
			this.$emit('clear-selected-metadata');
		},
		getMetadata: function getMetadata(name) {
			this.$emit('get-metadata', name);
		},
		createOrUpdateMetadata: function createOrUpdateMetadata() {
			const clone = JSON.parse(JSON.stringify(this.selectedMetadata));
			delete clone.status;
			delete clone.streamingCount;
			if (this.output) {
				clone.body = {};
				clone.body.output = this.output;
			}
			if (this.rel) clone.body.relevance = this.rel;
			if (this.buttonName === 'Update') return this.$emit('set-metadata', clone, 'update');
			if (this.buttonName === 'Create') return this.$emit('set-metadata', clone, 'create');
			return undefined;
		},
		deleteMetadata: function deleteMetadata(name) {
			this.$emit('delete-metadata', name);
		}
	}
});
