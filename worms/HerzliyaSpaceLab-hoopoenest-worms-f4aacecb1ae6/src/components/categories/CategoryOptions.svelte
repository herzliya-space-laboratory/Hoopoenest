<script>
	import { createEventDispatcher, onMount } from "svelte";
	const dispatch = createEventDispatcher();

	export let category;
	export let part;

	const curr = { ...category };

	const deleteCategory = () => {
		dispatch("deleteCategory", category.id);
	};
	const updateCategory = () => {
		dispatch("updateCategory", { updated: curr, old: category });
	};
	const duplicateCategory = () => {
		dispatch("duplicateCategory", category.id);
	};

	onMount(M.AutoInit);
</script>

<!-- Modal Trigger -->
<a
	href={`#CategoryOptions${category.id}${part}`}
	class="collection-item modal-trigger">
	{category.name}
</a>

<!-- Modal Structure -->
<div id={`CategoryOptions${curr.id}${part}`} class="modal">
	<div class="modal-content">
		<h4>Edit</h4>
		<p>Name:</p>
		<input type="text" bind:value={curr.name} />
		<p>ID:</p>
		<input type="number" bind:value={curr.id} />
	</div>
	<div class="modal-footer">
		<a
			on:click={updateCategory}
			href="#!"
			class="modal-close waves-effect waves-blue btn-flat"> Save </a>
		<a
			on:click={duplicateCategory}
			href="#!"
			class="modal-close waves-effect waves-blue btn-flat"> Duplicate </a>
		<a
			on:click={deleteCategory}
			href="#!"
			class="modal-close waves-effect waves-red btn-flat">
			<i class="material-icons">delete</i>
		</a>
	</div>
</div>
