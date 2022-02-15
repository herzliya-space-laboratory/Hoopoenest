<script>
	import LinearCal from "./LinearCal.svelte";
	import EnumCal from "./EnumCal.svelte";
	import AddCalibration from "./AddCalibration.svelte";

	import { validateCalibration, validateName } from "../../lib/validations";
	import { openErrors } from "../../stores.js";

	export let calibrations;
	let searchTerm = "";
	let filteredList = calibrations;

	$: filteredList = calibrations.filter(
		(item) =>
			item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
	);

	const addCalibration = (data) => {
		let newCal = data.detail;
		const valErrs = validateName(newCal.name, calibrations);
		if (valErrs.length > 0) {
			openErrors(valErrs);
			return;
		}
		calibrations = [...calibrations, newCal];
	};

	const deleteCal = (data) => {
		calibrations = calibrations.filter((cal) => cal.id !== data.detail);
	};

	const updateCal = (ctx) => {
		const cal = ctx.detail;
		const testArr = calibrations.filter((item) => item.id !== cal.id);
		const valErrs = validateCalibration(cal, testArr);
		if (valErrs.length > 0) {
			openErrors(valErrs);
			return;
		}

		const curr = calibrations.find((item) => item.id === cal.id);
		const index = calibrations.indexOf(curr);
		calibrations[index] = cal;
	};
</script>

<div class="row">
	<div class="col l2 m2 s2">
		<AddCalibration on:addCalibration={addCalibration} />
	</div>
	<div class="col l2 m2 s2 offset-l2 offset-m2 offset-s2">
		<h5>Calibration</h5>
	</div>
</div>
<div class="input-field">
	<i class="material-icons prefix">search</i>
	<input id="search" type="search" bind:value={searchTerm} />
</div>
{#if filteredList.length === 0}
	<span>
		<i>Empty</i>
	</span>
{:else}
	<ul class="collection">
		{#each filteredList as c (c.name)}
			{#if c.type === "linear"}
				<li class="collection-item">
					<LinearCal
						bind:calibration={c}
						on:deleteCal={deleteCal}
						on:updateCal={updateCal}
					/>
				</li>
			{/if}
		{/each}
	</ul>
	<ul class="collection">
		{#each filteredList as c (c.name)}
			{#if c.type === "enum"}
				<li class="collection-item">
					<EnumCal
						bind:calibration={c}
						on:deleteCal={deleteCal}
						on:updateCal={updateCal}
					/>
				</li>
			{/if}
		{/each}
	</ul>
{/if}

<style>
	.collection {
		overflow: auto;
		max-height: 34vh;
	}
</style>
