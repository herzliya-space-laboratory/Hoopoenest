import dayjs from "dayjs";
import type { packet, packetType, satField } from "./types";

/**
 * Convert packets to CSV string
 * @param packets
 * @param satFields
 * @param format
 * @param type
 */
export function packetsToCSV(
	packets: packet[],
	satFields: satField[],
	format: string,
	type: packetType
) {
	const paramNames = getParamNames(packets);
	let str = formatKeyFields(format);
	satFields.forEach((field) => {
		if (type === "telemetry") str += `,${field.telemetryName}`;
		else str += `,${field.commandName}`;
	});
	str += "," + paramNames.join(",");
	str += ",Raw\n";

	packets.forEach((packet) => {
		str += keyToCSV(packet.key, format);
		satFields.forEach((field) => {
			str += paramToStr(packet[field.name]);
		});

		paramNames.forEach((paramName) => {
			const param = packet.params.find(
				(param) => param.name === paramName
			);
			if (param === undefined) str += ",";
			else str += paramToStr(param.value);
		});

		str += `,${packet.raw}\n`;
	});

	return str;
}

function paramToStr(value) {
	if (dayjs.isDayjs(value)) return `,${value.format("DD/MM/YYYY HH:mm:ss")}`;
	else return `,${value}`;
}

function keyToCSV(key: any, format: string) {
	switch (format) {
		case "MIB":
			return `${key.serviceType},${key.serviceSubType}`;
		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

function formatKeyFields(format: string) {
	switch (format) {
		case "MIB":
			return "Service Type,Service Sub Type";
		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

function getParamNames(packets: packet[]): string[] {
	const fields: Set<string> = new Set();
	packets.forEach((packet) =>
		packet.params.forEach((param) => fields.add(param.name))
	);
	return Array.from(fields);
}
