<script lang="ts">
	import Packet from "./Packet.svelte";
	import { onMount } from "svelte";
	import type { packet } from "@lib/types";

	let modal: M.Modal;

	export let format: string;
	let acks: packet[];

	export const open = (newAcks) => {
		acks = newAcks;
		modal.open();
	};

	onMount(() => {
		modal = M.Modal.init(document.getElementById("ackModal"));
	});
</script>

<!-- Modal Structure -->
<div id="ackModal" class="modal">
	<div class="modal-content">
		<h4>Acks</h4>
		{#if acks !== undefined}
			{#each acks as ack}
				<Packet
					packet={{ ...ack, category: "Ack", type: "telemetry" }}
					{format}
				/>
			{/each}
		{/if}
	</div>
	<div class="modal-footer">
		<a href="#!" class="modal-close waves-effect waves-green btn-flat"
			>Close</a
		>
	</div>
</div>
