<script>
	import UnitList from "../units/UnitList.svelte";
	import CategoryListOptions from "./../categories/CategoryListOptions.svelte";
	import { onMount } from "svelte";
	import { currentPage } from "../../stores.js";

	export let units;
	export let data;

	let part = undefined;

	onMount(() => {
		M.AutoInit();
	});
</script>

<div class="container">
	<div class="row">
		<div class="col l1">
			<a
				href="#!"
				on:click={() => currentPage.set("home")}
				class="btn-floating btn-large waves-effect waves-light red">
				<i class="material-icons">arrow_back</i>
			</a>
		</div>
		<div class="col l6 offset-l2">
			<h2 class="red-text center">Options</h2>
		</div>
	</div>

	<div class="row">
		<div class="col l3">
			<UnitList bind:units />
		</div>

		<div class="col l3">
			<h5 class="center">Part</h5>
			<div class="collection">
				<a
					href="#!"
					class="collection-item"
					class:active={part === "telemetry"}
					on:click={() => (part = "telemetry")}> Telemetry </a>
				<a
					href="#!"
					class="collection-item"
					class:active={part === "telecommands"}
					on:click={() => (part = "telecommands")}> Telecommands </a>
			</div>
		</div>

		<div class="col l3">
			{#if part}
				<CategoryListOptions
					bind:categories={data[part].serviceTypes}
					{part}
				/>
			{:else}
				<span>
					<i>Please select a part</i>
				</span>
			{/if}
		</div>
	</div>
</div>

<style>
	div.container {
		margin: 0 auto;
		max-width: unset;
		width: 95%;
	}
	.collection {
		overflow: auto;
		max-height: 69vh;
	}
</style>
