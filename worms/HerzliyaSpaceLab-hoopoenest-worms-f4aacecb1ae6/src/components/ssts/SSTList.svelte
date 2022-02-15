<script>
	export let ssts;
	export let curr;

	let searchTerm = "";
	let filteredList = ssts;

	$: {
		if (/^\d+$/.test(searchTerm)) {
			const num = +searchTerm;
			filteredList = ssts.filter((item) => item.id === num);
		} else {
			filteredList = ssts.filter(
				(item) =>
					item.name
						.toLowerCase()
						.indexOf(searchTerm.toLowerCase()) !== -1
			);
		}
	}
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
		{#each filteredList as sst (sst.id)}
			<a
				href="#!"
				class:active={!!curr && curr.id === sst.id}
				class="collection-item"
				on:click={() => (curr = sst)}>
				{sst.name}
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
