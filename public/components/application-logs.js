/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('application-logs', {
	template: `
		<div>
			Select Log File to View:
			<select id="applications-logs-select" v-model:select="selectedLogName" @change="getLogData">
				<option v-for="log in logFileNames" :value="log">{{ log }}</option>
			</select>
			<pre>{{ logFileContent }}</pre>
		</div>
	`,
	data: function () {
		return {
			selectedLogName: '',
			logFileContent: '',
			logFileNames: [],
			BASE_URL: '/api/application-logs'
		};
	},
	created: async function created() {
		const cfg = { apipath: this.BASE_URL, type: 'json' };
		try {
			this.logFileNames = await apiFetch(cfg);
			return;
		} catch (e) {
			toast.error(e.message);
		}
	},
	methods: {
		getLogData: async function getLogData() {
			const cfg = { apipath: `${this.BASE_URL}/${this.selectedLogName}`, type: 'text' };
			try {
				this.logFileContent = await apiFetch(cfg);
			} catch (e) {
				toast.error(e.message);
			}
		},
		getLogFileContent: async function getLogFileContent(logName) {
			const cfg = { apipath: `${this.BASE_URL}/${logName}`, type: 'text' };
			try {
				this.logFileContent = await apiFetch({ apipath: cfg.apipath });
				return;
			} catch (e) {
				toast.error(e.message);
			}
		}
	}
});
