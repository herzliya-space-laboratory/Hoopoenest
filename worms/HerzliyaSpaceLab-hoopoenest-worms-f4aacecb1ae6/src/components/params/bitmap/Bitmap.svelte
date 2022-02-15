<script>
	export let bitArr;
	export let calibrations;
	if (bitArr === undefined) bitArr = [];

	import Bit from "./Bit.svelte";
	import BitOptions from "./BitOptions.svelte";
	import { openErrors } from "../../../stores.js";
	import { validateName, validateRange } from "../../../lib/validations.js";

	const initialBit = {
		size: 1,
		isNull: false,
		name: "",
		range: {},
		calibration: undefined,
	};

	const calcLeftSize = () => {
		return 8 - bitArr.reduce((prev, cur) => prev + cur.size, 0);
	};

	let leftSize = calcLeftSize();
	let currentBit = initialBit;

	const handleClick = (e) => {
		currentBit = bitArr[bitArr.indexOf(e.detail)];
		leftSize = calcLeftSize();
	};

	const handleUpdate = (e) => {
		let errorList = [];
		const checkingArr = bitArr.filter((b) => b !== currentBit);
		const bit = e.detail;
		if (validateName(bit, checkingArr).length > 0) {
			errorList.push(`Bitfield name: "${bit.name}" is not valid`);
		}
		if (
			validateRange(
				bit.range?.min,
				bit.range?.max,
				findBitIdx(currentBit),
				findBitIdx(currentBit) + bit.size
			).length > 0
		) {
			errorList.push(`Bitfield range is not valid`);
		}
		if (errorList.length > 0) openErrors(errorList);
		else {
			bitArr[bitArr.indexOf(currentBit)] = bit;
			currentBit = initialBit;
		}
	};

	const handleDelete = (e) => {
		bitArr = bitArr.filter((bit) => bit != e.detail);
		currentBit = initialBit;
	};

	const findBitIdx = (bit) => {
		return bitArr.indexOf(bit);
	};

	const calculateBitIdx = (i) => {
		return bitArr.slice(0, i).reduce((prev, cur) => prev + cur.size, 0) + 1;
	};
</script>

<ul class="pagination">
	<li>
		<i class="material-icons">chevron_left</i>
	</li>
	{#each bitArr as bit, i (i)}
		{#if i == 0}
			<Bit idx={i + 1} {currentBit} {bit} on:activation={handleClick} />
		{:else}
			<Bit
				idx={calculateBitIdx(i)}
				{currentBit}
				{bit}
				on:activation={handleClick}
			/>
		{/if}
	{/each}
	<li>
		<i class="material-icons">chevron_right</i>
	</li>
</ul>

{#if currentBit != initialBit}
	<BitOptions
		bind:calibrations
		bind:bit={currentBit}
		{leftSize}
		idx={findBitIdx(currentBit)}
		on:saveBit={handleUpdate}
		on:deleteBit={handleDelete}
	/>
{/if}
