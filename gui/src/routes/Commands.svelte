<script lang="ts">
	import CommandList from "../components/commands/CommandList.svelte";
	import Playlist from "../components/commands/Playlist.svelte";
	import EditCommand from "../components/commands/EditCommand.svelte";
	import PlaylistList from "../components/commands/PlaylistList.svelte";

	import { satellite, endnode, satFormat, config } from "@lib/stores";
	import { jsonReviver, parseSocketPacket } from "@lib/parsers";
	import { io } from "socket.io-client";
	import type { playlist, commandModalState, packet } from "@lib/types";
	import {
		addIds,
		encodePlaylistToSend,
		sendPacket as sendPacketFun,
	} from "@lib/misc";

	const sendPacket = (packet: packet) =>
		sendPacketFun(packet, $endnode, $satellite, $satFormat.format);

	const socket = io(`${config.apiUrl}?satellite=${$satellite}`);

	let currentCommand: packet;
	let commandModalState: commandModalState;

	let formatsRes: Promise<{ name: string }[]> = fetchFormats();

	let playlist: playlist = { packets: [] };

	let sendStepsFun;
	let isLastPacketSendSteps: boolean;

	let isLastPacket: boolean;
	let retryInterval;
	let abortTimeout;
	let sendAutoPlaylistFun;

	socket.on("gotPacket", async (newPacket) => {
		parseSocketPacket(newPacket);
		if (/^ack/i.exec(newPacket.name)) {
			M.toast({
				classes: "green",
				html: "Ack received!",
			});
			if (sendAutoPlaylistFun !== undefined) {
				clearInterval(retryInterval);
				isLastPacket = (await sendAutoPlaylistFun.next()).value;
			}
		}
	});

	satellite.subscribe((sat) => {
		socket.disconnect();
		(socket.io as any).uri = `${config.apiUrl}?satellite=${sat}`;
		socket.connect();
		playlist = { packets: [] };
		formatsRes = fetchFormats();
	});

	async function fetchFormats() {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/telecommands/formats`
		);
		if (!res.ok)
			alert(
				"Couldn't connect to server, please refresh and check server"
			);

		const text = await res.text();
		const formats = JSON.parse(text, jsonReviver);
		if (res.ok) return formats;
		else
			alert(
				"Couldn't connect to server, please refresh and check server"
			);
	}

	function addCommand({ detail: command }) {
		playlist.packets = [...playlist.packets, command];
		currentCommand = undefined;
	}

	function updateCommand({ detail: command }) {
		const idx = playlist.packets.findIndex(({ id }) => command.id === id);
		playlist.packets[idx] = command;
		currentCommand = undefined;
	}

	function deleteCommand({ detail: id }) {
		const idx = playlist.packets.findIndex(
			({ id: itemId }) => itemId === id
		);
		playlist.packets = [
			...playlist.packets.slice(0, idx),
			...playlist.packets.slice(idx + 1),
		];
	}

	function clearPlaylist() {
		if (confirm("Are you sure you want to clear the playlist?"))
			playlist.packets = [];
	}

	async function sendPlaylist() {
		const packets = playlist.packets.map(({ id, ...packet }) => ({
			...packet,
		}));

		let ok = true;
		for (const packet of packets) {
			const res = await sendPacket(packet);
			if (!res) {
				ok = false;
				break;
			}
		}
		if (ok)
			M.toast({
				classes: "green",
				html: "All packets were sent successfully!",
			});
	}

	async function savePlaylist() {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/playlists/${playlist._id}`,
			{
				method: "PUT",
				body: JSON.stringify(
					encodePlaylistToSend(playlist, $satFormat.format)
				),
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		const json = JSON.parse(await res.text(), jsonReviver);
		if (json.success) {
			M.toast({
				classes: "green",
				html: "Playlist saved successfully",
			});
		} else
			M.toast({
				classes: "red",
				html: `Couldn't save: ${json.msg}`,
			});
	}

	async function savePlaylistAs() {
		const name = prompt("Enter name:", playlist.name);

		if (name === null) return;
		if (name === playlist.name)
			M.toast({
				classes: "red",
				html: `Playlist "${name}" already exists`,
			});

		const res = await fetch(`${config.apiUrl}/${$satellite}/playlists`, {
			method: "POST",
			body: JSON.stringify({
				...encodePlaylistToSend(playlist, $satFormat.format),
				name,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});

		const json = JSON.parse(await res.text(), jsonReviver);
		if (json.success) {
			playlist._id = json.id;
			playlist.name = name;
			M.toast({
				classes: "green",
				html: "Playlist created successfully",
			});
		} else
			M.toast({
				classes: "red",
				html: `${json.msg}`,
			});
	}

	async function* sendSteps() {
		commandModalState = "send-steps";
		for (let idx = 0; idx < playlist.packets.length - 1; idx++) {
			currentCommand = playlist.packets[idx];
			await sendPacket(currentCommand);
			const retry: boolean = yield false;
			if (retry) idx--;
		}
		let retry = true;
		while (retry) {
			currentCommand = playlist.packets[playlist.packets.length - 1];
			await sendPacket(currentCommand);
			retry = yield true;
		}
	}

	const retryTime = 5000;
	const abortTime = 15 * 60 * 1000;

	async function* sendAutoPlaylist() {
		commandModalState = "auto";
		for (let idx = 0; idx < playlist.packets.length; idx++) {
			clearInterval(retryInterval);
			currentCommand = playlist.packets[idx];
			await sendPacket(currentCommand);
			retryInterval = setInterval(async () => {
				M.toast({ classes: "yellow black-text", html: "Retrying..." });
				await sendPacket(currentCommand);
			}, retryTime);
			yield idx === playlist.packets.length - 1;
		}
		clearTimeout(abortTimeout);
	}

	const abort = () => {
		sendAutoPlaylistFun = undefined;
		clearInterval(retryInterval);
		clearTimeout(abortTimeout);
	};

	function selectPlaylist(evt) {
		addIds(evt.detail.packets);
		playlist = evt.detail;
	}
</script>

<svelte:head>
	<title>HoopoeNest | Commands</title>
</svelte:head>

<h3 class="title"><b>Commands</b></h3>
<div class="divider" />

<div class="row">
	<div class="col l6">
		{#await formatsRes}
			<p><i>Loading...</i></p>
		{:then formats}
			<CommandList
				commands={formats}
				format={$satFormat.format}
				bind:currCommand={currentCommand}
				bind:commandModalState
			/>
		{/await}
	</div>
	<div class="col l6">
		<h5 class="center">
			<b
				>Playlist:
				{playlist.name === undefined
					? "new playlist"
					: playlist.name}</b
			>
		</h5>
		<Playlist
			bind:playlist={playlist.packets}
			bind:currentCommand
			bind:commandModalState
		/>

		<button class="btn green" on:click={sendPlaylist}
			>Send<i class="material-icons right">send</i></button
		>
		<button
			class="btn modal-trigger"
			data-target="edit-command-modal"
			on:click={async () => {
				sendStepsFun = sendSteps();
				isLastPacketSendSteps = (await sendStepsFun.next(false)).value;
			}}
			>Send Steps<i class="material-icons right">directions_walk</i
			></button
		>
		<button
			class="btn blue-grey modal-trigger"
			data-target="edit-command-modal"
			on:click={async () => {
				sendAutoPlaylistFun = sendAutoPlaylist();
				isLastPacketSendSteps = (await sendAutoPlaylistFun.next())
					.value;
				abortTimeout = setTimeout(abort, abortTime);
			}}>Send Auto<i class="material-icons right">smart_toy</i></button
		>
		<PlaylistList
			on:selectPlaylist={selectPlaylist}
			on:rename={({ detail: { id, name } }) => {
				if (playlist._id === id) {
					playlist.name = name;
				}
			}}
			on:delete={({ detail: id }) => {
				if (playlist._id === id) playlist._id = undefined;
			}}
		/>
		<button class="btn red" on:click={clearPlaylist}
			>Clear<i class="material-icons right">clear</i></button
		>
		<button
			on:click={savePlaylist}
			class="btn yellow black-text"
			disabled={playlist._id === undefined}
			style="margin-top: 0.5em"
		>
			Save
			<i class="material-icons right">save</i></button
		>
		<button
			on:click={savePlaylistAs}
			class="btn pink"
			style="margin-top: 0.5em"
		>
			Save As
			<i class="material-icons right">save</i></button
		>
	</div>
</div>

<EditCommand
	{sendPacket}
	command={currentCommand}
	{commandModalState}
	{isLastPacketSendSteps}
	sendSteps={sendStepsFun}
	on:addCommand={addCommand}
	on:deleteCommand={deleteCommand}
	on:updateCommand={updateCommand}
	on:abort={abort}
/>
