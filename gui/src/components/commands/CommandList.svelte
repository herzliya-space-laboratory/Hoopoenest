<script lang="ts">
	import type { commandModalState, packet } from "../../lib/types";

	import MIBCommandsList from "../MIB/CommandList.svelte";

	export let commands: any[];
	export let format: string;

	export let currCommand: packet;
	export let commandModalState: commandModalState;
</script>

{#if format === 'MIB'}
	<MIBCommandsList
		serviceTypes={commands}
		bind:currCommand
		bind:commandModalState />
{:else}
	<p>Unknown Format!</p>
{/if}
