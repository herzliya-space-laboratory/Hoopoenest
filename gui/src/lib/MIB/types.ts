import type { Dayjs } from "dayjs";

export type mibKey = { serviceType: number; serviceSubType: number };

export type packetType = "telemetry" | "telecommands";

export type packet = {
	satellite: string;
	key: mibKey;
	name: string;
	type: packetType;
	params: parameter[];
	raw?: string;
	[key: string]: any;
};

export type telemetryPacket = packet & {
	groundTime: Dayjs;
	packetType: "telemetry";
};

export type commandPacket = packet & {
	sentTime: Dayjs;
	commandId: number;
	packetType: "telecommands";
};

export type linearCalibration = {
	type: "linear";
	m: number;
	b: number;
};

export type enumCalibration = {
	type: "enum";
	options: { name: string; value: number }[];
};

export type calibration = linearCalibration | enumCalibration;

export type range = {
	min?: any;
	max?: any;
};

export type bitfield = {
	name: string;
	range?: range;
	calibration?: calibration;
};

export type parameter = {
	name: string;
	value: any;
	type: "int" | "float" | "buffer" | "bitmap" | "enum" | "datetime";
	range?: range;
	size?: number;
	values?: string[];
	unit?: string;
	description?: string;
	calibration?: linearCalibration;
	bitfields?: bitfield[];
};
