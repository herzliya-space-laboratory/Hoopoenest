<script lang="ts">
	import type { telemetryPacket, commandPacket } from "@lib/MIB/types";
	import { getSatFields } from "@lib/misc";
	import { satFormat } from "@lib/stores";
	import { createEventDispatcher } from "svelte";
	import Param from "./Param.svelte";

	const dispatch = createEventDispatcher();

	export let packet: telemetryPacket | commandPacket | undefined;

	const satFields = getSatFields(packet.type, $satFormat.fields, false);
	let fieldDisplayNameField =
		packet.type === "telemetry" ? "telemetryName" : "commandName";
</script>

<div
	class="col"
	class:l12={packet.acks === undefined}
	class:l10={packet.acks !== undefined}
>
	<div class="card-panel">
		<!-- svelte-ignore a11y-missing-attribute -->
		<a class="btn-small inline">{packet.name}</a>
		<p class="inline">Category: {packet.category}</p>
		<p class="inline">
			ST:
			{packet.key.serviceType}, SST:
			{packet.key.serviceSubType}
		</p>

		{#each satFields as field}
			{#if packet[field.name] !== undefined}
				{#if field.type === "datetime"}
					<p class="inline">
						{field[fieldDisplayNameField]}:
						{packet[field.name].format("DD/MM/YYYY HH:mm:ss")}
					</p>
				{:else}
					<p class="inline">
						{field[fieldDisplayNameField]}:
						{packet[field.name]}
					</p>
				{/if}
			{/if}
		{/each}

		<p style="word-break: break-all">Raw: {packet.raw}</p>

		{#if packet.params.length > 0}
			<div class="divider" />
			<p><b>Parameters:</b></p>
			{#each packet.params as param}
				<Param {param} />
			{/each}
		{/if}
	</div>
</div>
{#if packet.acks !== undefined}
	<div class="col l2">
		<div class="card-panel">
			<h6>Acks: {packet.acks.length > 0 ? "✔️" : "➖"}</h6>

			{#if packet.acks.length > 0}
				<button
					class="btn green"
					on:click={() => dispatch("openAck", packet.acks)}
					>Open</button
				>
			{/if}
		</div>
	</div>
{/if}

<style>
	.inline {
		display: inline-block;
		margin-right: 1em;
	}
</style>
