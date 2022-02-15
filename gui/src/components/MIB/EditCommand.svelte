<script lang="ts">
	import { onMount, createEventDispatcher, tick } from "svelte";

	import { satFormat } from "@lib/stores";
	import type { packet } from "@lib/MIB/types";
	import { getSatFields } from "@lib/misc";
	import { validate } from "@lib/MIB/validation";
	import type { commandModalState } from "@lib/types";
	import EditParam from "./EditParam.svelte";
	import EditField from "./EditField.svelte";

	export let command: packet;
	export let commandModalState: commandModalState;

	export let sendPacket: (packet: packet) => Promise<boolean>;
	export let sendSteps: AsyncGenerator<boolean, void, boolean>;

	const dispatch = createEventDispatcher();
	let satFields = getSatFields("telecommands", $satFormat.fields, true);

	let modal;
	let errorMsgs: Record<string, string | string[]> = {};

	export let isLastPacketSendSteps: boolean;

	$: isDisabled =
		commandModalState === "auto" || commandModalState === "send-steps";

	function checkErrors(errors) {
		if (Object.keys(errors).length === 0) return true;
		for (const key in errors) {
			if (!Array.isArray(errors[key])) return false;
			for (const msg of errors[key]) {
				if (msg !== undefined) return false;
			}
		}
		return true;
	}

	function addCommand() {
		const errors = validate(command, satFields);
		if (checkErrors(errors)) {
			command.id = +new Date();
			dispatch("addCommand", command);
			modal.close();
		}
		errorMsgs = errors;
	}

	function updateCommand() {
		const errors = validate(command, satFields);
		if (checkErrors(errors)) {
			dispatch("updateCommand", command);
			modal.close();
		}
		errorMsgs = errors;
	}

	function deleteCommand() {
		const errors = validate(command, satFields);
		if (checkErrors(errors)) {
			dispatch("deleteCommand", command.id);
			modal.close();
		}
		errorMsgs = errors;
	}

	async function sendCommand() {
		const errors = validate(command, satFields);
		if (checkErrors(errors)) {
			await sendPacket(command);
			modal.close();
		}
		errorMsgs = errors;
	}

	function abort() {
		dispatch("abort");
	}

	function redrawCommandModal(command) {
		if (command !== undefined) {
			const modal = document.getElementById("edit-command-modal");

			// Remove remaining selects
			// modal
			// 	?.querySelectorAll(".select-wrapper")
			// 	.forEach((elem) => elem.remove());

			tick().then(() => {
				M.Tooltip.init(modal.querySelectorAll(".tooltipped"));
				// M.FormSelect.init(modal.querySelectorAll("select"));
			});
		}
	}

	$: redrawCommandModal(command);

	$: {
		if (command !== undefined) {
			command?.params.forEach((p) => {
				if (p.type === "datetime" && p.value === undefined)
					p.value = {
						type: "TimeSpan",
						hours: 0,
						mins: 0,
						secs: 0,
					};
			});
			satFields.forEach((field) => {
				if (command?.[field.name] === undefined) {
					if (field.type === "datetime")
						command[field.name] = {
							type: "TimeSpan",
							hours: 0,
							mins: 0,
							secs: 0,
						};
					else if (field.type === "boolean")
						command[field.name] = false;
				}
			});
		}
	}

	satFormat.subscribe((format) => {
		satFields = getSatFields("telecommands", format.fields, true);
	});

	onMount(() => {
		modal = M.Modal.init(document.getElementById("edit-command-modal"));
	});
</script>

<div id="edit-command-modal" class="modal">
	{#if command !== undefined}
		<div class="modal-content">
			<h4>{command.name}</h4>
			{#each command.params as param}
				<EditParam
					{param}
					{isDisabled}
					errorMsg={errorMsgs[param.name]}
				/>
			{/each}

			{#each satFields as field}
				<EditField
					{command}
					{field}
					{isDisabled}
					errorMsg={errorMsgs[field.name]}
				/>
			{/each}
		</div>

		<div class="modal-footer">
			{#if commandModalState === "new-command" || commandModalState == "existing-command"}
				<a
					on:click={sendCommand}
					href="#!"
					class="waves-effect waves-blue btn-flat"
					>Send<i class="material-icons right">send</i></a
				>
			{/if}
			{#if commandModalState === "send-steps"}
				<a
					href="#!"
					class="waves-effect waves-green btn-flat"
					on:click={async () =>
						(isLastPacketSendSteps = !!(await sendSteps.next(true))
							.value)}
				>
					Resend<i class="material-icons right">refresh</i></a
				>
				{#if !isLastPacketSendSteps}
					<a
						href="#!"
						class="waves-effect waves-green btn-flat"
						on:click={async () =>
							(isLastPacketSendSteps = !!(
								await sendSteps.next(false)
							).value)}
					>
						Send Next<i class="material-icons right"
							>arrow_forward</i
						></a
					>
				{/if}
			{:else if commandModalState === "new-command"}
				<a
					href="#!"
					class="waves-effect waves-green btn-flat"
					on:click={addCommand}
					>Add to playlist<i class="material-icons right">add</i></a
				>
			{:else if commandModalState !== "auto"}
				<a
					href="#!"
					class="waves-effect waves-green btn-flat"
					on:click={updateCommand}
					>Save<i class="material-icons right">save</i></a
				>
				<a
					href="#!"
					class="modal-close waves-effect waves-red btn-flat"
					on:click={deleteCommand}
					>Delete<i class="material-icons right">delete</i></a
				>
			{/if}
			<a
				href="#!"
				class="modal-close waves-effect waves-red btn-flat"
				on:click={abort}
				>Abort<i class="material-icons right">cancel</i></a
			>
		</div>
	{:else}
		<p>Please choose a command</p>
	{/if}
</div>
