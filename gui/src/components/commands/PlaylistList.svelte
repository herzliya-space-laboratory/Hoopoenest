<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import { satellite, config } from "@lib/stores";
	import { jsonReviver } from "@lib/parsers";
	import type { playlist } from "@lib/types";
	import { parsePlaylistsDayJsToString } from "@lib/misc";

	let playlists: playlist[];

	const dispatch = createEventDispatcher();

	let mouseHoverIdx = null;
	let modal;

	async function fetchPlaylists() {
		const fetchRes = await fetch(
			`${config.apiUrl}/${$satellite}/playlists`
		);
		playlists = JSON.parse(
			await fetchRes.text(),
			jsonReviver
		) as playlist[];
		parsePlaylistsDayJsToString(playlists);
	}

	async function deletePlaylist(id: string) {
		if (confirm("Are you sure you wat to proceed?")) {
			const res = await fetch(
				`${config.apiUrl}/${$satellite}/playlists/${id}`,
				{
					method: "DELETE",
				}
			);
			const json = JSON.parse(await res.text(), jsonReviver);

			if (json.success) {
				const playlistIdx = playlists.findIndex((p) => p._id === id);
				const playlist = playlists[playlistIdx];
				playlists = [
					...playlists.slice(0, playlistIdx),
					...playlists.slice(playlistIdx + 1, playlists.length),
				];
				M.toast({
					classes: "green",
					html: `Playlist "${playlist.name}" was deleted successfully`,
				});

				dispatch("delete", id);
			} else
				M.toast({
					classes: "red",
					html: `Failed to delete playlist`,
				});
		}
	}

	async function renamePlaylist(id: string) {
		const playlistIdx = playlists.findIndex((p) => p._id === id);
		const name = prompt("Enter name:", playlists[playlistIdx].name);

		if (name === null) return;
		if (
			playlists.find((p) => p.name === name && p._id !== id) === undefined
		) {
			const res = await fetch(
				`${config.apiUrl}/${$satellite}/playlists/${id}`,
				{
					method: "PUT",
					body: JSON.stringify({ ...playlists[playlistIdx], name }),
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			const json = JSON.parse(await res.text(), jsonReviver);
			if (json.success) {
				playlists[playlistIdx].name = name;
				dispatch("rename", { id: playlists[playlistIdx]._id, name });
				M.toast({
					classes: "green",
					html: "Name changed successully",
				});
			} else
				M.toast({
					classes: "red",
					html: `Couldn't rename: ${json.msg}`,
				});
		} else
			M.toast({
				classes: "red",
				html: `Playlist "${name}" already exists`,
			});
	}

	function selectPlaylist(playlist: playlist) {
		dispatch("selectPlaylist", playlist);
		modal.close();
	}

	onMount(() => {
		modal = M.Modal.init(document.getElementById("playlists-modal"));
	});
</script>

<button
	class="btn blue modal-trigger"
	href="#playlists-modal"
	on:click={fetchPlaylists}
	>Playlists<i class="material-icons right">list</i></button
>

<!-- Modal Structure -->
<div id="playlists-modal" class="modal">
	<div class="modal-content">
		<h4>Playlists</h4>
		{#if playlists === undefined}
			<p>Please wait...</p>
		{:else if playlists.length === 0}
			<p>No playlists found</p>
		{:else}
			<div style="overflow: auto; max-height: 50vh;">
				{#each playlists as playlist, idx}
					<div
						style="margin: 0px"
						class="row"
						on:mouseenter={() => (mouseHoverIdx = idx)}
						on:mouseleave={() => (mouseHoverIdx = null)}
					>
						<div class="col l11">
							<a href="#!">
								<div
									class="card-panel"
									on:click={() => selectPlaylist(playlist)}
								>
									<div>
										<h6
											class="black-text"
											style="display: inline-block; margin: 0px;"
										>
											{playlist.name}
										</h6>
									</div>
								</div>
							</a>
						</div>
						<div class="col l1" style="margin-top: 2em">
							{#if mouseHoverIdx === idx}
								<a
									on:click={() =>
										renamePlaylist(playlist._id)}
									href="#!"
									style="display: inline-block; float: right; margin-left: 0.75em;"
									><i class="material-icons teal-text">edit</i
									></a
								>
								<a
									on:click={() =>
										deletePlaylist(playlist._id)}
									href="#!"
									style="display: inline-block; float: right;"
									><i class="material-icons teal-text"
										>delete</i
									></a
								>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={() => (playlists = [])}>Close</a
		>
	</div>
</div>
