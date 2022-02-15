<script lang="ts">
	import { satellite, config } from "../../lib/stores";
	import { jsonReviver } from "../../lib/parsers";
	import { packetsToCSV } from "../../lib/csv";
	import type { packetType, satField } from "../../lib/types";
	import { onMount } from "svelte";
	import { saveAs } from "file-saver";
	import dayjs from "dayjs";

	export let urlQuery: string;
	export let packetType: packetType;
	export let format: string;
	export let satFields: satField[];

	let num: number;
	let all: boolean = false;

	async function fetchPackets() {
		const res = await fetch(
			`${config.apiUrl}/${$satellite}/telemetry?${
				!all ? `num=${num}` : ""
			}${urlQuery}`
		);
		const text = await res.text();
		const packets = JSON.parse(text, jsonReviver);
		if (res.ok) {
			return packets;
		} else {
			throw new Error("Couldn't connect to server");
		}
	}

	function saveCSV(csv: string) {
		const blob = new Blob([csv], {
			type: "text/csv;charset=utf-8",
		});
		saveAs(
			blob,
			`${$satellite}-${packetType}-${dayjs().format(
				"DD-MM-YYYYTHH-mm-ss"
			)}.csv`
		);
	}

	async function onDownload() {
		if (all || num > 0) {
			const toast = M.toast({
				classes: "yellow black-text",
				html: "Please wait, this could take a while...",
				displayLength: Infinity,
			});
			const packets = await fetchPackets();
			const csv = packetsToCSV(packets, satFields, format, packetType);
			saveCSV(csv);
			toast.dismiss();
		} else {
			M.toast({
				classes: "red",
				html: "Please select number of packets",
			});
		}
	}

	onMount(() => {
		M.Modal.init(document.getElementById("download-csv-modal"));
	});
</script>

<div id="download-csv-modal" class="modal">
	<div class="modal-content">
		<h4>Download CSV</h4>
		<input
			type="number"
			name="packets-num"
			disabled={all}
			bind:value={num}
		/>
		<label for="packets-num">Number of packets</label>
		<p>
			<label>
				<input type="checkbox" class="filled-in" bind:checked={all} />
				<span>Download All</span>
			</label>
		</p>
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={onDownload}>Download</a
		>
	</div>
</div>
