<script>
	import { createEventDispatcher } from "svelte";
	import { v4 as uuidv4 } from "uuid";
	const dispatch = createEventDispatcher();

	let newCalibration = {
		name: "",
		type: "linear",
		id: uuidv4(),
	};

	const addCalibration = () => {
		if (newCalibration.type === "enum") {
			newCalibration.options = [];
		} else {
			newCalibration.b = 0;
			newCalibration.m = 0;
		}
		dispatch("addCalibration", newCalibration);
		newCalibration = {
			name: "",
			type: "linear",
			id: uuidv4(),
		};
	};
</script>

<!-- Modal Trigger -->
<a
	href="#addCalibration"
	class="btn-floating btn-large waves-effect waves-light red modal-trigger">
	<i class="material-icons">add</i>
</a>

<!-- Modal Structure -->
<div id="addCalibration" class="modal">
	<div class="modal-content">
		<h4>Add Calibration</h4>
		<p>Name:</p>
		<input type="text" bind:value={newCalibration.name} />
		<p>
			<label>
				<input
					name="type"
					type="radio"
					bind:group={newCalibration.type}
					value={"linear"}
				/>
				<span>Linear</span>
			</label>
		</p>
		<p>
			<label>
				<input
					name="type"
					type="radio"
					bind:group={newCalibration.type}
					value={"enum"}
				/>
				<span>Enum</span>
			</label>
		</p>
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={addCalibration}> Add </a>
	</div>
</div>
