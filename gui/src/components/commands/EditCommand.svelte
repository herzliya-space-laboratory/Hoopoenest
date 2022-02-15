<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import MIBEditCommand from "../MIB/EditCommand.svelte";

	import { satFormat } from "../../lib/stores";
	import type { commandModalState, packet } from "../../lib/types";

	export let command: packet;
	export let commandModalState: commandModalState;

	export let sendPacket: (packet: packet) => Promise<boolean>;
	export let sendSteps: AsyncGenerator<boolean, void, boolean>;

	export let isLastPacketSendSteps: boolean;

	const dispatch = createEventDispatcher();

	function addCommand() {
		dispatch("addCommand", command);
	}

	function updateCommand() {
		dispatch("updateCommand", command);
	}

	function deleteCommand() {
		dispatch("deleteCommand", command.id);
	}

	function abort() {
		dispatch("abort")
	}
</script>

{#if $satFormat.format === 'MIB'}
	<MIBEditCommand
		{isLastPacketSendSteps}
		{sendSteps}
		{sendPacket}
		{command}
		{commandModalState}
		on:addCommand={addCommand}
		on:deleteCommand={deleteCommand}
		on:updateCommand={updateCommand}
		on:abort={abort} />
{:else}
	<p>Unknown Format!</p>
{/if}
