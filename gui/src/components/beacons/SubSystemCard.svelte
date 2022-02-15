<script lang="ts">
	import { satFormat } from "../../lib/stores";
	import MIBParam from "../MIB/Param.svelte";

	export let name: string;
	export let params: any[];
</script>

<div class="col l3">
	<div class="card white">
		<div class="card-content black-text">
			<span class="card-title">{name}</span>
			<div class="divider" />
			{#each params as param}
				{#if $satFormat.format === 'MIB'}
					<MIBParam {param} inline={false} />
				{:else}
					<p>Error</p>
				{/if}
			{/each}
		</div>
	</div>
</div>
