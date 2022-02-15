<script>
	import { createEventDispatcher } from "svelte";
	import Bitmap from "./bitmap/Bitmap.svelte";
	import config from "../../lib/config";

	const dispatch = createEventDispatcher();
	export let param;
	export let calibrations;
	export let units;

	$: console.log(curr);

	const types = Object.keys(config.types);

	let bitfield = {
		size: 1,
		isNull: false,
		name: "",
		range: {},
		calibration: undefined,
	};

	let last = param;
	let curr = { ...param };
	parseParamDateRange(curr);
	if (!curr.range) curr.range = {};
	$: if (last !== param) {
		curr = { ...param };
		if (!curr.range) curr.range = {};
		parseParamDateRange(curr);
		last = param;
	}

	function dateToISOString(input) {
		const [date, time] = input.split(" ");
		const [day, month, year] = date.split("/");
		const [hours, mins, secs] = time.split(":");
		return `${year}-${month}-${day}T${hours}:${mins}:${secs}`;
	}

	function parseParamDateRange(param) {
		if (param.type === "datetime") {
			if (param.range?.min)
				param.range.min = dateToISOString(param.range.min);
			if (param.range?.max)
				param.range.max = dateToISOString(param.range.max);
		}
	}

	$: isRangePossible = curr.type !== "buffer" && curr.type !== "bitmap";

	$: if (curr.type === "buffer" || curr.type === "bitmap") {
		delete curr.range.min;
		delete curr.range.max;
	}

	$: if (curr.type !== "buffer") {
		curr.size = undefined;
	}

	$: if (curr.type === "byte" || curr.type === "bitmap") {
		curr.isLittleEndian = undefined;
	}

	$: if (curr.type === "bitmap") {
		curr.calibration = undefined;
	} else curr.bitfields = undefined;

	const deleteParam = () => {
		dispatch("deleteParam");
	};

	const addBitfield = () => {
		if (curr.bitfields.reduce((prev, cur) => prev + cur.size, 0) < 8) {
			curr.bitfields = [...curr.bitfields, bitfield];
			bitfield = {
				size: 1,
				isNull: false,
				name: "",
				range: {},
				calibration: undefined,
			};
		}
	};

	const updateParam = () => {
		const send = { ...curr };
		if (curr.range.min == null && curr.range.max == null) delete send.range;
		else {
			if (curr.range.min == null) delete send.range.min;
			if (curr.range.max == null) delete send.range.max;
		}
		dispatch("updateParam", send);
	};

	const duplicateParam = () => {
		dispatch("duplicateParam");
	};
</script>

<div class="card white black-text">
	<div class="card-content">
		<p>Name:</p>
		<input type="text" bind:value={curr.name} />

		<div class="input-field">
			<p>Description:</p>
			<textarea
				class="materialize-textarea"
				bind:value={curr.description}
			/>
		</div>

		<p>Type:</p>
		<select bind:value={curr.type} class="browser-default">
			{#each types as type}
				<option value={type}>{type}</option>
			{/each}
		</select>

		{#if curr.type !== "byte" || curr.type !== "bitmap"}
			<p>
				<label>
					<input type="checkbox" bind:checked={curr.isLittleEndian} />
					<span class="black-text">Is Little Endian?</span>
				</label>
			</p>
		{/if}

		<div>
			Unit:
			<select bind:value={curr.unit} class="browser-default">
				<option value={undefined}>
					<i>None</i>
				</option>
				{#each [...units] as unit}
					<option value={unit}>{unit}</option>
				{/each}
				{#if !units.has(curr.unit) && (curr.unit || curr.unit == 0)}
					<option value={curr.unit}>{curr.unit}</option>
				{/if}
			</select>
		</div>

		{#if isRangePossible}
			{#if curr.type === "datetime"}
				<p>Range:</p>
				<div>
					From:
					<div class="input-field inline">
						<input
							type="datetime-local"
							bind:value={curr.range.min}
							step="1"
						/>
					</div>
				</div>
				<div>
					To:
					<div class="input-field inline">
						<input
							type="datetime-local"
							bind:value={curr.range.max}
							step="1"
						/>
					</div>
				</div>
			{:else}
				<div class="row">
					<div class="col l2 m2 s2">
						<p>Range:</p>
					</div>
					<div class="col l4 s4">
						<input type="number" bind:value={curr.range.min} />
					</div>
					<div class="col l1">
						<p>-</p>
					</div>
					<div class="col l4 s4">
						<input type="number" bind:value={curr.range.max} />
					</div>
				</div>
			{/if}
		{/if}

		{#if curr.type === "buffer"}
			<div>
				Size:
				<div class="input-field inline">
					<input type="text" bind:value={curr.size} />
				</div>
			</div>
		{/if}

		{#if curr.type === "bitmap"}
			<p>Bitfields:</p>
			<div class="row">
				<div class="col">
					<Bitmap bind:bitArr={curr.bitfields} bind:calibrations />
				</div>
				<div class="col">
					<a
						class="btn-floating waves-effect"
						href="#!"
						on:click={addBitfield}>
						<i class="material-icons">add</i>
					</a>
				</div>
			</div>
		{/if}

		{#if curr.type !== "bitmap" && curr.type !== "buffer"}
			<p>Calibration:</p>
			<select bind:value={curr.calibration} class="browser-default">
				<option value={undefined}>
					<i>None</i>
				</option>
				{#each calibrations as { name, type }}
					{#if !(curr.type === "datetime" && type === "enum")}
						<option value={name}>{name}</option>
					{/if}
				{/each}
				{#if !calibrations.find((cal) => cal.name === curr.calibration) && curr.calibration !== undefined}
					<option value={curr.calibration}>DOES NOT EXIST</option>
				{/if}
			</select>
		{/if}

		<div>
			Sub-System:
			<div class="input-field inline">
				<input type="text" bind:value={curr.subSystem} />
			</div>
		</div>

		<div class="row">
			<div class="col l3">
				<a
					on:click={updateParam}
					href="#!"
					class="waves-effect waves-green btn-flat"> Save </a>
			</div>
			<div class="col l3">
				<a
					on:click={duplicateParam}
					href="#!"
					class="waves-effect waves-yellow btn-flat"> Duplicate </a>
			</div>
			<div class="col l2 offset-l4">
				<a
					on:click={deleteParam}
					href="#!"
					class="waves-effect waves-red btn-flat">
					<i class="material-icons">delete</i>
				</a>
			</div>
		</div>
	</div>
</div>
