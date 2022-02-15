import { Writable, writable } from "svelte/store";
import type { satField } from "./types";

export let config: {
	apiUrl: string;
	version: string;
	[key: string]: any;
} = null;

export const setConfig = (newConfig) => (config = newConfig);

export const satellite: Writable<string | null> = writable(
	localStorage.getItem("satellite")
);

export const endnode: Writable<string | null> = writable(
	localStorage.getItem("endnode")
);

/**
 * Store satelliet default fields that every packet has
 */
export const satFormat: Writable<{
	format: string;
	fields: satField[];
}> = writable(null as any);
