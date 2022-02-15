<script>
	import { createEventDispatcher } from "svelte";

	export let partName;
	const dispatch = createEventDispatcher();

	let newSST = {
		name: "",
		id: null,
		params: [],
	};

	const addSST = () => {
		dispatch("addSST", newSST);
		newSST = {
			name: "",
			id: null,
			params: [],
		};
	};
</script>

<!-- Modal Trigger -->
<a
	href="#addSST"
	class="btn-floating btn-large waves-effect waves-light red modal-trigger">
	<i class="material-icons">add</i>
</a>

<!-- Modal Structure -->
<div id="addSST" class="modal">
	<div class="modal-content">
		<h4>Add {partName}</h4>
		<p>Name:</p>
		<input type="text" bind:value={newSST.name} />
		<p>ID:</p>
		<input type="number" min="0" max="255" bind:value={newSST.id} />
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={addSST}> Add </a>
	</div>
</div>
