import dayjs from "dayjs";
import { commProtocol } from "./types";

const spl: commProtocol = {
	decode,
	encode,
	fields: [
		{
			name: "satelliteTime",
			telemetryName: "Satellite Time",
			commandName: "Execution Time",
			onSend: true,
			onHistory: true,
			type: "datetime",
			range: {
				min: new Date(0),
				max: new Date(4294967295 * 1000),
			},
		},
	],
};

export default spl;

type splPacket = {
	key: {
		serviceType: number;
		serviceSubType: number;
	};
	satelliteTime: Date;
	data: Buffer;
	commandId: number;
};

/**
 * Decodes an SPL packet
 * @param encoded - SPL packet as a nodejs Buffer
 */
function decode(encoded: Buffer): Omit<splPacket, "commandId"> {
	if (encoded.length < 8) throw new Error("SPL decode: packet is too short");

	const st = encoded[0];
	const sst = encoded[1];
	const dataFieldLength = encoded.readUIntBE(2, 2);
	const unixSeceonds = encoded.readUIntBE(4, 4);
	const unixTime = dayjs.unix(unixSeceonds).toDate();
	const data = encoded.slice(8);

	if (dataFieldLength !== data.length)
		throw new Error(
			"SPL decode: packet data length field and actual data length don'nt match"
		);

	const decodedPacket = {
		key: {
			serviceType: st,
			serviceSubType: sst,
		},
		satelliteTime: unixTime,
		data: data,
	};

	return decodedPacket;
}

function validateSplObject(obj: unknown): obj is splPacket {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"key" in obj &&
		"data" in obj &&
		"satelliteTime" in obj &&
		"commandId" in obj
	);
}

/**
 * Encodes an SPL packet
 * @param decoded - SPL packet as a JS object
 */
function encode(decoded: unknown): Buffer {
	if (!validateSplObject(decoded))
		throw new Error("SPL encode error: given object isn't compatible");

	const encodedHeader = Buffer.alloc(12);
	encodedHeader.writeUIntBE(decoded.commandId, 0, 4);
	encodedHeader[4] = decoded.key.serviceType;
	encodedHeader[5] = decoded.key.serviceSubType;
	encodedHeader.writeUIntBE(decoded.data.length, 6, 2);
	const unixSeceonds =
		dayjs(decoded.satelliteTime) < dayjs()
			? 0
			: dayjs(decoded.satelliteTime).unix();
	encodedHeader.writeUIntBE(unixSeceonds, 8, 4);

	return Buffer.concat(
		[encodedHeader, decoded.data],
		encodedHeader.length + decoded.data.length
	);
}
