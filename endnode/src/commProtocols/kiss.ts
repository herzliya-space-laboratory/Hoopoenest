import { commProtocolPacket, commProtocol } from "./types";

const kiss: commProtocol = {
	decode,
	encode,
};

export default kiss;

/**
 * Decodes a encoded KISS packet
 * @param encoded - An Encoded KISS packet as a nodejs Buffer
 */
function decode(encoded: Buffer): commProtocolPacket {
	if (!validateEncodedBuffer(encoded))
		throw new Error(
			"KISS decode: packet does not contain frame end or frame start"
		);

	let decoded = encoded.slice(2, encoded.length - 1);
	decoded = replaceEncodedBuffer(decoded, "C0");
	decoded = replaceEncodedBuffer(decoded, "DB");

	return { data: decoded };
}

/**
 * Encodes A KISS packet
 * @param decoded - A packet as a nodejs Buffer
 */
function encode(decoded: Buffer): Buffer {
	let encoded = decoded;

	encoded = replaceDecodedBuffer(encoded, 219);
	encoded = replaceDecodedBuffer(encoded, 192);

	encoded = Buffer.concat([
		Buffer.from("C000", "hex"),
		encoded,
		Buffer.from("C0", "hex"),
	]);

	return encoded;
}

/**
 * Check if an packet is a validated KISS encoded packet
 * @param encoded - An Encoded packet as nodejs Buffer
 */
function validateEncodedBuffer(encoded: Buffer): boolean {
	return (
		encoded[0] === 192 &&
		encoded[1] === 0 &&
		encoded[encoded.length - 1] === 192
	);
}

/**
 * Creates new Buffer with a special byte encoded
 * @param decoded - A packet as a nodejs Buffer
 * @param location - The index of the special byte needs to encode
 * @param byteSequence - The encoded sequence that match the special byte
 */
function replaceDecodedByte(
	decoded: Buffer,
	location: number,
	byteSequence: string
): Buffer {
	return Buffer.concat([
		decoded.slice(0, location),
		Buffer.from(byteSequence, "hex"),
		decoded.slice(location + 1),
	]);
}

/**
 * Creates new Buffer that all special bytes are encoded
 * @param decoded - A packet as nodejs Buffer
 * @param byte - T special byte needs to encoded in the packet
 */
function replaceDecodedBuffer(decoded: Buffer, byte: number): Buffer {
	let encoded = decoded;
	const encodedSequence = byte === 192 ? "DBDC" : "DBDD";

	for (let idx = 0; idx < encoded.length; idx++) {
		if (encoded[idx] === byte) {
			encoded = replaceDecodedByte(encoded, idx, encodedSequence);
		}
	}

	return encoded;
}

/**
 * Creates a new Buffer with the decoded matchig byte of sequence (2 bytes)
 * @param encoded - A nodejs Buffer
 * @param location - The start index of the encoded sequence (2 bytes)
 * @param byte  - The Decoded byte that replace the sequence
 */
function replceEncodedBytes(
	encoded: Buffer,
	location: number,
	byte: string
): Buffer {
	return Buffer.concat([
		encoded.slice(0, location),
		Buffer.from(byte, "hex"),
		encoded.slice(location + 2),
	]);
}

/**
 * Creates a Buffer that all special 2 bytes sequences are replaced with special byte
 * @param encoded - A packet as nodejs Buffer
 * @param byte - The special byte that replace all encoded sequences
 */
function replaceEncodedBuffer(encoded: Buffer, byte: string): Buffer {
	let decoded = encoded;
	const transposedByte = byte === "C0" ? 220 : 221;

	for (let idx = 0; idx < decoded.length - 1; idx++) {
		if (decoded[idx] === 219 && decoded[idx + 1] === transposedByte) {
			decoded = replceEncodedBytes(decoded, idx, byte);
		}
	}

	return decoded;
}
