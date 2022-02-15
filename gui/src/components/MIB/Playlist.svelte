<script lang="ts">
	import { flip } from "svelte/animate";
	import { onMount, tick } from "svelte";
	import { dndzone } from "svelte-dnd-action";
	import type { packet } from "@lib/MIB/types";
	import rfdc from "rfdc";
	import { satFormat } from "@lib/stores";
	import { getSatFields } from "@lib/misc";
	import dayjs from "dayjs";
	import type { commandModalState } from "@lib/types";

	export let playlist: packet[];

	export let currentCommand: packet;
	export let commandModalState: commandModalState;

	let satFields = getSatFields("telecommands", $satFormat.fields, true);

	const clone = rfdc();

	const flipDurationMs = 200;

	function handleDndConsider(e) {
		playlist = e.detail.items;
	}
	function handleDndFinalize(e) {
		playlist = e.detail.items;
	}

	function initTooltips() {
		const elems = document.querySelectorAll(".tooltipped");
		M.Tooltip.init(elems);
	}

	$: {
		playlist;
		tick().then(initTooltips);
	}

	function paramTooltipText(command: packet) {
		return command.params
			.reduce((str, param) => {
				if (param.type === "bitmap") {
					return (
						`<u>${param.name}</u>:<br/>` +
						param.value.reduce(
							(str, bitfield) =>
								`${str}${bitfield.name}: ${bitfield.value}<br/>`,
							""
						)
					);
				}
				const valueStr =
					param.type === "datetime"
						? typeof param.value === "object"
							? `in ${param.value.hours}:${param.value.mins}:${param.value.secs}`
							: dayjs(param.value).format("DD/MM/YYYY HH:mm:ss")
						: param.value;
				return str + `${param.name}: ${valueStr}<br/>`;
			}, "")
			.concat(
				satFields.reduce((str, field) => {
					const valueStr =
						field.type === "datetime"
							? typeof command[field.name] === "object"
								? `in ${command[field.name].hours}:${
										command[field.name].mins
								  }:${command[field.name].secs}`
								: dayjs(command[field.name]).format(
										"DD/MM/YYYY HH:mm:ss"
								  )
							: command[field.name];
					return str + `${field.commandName}: ${valueStr}<br/>`;
				}, "")
			);
	}

	onMount(initTooltips);

	satFormat.subscribe((format) => {
		satFields = getSatFields("telecommands", format.fields, true);
	});
</script>

<section
	class="collection"
	use:dndzone={{ items: playlist, flipDurationMs, dropTargetStyle: {} }}
	on:consider={handleDndConsider}
	on:finalize={handleDndFinalize}
>
	{#each playlist as command, i (command.id)}
		<a
			data-position="left"
			data-tooltip={paramTooltipText(command)}
			href="#edit-command-modal"
			class="collection-item tooltipped modal-trigger"
			animate:flip={{ duration: flipDurationMs }}
			on:click={() => {
				currentCommand = clone(command);
				commandModalState = "existing-command";
			}}
		>
			<p style="display: inline-block; margin: 0px;">
				{i + 1}.
				{command.name}
			</p>
			<p style="display: inline-block; margin: 0px; float: right;">
				({command.key.serviceType},{command.key.serviceSubType})
			</p></a
		>
	{/each}
</section>

<style>
	.collection {
		overflow: auto;
		max-height: 72vh;
		list-style-type: none;
	}
</style>
