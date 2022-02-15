import dayjs from "dayjs";
import utcPlugin from "dayjs/plugin/utc";
dayjs.extend(utcPlugin);

const isoDateRe = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;

/**
 * Convert JSON objects to js implementaions (Date, Buffer)
 * @param key json key
 * @param value json value
 */
export function jsonReviver(key: string, value: unknown) {
	// Date
	if (typeof value === "string") {
		if (isoDateRe.exec(value)) return dayjs(value).utc();
	}
	return value;
}

/**
 * Convert parse new packet from socket
 * @param obj packet from socket
 */
export function parseSocketPacket(obj: Record<string, any>) {
	if (typeof obj === "string" && isoDateRe.exec(obj)) return dayjs(obj).utc();
	if (typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(parseSocketPacket);
	Object.entries(obj).forEach(([key, val]) => {
		obj[key] = parseSocketPacket(val);
	});
	return obj;
}
