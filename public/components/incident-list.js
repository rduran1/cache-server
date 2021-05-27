/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('incidents-list', {
	template: `
		<div>
			<table>
				<tr>
					<th>Case Number</th>
					<th>Status</th>
					<th>Assignee</th>
					<th>Problem Statement</th>
				</tr>
				<tr @click="selectIncident" v-for="item in incidents">
					<td><a :href="urlToLookupIncident(item.IncidentID)" target="_blank">{{ item.IncidentID }}</a></td>
					<td>{{ item.Status }}</td>
					<td>{{ item.Assignee }}</td>
					<td>{{ item.Title }}</td>
				</tr>
			</table>
		</div>
	`,
	data: function () {
		return {
		};
	},
	props: [
		'incidents',
		'smServer'
	],
	methods: {
		selectIncident: function selectIncident(evt) {
			const selectedIncidentId = evt.target.parentNode.querySelectorAll('td')[0].innerText;
			return this.$emit('set-selected-incident', selectedIncidentId);
		},
		urlToLookupIncident: function urlToLookupIncident(id) {
			return `${this.smServer}/webtier-9.52/index.do?ctx=docEngine&file=probsummary&query=number%3D%22${id}%22`;
		}
	}
});
