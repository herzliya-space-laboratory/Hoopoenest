<script lang="ts">
	import { jsonReviver, parseSocketPacket } from "@lib/parsers";
	import { satellite, satFormat, config } from "@lib/stores";
	import type { packet, playlist } from "@lib/types";
	import { endnode } from "@lib/stores";
	import { sendPacket as sendPacketFun } from "@lib/misc";
	import Select from "svelte-select";
	import CommandModal from "../components/commands/EditCommand.svelte";
	import { io } from "socket.io-client";
	import { onMount } from "svelte";
	import { Modal } from "materialize-css";

	const retryTime = 5000;
	const checkTime = 5000;
	const autoAbortTime = 15 * 60 * 1000;

	const sendPacket = (packet: packet) =>
		sendPacketFun(packet, $endnode, $satellite, $satFormat.format);

	let sendTime: string;
	let playlist: { value: playlist; label: string };
	let playlists: { value: playlist; label: string }[];

	async function fetchPlaylists() {
		const fetchRes = await fetch(
			`${config.apiUrl}/${$satellite}/playlists`
		);
		playlists = JSON.parse(await fetchRes.text(), jsonReviver).map((p) => ({
			value: p,
			label: p.name,
		}));
	}

	fetchPlaylists();

	let currentCommand: packet;
	let sendSteps;
	let isLastPacket: boolean;
	let retryInterval;
	let abortTimeout;

	let commandModal;

	const socket = io(`${config.apiUrl}?satellite=${$satellite}`);

	socket.on("gotPacket", async (newPacket) => {
		parseSocketPacket(newPacket);
		if (/^ack/i.exec(newPacket.name)) {
			M.toast({
				classes: "green",
				html: "Ack received!",
			});
			if (sendSteps !== undefined) {
				clearInterval(retryInterval);
				isLastPacket = (await sendSteps.next()).value;
			}
		}
	});

	async function* sendPlaylistGen() {
		for (let idx = 0; idx < playlist.value.packets.length; idx++) {
			clearInterval(retryInterval);
			currentCommand = playlist.value.packets[idx];
			await sendPacket(currentCommand);
			retryInterval = setInterval(async () => {
				M.toast({ classes: "yellow black-text", html: "Retrying..." });
				await sendPacket(currentCommand);
			}, retryTime);
			yield idx === playlist.value.packets.length - 1;
		}
		clearInterval(retryInterval);
		clearTimeout(abortTimeout);
	}

	const abort = () => {
		sendSteps = undefined;
		clearInterval(retryInterval);
		clearTimeout(abortTimeout);
		commandModal.close();
	};

	const coeff = 1000 * 60;
	setInterval(async () => {
		if (
			typeof sendTime === "string" &&
			Math.round(Date.now() / coeff) * coeff ===
				new Date(sendTime).getTime()
		) {
			if (typeof $endnode === "string" && playlist !== undefined) {
				sendSteps = sendPlaylistGen();
				isLastPacket = (await sendSteps.next()).value;
				commandModal.open();
				abortTimeout = setTimeout(abort, autoAbortTime);
			} else {
				M.toast({
					classes: "red",
					html: "Please select an endnode and a playlist",
				});
			}
		}
	}, checkTime);

	onMount(() => {
		commandModal = M.Modal.init(
			document.getElementById("edit-command-modal")
		);
	});
</script>

<svelte:head>
	<title>HoopoeNest | Auto Playlist</title>
</svelte:head>

<h3 class="title"><b>Auto Playlist</b></h3>
<div class="divider" />

<div class="row">
	<div class="col s6">
		<div class="card">
			<div class="card-content black-text">
				{#if playlists === undefined}
					<p>Loading...</p>
				{:else}
					<p>Select playlist:</p>
					<Select items={playlists} bind:selectedValue={playlist} />

					<p>When to send?</p>
					<input type="datetime-local" bind:value={sendTime} />
				{/if}
			</div>
		</div>
	</div>
</div>

<CommandModal
	commandModalState="auto"
	command={currentCommand}
	on:abort={abort}
/>
