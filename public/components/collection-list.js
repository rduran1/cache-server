/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('collection-list', {
	template: `
		<div>
			<table v-if="collectionDataExists">
				<tr>
					<th>Collection</th>
					<th>Description</th>
					<th>Last Cache Update</th>
					<th>TTL</th>
					<th>Status</th>
				</tr>
				<tr v-for="col in collections">
					<td>{{ col.name }}</td>
					<td>{{ col.description }}</td>
					<td>{{ col.lastCacheUpdate }}</td>
					<td>{{ col.ttl }}</td>
					<td class="collection-button-tds">
						<button class="collection-list-buttons"
							@click="setCollectionStatus(col)"
							:disabled="isPendingServerResponse"
						><abbr v-if="col.status === "error" :title="errorMessage(col)">{{ col.status }}</abbr><div v-else>{{ col.status }}</button>
					</td>
				</tr>
			</table>
			<div v-if="!collectionDataExists">No Collection Data to Display</div>
		</div>
	`,
	data: function () {
		return {};
	},
	props: [
		'collections',
		'isPendingServerResponse'
	],
	computed: {
		collectionDataExists: function collectionDataExists() {
			if (typeof this.collections === 'undefined') return false;
			return this.collections.length > 0;
		}
	},
	methods: {
		setCollectionStatus: function setCollectionStatus(col) {
			const config = { name: col.name };
			if (col.status === 'stopped') config.status = 'start';
			if (col.status === 'running') config.status = 'stop';
			if (col.status === 'waiting') config.status = 'stop';
			if (col.status === 'starting') config.status = 'stop';
			if (col.status === 'error') config.status = 'stop';
			if (col.status === 'listening') config.status = 'stop';
			return this.$emit('set-collection-status', config);
		},
		errorMessage: function errorMessage(col) {
			return col.status === 'error' ? col.lastErrorMessage : '';
		}
	}
});
