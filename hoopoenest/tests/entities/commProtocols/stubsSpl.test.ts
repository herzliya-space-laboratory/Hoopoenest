import createStubsSpl from "../../../src/entities/commProtocols/stubsSpl";
const stubsSpl = createStubsSpl(4);

describe("STUBS SPL", () => {
	test("Call decode SPL with an empty buffer and expect error", () => {
		expect(() => stubsSpl.decode(Buffer.alloc(0))).toThrowError();
	});

	test("Call decode SPL with a too short buffer and expect error", () => {
		expect(() => stubsSpl.decode(Buffer.alloc(2))).toThrowError();
	});

	test("Call decode SPL with a wrong data length and expect error", () => {
		const encoded = Buffer.alloc(8);
		encoded[7] = 5;
		expect(() => stubsSpl.decode(encoded)).toThrowError();
	});

	test("Call decode SPL with a minimal length and expect zeros object", () => {
		const encoded = Buffer.alloc(8);
		const expected = {
			key: {
				serviceType: 0,
				serviceSubType: 0,
			},
			commandId: 0,
			data: Buffer.alloc(0),
		};

		expect(stubsSpl.decode(encoded)).toEqual(expected);
	});

	test("Call decode SPL with a real buffer and expect correct object", () => {
		const encoded = Buffer.from("0524C705031905000123456789", "hex");
		const expected = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			commandId: 13050885,
			data: Buffer.from("0123456789", "hex"),
		};

		expect(stubsSpl.decode(encoded)).toEqual(expected);
	});

	test("Call encode SPL with a wrong object and expect error", () => {
		const decoded = {
			sdcsdcsd: 9,
		};
		expect(() => stubsSpl.encode(decoded)).toThrow();
	});

	test("Call encode SPL with a real object and expect correct buffer", () => {
		const decoded = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			commandId: 13050885,
			isForAllSats: false,
			data: Buffer.from("0123456789", "hex"),
		};
		const expected = Buffer.from("0524C704031905000123456789", "hex");

		expect(stubsSpl.encode(decoded)).toEqual(expected);
	});

	test("Call encode SPL with forAllSats set to true expect satId to be 0", () => {
		const decoded = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			commandId: 13050885,
			isForAllSats: true,
			data: Buffer.from("0123456789", "hex"),
		};
		const expected = Buffer.from("0524C700031905000123456789", "hex");

		expect(stubsSpl.encode(decoded)).toEqual(expected);
	});
});
