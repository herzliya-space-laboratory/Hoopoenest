<script>
	import Part from "./components/pages/Part.svelte";
	import Options from "./components/pages/Options.svelte";
	import ErrorBox from "./components/ErrorBox.svelte";
	import getUnits from "./lib/parseUnits";
	import preParsing from "./lib/preParsing";
	import { validateOnSave } from "./lib/validations";
	import { openErrors, currentPage } from "./stores";

	const fs = require("fs");
	const { dialog } = require("electron").remote;
	const { extname } = require("path");

	const version = "__version";

	let data;
	let units;

	let page = "home";

	const saveFile = () => {
		const valErrs = validateOnSave(data, units);
		if (valErrs.length > 0) {
			openErrors(valErrs);
			return;
		}
		dialog
			.showSaveDialog({
				defaultPath: "MIB.json",
				filters: [
					{
						name: "Mission Information Files (.json)",
						extensions: ["json"],
					},
				],
			})
			.then(parseFileSave);
	};

	const parseFileSave = (dialogRes) => {
		const path = dialogRes.filePath;
		let output;
		const preParsed = preParsing(data);
		switch (extname(path)) {
			case ".json":
				output = JSON.stringify(preParsed);
				break;
		}
		fs.writeFileSync(path, output);
		M.toast({ html: "Saved!", classes: "green" });
	};

	const openFile = () => {
		event.preventDefault();
		dialog
			.showOpenDialog({
				properties: ["openFile"],
				filters: [
					{ name: "Mission Information Files", extensions: ["json"] },
				],
			})
			.then((dialogRes) => {
				parseFileOpen(dialogRes.filePaths[0]);
				M.toast({ html: "Loaded!", classes: "green" });
			});
	};

	const parseFileOpen = (path) => {
		let file;
		try {
			file = fs.readFileSync(path);
		} catch (err) {
			M.toast({ html: "Failed Loading File", classes: "red" });
		}
		switch (extname(path)) {
			case ".json":
				data = JSON.parse(file);
				units = getUnits(data);
				break;
		}
	};

	const initializeNew = () => {
		data = {
			settings: {
				isDefaultLittleEndian: false,
			},
			telemetry: {
				serviceTypes: [],
			},
			telecommands: {
				serviceTypes: [],
			},
			calibrations: [],
		};
		units = new Set();
		M.toast({ html: "Created!", classes: "green" });
	};

	currentPage.subscribe((value) => {
		page = value;
	});
</script>

<main>
	{#if page === "home"}
		<h1 class="center red-text">WORking Mission Specification</h1>

		<div class="container center">
			<a
				href="#!"
				class:disabled={data === undefined}
				on:click={() => currentPage.set("telemetry")}
				class="waves-effect waves-red btn-flat btn-large">
				Telemetry
			</a>
			<a
				href="#!"
				class:disabled={data === undefined}
				on:click={() => currentPage.set("telecommands")}
				class="waves-effect waves-red btn-flat btn-large">
				Telecommands
			</a>
			<a
				href="#!"
				class:disabled={data === undefined}
				on:click={() => currentPage.set("options")}
				class="waves-effect waves-red btn-flat btn-large"> Options </a>
		</div>

		<div class="container center">
			<button
				class="btn waves-effect waves-light green"
				on:click={initializeNew}> Create New </button>
			<button
				class="btn waves-effect waves-light red"
				on:click={openFile}> Open File </button>
			<button
				class:disabled={data === undefined}
				class="btn waves-effect waves-light"
				on:click={saveFile}> Save File As... </button>
		</div>
	{:else if page === "telemetry"}
		<Part bind:data bind:units partName={"telemetry"} />
	{:else if page === "telecommands"}
		<Part bind:data bind:units partName={"telecommands"} />
	{:else if page === "options"}
		<Options bind:units bind:data />
	{/if}

	<p class="center">v{version}</p>

	<ErrorBox />
</main>
