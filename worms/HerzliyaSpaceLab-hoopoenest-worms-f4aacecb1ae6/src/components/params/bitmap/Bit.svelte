<script>
	export let idx;
	export let currentBit;
	export let bit;

	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	const activateBit = (e) => {
		dispatch("activation", bit);
	};

	$: msg = `${idx} - ${idx + bit.size - 1}`;
</script>

<li
	on:click={activateBit}
	class:active={bit === currentBit}
	class="waves-effect"
>
	{#if bit.size > 1}
		<a href="#!">{msg}</a>
	{:else}
		<a href="#!">{idx}</a>
	{/if}
</li>
