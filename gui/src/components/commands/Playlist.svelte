<script lang="ts">
	import MIBPlaylist from "../MIB/Playlist.svelte";

	import { satFormat } from "../../lib/stores";
	import type { commandModalState, packet } from "../../lib/types";

	export let playlist: packet[] = [];
	export let currentCommand: packet;
	export let commandModalState: commandModalState;
</script>

{#if $satFormat.format === 'MIB'}
	<MIBPlaylist bind:playlist bind:currentCommand bind:commandModalState />
{:else}
	<p>Unknown Format!</p>
{/if}
