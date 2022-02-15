<script lang="ts">
	import type { packet } from "../lib/types";
	import Filter from "../components/telemetry/Filter.svelte";
	import { jsonReviver } from "../lib/parsers";
	import { satellite, satFormat, config } from "../lib/stores";
	import { filterUrlQuery } from "../lib/filter";
	import { getSatFields } from "../lib/misc";
	import Packet from "../components/telemetry/Packet.svelte";
	import AckModal from "../components/telemetry/AckModal.svelte";
	import VirtualList from "@sveltejs/svelte-virtual-list";
	import { onMount } from "svelte";

	const satFields = getSatFields("telecommands", $satFormat.fields);

	let packets: packet[] | undefined = undefined;

	let filterQuery: Record<string, any> = {};
	let urlQuery = filterUrlQuery(filterQuery, satFields);

	let showLoadMore = true;
	const numToFetch = 10;

	async function fetchPackets(skip) {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/telecommands?num=${numToFetch}&skip=${skip}${urlQuery}`
		);
		if (!res.ok)
			alert(
				"Couldn't connect to server, please refresh and check server"
			);

		const text = await res.text();
		const packets = JSON.parse(text, jsonReviver);
		if (res.ok) {
			return packets;
		} else {
			alert(
				"Couldn't connect to server, please refresh and check server"
			);
		}
	}

	function loadMore() {
		const toast = M.toast({
			classes: "yellow black-text",
			html: "Loading...",
			displayLength: Infinity,
		});
		const skip = packets !== undefined ? packets.length : 0;
		fetchPackets(skip).then((data) => {
			if (data.length < numToFetch) {
				showLoadMore = false;
			}
			if (packets === undefined) packets = data;
			else packets = [...packets, ...data];
			toast.dismiss();
		});
	}

	let mounted = false;

	onMount(() => {
		fetchPackets(0).then((data) => {
			if (data.length < numToFetch) showLoadMore = false;
			packets = data;
		});
		mounted = true;
	});

	satellite.subscribe(async () => {
		if (mounted) {
			packets = undefined;
			showLoadMore = true;
			packets = await fetchPackets(0);
		}
	});

	let ackModal;
</script>

<svelte:head>
	<title>HoopoeNest | Command History</title>
</svelte:head>

<h3 class="title"><b>Command History</b></h3>
<div class="divider" />

<div class="row" style="height: 85vh">
	{#if packets !== undefined}
		{#if packets.length === 0}
			<p><i>No commands found</i></p>
		{:else}
			<br />
			<VirtualList items={[...packets, 0]} let:item>
				{#if item !== 0}
					<Packet
						packet={item}
						format={$satFormat.format}
						on:openAck={({ detail: acks }) => ackModal.open(acks)}
					/>
				{:else if showLoadMore}
					<button class="btn" on:click={loadMore}>Load More</button>
				{/if}
			</VirtualList>
		{/if}
	{:else}
		<p>Loading...</p>
	{/if}
</div>

<Filter
	{urlQuery}
	packetType="telecommands"
	on:filter={async (ctx) => {
		filterQuery = ctx.detail;
		urlQuery = filterUrlQuery(filterQuery, satFields);
		packets = undefined;
		showLoadMore = true;
		packets = await fetchPackets(0);
		if (packets.length < numToFetch) showLoadMore = false;
	}}
/>
<AckModal format={$satFormat.format} bind:this={ackModal} />
