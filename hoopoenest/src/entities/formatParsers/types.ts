import { parameter, packetType, packet } from "../../types";

export interface packetValues {
	key: unknown;
	type: packetType;
	params: { name: string; value: any }[];
	name?: string;
}

export interface packetForEncoding {
	key: unknown;
	type: packetType;
	params: any[];
	name?: string;
}

export type packetMetaInfo = {
	key: any;
	params: {
		name: string;
		type: string;
		[key: string]: any;
	}[];
	[key: string]: any;
};

export interface formatParser {
	parsePacket(raw: Buffer, key: unknown, type: packetType): packetValues;
	encodePacket(packet: packetValues): Buffer;
	getPacketFormat(key: unknown, type: packetType): packetMetaInfo;
	getAllPacketFormats(type: packetType): any[];
	getKeys(type: packetType): any[];
	formatPacket(
		packet: packetValues,
		key: unknown,
		type: packetType
	): Omit<packet, "id">;
	addParamsNames(packet: packetForEncoding): packetValues;
	readonly formatName: string;
}
