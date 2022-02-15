<script lang="ts">
	import type { mibKey } from "@lib/MIB/types";
	import type { packetType } from "@lib/types";
	import Select from "svelte-select";

	import { satellite, config } from "../../lib/stores";

	export let type: packetType = "telemetry";
	export let key: mibKey;
	export let paramId: number;

	let params: { value: number; label: string }[] = [];

	$: getParams(type, key);
	$: if (!validateKey(key)) paramId = undefined;

	let selected;

	$: paramId = selected?.value;

	function validateKey(key) {
		return (
			key !== undefined &&
			key.serviceType !== undefined &&
			key.serviceSubType !== undefined
		);
	}

	async function getParams(type: packetType, key: mibKey) {
		if (validateKey(key)) {
			params = [];
			const res = await fetch(
				`${
					config.apiUrl
				}/${$satellite}/${type}/format?key=${JSON.stringify(key)}`
			);
			params = (await res.json()).params
				.filter((p) => p.type === "int" || p.type === "float") // filter only params that can be graphed
				.map((p, i) => ({
					label: p.name,
					value: i,
				}));
		}
	}
</script>

<Select
	isDisabled={!validateKey(key)}
	items={params}
	bind:selectedValue={selected}
/>
