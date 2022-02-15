<script lang="ts">
	import SearchSelect from "svelte-select";

	type serviceSubType = { name: string; id: number };
	type serviceType = { name: string; id: number; subTypes: serviceSubType[] };

	export let disabled: boolean = false;

	export let serviceTypes: serviceType[];
	let stItems = serviceTypes.map((st) => ({
		value: st.id,
		label: `${st.name} (${st.id})`,
	}));
	let sstItems = [];

	export let key: {
		serviceType: number | undefined;
		serviceSubType: number | undefined;
	} = {
		serviceType: undefined,
		serviceSubType: undefined,
	};

	let selectedSt;
	$: if (selectedSt !== undefined) {
		key.serviceType = selectedSt.value;
		sstItems = serviceTypes
			.find((st) => st.id === key.serviceType)
			.subTypes.map((sst) => ({
				value: sst.id,
				label: `${sst.name} (${sst.id})`,
			}));
	} else {
		key.serviceType = undefined;
		key.serviceSubType = undefined;
		sstItems = [];
	}

	let selectedSst;
	$: key.serviceSubType = selectedSst?.value;
</script>

<p>Service Type:</p>
<SearchSelect
	bind:selectedValue={selectedSt}
	isDisabled={disabled}
	items={stItems} />

<p>Service Sub Type:</p>
<SearchSelect
	bind:selectedValue={selectedSst}
	isDisabled={key.serviceType == undefined || disabled}
	items={sstItems} />
