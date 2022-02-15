import dayjs from "dayjs";
import type { satField } from "../types";
import type { parameter, packet } from "./types";

const isoDateRe = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

function getErrorString(p: parameter): string | string[] {
	if (p.value === undefined || p.value === null) return "can't be undefined";

	switch (p.type) {
		case "datetime": {
			if (typeof p.value === "object") {
				if (p.value.secs < 0 || p.value.mins < 0 || p.value.hours < 0)
					return "can't be negative";
			} else if (!isoDateRe.exec(p.value)) return "must be a valid date";

			if (p.range !== undefined) {
				const date =
					typeof p.value === "object"
						? dayjs()
								.add(p.value.hours, "hour")
								.add(p.value.mins, "minute")
								.add(p.value.secs, "second")
						: dayjs(p.value);

				if (p.range.min !== undefined && dayjs(p.range.min) > date)
					return `must be more or equal to ${dayjs(
						p.range.min
					).format("DD/MM/YYYY HH:mm:ss")}`;
				if (p.range.max !== undefined && dayjs(p.range.max) < date)
					return `must be less or equal to ${dayjs(
						p.range.min
					).format("DD/MM/YYYY HH:mm:ss")}`;
			}
			break;
		}

		case "float":
		case "int": {
			const valueCalibrated =
				p.calibration !== undefined && p.calibration.type === "linear"
					? (p.value - p.calibration.b) / p.calibration.m
					: p.value;
			const value = valueCalibrated.toFixed(6);

			const calStr =
				p.calibration !== undefined && p.calibration.type === "linear"
					? ` after calibration of ${1 / p.calibration.m}x + ${
							-p.calibration.b / p.calibration.m
					  })`
					: "";

			if (p.type === "int" && value % 1 !== 0)
				return "must be an integer" + calStr;

			if (p.range !== undefined) {
				if (p.range.min !== undefined && value < p.range.min)
					return `must be more or equal to ${p.range.min}${calStr}`;
				if (p.range.max !== undefined && value > p.range.max)
					return `must be less or equal to ${p.range.max}${calStr}`;
			}
			break;
		}

		case "buffer": {
			if (!(p.value as string).match(/^0x[0-9a-f]+$/i))
				return "must be a hex string (starts with 0x with no spacing or symbols)";
			if (p.value.length - 2 !== p.size * 2)
				return `must be ${p.size} hex bytes`;
			break;
		}

		case "bitmap": {
			return p.value.map(getErrorString);
		}
	}
	return undefined;
}

export function validate(command: packet, satFields: satField[]) {
	const errors: Record<string, string | string[]> = command.params.reduce(
		(map, p) => {
			const errStr = getErrorString(p);
			return {
				...map,
				...(errStr !== undefined && { [p.name]: errStr }),
			};
		},
		{}
	);

	satFields.forEach((field) => {
		const errStr = getErrorString({
			...field,
			value: command[field.name],
		} as parameter);
		if (errStr !== undefined) errors[field.name] = errStr;
	});

	return errors;
}
