<script>
	import {
		validateParam,
		validateCategory,
		validateName,
	} from "../../lib/validations.js";
	import { duplicate, deleteEmptyStrings } from "../../lib/utilities.js";
	import { openErrors, currentPage } from "../../stores.js";

	import ParamOptions from "../params/ParamOptions.svelte";
	import AddParam from "../params/AddParam.svelte";
	import ParamList from "../params/ParamList.svelte";

	import CalList from "../calibrations/CalList.svelte";

	import SSTList from "../ssts/SSTList.svelte";
	import AddSST from "../ssts/AddSST.svelte";
	import SSTOptions from "../ssts/SSTOptions.svelte";

	import CategoryList from "../categories/CategoryList.svelte";

	import { onMount } from "svelte";

	export let partName;
	export let data;
	export let units;

	let part = data[partName];
	let category;
	let sst;
	let param;

	const addSST = (newSST) => {
		if (category) {
			const errs = validateCategory(
				newSST.detail,
				category.serviceSubTypes
			);
			if (errs.length > 0) {
				openErrors(errs);
				return;
			}
			category.serviceSubTypes = [
				...category.serviceSubTypes,
				newSST.detail,
			];
			sst = category.serviceSubTypes[category.serviceSubTypes.length - 1];
			param = null;
		}
	};

	const deleteSST = () => {
		if (category)
			category.serviceSubTypes = category.serviceSubTypes.filter(
				(item) => item.id !== sst.id
			);
		sst = null;
		param = null;
	};

	const updateSST = (newSST) => {
		const testArr = category.serviceSubTypes.filter((elem) => elem !== sst);
		const errs = validateCategory(newSST.detail, testArr);
		if (errs.length > 0) {
			openErrors(errs);
			return;
		}
		const index = category.serviceSubTypes.indexOf(sst);
		sst = newSST.detail;
		category.serviceSubTypes[index] = newSST.detail;
	};

	const addParam = (newParam) => {
		if (sst) {
			const errs = validateName(newParam.detail, sst.params);
			if (errs !== "") {
				openErrors([errs]);
				return;
			}
			sst.params = [...sst.params, newParam.detail];
			param = sst.params[sst.params.length - 1];
		}
	};

	const deleteParam = () => {
		const index = sst.params.indexOf(param);
		sst.params = sst.params.filter((item) => item !== param);
		param = sst.params[index - 1];
	};

	const updateParam = (newParam) => {
		// try {
			const testArr = sst.params.filter((elem) => elem !== param);
			const errs = validateParam(newParam.detail, testArr);
			if (errs.length > 0) {
				openErrors(errs);
				return;
			}
			const index = sst.params.indexOf(param);
			param = newParam.detail;
			sst.params[index] = newParam.detail;
			parseParamDateRange(sst.params[index]);
			deleteEmptyStrings(sst.params[index]);
			M.toast({ html: "Saved!", classes: "green" });
		// } catch (err) {
		// 	M.toast({ html: err, classes: "red" });
		// }
	};

	const duplicateParam = () => {
		sst.params = duplicate(param, sst.params);
	};

	const duplicateSST = () => {
		category.serviceSubTypes = duplicate(sst, category.serviceSubTypes);
	};

	function parseISOString(iso) {
		const [date, time] = iso.split("T");
		const [year, month, day] = date.split("-");
		const [hours, mins, secs] = time.split(":");
		return `${day}/${month}/${year} ${hours}:${mins}:${secs ? secs : "00"}`;
	}

	function parseParamDateRange(param) {
		if (param.type === "datetime") {
			if (param.range?.min)
				param.range.min = parseISOString(param.range.min);
			if (param.range?.min)
				param.range.max = parseISOString(param.range.max);
		}
	}
	onMount(M.AutoInit);
</script>

<div class="container">
	<div class="row">
		<div class="col l1">
			<a
				style="margin-top: 2em"
				on:click={() => currentPage.set("home")}
				href="#!"
				class="btn-floating btn-large waves-effect waves-light red">
				<i class="material-icons">arrow_back</i>
			</a>
		</div>
		<div class="col l6 offset-l2">
			<h2 class="red-text center">{partName}</h2>
		</div>
	</div>

	<div class="row">
		<div class="col l2 m6 s12">
			<div class="row">
				<div class="col l2 m2 s2">
					<button on:click={() => console.log(data)}>Log Data</button>
				</div>
				<div class="col l2 m2 s2 offset-l1 offset-m2 offset-s2">
					<h5>Categories</h5>
				</div>
			</div>
			<CategoryList
				bind:curr={category}
				bind:categories={part.serviceTypes}
			/>
		</div>

		<div class="col l2 m6 s12">
			<div class="row">
				<div class="col l2 m2 s2">
					<AddSST on:addSST={addSST} {partName} />
				</div>
				<div class="col l2 m2 s2 offset-l1 offset-m2 offset-s2">
					<h5>{partName}</h5>
				</div>
				<div class="col l1 m1 s1 offset-l3 offset-m3 offset-s3">
					<SSTOptions
						on:updateSST={updateSST}
						on:deleteSST={deleteSST}
						on:duplicateSST={duplicateSST}
						bind:sst
					/>
				</div>
			</div>
			{#if !category}
				<h6 class="center">
					<i>Please select a category</i>
				</h6>
			{:else}
				<SSTList
					name={partName}
					bind:ssts={category.serviceSubTypes}
					bind:curr={sst}
				/>
			{/if}
		</div>

		<div class="col l2 m6 s12">
			<div class="row">
				<div class="col l2 m2 s2">
					<AddParam on:addParam={addParam} />
				</div>
				<div class="col l2 m2 s2 offset-l2 offset-m2 offset-s2">
					<h5>Paramtetes</h5>
				</div>
			</div>
			{#if !sst}
				<h6 class="center">
					<i>Please select a {partName}</i>
				</h6>
			{:else}
				<ParamList bind:param bind:params={sst.params} />
			{/if}
		</div>

		<div class="col l3 m6 s12">
			<h5 class="center">Parameter Options</h5>
			{#if !param}
				<h6 class="center">
					<i>No Parameter Selected</i>
				</h6>
			{:else}
				<ParamOptions
					bind:param
					bind:calibrations={data.calibrations}
					bind:units
					on:deleteParam={deleteParam}
					on:updateParam={updateParam}
					on:duplicateParam={duplicateParam}
				/>
			{/if}
		</div>

		<div class="col l3 m6 s12">
			<CalList bind:calibrations={data.calibrations} />
		</div>
	</div>
</div>

<style>
	div.container {
		margin: 0 auto;
		max-width: unset;
		width: 95%;
	}
</style>
