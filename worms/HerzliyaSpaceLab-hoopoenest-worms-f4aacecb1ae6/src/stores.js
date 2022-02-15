import { writable } from "svelte/store";

export const errors = writable([]);
export const currentPage = writable("home");

export function openErrors(newErrors) {
	errors.set(newErrors);
	const elem = document.getElementById("errorBox");
	const errorBox = M.Modal.getInstance(elem);
	errorBox.open();
}
