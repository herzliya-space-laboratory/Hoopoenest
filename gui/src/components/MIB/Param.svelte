<script lang="ts">
	import { onMount } from "svelte";
	import type { parameter } from "../../lib/MIB/types";

	export let inline: boolean = true;

	export let param: parameter;

	let unitString: string;
	let paramString: string;
	let valueString: string;
	let color: string;
	let hoverText: string;

	function getColor(param: parameter) {
		if ("range" in param) {
			const range = param.range;
			if (
				("min" in range && param.value < range.min) ||
				("max" in range && param.value > range.max)
			)
				return "red";
			return "green";
		}
		return "black";
	}

	$: {
		unitString = typeof param.unit === "string" ? ` [${param.unit}]` : "";
		if (param.type === "datetime")
			valueString = param.value.format("DD/MM/YYYY HH:mm:ss");
		else valueString = param.value;
		paramString = `${param.name}${unitString}: ${valueString}`;
		color = getColor(param);
		let descText = "";
		if ("description" in param) descText = param.description + "</br>";
		hoverText = descText + `Type: ${param.type}`;
		if ("range" in param) {
			if ("min" in param.range) {
				if (param.type === "datetime")
					hoverText += `</br>Min: ${param.range.min.format(
						"DD/MM/YYYY HH:mm:ss"
					)}`;
				else hoverText += `</br>Min: ${param.range.min}`;
			}
			if ("max" in param.range) {
				if (param.type === "datetime")
					hoverText += `</br>Max: ${param.range.max.format(
						"DD/MM/YYYY HH:mm:ss"
					)}`;
				else hoverText += `</br>Max: ${param.range.max}`;
			}
		}
	}

	onMount(() => {
		const elems = document.querySelectorAll(".tooltipped");
		M.Tooltip.init(elems);
	});
</script>

{#if param.type === "bitmap"}
	<p
		data-position={inline ? "bottom" : "right"}
		data-tooltip={hoverText}
		class="{color}-text tooltipped"
	>
		<u>{param.name}</u>:
	</p>
	{#each param.value as field}
		<svelte:self {inline} param={field} />
	{/each}
{:else}
	<p
		data-position={inline ? "bottom" : "right"}
		class="{color}-text tooltipped"
		class:inline
		data-tooltip={hoverText}
	>
		{paramString}
	</p>
{/if}

<style>
	p.inline {
		display: inline-block;
		padding-right: 1em;
	}
	p:not(.inline) {
		padding-top: 4px;
		display: table;
	}
</style>
