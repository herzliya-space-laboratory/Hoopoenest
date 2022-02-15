import dayjs from "dayjs";
import { Binary, ObjectID } from "mongodb";
import utcPlugin from "dayjs/plugin/utc";

dayjs.extend(utcPlugin);

type BufferJSON = { type: "Buffer"; data: number[] };
type timeSpan = {
	type: "TimeSpan";
	secs: number;
	mins: number;
	hours: number;
};

function isBuffer(obj: Record<string, any>): obj is BufferJSON {
	return "type" in obj && (obj as any).type === "Buffer" && "data" in obj;
}

/**
 * Check if object is a time stamp
 * @param obj object to check
 */
export function isTimeSpan(obj: unknown): obj is timeSpan {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"type" in obj &&
		(obj as any).type === "TimeSpan" &&
		"secs" in obj &&
		"mins" in obj &&
		"hours" in obj
	);
}

function parseTimeSpan(obj: timeSpan) {
	return dayjs()
		.utc()
		.add(obj.hours, "hour")
		.add(obj.mins, "minute")
		.add(obj.secs, "second")
		.toDate();
}

/**
 * Parse every time stamp value in an object
 * @param obj
 */
export function parseObjTimeSpan(obj: {
	[key: string]: any;
}): { [key: string]: any } {
	if (obj === undefined || obj === null) return obj;
	if (typeof obj !== "object") return obj;
	if (obj instanceof Date) return obj;
	if (isTimeSpan(obj)) return parseTimeSpan(obj);
	if (Array.isArray(obj)) return obj.map(parseObjTimeSpan);
	return Object.keys(obj).reduce(function (
		newObj: { [key: string]: any },
		key
	) {
		newObj[key] = parseObjTimeSpan(obj[key]);
		return newObj;
	},
	{});
}

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{3}Z)?$/;

/**
 * Convert JSON objects to js implementaions (Date)
 * @param key json key
 * @param value json value
 */
export const jsonReviver = (key: string, value: unknown) => {
	// Date
	if (typeof value === "string") {
		const isDate = reISO.exec(value);
		if (isDate) return dayjs.utc(value).toDate();
	}
	return value;
};

/**
 * Parse every buffer value in an object into json
 * @param obj
 */
export function JSONifyBuffers(obj: {
	[key: string]: any;
}): { [key: string]: any } {
	if (typeof obj !== "object") return obj;
	if (obj instanceof Date) return obj;
	if (Buffer.isBuffer(obj)) return obj.toJSON();
	if (Array.isArray(obj)) return obj.map(JSONifyBuffers);
	return Object.keys(obj).reduce(function (
		newObj: { [key: string]: any },
		key
	) {
		newObj[key] = JSONifyBuffers(obj[key]);
		return newObj;
	},
	{});
}

export function parseDBtypes(obj: {
	[key: string]: any;
}): { [key: string]: any } {
	if (typeof obj !== "object") return obj;
	if (obj instanceof Date) return obj;
	if (obj instanceof Binary) return obj.buffer;
	if (obj instanceof ObjectID) return obj.toHexString() as any;
	if (Array.isArray(obj)) return obj.map(parseDBtypes);
	return Object.keys(obj).reduce(function (
		newObj: { [key: string]: any },
		key
	) {
		newObj[key] = parseDBtypes(obj[key]);
		return newObj;
	},
	{});
}

export function hasDuplicateName(arr: { name: string }[]) {
	const seen = new Set();
	return arr.some((item) => seen.size === seen.add(item.name).size);
}
