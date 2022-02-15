import commProtocolsHandler from "../../src/CommProtocolHandler/ProtocolHandler";
import kiss from "../../src/commProtocols/kiss";
import ax25 from "../../src/commProtocols/ax25";

const protocolHandler = new commProtocolsHandler([kiss, ax25("4X4HSC", 0)]);

describe("commProtocols Handler", () => {
	test("should decode correctly an empty packet", () => {
		const samplePacket = Buffer.from(
			`C00000000000000000000000000000000000C0`,
			"hex"
		);
		const expectedCallsign = Buffer.alloc(6).toString("ascii");
		const expected = {
			destCallsign: expectedCallsign,
			destSSID: 0,
			srcCallsign: expectedCallsign,
			srcSSID: 0,
			data: Buffer.alloc(0),
		};

		expect(protocolHandler.decodePacket(samplePacket)).toEqual(expected);
	});

	test("should decode correctly a full real packet", () => {
		const samplePacket = Buffer.from(
			"c0009e9c606292986468b06890a6866303f0acab05afff56c0",
			"hex"
		);
		const expected = {
			destCallsign: "ON01IL",
			destSSID: 2,
			srcCallsign: "4X4HSC",
			srcSSID: 1,
			data: Buffer.from("ACAB05AFFF56", "hex"),
		};

		expect(protocolHandler.decodePacket(samplePacket)).toEqual(expected);
	});

	test("should encode correctly a full real packet", () => {
		const protocolHandler = new commProtocolsHandler([
			kiss,
			ax25("4X4HSC", 1),
		]);
		const samplePacket = {
			destCallsign: "ON01IL",
			destSSID: 2,
			srcCallsign: "4X4HSC",
			srcSSID: 1,
			data: Buffer.from("ACAB05AFFF56", "hex"),
		};

		const expected = Buffer.from(
			"c0009e9c606292986468b06890a6866303f0acab05afff56c0",
			"hex"
		);

		expect(protocolHandler.encodePacket(samplePacket)).toEqual(expected);
	});
});
