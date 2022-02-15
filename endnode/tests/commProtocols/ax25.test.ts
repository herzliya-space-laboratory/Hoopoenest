import { default as ax25gen } from "../../src/commProtocols/ax25";

const ax25 = ax25gen("4X4HSC", 1);

describe("AX25", () => {
	test("Call decode AX25 with an empty buffer and expect error", () => {
		expect(() => ax25.decode(Buffer.alloc(0))).toThrowError();
	});

	test("Call decode AX25 with a too short buffer and expect error", () => {
		expect(() => ax25.decode(Buffer.alloc(2))).toThrowError();
	});

	test("Call decode AX25 with a too long buffer and expect error", () => {
		expect(() => ax25.decode(Buffer.alloc(400))).toThrowError();
	});

	test("Call decode AX25 with minimal length zeros buffer and expect zeros object", () => {
		const encoded = Buffer.alloc(16);
		const expectedCallsign = Buffer.alloc(6).toString("ascii");
		const expected = {
			destCallsign: expectedCallsign,
			destSSID: 0,
			srcCallsign: "",
			srcSSID: 0,
			data: Buffer.alloc(0),
		};

		expect(ax25.decode(encoded)).toMatchObject(expected);
	});

	test("Call decode AX25 with a real buffer and expect correct object", () => {
		const encoded = Buffer.from(
			"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
			"hex"
		);
		const expected = {
			destCallsign: "ON01IL",
			destSSID: 2,
			srcCallsign: "4X4HSC",
			srcSSID: 1,
			data: Buffer.from("ACAB05AFFF56", "hex"),
		};

		expect(ax25.decode(encoded)).toEqual(expected);
	});

	test("Call encode AX25 with a wrong object and expect error", () => {
		const decoded = {
			sdcsdcsd: 9,
		};
		expect(() => ax25.encode(decoded)).toThrow();
	});

	test("Call encode AX25 with a real object and expect correct buffer", () => {
		const decoded = {
			destCallsign: "ON01IL",
			destSSID: 2,
			srcCallsign: "4X4HSC",
			srcSSID: 1,
			data: Buffer.from("ACAB05AFFF56", "hex"),
		};
		const expected = Buffer.from(
			"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
			"hex"
		);

		expect(ax25.encode(decoded)).toEqual(expected);
	});
});
