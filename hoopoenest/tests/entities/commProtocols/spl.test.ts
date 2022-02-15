import spl from "../../../src/entities/commProtocols/spl";
import dayjs from "dayjs";

describe("SPL", () => {
	test("Call decode SPL with an empty buffer and expect error", () => {
		expect(() => spl.decode(Buffer.alloc(0))).toThrowError();
	});

	test("Call decode SPL with a too short buffer and expect error", () => {
		expect(() => spl.decode(Buffer.alloc(2))).toThrowError();
	});

	test("Call decode SPL with a wrong data length and expect error", () => {
		const encoded = Buffer.alloc(8);
		encoded[3] = 5;
		expect(() => spl.decode(encoded)).toThrowError();
	});

	test("Call decode SPL with a minimal length and expect zeros object", () => {
		const encoded = Buffer.alloc(8);
		const expected = {
			key: {
				serviceType: 0,
				serviceSubType: 0,
			},
			satelliteTime: dayjs(0).toDate(),
			data: Buffer.alloc(0),
		};

		expect(spl.decode(encoded)).toEqual(expected);
	});

	test("Call decode SPL with a real buffer and expect correct object", () => {
		const encoded = Buffer.from("0319000524C760130123456789", "hex");
		const expected = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			satelliteTime: dayjs.unix(617046035).toDate(),
			data: Buffer.from("0123456789", "hex"),
		};

		expect(spl.decode(encoded)).toEqual(expected);
	});

	test("Call encode SPL with a wrong object and expect error", () => {
		const decoded = {
			sdcsdcsd: 9,
		};
		expect(() => spl.encode(decoded)).toThrow();
	});

	test("Call encode SPL with date before now and expect execution time to be 0", () => {
		const date = dayjs().subtract(1, "day");
		const decoded = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			commandId: 1,
			satelliteTime: date.toDate(),
			data: Buffer.from("0123456789", "hex"),
		};
		const expected = Buffer.from(
			"0000000103190005000000000123456789",
			"hex"
		);

		expect(spl.encode(decoded)).toEqual(expected);
	});

	test("Call encode SPL with a real object and expect correct buffer", () => {
		const date = dayjs().add(1, "day");
		const decoded = {
			key: {
				serviceType: 3,
				serviceSubType: 25,
			},
			satelliteTime: date.toDate(),
			commandId: 1,
			data: Buffer.from("0123456789", "hex"),
		};
		const expected = Buffer.from(
			`0000000103190005${date
				.unix()
				.toString(16)
				.padStart(8, "0")}0123456789`,
			"hex"
		);

		expect(spl.encode(decoded)).toEqual(expected);
	});
});
