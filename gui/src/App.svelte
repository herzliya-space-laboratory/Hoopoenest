<script lang="ts">
	import Commands from "./routes/Commands.svelte";
	import Telemetry from "./routes/Telemetry.svelte";
	import Beacons from "./routes/Beacons.svelte";
	import CommandHistory from "./routes/CommandHistory.svelte";
	import NotFound from "./routes/NotFound.svelte";
	import Graphs from "./routes/Graphs.svelte";
	import AutoPlaylist from "./routes/AutoPlaylist.svelte";
	import ConnectionError from "./routes/ConnectionError.svelte";

	import Sidebar from "./components/Sidebar.svelte";

	import router from "page";
	import { satFormat, satellite, setConfig, endnode } from "./lib/stores";

	let isSidebar = false;
	const satellites = fetchConfig();
	satellites.then(() => {
		isSidebar = true;
	});

	async function fetchConfig() {
		const config = await (
			await fetch(
				`${window.location.protocol}//${window.location.host}/config`
			)
		).json();
		setConfig(config);
		const res = await fetch(`${config.apiUrl}/satellites`);
		const sats = await res.json();

		satellite.subscribe(async (value) => {
			if (value !== null) {
				localStorage.setItem("satellite", value);

				const res = await fetch(
					`${config.apiUrl}/${value}/requiredFields`
				);
				satFormat.set(await res.json());
			}
		});

		endnode.subscribe((en) => {
			if (en !== undefined && en !== null)
				localStorage.setItem("endnode", en);
		});
		return sats;
	}

	let page: any;

	router("/", () => (page = Beacons));
	router("/telemetry", () => (page = Telemetry));
	router("/beacons", () => (page = Beacons));
	router("/command-history", () => (page = CommandHistory));
	router("/commands", () => (page = Commands));
	router("/graphs", () => (page = Graphs));
	router("/auto-playlist", () => (page = AutoPlaylist));
	router(
		"/v2",
		() =>
			(window.location.href =
				"https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLahKLy8pQdCM0SiXNn3EfGIXX19QGzUG3")
	);
	router("*", () => (page = NotFound));

	router.start();
</script>

<main class:sidebar={isSidebar}>
	{#await satellites}
		<h1 class="center">Loading...</h1>
	{:then sats}
		<Sidebar
			satellites={sats}
			{page}
		/>{#if $satellite !== null && $satFormat !== null}
			<div class="container">
				<svelte:component this={page} />
			</div>
		{/if}
	{:catch error}
		<ConnectionError />
	{/await}
</main>

<style>
	/* Sidebar */
	header.sidebar,
	main.sidebar,
	footer.sidebar {
		padding-left: 15vw;
	}

	@media only screen and (max-width: 992px) {
		header.sidebar,
		main.sidebar,
		footer.sidebar {
			padding-left: 0;
		}
	}

	/* Container */
	div.container {
		margin: 0 auto;
		max-width: 80vw;
		width: 100%;
	}

	/* Title */
	:global(h3.title) {
		font-size: 1.75vw;
	}
</style>
