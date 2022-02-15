<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();
	import { onMount } from "svelte";
	export let calibration;

	let curr = { ...calibration };

	const updateCal = () => {
		dispatch("updateCal", curr);
		curr = { ...calibration };
	};

	const addOption = () => {
		curr.options = [...curr.options, { name: "", value: null }];
	};

	const deleteOption = (index) => {
		curr.options = [
			...curr.options.slice(0, index),
			...curr.options.slice(index + 1),
		];
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
		<ul class="collection">
			{#each curr.options as { value, name }, i (i)}
				<li class="collection-item">
					<div class="row">
						<div class="col l3 m3 s3">
							<input type="number" bind:value min="0" max="255" />
						</div>
						<div class="col l1 m1 s1">
							<p class="center">:</p>
						</div>
						<div class="col l6 m6 s6">
							<input type="text" bind:value={name} />
						</div>
						<div class="col l1 m1 s1">
							<a
								href="#!"
								class="waves-effect waves-red btn-flat">
								<i
									class="material-icons"
									on:click={() => deleteOption(i)}>
									delete
								</i>
							</a>
						</div>
					</div>
				</li>
			{/each}
		</ul>
		<a href="#!" class="waves-effect waves-green btn-flat">
			<i class="material-icons" on:click={addOption}>add</i>
		</a>
	</div>
	<div class="modal-footer">
		<a
			on:click={updateCal}
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"> Save </a>
	</div>
</div>
