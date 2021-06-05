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
			@get-service-account=getServiceAccount
			@delete-service-account=deleteServiceAccount
			:service-accounts=serviceAccounts
			:service-account-update-mode=serviceAccountUpdateMode
			:selected-service-account=selectedServiceAccount
		>service accounts</collection-service-accounts>

		<collection-metadata
			v-if="mcm"
			@clear-selected-metadata=clearSelectedMetadata
			@set-metadata=setMetadata
			@get-metadata=getMetadata
			@delete-metadata=deleteMetadata
			:service-accounts=serviceAccounts
			:metadata=metadata
			:metadata-update-mode=metadataUpdateMode
			:selected-metadata=selectedMetadata
			:transforms=transforms
		>metadata</collection-metadata>

		<collection-tokens
			v-if="mat"
			@clear-selected-token=clearSelectedToken
			@set-token=setToken
			@get-token=getToken
			@delete-token=deleteToken
			:tokens=tokens
			:token-update-mode=tokenUpdateMode
			:selected-token=selectedToken
			:metadata=metadata
		>tokens</collection-tokens>
	</div>
	`,
	data: function data() {
		return {
			BASE_URL: '/api/collections',
			metadata: [],
			serviceAccounts: [],
			serviceAccountUpdateMode: false,
			tokenUpdateMode: false,
			metadataUpdateMode: false,
			selectedServiceAccount: {},
			selectedToken: {},
			selectedMetadata: {
				body: {
					output: '',
					relevance: ''
				}
			},
			isPendingServerResponse: false,
			transforms: {},
			tokens: [],
			msa: false,
			mcm: false,
			mat: false,
			mcs: true
		};
	},
	created: async function created() {
		this.refreshLocalStore('all-metadata', 'metadata');
		this.refreshLocalStore('all-service-accounts', 'serviceAccounts');
		this.refreshLocalStore('all-tokens', 'tokens');
		this.transforms = await apiFetch({ apipath: `${this.BASE_URL}/transforms`, type: 'json' });
		this.transforms.incoming.push('');
		this.transforms.outgoing.push('');
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
				toast.error(`Failed to load local dataset: ${e.message}`);
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
				uri: 'all-metadata',
				dataProp: 'metadata',
				apipath: `${this.BASE_URL}/${status}/${name}`,
				method: 'put'
			};
			await this.apiFetchNSyncModel(config);
		},
		setMetadata: async function setMetadata(config, setType) {
			let apipath;
			let method;
			if (setType === 'create') {
				apipath = `${this.BASE_URL}/create-metadata/${config.name}`;
				method = 'post';
			}
			if (setType === 'update') {
				apipath = `${this.BASE_URL}/update-metadata/${config.name}`;
				method = 'put';
			}
			const cfg = {
				uri: 'all-metadata',
				dataProp: 'metadata',
				apipath,
				method,
				body: config,
				headers: { 'Content-Type': 'application/json' }
			};
			await this.apiFetchNSyncModel(cfg);
			this.clearSelectedMetadata();
		},
		deleteMetadata: async function deleteMetadata(name) {
			const config = {
				uri: 'all-metadata',
				dataProp: 'metadata',
				apipath: `${this.BASE_URL}/delete-metadata/${name}`,
				method: 'delete'
			};
			await this.apiFetchNSyncModel(config);
			this.clearSelectedMetadata();
		},
		getMetadata: async function getMetadata(name) {
			const apipath = `${this.BASE_URL}/metadata/${name}`;
			this.selectedMetadata = await apiFetch({ apipath, type: 'json' });
			this.selectedMetadata.name = name;
			this.metadataUpdateMode = true;
			if (typeof this.selectedMetadata.body !== 'object') this.selectedMetadata.body = {};
		},
		clearSelectedMetadata: function clearSelectedMetadata() {
			const keyNames = Object.keys(this.selectedMetadata);
			for (let i = 0; i < keyNames.length; i++) {
				if (keyNames[i] !== 'body') this.selectedMetadata[keyNames[i]] = '';
			}
			this.selectedMetadata.body.output = '';
			this.selectedMetadata.body.relevance = '';
			this.metadataUpdateMode = false;
		},
		setServiceAccount: async function setServiceAccount(config, setType) {
			let apipath;
			let method;
			if (setType === 'create') {
				apipath = `${this.BASE_URL}/create-service-account/${config.name}`;
				method = 'post';
			}
			if (setType === 'update') {
				apipath = `${this.BASE_URL}/update-service-account/${config.name}`;
				method = 'put';
			}
			const cfg = {
				uri: 'all-service-accounts',
				dataProp: 'serviceAccounts',
				apipath,
				method,
				body: config,
				headers: { 'Content-Type': 'application/json' }
			};
			if (config.username === '' && config.password === '') {
				delete cfg.body.username;
				delete cfg.body.password;
			}
			await this.apiFetchNSyncModel(cfg);
		},
		getServiceAccount: async function getServiceAccount(name) {
			const apipath = `${this.BASE_URL}/service-account/${name}`;
			this.selectedServiceAccount = await apiFetch({ apipath, type: 'json' });
			this.selectedServiceAccount.name = name;
			this.serviceAccountUpdateMode = true;
		},
		clearSelectedServiceAccount: async function clearSelectedServiceAccount() {
			const keyNames = Object.keys(this.selectedServiceAccount);
			keyNames.forEach((kn) => {
				this.selectedServiceAccount[kn] = '';
			});
			this.serviceAccountUpdateMode = false;
		},
		deleteServiceAccount: async function deleteServiceAccount(name) {
			const config = {
				uri: 'all-service-accounts',
				dataProp: 'serviceAccounts',
				apipath: `${this.BASE_URL}/delete-service-account/${name}`,
				method: 'delete'
			};
			await this.apiFetchNSyncModel(config);
			this.clearSelectedServiceAccount();
		},
		clearSelectedToken: function clearSelectedToken() {
			const keyNames = Object.keys(this.selectedToken);
			keyNames.forEach((kn) => {
				this.selectedToken[kn] = '';
			});
			this.tokenUpdateMode = false;
		},
		getToken: async function getToken(name, done) {
			const apipath = `${this.BASE_URL}/token/${name}`;
			this.selectedToken = await apiFetch({ apipath, type: 'json' });
			this.selectedToken.tokenName = name;
			this.tokenUpdateMode = true;
			done();
		},
		setToken: async function setToken(config, setType) {
			let apipath;
			let method;
			if (setType === 'create') {
				apipath = `${this.BASE_URL}/create-token`;
				method = 'post';
			}
			if (setType === 'update') {
				apipath = `${this.BASE_URL}/update-token/${config.tokenName}`;
				method = 'put';
			}
			const cfg = {
				uri: 'all-tokens',
				dataProp: 'tokens',
				apipath,
				method,
				body: config,
				headers: { 'Content-Type': 'application/json' }
			};
			await this.apiFetchNSyncModel(cfg);
			this.clearSelectedToken();
		},
		deleteToken: async function deleteToken(name) {
			const config = {
				uri: 'all-tokens',
				dataProp: 'tokens',
				apipath: `${this.BASE_URL}/delete-token/${name}`,
				method: 'delete'
			};
			await this.apiFetchNSyncModel(config);
			this.clearSelectedToken();
		},
		apiFetchNSyncModel: async function apiFetchNSyncModel(config) {
			const cfg = JSON.parse(JSON.stringify(config));
			const { uri, dataProp } = cfg;
			delete cfg.uri;
			delete cfg.dataProp;
			try {
				this.isPendingServerResponse = true;
				document.body.style.cursor = 'progress';
				await apiFetch(config);
				cfg.method = 'get';
				delete cfg.body; // get requests cant have a body
				await sleep(1000);
				this.refreshLocalStore(uri, dataProp);
			} catch (e) {
				toast.error(e.message);
			}
			document.body.style.cursor = 'default';
			this.isPendingServerResponse = false;
		}
	}
});
