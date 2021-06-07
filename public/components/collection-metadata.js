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
						<label for="min-size">Minimum size in bytes:</label>
						<input id="min-size" type=number v-model=selectedMetadata.minValidCacheSizeInBytes></input>
						<label for="ttl">TTL:</label>
						<input id="ttl" type=number v-model=selectedMetadata.ttl></input>
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

						<label v-show="showBFRelevanceSection" for="relevance-output">Output:</label>
						<select v-show="showBFRelevanceSection" id="relevance-output" v-model="selectedMetadata.body.output">
							<option value="xml">XML</option>
							<option value="json">JSON</option>
						</select>

						<label 
							v-show="showBFRelevanceSection" 
							for="relevance">Relevance: <i @click="transpile" class="bi bi-gear relevance-transpiler-icon" :disabled=transpilerDisabled />
						</label>
						<textarea 
							v-show="showBFRelevanceSection" 
							id="relevance" 
							v-model="selectedMetadata.body.relevance"
							@change="enableTranspiler"
						></textarea>

						<label for="incoming-transform">Incoming Transform:</label>
						<select id="incoming-transform" v-model=selectedMetadata.incomingTransforms>
							<option v-for="transform in transforms.incoming" :value=transform>{{ transform }}</option>
						</select>

						<label for="outgoing-transform">Outgoing Transform:</label>
						<select id="outgoing-transform" v-model=selectedMetadata.outgoingTransforms>
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
		return {
			output: '',
			transpilerDisabled: true
		};
	},

	props: [
		'metadata',
		'selectedMetadata',
		'metadataUpdateMode',
		'serviceAccounts',
		'transforms'
	],

	computed: {
		buttonName: function buttonName() {
			if (this.metadataUpdateMode) return 'Update';
			return 'Create';
		},
		showBFRelevanceSection: function showBFRelevanceSection() {
			return this.selectedMetadata.sourceType === 'bigfix_root_api';
		}
	},

	methods: {
		enableTranspiler: function enableTranspiler() {
			this.transpilerDisabled = false;
		},
		transpile: function transpile() {
			if (this.transpilerDisabled) return;
			this.transpilerDisabled = true;
			let whoseit = '';
			const data = this.selectedMetadata.body.relevance.toLowerCase().split('\n');
			if (data[0].includes('/* transpiled relevance content */')) return;
			if (data[0].includes('whoseit=')) {
				const filter = data[0].split('whoseit=')[1];
				whoseit = `whose (${filter})`;
				data.shift();
			}
			for (let i = 0; i < data.length; i++) {
				if (data[i].split(',').length !== 4) {
					toast.error('Cannot transpile, each row must have exactly 4 elements separated by a comma');
					return;
				}
			}
			let query = `/* transpiled relevance content */
				name of item 0 of it | "Missing Computer Name",
			`;
			query += data.map((item, i) => `
				(
					if (size of item ${i + 1} of it = 1) then
						(
							(if it = "" then "No Data" else it)
							of concatenation ";" of values of results (item 0 of it, elements of item ${i + 1} of it)
						)
					else
					(
						if (size of item ${i + 1} of it > 1) then
						(
							(
								"Duplicates: " & concatenation "|" of ((name of it) & "=" & (id of it as string))
								of elements of item ${i + 1} of it
							) as string
						)
						else ("No Data")
					)
				)
			`);
			query += `
				)
				of
					(
						elements of item 0 of it,
			`;
			query += data.map((item, i) => ` item ${i + 1} of it `);
			query += ` ) of (set of bes computers ${whoseit},`;
			query += data.map((item) => {
				const field = item.split(',', 4);
				return ` set of bes properties whose ((id of it = (${field[0]}, ${field[1]}, ${field[2]}))) /* ${field[3]} */ `;
			});
			this.selectedMetadata.body.relevance = `(${query})`;
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
			delete clone.lastErrorMessage;
			delete clone.lastErrorTimestamp;
			if (this.buttonName === 'Update') return this.$emit('set-metadata', clone, 'update');
			if (this.buttonName === 'Create') return this.$emit('set-metadata', clone, 'create');
			return undefined;
		},
		deleteMetadata: function deleteMetadata(name) {
			this.$emit('delete-metadata', name);
		}
	}
});
