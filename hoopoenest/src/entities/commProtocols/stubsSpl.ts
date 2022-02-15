import { commProtocol } from "./types";

const stubsSpl: (satId: number) => commProtocol = (satId) => {
	return {
		decode,
		encode: (data: unknown) => encode(data, satId),
		fields: [
			{
				name: "commandId",
				telemetryName: "Command Id",
				type: "int",
			},
			{
				name: "isForAllSats",
				commandName: "Is for all satellites?",
				onSend: true,
				onHistory: false,
				type: "boolean",
			},
		],
	};
};

export default stubsSpl;

type stubsSplPacket = {
	key: {
		serviceType: number;
		serviceSubType: number;
	};
	commandId: number;
	data: Buffer;
};

/**
 * Decodes an SPL packet
 * @param encoded - SPL packet as a nodejs Buffer
 */
function decode(encoded: Buffer): stubsSplPacket {
	if (encoded.length < 8)
		throw new Error("SPL-STUBS decode: packet is too short");

	const commandId = encoded.readUIntLE(0, 3);
	const satId = encoded[3];
	const st = encoded[4];
	const sst = encoded[5];
	const dataFieldLength = encoded.readUIntLE(6, 2);
	const data = encoded.slice(8);

	if (dataFieldLength !== data.length)
		throw new Error(
			"SPL-STUBS decode: packet data length field and actual data length don't match"
		);

	const decodedPacket = {
		key: {
			serviceType: st,
			serviceSubType: sst,
		},
		// satId,
		commandId,
		data: data,
	};

	return decodedPacket;
}

type stubsSplPacketDecoded = stubsSplPacket & { isForAllSats: boolean };

function validateSplObject(obj: unknown): obj is stubsSplPacketDecoded {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"key" in obj &&
		"data" in obj &&
		"commandId" in obj &&
		"isForAllSats" in obj
	);
}

/**
 * Encodes an SPL packet
 * @param decoded - SPL packet as a JS object
 */
function encode(decoded: unknown, satId: number): Buffer {
	if (!validateSplObject(decoded))
		throw new Error(
			"SPL-STUBS encode error: given object isn't compatible"
		);

	const encodedHeader = Buffer.alloc(8);
	encodedHeader.writeUIntLE(decoded.commandId, 0, 3);
	encodedHeader[3] = !decoded.isForAllSats ? satId : 0;
	encodedHeader[4] = decoded.key.serviceType;
	encodedHeader[5] = decoded.key.serviceSubType;
	encodedHeader.writeUIntLE(decoded.data.length, 6, 2);

	return Buffer.concat(
		[encodedHeader, decoded.data],
		encodedHeader.length + decoded.data.length
	);
}
