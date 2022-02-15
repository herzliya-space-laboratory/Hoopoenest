<script lang="ts">
	import type { parameter } from "@lib/MIB/types";
	import DatePicker from "../DatePicker.svelte";
	import CustomSelect from "../CustomSelect.svelte";

	export let param: parameter;
	export let isDisabled: boolean;
	export let errorMsg: string | string[] | undefined;

	$: if (param.type === "bitmap") {
		if (!Array.isArray(param.value)) param.value = param.bitfields;
		if (!Array.isArray(errorMsg)) errorMsg = [];
	}

	function displayUnit(param: parameter) {
		if (param.unit !== undefined) return `${param.name} [${param.unit}]`;
		return param.name;
	}
</script>

{#if param.type !== "bitmap"}
	<span
		class:tooltipped={Boolean(param.description)}
		data-position="right"
		data-tooltip={param.description}>{displayUnit(param)}</span
	>
{:else}
	<span
		class:tooltipped={Boolean(param.description)}
		data-position="right"
		data-tooltip={param.description}><u>{displayUnit(param)}</u>:</span
	>
{/if}

{#if param.type === "datetime"}
	<DatePicker bind:date={param.value} {isDisabled} />
{:else if param.type === "int" || param.type === "float"}
	<input
		type="number"
		name={param.name}
		bind:value={param.value}
		disabled={isDisabled}
	/>
{:else if param.type === "enum"}
	<CustomSelect values={param.values} bind:value={param.value} {isDisabled} />
{:else if param.type === "buffer"}
	<input
		type="text"
		name={param.name}
		bind:value={param.value}
		disabled={isDisabled}
	/>
{:else if param.type === "bitmap"}
	<br />
	{#if Array.isArray(param.value)}
		{#each param.value as field, idx}
			<svelte:self param={field} {isDisabled} errorMsg={errorMsg[idx]} />
		{/each}
	{/if}
{:else}
	<p>Type "{param.type}" not supported</p>
{/if}
{#if errorMsg !== undefined && param.type !== "bitmap"}
	<span class="red-text">{errorMsg}</span>
{/if}
<br />
