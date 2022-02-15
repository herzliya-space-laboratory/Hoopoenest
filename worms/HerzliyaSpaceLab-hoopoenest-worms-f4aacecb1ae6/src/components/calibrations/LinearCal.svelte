<script>
	import EditLinearCal from "./EditLinearCal.svelte";
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

<p class="red-text">{calibration.name}</p>
<div class="row">
	<div class="col l10">
		<pre>ƒ(x) = {calibration.m}x + {calibration.b}</pre>
	</div>
	<div class="col l1 m1 s1">
		<a
			href="#!"
			class="waves-effect waves-red btn-flat"
			on:click={deleteCal}>
			<i class="material-icons">delete</i>
		</a>
		<EditLinearCal bind:calibration on:updateCal={updateCal} />
	</div>
</div>
