function findDuplicateId(item, arr) {
	let newId = item.id + 1;
	let ok = true;
	while (ok) {
		if (newId > 255) {
			M.toast({
				html: "Can't duplictate: maxmimum id reached",
				classes: "red",
			});
			return undefined;
		}
		ok = false;
		for (const elem of arr) {
			if (elem.id === newId) {
				ok = true;
				newId++;
				break;
			}
		}
	}
	return newId;
}

export function duplicate(item, arr) {
	const newItem = { ...item };
	if (item.id !== undefined) {
		const newId = findDuplicateId(item, arr);
		if (newId === undefined) return arr;
		newItem.id = newId;
	}
	let copyIndex = 1;
	let ok = true;
	while (ok) {
		ok = false;
		let name = item.name + ` (${copyIndex})`;
		for (const elem of arr) {
			if (elem.name === name) {
				ok = true;
				copyIndex++;
				break;
			}
		}
	}
	newItem.name += ` (${copyIndex})`;
	const index = arr.indexOf(item);
	return [...arr.slice(0, index + 1), newItem, ...arr.slice(index + 1)];
}

export function deleteEmptyStrings(obj) {
	for (const key in obj) {
		if (obj[key] === "") delete obj[key];
	}
}
