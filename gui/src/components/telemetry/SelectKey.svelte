<script lang="ts">
	import type { packetType } from "@lib/types";

	import { satFormat, satellite, config } from "../../lib/stores";
	import MIBkey from "../MIB/SelectKey.svelte";

	export let key;
	export let disabled: boolean = false;
	export let type: packetType = "telemetry";

	$: keysRes = getKeys(type);

	async function getKeys(type: packetType) {
		const res = await fetch(`${config.apiUrl}/${$satellite}/${type}/keys`);
		return await res.json();
	}
</script>

{#await keysRes}
	<p>Wait...</p>
{:then value}
	{#if $satFormat.format === "MIB"}
		<MIBkey bind:key {disabled} serviceTypes={value} />
	{:else}
		<p>UNKNOWN FORMAT</p>
	{/if}
{/await}
