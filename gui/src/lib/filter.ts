import dayjs from "dayjs";
import type { packet, satField } from "./types";
import { getDateQuery, isKeyEqual } from "./misc";

/**
 * Filter a packet using an query object
 * @param query a query object specifing which values are allowed
 * @param packet the packet
 * @param fields satellite default fields
 * @param format packet format used (AKA MIB)
 */
export function filter(
	query: Record<string, any>,
	packet: packet,
	fields: satField[],
	format: string
) {
	if (query.key !== undefined && !isKeyEqual(query.key, packet.key, format))
		return false;
	for (const field of fields) {
		if (query[field.name] !== undefined) {
			if (field.type === "datetime") {
				const { from, to } = query[field.name];
				if (
					from !== undefined &&
					from !== "" &&
					dayjs(from) > packet[field.name]
				)
					return false;
				if (
					to !== undefined &&
					to !== "" &&
					dayjs(to) < packet[field.name]
				)
					return false;
			} else {
				if (
					query[field.name] !== undefined &&
					packet[field.name] != query[field.name]
				)
					return false;
			}
		}
	}
	return true;
}

/**
 * get url query params for given query object to fetch packets
 * @param query a query object specifing which values to fetch
 * @param fields satellite default fields
 */
export function filterUrlQuery(
	query: Record<string, any>,
	fields: satField[]
): string {
	if (Object.keys(query).length === 0) return "";
	const urlParams: string[] = [];
	if ("key" in query) urlParams.push(`key=${JSON.stringify(query.key)}`);

	return (
		"&" +
		fields
			.reduce((acc, field) => {
				if (field.name in query) {
					if (field.type === "datetime") {
						const { from, to } = query[field.name];
						const dateQuery = getDateQuery(from, to);
						return [
							...acc,
							`${field.name}=${JSON.stringify(dateQuery)}`,
						];
					} else {
						return [
							...acc,
							`${field.name}=${JSON.stringify(
								query[field.name]
							)}`,
						];
					}
				}
				return acc;
			}, urlParams)
			.join("&")
	);
}
