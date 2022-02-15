<script lang="ts">
	import { io } from "socket.io-client";
	import VirtualList from "@sveltejs/svelte-virtual-list";
	import { onMount } from "svelte";
	import type { packet } from "../lib/types";
	import Filter from "../components/telemetry/Filter.svelte";
	import { jsonReviver, parseSocketPacket } from "../lib/parsers";
	import { satellite, satFormat, config } from "../lib/stores";
	import { getSatFields } from "../lib/misc";
	import { filter, filterUrlQuery } from "../lib/filter";
	import Packet from "../components/telemetry/Packet.svelte";

	const satFields = getSatFields("telemetry", $satFormat.fields);

	let packets: packet[] | undefined = undefined;

	let filterQuery: Record<string, any> = {};
	let urlQuery = filterUrlQuery(filterQuery, satFields);

	let showLoadMore = true;
	const numToFetch = 10;

	const socket = io(`${config.apiUrl}?satellite=${$satellite}`);

	socket.on("gotPacket", (newPacket) => {
		if (packets === undefined) return;
		parseSocketPacket(newPacket);
		if (filter(filterQuery, newPacket, satFields, $satFormat.format))
			packets = [newPacket, ...packets];
	});

	async function fetchPackets(skip) {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/telemetry?num=${numToFetch}&skip=${skip}${urlQuery}`
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

	satellite.subscribe(async (sat) => {
		if (mounted) {
			packets = undefined;
			socket.disconnect();
			(socket.io as any).uri = `${config.apiUrl}?satellite=${sat}`;
			socket.connect();
			showLoadMore = true;
			packets = await fetchPackets(0);
		}
	});
</script>

<svelte:head>
	<title>HoopoeNest | Telemetry</title>
</svelte:head>

<h3 class="title"><b>Telemetry</b></h3>
<div class="divider" />
<div class="row" style="height: 85vh">
	{#if packets !== undefined}
		{#if packets.length === 0}
			<p><i>No telemetry found</i></p>
		{:else}
			<br />
			<VirtualList items={[...packets, 0]} let:item>
				{#if item !== 0}
					<Packet packet={item} format={$satFormat.format} />
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
	packetType="telemetry"
	on:filter={async (ctx) => {
		filterQuery = ctx.detail;
		urlQuery = filterUrlQuery(filterQuery, satFields);
		packets = undefined;
		showLoadMore = true;
		packets = await fetchPackets(0);
		if (packets.length < numToFetch) showLoadMore = false;
	}}
/>
