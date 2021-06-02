/* eslint-disable no-undef */
/* eslint-disable object-shorthand */
/* eslint-disable func-names */

Vue.component('collection-tokens', {
	template: `
    <div class="grid-container">
			<div>
				<div id="title">Tokens</div>
				<ul>
					<li @click="getToken(token.tokenName)" v-for="token in tokens">{{token.tokenName}}</li>
				</ul>
			</div>
			<div>
				<div id="title">Token Details</div>
					<div class="service-account-details-grid">
						<label class="first-row" for="tokenName">Token Name:</label>
						<input class="first-row" id="tokenName" v-model=selectedToken.tokenName :readonly="tokenUpdateMode"/>
						<label for="description">Description:</label>
						<input id="description" v-model=selectedToken.description></input>
						<label for="issued-to">Issued To:</label>
						<input id="issued-to" v-model=selectedToken.issuedTo></input>
						<label for="date-issued">Date Issued:</label>
						<input id="date-issued" v-model=selectedToken.dateIssued></input>
						<label for="value">Value:</label>
						<input id="value" v-model=selectedToken.value></input>
						<label for="collections">Token has access to the following selected collections:</label>

						<div>
							<input @keyup="filterCollectionsList" v-model="filterString">
						</div>
						<div v-for"(item, idx) in filteredCollectionList">
							<label> {{ item }} </label>
							<input
								@click="updateSelectedDatasets(item)"
								type="checkbox"
								:id="item"
								:value="item"
								:checked="false"
							/>
						</div>

						<div>
							<button @click="createOrUpdateToken">{{ buttonName }}</button>
							<button @click="clearSelectedToken">Clear</button>
							<button v-if="buttonName === 'Update'" @click="deleteToken(selectedToken.tokenName)">Delete</button>
						</div>
					</div>
				</div>
			</div>
    </div>
  `,
	data: function () {
		return {
			filterString: '',
			filteredCollectionList: []
		};
	},

	props: [
		'tokens',
		'selectedToken',
		'tokenUpdateMode',
		'metadata'
	],

	computed: {
		buttonName: function buttonName() {
			if (this.tokenUpdateMode) return 'Update';
			return 'Create';
		},
		collectionNames: function collectionNames() {
			const names = metadata.map((col) => col.name);
			return names;
		}
	},

	methods: {
		filterCollectionsList: function filterCollectionsList() {
			this.filteredCollectionList = this.collectionNames.filter((name) => name.includes(this.filterString));
		},
		clearSelectedToken: function clearSelectedToken() {
			this.$emit('clear-selected-token');
		},
		getToken: function getToken(name) {
			this.$emit('get-token', name);
		},
		createOrUpdateToken: function createOrUpdateToken() {
			if (this.buttonName === 'Update') return this.$emit('set-token', this.selectedToken, 'update');
			if (this.buttonName === 'Create') return this.$emit('set-token', this.selectedToken, 'create');
			return undefined;
		},
		deleteToken: function deleteToken(name) {
			this.$emit('delete-token', name);
		}
	}
});
