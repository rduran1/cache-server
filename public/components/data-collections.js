/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('data-collections', {
	template: `
	<div>
		<collection-list> </collection-list>
		<service-account-form> </service-account-form>
		<metadata-form> </metadata-form>
		<token-form> <token-form>
	</div>
	`,
	data: function data() {
		return {
			BASE_URL: '/api/collections',
			collections: {},
			currentIncident: {
				Title: '',
				Description: '',
				IncidentID: ''
			}
		};
	},
	created: async function created() {
		try {
			this.collections = await apiFetch({ apipath: `${this.BASE_URL}/all-metadata`, type: 'json' });
		} catch (e) {
			toast.error(`Failed to get list of collections: ${e.message}`);
		}
	},
	methods: {
		// collections
		setCollectionStatus: async function setCollectionStatus(name, status) {
			const config = {
				model: 'metadata',
				apipath: `${this.BASE_URL}/${status}/${name}`,
				type: 'json',
				method: 'put'
			};
			await apiFetchNSyncModel(config);
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
				type: 'json'
			};
			await apiFetchNSyncModel(cfg);
		},
		deleteMetaData: async function deleteMetaData(name) {
			const config = {
				model: 'metadata',
				apipath: `${BASE_URL}/delete-metadata/${name}`,
				method: 'delete',
				type: 'json'
			};
			await apiFetchNSyncModel(config);
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
				type: 'json'
			};
			await apiFetchNSyncModel(cfg);
		},
		deleteServiceAccount: async function deleteServiceAccount(name) {
			const config = {
				model: 'service-accounts',
				apipath: `${BASE_URL}/delete-service-account/${name}`,
				method: 'delete',
				type: 'json'
			};
			await apiFetchNSyncModel(config);
		},
		setToken: async function setToken(config, setType) {
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
				model: 'token',
				apipath,
				method,
				type: 'json'
			};
			await apiFetchNSyncModel(cfg);
		},
		deleteToken: async function deleteToken(name) {
			const config = {
				model: 'tokens',
				apipath: `${BASE_URL}/delete-service-account/${name}`,
				method: 'delete',
				type: 'json'
			};
			await apiFetchNSyncModel(config);
		},
		apiFetchNSyncModel: async function apiFetchNSyncModel(config) {
			const cfg = config;
			let retval;
			const { model } = cfg;
			delete cfg.model;
			try {
				document.body.style.cursor = 'progress';
				await apiFetch(cfg);
				cfg.method = 'get';
				cfg.apipath = `${BASE_URL}/all-${cfg.model}`;
				this[model] = await apiFetch();
			} catch (e) {
				toast.error(e.message);
			}
			document.body.style.cursor = 'default';
			return retval;
		}
	}
});
