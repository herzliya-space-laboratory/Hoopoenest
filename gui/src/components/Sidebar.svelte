<script lang="ts">
	import { satellite, endnode, config } from "../lib/stores";
	import { onMount, tick } from "svelte";
	import { io } from "socket.io-client";

	export let satellites;
	export let page;

	if ($satellite === null || !satellites.includes($satellite))
		$satellite = satellites[0];

	let endnodes: string[] = [];

	$: if (page.name === "Commands" || page.name === "AutoPlaylist") {
		const socket = io(`${config.apiUrl}?satellite=${$satellite}`);
		socket.on("endNodes", async (endNodes: string[]) => {
			endnodes = endNodes;
			if (endNodes.length === 0) $endnode = null;
			else if (
				$endnode === null ||
				endNodes.find((en) => en === $endnode) === undefined
			)
				$endnode = endNodes[0];

			await tick();
			M.FormSelect.init(document.getElementById("select-endnode"));
		});
	}

	onMount(() => {
		M.FormSelect.init(document.getElementById("select-satellite"));
	});
</script>

<ul id="slide-out" class="sidenav sidenav-fixed" style="width: 15vw">
	<li>
		<img
			src="logo.png"
			alt="hoopoenest-logo"
			width="100%"
			style="display: block; margin-left: auto;
  					margin-right: auto; margin-top: 1em"
		/>
	</li>

	<li>
		<div
			style="margin-left: 1.5vw; margin-right: 1.5vw;"
			class="input-field"
		>
			<select bind:value={$satellite} id="select-satellite">
				{#each satellites as sat}
					<option value={sat}>{sat}</option>
				{/each}
			</select>
			<label for="select-satellite">Satellite</label>
		</div>
	</li>
	{#if page.name === "Commands" || page.name === "AutoPlaylist"}
		<li>
			<div
				style="margin-left: 1.5vw; margin-right: 1.5vw;"
				class="input-field"
			>
				<!-- <p style="margin-bottom: 0">EndNode:</p> -->
				<select bind:value={$endnode} id="select-endnode">
					{#each endnodes as en}
						<option value={en}>{en}</option>
					{/each}
				</select>
				<label for="select-endnode">EndNode</label>
			</div>
		</li>
	{/if}

	<li>
		<div class="divider" />
	</li>

	<li class:active={page.name === "Beacons"}>
		<a href="/beacons">Beacons</a>
	</li>
	<li class:active={page.name === "Commands"}>
		<a href="/commands">Commands</a>
	</li>
	<li class:active={page.name === "Telemetry"}>
		<a href="/telemetry">Telemetry</a>
	</li>
	<li class:active={page.name === "Graphs"}>
		<a href="/graphs">Graphs</a>
	</li>
	<li class:active={page.name === "CommandHistory"}>
		<a href="/command-history">Command History</a>
	</li>
	<li class:active={page.name === "AutoPlaylist"}>
		<a href="/auto-playlist">Auto Playlist</a>
	</li>
	<li style="position: absolute; bottom: 0;">
		<p class="center" style="padding: 0px 2em 5em; line-height: 1.5;">
			v{config.version}<br />
			Created with love by Amit Goldenberg, Shahar Zyss and Nikita Weil ❤️
			2020 ©
		</p>
	</li>
</ul>
