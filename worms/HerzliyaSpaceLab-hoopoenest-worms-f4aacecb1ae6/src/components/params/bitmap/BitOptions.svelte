<script>
	export let bit;
	export let leftSize;
	export let idx;
	export let calibrations;
	let maxSize = bit.size + leftSize;
	$: maxSize = bit.size + leftSize;

	let curr = { ...bit };
	if (!curr.range) curr.range = {};
	let last = bit;
	$: if (last !== bit) {
		curr = { ...bit };
		if (!curr.range) curr.range = {};
		last = bit;
	}

	import { openErrors } from "../../../stores.js";
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	const saveBit = () => {
		const send = { ...curr };
		if (curr.range.min == null && curr.range.max == null) delete send.range;
		else {
			if (curr.range.min == null) delete send.range.min;
			if (curr.range.max == null) delete send.range.max;
		}
		dispatch("saveBit", send);
	};

	const deleteBit = () => {
		if (window.confirm("Delete?")) {
			dispatch("deleteBit", bit);
		}
	};

	const checkBitSize = () => {
		if (curr.size > maxSize || curr.size < 1) {
			openErrors(["not a valid size of bitfield!"]);
			curr.size = maxSize;
		}
	};
</script>

<div class="row">
	<div class="card">
		<div class="card-content black-text">
			<span class="card-title">Bit Options</span>
			<hr />
			<div>
				Name:
				<div class="input-field inline">
					<input type="text" bind:value={curr.name} />
				</div>
			</div>
			<div>
				Size:
				<div class="input-field inline">
					<input
						type="number"
						max={maxSize}
						min="1"
						bind:value={curr.size}
						on:change={checkBitSize}
					/>
				</div>
			</div>
			<div>
				Calibration:
				<div class="input-field inline">
					<select
						bind:value={curr.calibration}
						class="browser-default">
						<option value={undefined}>
							<i>None</i>
						</option>
						{#each calibrations as { name }}
							<option value={name}>{name}</option>
						{/each}
						{#if !calibrations.find((cal) => cal.id === curr.calibration) && curr.calibration !== undefined}
							<option value={curr.calibration}
								>DOES NOT EXIST</option
							>
						{/if}
					</select>
				</div>
			</div>
			<div>
				Range Start:
				<div class="input-field inline">
					<input
						type="number"
						min={idx + 1}
						max={idx + curr.size}
						bind:value={curr.range.min}
					/>
				</div>
			</div>
			<div>
				Range End:
				<div class="input-field inline">
					<input
						type="number"
						min={idx + 1}
						max={idx + curr.size}
						bind:value={curr.range.max}
					/>
				</div>
			</div>
			<p>
				<label>
					<input type="checkbox" bind:checked={curr.isNull} />
					<span class="black-text">Is null?</span>
				</label>
			</p>
			<div class="card-action">
				<a class="btn green" href="#!" on:click={saveBit}>
					<i class="material-icons">save</i>
					Save
				</a>
				<a class="btn red" href="#!" on:click={deleteBit}>
					<i class="material-icons">delete</i>
					Delete
				</a>
			</div>
		</div>
	</div>
</div>
