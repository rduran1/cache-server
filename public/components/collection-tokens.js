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
						<label v-if="tokenUpdateMode" for="date-issued">Date Issued:</label>
						<input v-if="tokenUpdateMode" id="date-issued" :value=selectedToken.dateIssued readonly></input>
						<label v-if="tokenUpdateMode" for="value">Value:</label>
						<input v-if="tokenUpdateMode" id="value" v-model=selectedToken.value></input>
						<p class="nowrap">Token has access to the following selected collections:</p>
						<div></div>
						<label>Filter:</label>
						<div>
							<input class="collection-filter" @keyup="filterCollectionsList" v-model="filterString">
						</div>
						<div></div>
						<div>
							<div v-for="(item, idx) in filteredCollectionList">
								<label class="collection-label"> {{ item }} </label>
								<input class="collection-checkbox"
									type="checkbox"
									:id="item"
									:value="item"
									:checked="isChecked(item)"
									v-model="selectedCollections"
								/>
							</div>
						</div>
						<div></div>
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
			filteredCollectionList: [],
			selectedCollections: []
		};
	},

	created: function created() {
		this.filteredCollectionList = this.collectionNames;
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
			const names = this.metadata.map((col) => col.name);
			return names;
		}
	},

	methods: {
		isChecked: function isChecked(collectionName) {
			selectedToken.collections.include(collectionName);
		},
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
			const clone = JSON.parse(JSON.stringify(this.selectedToken));
			clone.collections = this.selectedCollections;

			if (this.buttonName === 'Update') {
				delete clone.value;
				delete clone.dateIssued;
				return this.$emit('set-token', clone, 'update');
			}
			if (this.buttonName === 'Create') return this.$emit('set-token', clone, 'create');
			return undefined;
		},
		deleteToken: function deleteToken(name) {
			this.$emit('delete-token', name);
		}
	}
});
