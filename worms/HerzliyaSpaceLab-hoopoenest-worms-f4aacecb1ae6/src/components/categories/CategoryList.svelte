<script>
	export let categories;
	export let curr;

	let searchTerm = "";
	let filteredList = categories;

	$: {
		if (/^\d+$/.test(searchTerm)) {
			const num = +searchTerm;
			filteredList = categories.filter((item) => item.id === num);
		} else {
			filteredList = categories.filter(
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
	<input id="search" type="search" required bind:value={searchTerm} />
</div>
{#if filteredList.length === 0}
	<span>
		<i>Empty</i>
	</span>
{:else}
	<div class="collection">
		{#each filteredList as st (st.id)}
			<a
				href="#!"
				class:active={!!curr && curr.id === st.id}
				class="collection-item"
				on:click={() => (curr = st)}>
				{st.name}
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
