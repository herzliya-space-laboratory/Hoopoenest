<script lang="ts">
	// Select which chooses the first value if not chosen
	export let values: any[];
	export let value: any;
	export let isDisabled: boolean;

	$: if (value == undefined) value = values[0];
</script>

<select bind:value disabled={isDisabled} class="browser-default">
	{#each values as v}
		<option value={v}>{v}</option>
	{/each}
</select>
