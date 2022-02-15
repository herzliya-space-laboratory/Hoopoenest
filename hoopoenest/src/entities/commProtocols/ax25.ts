const ax25 = {
	decode,
	encode,
};

export default ax25;

type ax25Packet = {
	destCallsign: string;
	destSSID: number;
	srcCallsign: string;
	srcSSID: number;
	data: Buffer;
};

/**
 * Decodes an AX25 packet
 * @param encoded - AX25 packet as a nodejs Buffer
 */
function decode(encoded: Buffer): ax25Packet {
	if (encoded.length < 16 || encoded.length > 272)
		throw new Error("AX25 decode: packet is too short or long");

	const destCallsign = decodeCallsign(encoded.slice(0, 6));
	const destSSID = decodeSSID(encoded[6]);
	const srcCallsign = decodeCallsign(encoded.slice(7, 13));
	const srcSSID = decodeSSID(encoded[13]);
	const data = encoded.slice(16);

	const decodedPacket = {
		destCallsign: destCallsign,
		destSSID: destSSID,
		srcCallsign: srcCallsign,
		srcSSID: srcSSID,
		data: data,
	};

	return decodedPacket;
}

function decodeCallsign(callsign: Buffer): string {
	const unshiftedCallsign = Buffer.from(callsign.map((byte) => byte >> 1));

	return unshiftedCallsign.toString("ascii");
}

function decodeSSID(ssid: number): number {
	return (ssid >> 1) & 0x0f;
}

function validateAX25Object(obj: unknown): obj is ax25Packet {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"destCallsign" in obj &&
		"data" in obj &&
		"destSSID" in obj &&
		"srcCallsign" in obj &&
		"srcSSID" in obj
	);
}

/**
 * Encodes an AX25 packet
 * @param decoded - AX25 packet as a JS object
 */
function encode(decoded: unknown): Buffer {
	if (!validateAX25Object(decoded))
		throw new Error("AX25 encode error: given object isn't compatible");

	const destCallsign = encodeCallsign(decoded.destCallsign);
	const destSSID = encodeSSID(decoded.destSSID, 0);
	const srcCallsign = encodeCallsign(decoded.srcCallsign);
	const srcSSID = encodeSSID(decoded.srcSSID, 1);
	const encodedHeader = Buffer.concat([
		destCallsign,
		destSSID,
		srcCallsign,
		srcSSID,
	]);

	const staticBytes = Buffer.from("03F0", "hex");
	const encodedPacket = Buffer.concat([
		encodedHeader,
		staticBytes,
		decoded.data,
	]);

	if (encodedPacket.length > 272)
		throw new Error("AX25 encode: packet is too long");

	return encodedPacket;
}

function encodeCallsign(callsign: string): Buffer {
	const callsignBuffer = Buffer.from(callsign, "ascii");

	return Buffer.from(callsignBuffer.map((byte) => (byte << 1) & 0xff));
}

function encodeSSID(ssid: number, typeBit: number): Buffer {
	ssid &= 0x0f;
	ssid <<= 1;
	typeBit &= 0x01;
	const fixedBits = 0x60 | typeBit;
	ssid |= fixedBits;

	const ssidBuffer = Buffer.alloc(1);
	ssidBuffer.writeUInt8(ssid, 0);

	return ssidBuffer;
}
