<script>
	import AddUnit from "./AddUnit.svelte";

	export let units;

	const addUnit = (newUnit) => {
		units = units.add(newUnit.detail);
	};
	const deleteUnit = (unit) => {
		units.delete(unit);
		units = units;
	};
</script>

<div class="row">
	<div class="col l2 m2 s2">
		<AddUnit on:addUnit={addUnit} />
	</div>
	<div class="col l2 m2 s2 offset-l2 offset-m2 offset-s2">
		<h5>Units</h5>
	</div>
</div>
<ul class="collection">
	{#each [...units] as unit (unit)}
		<li href="#!" class="collection-item">
			{unit}
			<a href="#!" class="waves-effect waves-red btn-flat">
				<i class="material-icons" on:click={() => deleteUnit(unit)}
					>delete</i
				>
			</a>
		</li>
	{/each}
</ul>

<style>
	.collection {
		overflow: auto;
		max-height: 69vh;
	}
</style>
