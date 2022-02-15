<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let sst;

	let last = sst;
	let curr = { ...sst };
	$: if (last !== sst) {
		curr = { ...sst };
		last = sst;
	}

	const deleteSST = () => {
		dispatch("deleteSST", sst.id);
		sst = null;
		curr = null;
	};

	const updateSST = () => {
		dispatch("updateSST", curr);
		curr = { ...sst };
	};

	const duplicateSST = () => {
		dispatch("duplicateSST");
	};
</script>

<!-- Modal Trigger -->
<a
	href="#SSTOptions"
	class="btn-floating btn-large waves-effect waves-light blue modal-trigger">
	<i class="material-icons">edit</i>
</a>

<!-- Modal Structure -->
<div id="SSTOptions" class="modal">
	{#if curr && Object.keys(curr).length > 0}
		<div class="modal-content">
			<h4>Edit</h4>
			<p>Name:</p>
			<input type="text" bind:value={curr.name} />
			<p>ID:</p>
			<input type="number" bind:value={curr.id} />
		</div>
		<div class="modal-footer">
			<a
				on:click={updateSST}
				href="#!"
				class="modal-close waves-effect waves-blue btn-flat"> Save </a>
			<a
				on:click={duplicateSST}
				href="#!"
				class="modal-close waves-effect waves-blue btn-flat">
				Duplicate
			</a>
			<a
				on:click={deleteSST}
				href="#!"
				class="modal-close waves-effect waves-red btn-flat">
				<i class="material-icons">delete</i>
			</a>
		</div>
	{:else}
		<div class="modal-content">
			<h4>Please select</h4>
		</div>
	{/if}
</div>
