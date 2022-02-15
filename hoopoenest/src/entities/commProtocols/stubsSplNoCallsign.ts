const stubsSpl = {
	decode,
	encode,
};

export default stubsSpl;

type stubsSplPacket = {
	key: {
		serviceType: number;
		serviceSubType: number;
	};
	packetId: number;
	satCallsign: "stubs";
	satSSID: number;
	data: Buffer;
};

/**
 * Decodes an SPL packet
 * @param encoded - SPL packet as a nodejs Buffer
 */
function decode(encoded: Buffer): stubsSplPacket {
	if (encoded.length < 8)
		throw new Error("SPL-STUBS decode: packet is too short");

	const satId = encoded[0];
	const packetId = encoded.readUIntBE(1, 3);
	const st = encoded[4];
	const sst = encoded[5];
	const dataFieldLength = encoded.readUIntBE(6, 2);
	const data = encoded.slice(8);

	if (dataFieldLength !== data.length)
		throw new Error(
			"SPL-STUBS decode: packet data length field and actual data length don'nt match"
		);

	const decodedPacket = {
		key: {
			serviceType: st,
			serviceSubType: sst,
		},
		satCallsign: "stubs" as const,
		satSSID: satId,
		packetId,
		data: data,
	};

	return decodedPacket;
}

function validateSplObject(obj: unknown): obj is stubsSplPacket {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"key" in obj &&
		"data" in obj &&
		"satSSID" in obj &&
		"packetId" in obj
	);
}

/**
 * Encodes an SPL packet
 * @param decoded - SPL packet as a JS object
 */
function encode(decoded: unknown): Buffer {
	if (!validateSplObject(decoded))
		throw new Error(
			"SPL-STUBS encode error: given object isn't compatible"
		);

	const encodedHeader = Buffer.alloc(8);
	encodedHeader[0] = decoded.satSSID;
	encodedHeader.writeUIntBE(decoded.packetId, 1, 3);
	encodedHeader[4] = decoded.key.serviceType;
	encodedHeader[5] = decoded.key.serviceSubType;
	encodedHeader.writeUIntBE(decoded.data.length, 6, 2);

	return Buffer.concat(
		[encodedHeader, decoded.data],
		encodedHeader.length + decoded.data.length
	);
}
