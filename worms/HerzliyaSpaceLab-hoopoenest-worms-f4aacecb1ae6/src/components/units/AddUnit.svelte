<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	let newUnit = "";

	const addUnit = () => {
		dispatch("addUnit", newUnit);
		newUnit = "";
	};
</script>

<!-- Modal Trigger -->
<a
	href="#addUnit"
	class="btn-floating btn-large waves-effect waves-light red modal-trigger">
	<i class="material-icons">add</i>
</a>

<!-- Modal Structure -->
<div id="addUnit" class="modal">
	<div class="modal-content">
		<h4>Add Unit</h4>
		<p>Name:</p>
		<input type="text" bind:value={newUnit} />
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={addUnit}> Add </a>
	</div>
</div>
