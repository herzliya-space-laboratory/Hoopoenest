<script>
	import { createEventDispatcher, onMount } from "svelte";

	const dispatch = createEventDispatcher();

	let newCategory = {
		name: "",
		id: null,
		serviceSubTypes: [],
	};

	const addCategory = () => {
		dispatch("addCategory", newCategory);
		newCategory = {
			name: "",
			id: null,
			serviceSubTypes: [],
		};
	};

	onMount(M.AutoInit);
</script>

<!-- Modal Trigger -->
<a
	href="#addCategory"
	class="btn-floating btn-large waves-effect waves-light red modal-trigger">
	<i class="material-icons">add</i>
</a>

<!-- Modal Structure -->
<div id="addCategory" class="modal">
	<div class="modal-content">
		<h4>Add Category</h4>
		<p>Name:</p>
		<input type="text" bind:value={newCategory.name} />
		<p>ID:</p>
		<input type="number" min="0" max="255" bind:value={newCategory.id} />
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={addCategory}> Add </a>
	</div>
</div>
