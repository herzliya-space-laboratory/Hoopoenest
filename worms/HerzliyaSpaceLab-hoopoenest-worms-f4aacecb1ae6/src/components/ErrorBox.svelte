<script>
	import { onMount } from "svelte";
	import { errors } from "../stores";
	let errorList = [];

	const unsubscribe = errors.subscribe((value) => {
		errorList = value;
	});

	const clearErrors = () => {
		errors.set([]);
	};

	onMount(M.AutoInit);
</script>

<!-- Modal Structure -->
<div id="errorBox" class="modal">
	<div class="modal-content">
		<h3>Errors</h3>
		{#each errorList as error}
			<div class="card-panel red">
				<h6 class="white-text">{error}</h6>
			</div>
		{/each}
	</div>
	<div class="modal-footer">
		<a
			href="#!"
			class="modal-close waves-effect waves-green btn-flat"
			on:click={clearErrors}> Close </a>
	</div>
</div>
