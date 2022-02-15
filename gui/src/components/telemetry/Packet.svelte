<script lang="ts">
	import { createEventDispatcher } from "svelte";
	import MIBPacket from "../MIB/Packet.svelte";

	const dispatch = createEventDispatcher();

	export let packet: any;
	export let format: string;
</script>

{#if format === "MIB"}
	<MIBPacket
		{packet}
		on:openAck={({ detail: ack }) => dispatch("openAck", ack)}
	/>
{:else}
	<p>Unknown Format!</p>
{/if}
