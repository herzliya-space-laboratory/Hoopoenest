<script>
	import { onMount } from "svelte";
	import { createEventDispatcher } from "svelte";

	export let calibration;
	const dispatch = createEventDispatcher();

	let curr = { ...calibration };

	const updateCal = () => {
		dispatch("updateCal", curr);
		curr = { ...calibration };
	};

	onMount(M.AutoInit);
</script>

<!-- Modal Trigger -->
<a
	href={"#editCalibration" + calibration.name}
	class="waves-effect waves-blue btn-flat modal-trigger">
	<i class="material-icons">edit</i>
</a>

<!-- Modal Structure -->
<div id={"editCalibration" + calibration.name} class="modal">
	<div class="modal-content">
		<h4>Edit Calibration</h4>
		<p>Name:</p>
		<input type="text" bind:value={curr.name} />
	</div>
	<div class="row">
		<div class="col l1 offset-l1">
			<pre>ƒ(x) =</pre>
		</div>
		<div class="col l1">
			<input type="number" bind:value={curr.m} />
		</div>
		<div class="col l1">
			<pre>x +</pre>
		</div>
		<div class="col l1">
			<input type="number" bind:value={curr.b} />
		</div>
	</div>
	<div class="modal-footer">
		<a
			on:click={updateCal}
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"> Save </a>
	</div>
</div>
