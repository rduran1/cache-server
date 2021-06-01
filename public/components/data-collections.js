/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('data-collections', {
	template: `
	<div class='data-collections'>
		<button id="msa" :disabled="msa" @click=activate($event.currentTarget.id)>Manage Service Accounts</button>
		<button id="mcm" :disabled="mcm" @click=activate($event.currentTarget.id)>Manage Collection Metadata</button>
		<button id="mat" :disabled="mat" @click=activate($event.currentTarget.id)>Manage Access Tokens</button>
		<button id="mcs" :disabled="mcs" @click=activate($event.currentTarget.id)>Manage Collections</button>
		<hr>
		<div class="h-divider-med"/>
		<collection-list 
			v-if="mcs"
			@set-collection-status=setCollectionStatus
			:collections="metadata"
			:is-pending-server-response="isPendingServerResponse"
		>collection list</collection-list>
		
		<collection-service-accounts
			v-if="msa"
			@clear-selected-service-account=clearSelectedServiceAccount
			@set-service-account=setServiceAccount
			@delete-service-account=deleteServiceAccount
			:service-accounts=serviceAccounts
			:selected-service-account=selectedServiceAccount
		>service accounts</collection-service-accounts>

		<collection-metadata
			v-if="mcm"
			@set=setServiceAccount
			@delete=deleteServiceAccount
		>metadata</collection-metadata>

		<collection-tokens
			v-if="mat"
			@set=setServiceAccount
			@delete=deleteServiceAccount
		>tokens</collection-tokens>
	</div>
	`,
	data: function data() {
		return {
			BASE_URL: '/api/collections',
			metadata: [],
			serviceAccounts: [
				{ name: 'bigfix_dev_compliance' }, { name: 'EPO_service' }, { name: 'bigfix_dev_root' }
			],
			selectedServiceAccount: {
				name: 'bigfix_dev_compliance'
			},
			isPendingServerResponse: false,
			tokens: [],
			msa: false,
			mcm: false,
			mat: false,
			mcs: true
		};
	},
	created: async function created() {
		await this.refreshLocalStore('all-metadata', 'metadata');
		await this.refreshLocalStore('all-service-accounts', 'serviceAccounts');
		socket.on('refresh metadata', () => this.refreshLocalStore('all-metadata', 'metadata'));
		socket.on('refresh service-accounts', () => this.refreshLocalStore('all-service-accounts', 'serviceAccounts'));
		socket.on('refresh tokens', () => this.refreshLocalStore('all-tokens', 'tokens'));
	},
	methods: {
		refreshLocalStore: async function refreshLocalStore(storeUri, dataProp) {
			try {
				const response = await apiFetch({ apipath: `${this.BASE_URL}/${storeUri}`, type: 'json' });
				if (typeof response !== 'object') throw new Error('Server did not respond with a object');
				const colNames = Object.keys(response);
				if (colNames.length === 0) {
					this[dataProp] = [];
					return;
				}
				this[dataProp].length = 0;
				for (let i = 0; i < colNames.length; i++) {
					response[colNames[i]].name = colNames[i];
					this[dataProp].push(response[colNames[i]]);
				}
			} catch (e) {
				toast.error(`Failed to get data from server: ${e.message}`);
			}
		},
		activate: function activate(id) {
			this.msa = false;
			this.mcm = false;
			this.mat = false;
			this.mcs = false;
			if (id === 'msa') this.msa = true;
			if (id === 'mcm') this.mcm = true;
			if (id === 'mat') this.mat = true;
			if (id === 'mcs') this.mcs = true;
		},
		// collections
		setCollectionStatus: async function setCollectionStatus(cfg) {
			const { name, status } = cfg;
			const config = {
				model: 'metadata',
				apipath: `${this.BASE_URL}/${status}/${name}`,
				type: 'text',
				method: 'put'
			};
			await this.apiFetchNSyncModel(config);
		},
		setMetaData: async function setMetaData(config, setType) {
			const model = 'metadata';
			let apipath = this.BASE_URL;
			let method = 'post';
			const body = config;
			if (setType === 'create') {
				apipath = `${apipath}/create-metadata/${config.name}`;
			}
			if (setType === 'update') {
				apipath = `${apipath}/update-metadata/${config.name}`;
				method = 'put';
			}
			const cfg = {
				model,
				apipath,
				method,
				body,
				type: 'text'
			};
			await this.apiFetchNSyncModel(cfg);
		},
		deleteMetaData: async function deleteMetaData(name) {
			const config = {
				model: 'metadata',
				apipath: `${BASE_URL}/delete-metadata/${name}`,
				method: 'delete',
				type: 'text'
			};
			await this.apiFetchNSyncModel(config);
		},
		setServiceAccount: async function setServiceAccount(config, setType) {
			let apipath = this.BASE_URL;
			let method = 'post';
			if (setType === 'create') {
				apipath = `${apipath}/create-service-account/${config.name}`;
			}
			if (setType === 'update') {
				apipath = `${apipath}/update-service-account/${config.name}`;
				method = 'put';
			}
			const cfg = {
				model: 'service-accounts',
				apipath,
				method,
				type: 'text'
			};
			await this.apiFetchNSyncModel(cfg);
		},
		clearSelectedServiceAccount: async function clearSelectedServiceAccount() {
			const keyNames = Object.keys(this.selectedServiceAccount);
			keyNames.forEach((kn) => {
				this.selectedServiceAccount[kn] = '';
			});
		},
		deleteServiceAccount: async function deleteServiceAccount(name) {
			const config = {
				model: 'service-accounts',
				apipath: `${BASE_URL}/delete-service-account/${name}`,
				method: 'delete',
				type: 'text'
			};
			await this.apiFetchNSyncModel(config);
		},
		setToken: async function setToken(config, setType) {
			let apipath = this.BASE_URL;
			let method = 'post';
			if (setType === 'create') {
				apipath = `${apipath}/create-token/${config.name}`;
			}
			if (setType === 'update') {
				apipath = `${apipath}/update-token/${config.name}`;
				method = 'put';
			}
			const cfg = {
				model: 'token',
				apipath,
				method,
				type: 'text'
			};
			await this.apiFetchNSyncModel(cfg);
		},
		deleteToken: async function deleteToken(name) {
			const config = {
				model: 'tokens',
				apipath: `${BASE_URL}/delete-token/${name}`,
				method: 'delete',
				type: 'text'
			};
			await this.apiFetchNSyncModel(config);
		},
		apiFetchNSyncModel: async function apiFetchNSyncModel(config) {
			const cfg = config;
			const { model } = cfg;
			delete cfg.model;
			try {
				this.isPendingServerResponse = true;
				document.body.style.cursor = 'progress';
				await apiFetch(cfg);
				cfg.method = 'get';
				await sleep(1000);
				cfg.apipath = `${this.BASE_URL}/all-${model}`;
				cfg.type = 'json';
				const response = await apiFetch(cfg);
				const colNames = Object.keys(response);
				if (colNames.length === 0) {
					this.metadata = [];
					return;
				}
				this.metadata.length = 0;
				for (let i = 0; i < colNames.length; i++) {
					response[colNames[i]].name = colNames[i];
					this.metadata.push(response[colNames[i]]);
				}
			} catch (e) {
				toast.error(e.message);
			}
			document.body.style.cursor = 'default';
			this.isPendingServerResponse = false;
		}
	}
});
