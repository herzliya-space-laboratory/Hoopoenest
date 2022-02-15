<script>
	export let params;
	export let param;
	let searchTerm = "";

	$: if (!params) params = [];
	$: filteredList = params.filter(
		(item) =>
			item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
	);
</script>

<div class="input-field">
	<i class="material-icons prefix">search</i>
	<input id="search" type="search" bind:value={searchTerm} />
</div>
{#if filteredList.length === 0}
	<span>
		<i>Empty</i>
	</span>
{:else}
	<div class="collection">
		{#each filteredList as paramElem, i (i)}
			<a
				href="#!"
				class:active={!!param && param.name === paramElem.name}
				class="collection-item"
				on:click={() => (param = paramElem)}>
				{`${i + 1}. ${paramElem.name} <${paramElem.type}>`}
			</a>
		{/each}
	</div>
{/if}

<style>
	.collection {
		overflow: auto;
		max-height: 69vh;
	}
</style>
