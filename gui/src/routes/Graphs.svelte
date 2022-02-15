<script lang="ts">
	import { onMount, tick } from "svelte";
	import SelectParam from "../components/graphs/SelectParam.svelte";
	import Graph from "../components/graphs/Graph.svelte";
	import {
		parseGraphData,
		groupParamsFromSameKey,
		validateGraphOptions,
	} from "@lib/graphs";
	import type { packetType } from "@lib/types";
	import { satFormat, satellite, config } from "@lib/stores";
	import { getDateQuery } from "@lib/misc";
	import { jsonReviver } from "@lib/parsers";

	let view: "form" | "graph" = "form";

	let params: {
		paramKey: any;
		packetKey: any;
		packetType: packetType;
		id: number;
	}[] = [
		{
			packetKey: undefined,
			paramKey: undefined,
			packetType: "telemetry",
			id: +new Date(),
		},
	];

	let isStartDate: boolean = false;
	let isEndDate: boolean = false;

	let startDate: string;
	let endDate: string;

	let graphType: "line" | "scatter" = "line";

	let dataRes: Promise<{
		params: { data: { x: Date; y: number }[]; label: string }[];
		annotations: any[];
	}>;

	let dateField: string = "default";

	async function addParam() {
		params = [
			...params,
			{
				packetKey: undefined,
				paramKey: undefined,
				packetType: "telemetry",
				id: +new Date(),
			},
		];

		await tick();

		M.FormSelect.init(
			document.getElementById(`param${params.length - 1}-packet-type`)
		);
	}

	function removeParam(idx: number) {
		params = [...params.slice(0, idx), ...params.slice(idx + 1)];
	}

	async function onGenGraph() {
		if (!validateOptions()) return;
		const toast = M.toast({
			classes: "yellow black-text",
			html: "Please wait, this could take a while...",
			displayLength: Infinity,
		});
		const packetKeys = groupParamsFromSameKey(params, $satFormat.format);
		dataRes = parseGraphData(
			packetKeys,
			await fetchParams(packetKeys),
			$satFormat.format,
			dateField
		);
		view = "graph";
		toast.dismiss();
		params = [];
	}

	async function fetchParams(
		packetKeys: {
			packetKey: any;
			packetType: packetType;
			paramKeys: any[];
		}[]
	) {
		const dateRange = JSON.stringify(
			getDateQuery(
				isStartDate ? startDate : undefined,
				isEndDate ? endDate : undefined
			)
		);
		const arr = [];
		for (const key of packetKeys) {
			const dateName =
				dateField === "default"
					? key.packetType === "telemetry"
						? "groundTime"
						: "sentTime"
					: dateField;
			const dateQuery =
				dateRange !== "{}" ? `&${dateName}=${dateRange}` : "";
			const res = await fetch(
				`${config.apiUrl}/${$satellite}/${
					key.packetType
				}?key=${JSON.stringify(key.packetKey)}${dateQuery}`
			);
			const text = await res.text();
			const json = JSON.parse(text, jsonReviver);
			arr.push(json);
		}
		return arr;
	}

	function validateOptions() {
		const validation = validateGraphOptions(
			isStartDate,
			isEndDate,
			startDate,
			endDate,
			$satFormat.format,
			params
		);
		if (validation !== undefined) {
			alert(validation);
			return false;
		}
		return true;
	}

	satellite.subscribe((s) => {
		params = [];
		dateField = "default";
	});

	onMount(() => {
		M.FormSelect.init(document.getElementById("param0-packet-type"));
	});
</script>

<svelte:head>
	<title>HoopoeNest | Graphs</title>
</svelte:head>

{#if view === "form"}
	<h3 class="title" style="display: inline-block;"><b>Graphs</b></h3>
	<a
		style="display: inline-block; float: right; margin-top: 2em"
		class="btn-floating btn-large waves-effect waves-light red"
		on:click={onGenGraph}
		href="#!"><i class="material-icons">arrow_forward</i></a
	>
	<div class="divider" />

	<div class="row">
		<div class="col s12 m4">
			<div class="card">
				<div class="card-content">
					<span class="card-title">Settings</span>
					<p>Graph type:</p>
					<select
						class="browser-default"
						id="graph-type"
						bind:value={graphType}
					>
						<option value="line">Line</option>
						<option value="scatter">Scatter</option>
					</select>
					<p>Sort by:</p>
					<select
						class="browser-default"
						id="date-field"
						bind:value={dateField}
					>
						<option value="default">Ground Time</option>
						{#each $satFormat.fields.filter((f) => f.type === "datetime" && f.name !== "groundTime" && f.name !== "sentTime") as { name }}
							<option value={name}>{name}</option>
						{/each}
					</select>
					<p>
						<label>
							<input
								type="checkbox"
								class="filled-in"
								bind:checked={isStartDate}
							/>
							<span>From date:</span>
						</label>
					</p>
					<input
						type="datetime-local"
						step="1"
						disabled={!isStartDate}
						bind:value={startDate}
					/>
					<p>
						<label>
							<input
								type="checkbox"
								class="filled-in"
								bind:checked={isEndDate}
							/>
							<span>To date:</span>
						</label>
					</p>
					<input
						type="datetime-local"
						step="1"
						disabled={!isEndDate}
						bind:value={endDate}
					/>
				</div>
			</div>
		</div>

		{#each params as param, idx (param.id)}
			<div class="col s12 m4">
				<div class="card">
					<div class="card-content">
						<span class="card-title">Parameter #{idx + 1}</span>
						<select
							id="param{idx}-packet-type"
							bind:value={param.packetType}
						>
							<option value="telemetry">Telemetry</option>
							<option value="telecommands">Commands</option>
						</select>

						<SelectParam
							bind:key={param.packetKey}
							bind:paramId={param.paramKey}
							type={param.packetType}
						/>
					</div>
					<div class="card-action">
						<a
							href="#!"
							class="black-text"
							on:click={() => removeParam(idx)}
							><i class="material-icons">delete</i></a
						>
					</div>
				</div>
			</div>
		{/each}

		<div class="col s12 m4">
			<p
				class="center-align"
				style="margin-top: 10em; margin-bottom: 10em;"
			>
				<a
					on:click={addParam}
					class="btn-floating btn-large waves-effect waves-light red"
					href="#!"><i class="material-icons">add</i></a
				>
			</p>
		</div>
	</div>
{:else}
	<a
		style="margin-top: 2em"
		class="btn-floating btn-large waves-effect waves-light red"
		href="#!"
		on:click={() => (view = "form")}
		><i class="material-icons left">arrow_back</i>Back</a
	>
	<p style="display: inline;" class="center-align">
		Scroll to zoom y-axis and shift-scroll to zoom x-axis
	</p>
	{#await dataRes}
		<p>Loading...</p>
	{:then graphData}
		<Graph
			type={graphType}
			annotations={graphData.annotations}
			params={graphData.params}
		/>
	{/await}
{/if}
