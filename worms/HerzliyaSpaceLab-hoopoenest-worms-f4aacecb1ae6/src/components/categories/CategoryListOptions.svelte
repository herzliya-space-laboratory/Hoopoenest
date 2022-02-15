<script>
	import CategoryOptions from "./CategoryOptions.svelte";
	import AddCategory from "./AddCategory.svelte";
	import { validateCategory } from "../../lib/validations.js";
	import { duplicate } from "../../lib/utilities.js";
	import { openErrors } from "../../stores";

	export let categories;
	export let part;

	let searchTerm = "";
	let filteredList = categories;

	$: {
		if (/^\d+$/.test(searchTerm)) {
			const num = +searchTerm;
			filteredList = categories.filter((item) => item.id === num);
		} else {
			filteredList = categories.filter(
				(item) =>
					item.name
						.toLowerCase()
						.indexOf(searchTerm.toLowerCase()) !== -1
			);
		}
	}

	const addCategory = (newCategory) => {
		const category = newCategory.detail;
		const valErrs = validateCategory(category, categories);
		if (valErrs.length > 0) {
			openErrors(valErrs);
			return;
		}
		categories = [...categories, category];
	};

	const deleteCategory = (evt) => {
		categories = categories.filter(
			(category) => category.id !== evt.detail
		);
	};

	const updateCategory = (ctx) => {
		const { updated, old } = ctx.detail;
		const testArr = categories.filter((item) => item !== old);
		const valErrs = validateCategory(updated, testArr);
		if (valErrs.length > 0) {
			openErrors(valErrs);
			return;
		}

		const curr = categories.find((item) => item === old);
		const index = categories.indexOf(curr);
		categories[index] = updated;
	};

	const duplicateCategory = (ctx) => {
		const id = ctx.detail;
		const category = categories.find((item) => item.id === id);
		categories = duplicate(category, categories);
	};
</script>

<div class="row">
	<div class="col l2 m2 s2">
		<AddCategory on:addCategory={addCategory} />
	</div>
	<h5 class="col l2 m2 s2 offset-l2 offset-m2 offset-s2">Categories</h5>
</div>

<div class="input-field">
	<i class="material-icons prefix">search</i>
	<input id="search" type="search" required bind:value={searchTerm} />
</div>
{#if filteredList.length === 0}
	<span>
		<i>Empty</i>
	</span>
{:else}
	<div class="collection">
		{#each filteredList as st (st.id)}
			<CategoryOptions
				bind:category={st}
				{part}
				on:deleteCategory={deleteCategory}
				on:updateCategory={updateCategory}
				on:duplicateCategory={duplicateCategory}
			/>
		{/each}
	</div>
{/if}

<style>
	.collection {
		overflow: auto;
		max-height: 69vh;
	}
</style>
