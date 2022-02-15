<script lang="ts">
	import { io } from "socket.io-client";
	import { satellite, config } from "../lib/stores";
	import { jsonReviver, parseSocketPacket } from "../lib/parsers";
	import type { packet } from "../lib/types";
	import SubSystemCard from "../components/beacons/SubSystemCard.svelte";

	async function fetchLatestBeacon() {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/telemetry?num=1&name={"$regex":"^beacon$","$options":"i"}`
		);
		if (!res.ok) throw new Error("Couldn't connect to server");

		const text = await res.text();
		const packet = JSON.parse(text, jsonReviver)[0];
		if (packet === undefined) return {};
		const subSystems = groupBySubSystems(packet);
		return { subSystems, groundTime: packet.groundTime };
	}

	function groupBySubSystems(packet: packet) {
		return packet.params.reduce((acc, param) => {
			acc[param.subSystem] = acc[param.subSystem] || [];
			acc[param.subSystem].push(param);
			return acc;
		}, {});
	}

	let groundTime: string;
	let beacon: {
		[key: string]: any[];
	};

	function setBeacon() {
		fetchLatestBeacon().then(({ groundTime: date, subSystems }) => {
			beacon = subSystems;
			groundTime = date?.format("DD/MM/YYYY HH:mm:ss");
		});
	}
	setBeacon();

	const socket = io(`${config.apiUrl}?satellite=${$satellite}`);

	socket.on("gotPacket", (newPacket) => {
		parseSocketPacket(newPacket);
		if (/^beacon$/i.exec(newPacket.name)) {
			groundTime = newPacket.groundTime.format("DD/MM/YYYY HH:mm:ss");
			beacon = groupBySubSystems(newPacket);
		}
	});

	satellite.subscribe((sat) => {
		beacon = undefined;
		groundTime = undefined;
		socket.disconnect();
		(socket.io as any).uri = `${config.apiUrl}?satellite=${sat}`;
		socket.connect();
		setBeacon();
	});
</script>

<svelte:head>
	<title>HoopoeNest | Beacons</title>
</svelte:head>

<h3 class="title">
	<b>Beacons</b>
	{#if groundTime}{" - " + groundTime}{/if}
</h3>
<div class="divider" />

{#if beacon !== undefined}
	<div class="row">
		{#each Object.keys(beacon) as subSystem}
			<SubSystemCard name={subSystem} params={beacon[subSystem]} />
		{/each}
	</div>
{:else}
	<p><i>No beacons found</i></p>
{/if}
