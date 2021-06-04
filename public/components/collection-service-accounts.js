/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('collection-service-accounts', {
	template: `
    <div class="grid-container">
			<div>
				<div id="title">Service Accounts</div>
				<ul>
					<li @click="getServiceDetails(serviceAccount.name)" v-for="serviceAccount in serviceAccounts">{{serviceAccount.name}}</li>
				</ul>
			</div>
			<div>
				<div id="title">Service Account Details</div>
					<div class="service-account-details-grid">
						<label class="first-row" for="name">Service Name:</label>
						<input class="first-row" id="name" v-model=selectedServiceAccount.name :readonly="serviceAccountUpdateMode"/>
						<label for="host">Host Name:</label>
						<input id="host" v-model=selectedServiceAccount.host></input>
						<label for="port">Port Number:</label>
						<input id="port" type=number v-model=selectedServiceAccount.port></input>
						<label for="username">User Name:</label>
						<input id="username" v-model=selectedServiceAccount.username></input>
						<label for="password">Password:</label>
						<input id="password" type="password" v-model=selectedServiceAccount.password></input>
						<label for="apiToken">API Token:</label>
						<input id="apiToken" v-model=selectedServiceAccount.apiToken></input>
						<label for="reject-unauthorized">Reject Unauthorized:</label>
						<select id="reject-unauthorized" v-model=selectedServiceAccount.rejectUnauthorized>
							<option value=true>True</option>
							<option value=false>False</option>
						</select>
						<label for="timeout">HTTP Timeout:</label>
						<input id="timeout" type=number v-model=selectedServiceAccount.timeout></input>
						<label for="method">HTTP Method:</label>
						<select id="method" v-model=selectedServiceAccount.method>
							<option value="get">GET</option>
							<option value="post">POST</option>
						</select>
						<div/>
						<div>
							<button @click="createOrUpdateService">{{ buttonName }}</button>
							<button @click="clearSelectedService">Clear</button>
							<button v-if="buttonName === 'Update'" @click="deleteService(selectedServiceAccount.name)">Delete</button>
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
		'serviceAccounts',
		'selectedServiceAccount',
		'serviceAccountUpdateMode'
	],

	computed: {
		buttonName: function buttonName() {
			if (this.serviceAccountUpdateMode) return 'Update';
			return 'Create';
		}
	},

	methods: {
		clearSelectedService: function clearSelectedService() {
			this.$emit('clear-selected-service-account');
		},
		getServiceDetails: function getServiceDetails(name) {
			this.$emit('get-service-account', name);
		},
		createOrUpdateService: function createOrUpdateService() {
			if (this.buttonName === 'Update') return this.$emit('set-service-account', this.selectedServiceAccount, 'update');
			if (this.buttonName === 'Create') return this.$emit('set-service-account', this.selectedServiceAccount, 'create');
			return undefined;
		},
		deleteService: function deleteService(name) {
			this.$emit('delete-service-account', name);
		}
	}
});
