<script lang="ts">
	import type { parameter, mibKey } from "@lib/MIB/types";
	import type { commandModalState } from "@lib/types";

	import rfdc from "rfdc";

	export let serviceTypes: {
		name: string;
		id: number;
		subTypes: {
			name: string;
			id: number;
			category: string;
			key: mibKey;
			params: parameter[];
		}[];
	}[];

	export let currCommand: any;
	export let commandModalState: commandModalState;

	const clone = rfdc();

	let searchTerm = "";

	$: filteredSts = serviceTypes
		.map((st) => {
			const subTypes = searchTerm.match(/\d+,\d+/)
				? st.subTypes.filter(
						(sst) =>
							sst.key.serviceType === +searchTerm.split(",")[0] &&
							sst.key.serviceSubType === +searchTerm.split(",")[1]
				  )
				: st.subTypes.filter(
						(sst) =>
							sst.name
								.toLowerCase()
								.indexOf(searchTerm.toLowerCase()) !== -1
				  );
			if (subTypes.length === 0) return undefined;
			return {
				...st,
				subTypes,
			};
		})
		.filter((item) => item !== undefined);
</script>

<div class="input-field">
	<i class="material-icons prefix">search</i>
	<textarea
		id="search-commands"
		bind:value={searchTerm}
		class="materialize-textarea"
	/>
	<label for="search-commands">Search</label>
</div>
<div class="collection">
	{#each filteredSts as st}
		<li class="collection-item">
			<h6>{st.name}</h6>
		</li>
		{#each st.subTypes as sst}
			<a
				href="#edit-command-modal"
				class="collection-item modal-trigger"
				on:click={() => {
					commandModalState = "new-command";
					currCommand = clone(sst);
				}}
			>
				<p style="display: inline-block; margin: 0px;">{sst.name}</p>
				<p style="display: inline-block; margin: 0px; float: right;">
					({sst.key.serviceType},{sst.key.serviceSubType})
				</p></a
			>
		{/each}
	{/each}
</div>

<style>
	.collection {
		overflow: auto;
		max-height: 76vh;
		list-style-type: none;
	}
</style>
