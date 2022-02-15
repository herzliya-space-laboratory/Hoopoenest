import kiss from "../../src/commProtocols/kiss";

describe("KISS", () => {
	test("sholud throw error when decoding not valid Buffer", () => {
		const packet = Buffer.from("C000", "hex");
		expect(() => kiss.decode(packet)).toThrowError();
	});

	test("should decode correctly an empty packet (Buffer)", () => {
		const packet = Buffer.from("C000C0", "hex");
		expect(kiss.decode(packet).data).toEqual(Buffer.alloc(0));
	});

	test("should decode correctly a valid packet (Buffer)", () => {
		const packet = Buffer.from("C000DBDDA8F2DBDC56DBDCC0", "hex");
		expect(kiss.decode(packet).data).toEqual(
			Buffer.from("DBA8F2C056C0", "hex")
		);
	});

	test("should encode correctly an empty packet (Buffer)", () => {
		const packet = Buffer.alloc(0);
		expect(kiss.encode(packet)).toEqual(Buffer.from("C000C0", "hex"));
	});

	test("should encode correctly a decoded packet (Buffer)", () => {
		const packet = Buffer.from("DBA8F2C056C0", "hex");
		expect(kiss.encode(packet)).toEqual(
			Buffer.from("C000DBDDA8F2DBDC56DBDCC0", "hex")
		);
	});
});
