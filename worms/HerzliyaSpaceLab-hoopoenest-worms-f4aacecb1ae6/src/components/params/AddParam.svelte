<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	let newParam = {
		name: "",
		type: "uint16",
		isLittleEndian: true,
		range: {},
	};

	const addParam = () => {
		dispatch("addParam", newParam);
		newParam = {
			name: "",
			type: "uint16",
			isLittleEndian: true,
			range: {},
		};
	};
</script>

<!-- Modal Trigger -->
<a
	href="#addParam"
	class="btn-floating btn-large waves-effect waves-light red modal-trigger">
	<i class="material-icons">add</i>
</a>

<!-- Modal Structure -->
<div id="addParam" class="modal">
	<div class="modal-content">
		<h4>Add Parameter</h4>
		<p>Name:</p>
		<input type="text" bind:value={newParam.name} />
	</div>
	<div class="modal-footer">
		<a
			on:click={addParam}
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"> Add </a>
	</div>
</div>
