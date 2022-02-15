<script lang="ts">
	import { Chart } from "chart.js";
	import "chartjs-plugin-zoom";
	import "chartjs-plugin-annotation";
	import "chartjs-plugin-colorschemes";

	import { onMount } from "svelte";

	export let type: "line" | "scatter";
	export let annotations: any[];
	export let params: { data: { x: Date; y: number }[]; label: string }[];

	let isShiftPressed: boolean = false;

	window.onkeydown = ({ key }) => {
		if (key === "Shift") isShiftPressed = true;
	};
	window.onkeyup = () => (isShiftPressed = false);

	onMount(() => {
		const canvas = document.getElementById("graph") as HTMLCanvasElement;
		Chart.defaults.global.defaultFontSize = 16;
		const chart = new Chart(canvas, {
			type,
			data: {
				datasets: params,
			},

			options: {
				scales: {
					xAxes: [
						{
							type: "time",
							time: {
								unit: "day",
							},
						},
					],
				},
				pan: {
					enabled: true,
					mode: "xy",
				},
				zoom: {
					enabled: true,
					mode: () => {
						if (isShiftPressed) return "x";
						else return "y";
					},
				},
				annotation: {
					annotations: annotations,
				},
				plugins: {
					colorschemes: {
						scheme: "tableau.Tableau20",
					},
				},
			},
		} as any);
	});
</script>

<canvas id="graph" width="80vw" height="40vh" />
