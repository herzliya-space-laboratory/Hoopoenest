<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import { satFormat } from "@lib/stores";
	import SelectKey from "./SelectKey.svelte";
	import type { packetType, satField } from "@lib/types";
	import { getSatFields } from "@lib/misc";
	import DownloadCSV from "./DownloadCsv.svelte";

	export let packetType: packetType;
	export let urlQuery: string;

	const dispatch = createEventDispatcher();

	onMount(() => {
		M.FloatingActionButton.init(document.getElementById("fiter-btn"));
		M.Modal.init(document.getElementById("filter-modal"));
	});

	let satFields = getSatFields(packetType, $satFormat.fields);
	let fieldDisplayNameField =
		packetType === "telemetry" ? "telemetryName" : "commandName";

	function getFilter() {
		return satFields.reduce(
			(acc, curr) => ({
				...acc,
				...(curr.type === "datetime" && {
					[curr.name]: { from: undefined, to: undefined },
				}),
			}),
			{
				key:
					$satFormat.format === "MIB"
						? { serviceType: undefined, serviceSubType: undefined }
						: undefined,
			}
		);
	}

	function getIsActive() {
		return satFields.reduce(
			(acc, curr) => ({
				...acc,
				[curr.name]: false,
			}),
			{
				key: false,
			}
		);
	}

	let filter: Record<string, any> = getFilter();
	let isActive: Record<string, boolean> = getIsActive();

	satFormat.subscribe((format) => {
		satFields = getSatFields(packetType, format.fields);
		filter = getFilter();
		isActive = getIsActive();
	});

	function close() {
		dispatch(
			"filter",
			Object.entries(filter).reduce(
				(acc, [name, value]) => ({
					...acc,
					...(isActive[name] && {
						[name]: value,
					}),
				}),
				{}
			)
		);
	}
</script>

<div class="fixed-action-btn" id="fiter-btn">
	<a
		class="btn-floating btn-large waves-effect waves-light red modal-trigger"
		href="#filter-modal"
	>
		<i class="large material-icons">search</i>
	</a>
	<ul>
		<li>
			<a
				class="btn-floating blue modal-trigger"
				href="#download-csv-modal"
				><i class="material-icons">cloud_download</i></a
			>
		</li>
	</ul>
</div>

<!-- Modal Structure -->
<div id="filter-modal" class="modal" style="overflow-x: hidden">
	<div class="modal-content">
		<h4>Filter</h4>

		<p>
			<label>
				<input
					type="checkbox"
					class="filled-in"
					bind:checked={isActive.key}
				/>
				<span>Key:</span>
			</label>
		</p>
		<SelectKey
			bind:key={filter.key}
			type={packetType}
			disabled={!isActive.key}
		/>

		{#each satFields as field}
			<p>
				<label>
					<input
						type="checkbox"
						class="filled-in"
						bind:checked={isActive[field.name]}
					/>
					<span>{field[fieldDisplayNameField]}:</span>
				</label>
			</p>
			{#if field.type === "datetime"}
				<label for="{field.name}-from">From</label>
				<input
					type="datetime-local"
					name="{field.name}-from"
					disabled={!isActive[field.name]}
					bind:value={filter[field.name].from}
					step="1"
				/>
				<label for="{field.name}-to">To</label>
				<input
					type="datetime-local"
					name="{field.name}-to"
					step="1"
					bind:value={filter[field.name].to}
					disabled={!isActive[field.name]}
				/>
			{:else if field.type === "int"}
				<input
					type="number"
					name={field.name}
					bind:value={filter[field.name]}
					disabled={!isActive[field.name]}
				/>
			{:else}
				<p>Type "{field.type}" not supported</p>
			{/if}
		{/each}
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={close}>OK</a
		>
	</div>
</div>

<DownloadCSV format={$satFormat.format} {packetType} {urlQuery} {satFields} />
