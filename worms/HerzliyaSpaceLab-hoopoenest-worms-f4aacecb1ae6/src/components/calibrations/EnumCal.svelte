<script>
	import EditEnumCal from "./EditEnumCal.svelte";
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let calibration;

	const deleteCal = () => {
		dispatch("deleteCal", calibration.id);
	};

	const updateCal = (ctx) => {
		dispatch("updateCal", ctx.detail);
	};
</script>

<div class="row">
	<div class="col l10">
		<p class="red-text">{calibration.name}</p>
		<ul class="collection">
			{#each calibration.options as { value, name }, i (i)}
				<li class="collection-item">
					<div class="row">
						<div class="col l3 m3 s3">
							<p>{value}</p>
						</div>
						<div class="col l1 m1 s1">
							<p class="center">:</p>
						</div>
						<div class="col l6 m6 s6">
							<p>{name}</p>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
	<div class="col l1">
		<a href="#!" class="waves-effect waves-red btn-flat">
			<i class="material-icons" on:click={deleteCal}>delete</i>
		</a>
		<EditEnumCal bind:calibration on:updateCal={updateCal} />
	</div>
</div>
