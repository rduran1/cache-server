/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('collection-tokens', {
	template: `
    <div class="grid-container">
			<div>
				<div id="title">Access Tokens</div>
				<ul border=1>
				</ul>
			</div>
			<div>
				<div id="title">Service Account Details</div>
					<div class="service-account-details-grid">
						<label for="host">Host Name:</label>
						<input id="host"></input>
						<label for="port">Port Number:</label>
						<input id="port"></input>
						<label for="username">User Name:</label>
						<input id="username"></input>
						<label for="password">Password:</label>
						<input id="password" type="password"></input>
						<label for="reject-unauthorized">Reject Unauthorized:</label>
						<select id="reject-unauthorized">
							<option>True</option>
							<option>False</option>
						</select>
						<label for="timeout">HTTP Timeout:</label>
						<input id="timeout"></input>
						<label for="method">HTTP Method:</label>
						<select id="method">
							<option>GET</option>
							<option>POST</option>
						</select>
						<div/>
						<div>
							<button>Create</button>
						</div>
					</div>
				</div>
			</div>
    </div>
  `,
	data: function () {
		return {
			name: ''
		};
	},

	props: [
		'serviceAccounts',
		'selectedServiceAccount'
	],

	methods: {

	}
});
