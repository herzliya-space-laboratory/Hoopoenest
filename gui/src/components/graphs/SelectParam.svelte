<script lang="ts">
	import type { packetType } from "@lib/types";
	import SelectKey from "../telemetry/SelectKey.svelte";
	import SelectParamMIB from "../MIB/SelectParam.svelte";

	import { satFormat } from "../../lib/stores";

	export let type: packetType = "telemetry";
	export let key;
	export let paramId;
</script>

<SelectKey bind:key disabled={false} {type} />
<p>Parameter:</p>
{#if $satFormat.format === 'MIB'}
	<SelectParamMIB {type} bind:paramId {key} />
{:else}
	<p>UNKNOWN FORMAT</p>
{/if}
