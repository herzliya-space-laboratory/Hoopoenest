<script lang="ts">
	export let isDisabled: boolean;
	export let date:
		| string
		| { type: "TimeSpan"; secs: number; mins: number; hours: number };
</script>

<p class="right" style="display: inline-block; margin: 0px; float: right;">
	<label>
		<input
			type="checkbox"
			on:change={(evt) => {
				if (!evt.target["checked"])
					date = { type: "TimeSpan", hours: 0, mins: 0, secs: 0 };
				else date = "";
			}}
			checked={!(typeof date === "object")}
			disabled={isDisabled}
		/>
		<span>Exact Date?</span>
	</label>
</p>

{#if typeof date === "object"}
	<div class="row">
		<div class="col l4">
			<span style="font-size: 70%">Hours</span>
			<input
				type="number"
				bind:value={date.hours}
				disabled={isDisabled}
			/>
		</div>
		<div class="col l4">
			<span style="font-size: 70%">Minutes</span>
			<input type="number" bind:value={date.mins} disabled={isDisabled} />
		</div>
		<div class="col l4">
			<span style="font-size: 70%">Seconds</span>
			<input type="number" bind:value={date.secs} disabled={isDisabled} />
		</div>
	</div>
{:else}
	<input
		type="datetime-local"
		bind:value={date}
		step="1"
		disabled={isDisabled}
	/>
{/if}
