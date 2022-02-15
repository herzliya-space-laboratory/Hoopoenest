<script lang="ts">
	import DatePicker from "../DatePicker.svelte";

	export let field;
	export let command;
	export let isDisabled: boolean;
	export let errorMsg: string | string[] | undefined;
</script>

{#if field.type === 'datetime'}
	<span>{field.commandName}</span>
	<DatePicker bind:date={command[field.name]} {isDisabled} />
{:else if field.type === 'int'}
	<span>{field.commandName}</span>
	<input
		type="number"
		name={field.name}
		bind:value={command[field.name]}
		disabled={isDisabled} />
{:else if field.type === 'boolean'}
	<p>
		<label>
			<input
				name={field.name}
				type="checkbox"
				bind:checked={command[field.name]}
				disabled={isDisabled} />
			<span>{field.commandName}</span>
		</label>
	</p>
{:else}
	<p>Type "{field.type}" not supported</p>
{/if}
{#if errorMsg !== undefined}<span class="red-text">{errorMsg}</span>{/if}
<br />
