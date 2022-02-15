import MibParser from "../../../../src/entities/formatParsers/MIB/MIBParser";
import { packet, packetType } from "../../../../src/types";
import dayjs from "dayjs";
import path from "path";

let parser: MibParser;

beforeAll(() => {
	parser = new MibParser(
		path.resolve(
			"tests",
			"entities",
			"formatParsers",
			"MIB",
			"MIBmock.json"
		)
	);
});

describe("MIB parser", () => {
	it("fails when the file format is wrong", () => {
		expect(
			() =>
				new MibParser(
					path.resolve(
						"tests",
						"entities",
						"formatParsers",
						"MIB",
						"fails.json"
					)
				)
		).toThrow();
	});

	it("should fail to parse a non-existing packet", () => {
		const buf = Buffer.alloc(1);
		expect(() =>
			parser.parsePacket(
				buf,
				{
					serviceType: 2,
					serviceSubType: 1,
				},
				"telemetry"
			)
		).toThrow();
	});

	it("parses correctly an empty packet", () => {
		const buf = Buffer.alloc(0);
		const expected = {
			key: {
				serviceType: 2,
				serviceSubType: 2,
			},
			type: "telemetry",
			name: "sst2",
			params: [],
		};

		expect(
			parser.parsePacket(
				buf,
				{
					serviceType: 2,
					serviceSubType: 2,
				},
				"telemetry"
			)
		).toEqual(expected);
	});

	it("parses correctly a simple packet: one byte parameter", () => {
		const buf = Buffer.alloc(1);
		buf[0] = 13;
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			type: "telemetry",
			name: "sst1",
			params: [{ name: "param1", value: 13 }],
		};

		expect(
			parser.parsePacket(
				buf,
				{
					serviceType: 1,
					serviceSubType: 1,
				},
				"telemetry"
			)
		).toEqual(expected);
	});

	it("throws on encoding a non existing pakcet", () => {
		const packet = {
			key: {
				serviceType: 2324234,
				serviceSubType: 1324123,
			},
			category: "dscsd",
			name: "sdcsdc",
			params: [],
			satellite: "dcsdc",
			groundTime: dayjs().toDate(),
			type: "telemetry" as packetType,
		};

		expect(() => parser.encodePacket(packet)).toThrow();
	});

	it("encodes good packet correctly", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			category: "dscsd",
			name: "sdcsdc",
			params: [13],
			satellite: "dcsdc",
			groundTime: dayjs().toDate(),
			type: "telemetry" as packetType,
		};

		const expected = Buffer.alloc(1);
		expected[0] = 13;

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("parses int16, uint16, int32, uint32", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 2,
			},
			name: "sst2",
			params: [
				{ name: "param1", value: -100 },
				{ name: "param2", value: 500 },
				{ name: "param3", value: -1000 },
				{ name: "param4", value: 2000 },
			],
			type: "telemetry",
		};

		const raw = Buffer.from("FF9C01F4FFFFFC18000007D0", "hex");

		expect(parser.parsePacket(raw, expected.key, "telemetry")).toEqual(
			expected
		);
	});

	it("parses float and double", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 3,
			},
			name: "sst3",
			params: [
				{ name: "param1", value: 24.600000381469727 },
				{ name: "param2", value: 523.001 },
			],
			type: "telemetry",
		};

		const raw = Buffer.from("41C4CCCD408058020C49BA5E", "hex");

		expect(parser.parsePacket(raw, expected.key, "telemetry")).toEqual(
			expected
		);
	});

	it("parses datetime", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 4,
			},
			name: "sst4",
			params: [{ name: "param1", value: new Date(1166259243 * 1000) }],
			type: "telemetry",
		};

		const raw = Buffer.from("4583B42B", "hex");

		expect(parser.parsePacket(raw, expected.key, "telemetry")).toEqual(
			expected
		);
	});

	it("encodes int16, uint16, int32, uint32", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 2,
			},
			params: [-100, 500, -1000, 2000],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("FF9C01F4FFFFFC18000007D0", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("encodes float and double", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 3,
			},
			params: [24.600000381469727, 523.001],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("41C4CCCD408058020C49BA5E", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("encodes datetime", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 4,
			},
			params: [new Date(1166259243 * 1000)],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("4583B42B", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("parses little endian correctly", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 5,
			},
			name: "sst5",
			params: [
				{ name: "param1", value: 14 },
				{ name: "param2", value: 9 },
			],
			type: "telemetry",
		};

		const raw = Buffer.from("0e000900", "hex");

		expect(parser.parsePacket(raw, expected.key, "telemetry")).toEqual(
			expected
		);
	});

	it("encodes little endian correctly", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 5,
			},

			params: [14, 9],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("0e000900", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("throws when passing an invalid key", () => {
		const packet = {
			key: 1234,
			params: [],
			type: "telemetry" as packetType,
		};
		expect(() => parser.parsePacket(Buffer.alloc(0), 12334)).toThrow();
		expect(() => parser.encodePacket(packet)).toThrow();
	});

	it("throws when parsing a too short buffer", () => {
		expect(() =>
			parser.parsePacket(Buffer.alloc(0), {
				serviceType: 1,
				serviceSubType: 1,
			})
		).toThrow();
	});

	it("throws when encoding a too short packet", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			params: [],
			type: "telemetry" as packetType,
		};
		expect(() => parser.encodePacket(packet)).toThrow();
	});

	it("throws when encoding a packet with wrong params", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			params: [
				{
					value: new Date(),
					name: "param1",
					type: "datetime",
				},
			],
			type: "telemetry" as packetType,
		};
		expect(() => parser.encodePacket(packet)).toThrow();
	});

	it("parses buffer type", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 7,
			},
			name: "sst7",
			params: [{ name: "param1", value: "010101" }],
			type: "telemetry",
		};

		const raw = Buffer.from("010101", "hex");

		expect(
			parser.parsePacket(raw, {
				serviceType: 1,
				serviceSubType: 7,
			})
		).toEqual(expected);
	});

	it("encodes buffer type", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 7,
			},
			params: ["010100"],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("010100", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("parses with linear calibration", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 9,
			},
			params: [{ name: "param1", value: 5 }],
			name: "sst9",
			type: "telemetry",
		};

		const raw = Buffer.from("01", "hex");

		expect(
			parser.parsePacket(raw, {
				serviceType: 1,
				serviceSubType: 9,
			})
		).toEqual(expected);
	});

	it("encodes with linear calibration", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 9,
			},
			params: [5],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.from("01", "hex");

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("parses bitmap", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 10,
			},
			name: "sst10",
			params: [
				{
					name: "param1",
					value: [
						{ name: "field1", value: 1 },
						{ name: "field2", value: 0 },
						{ name: "field3", value: 1 },
						{ name: "field4", value: 1 },
						{ name: "field5", value: 0 },
						{ name: "field6", value: 1 },
						{ name: "field8", value: 1 },
					],
				},
			],
			type: "telemetry",
		};

		const raw = Buffer.alloc(1);
		raw[0] = parseInt("10110101", 2);

		expect(
			parser.parsePacket(raw, {
				serviceType: 1,
				serviceSubType: 10,
			})
		).toEqual(expected);
	});

	it("parses bitmap format", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 10,
			},
			category: "st1",
			name: "sst10",
			params: [
				{
					type: "bitmap",
					name: "param1",
					value: [
						{
							name: "field1",
							value: 1,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field2",
							value: 0,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field3",
							value: 1,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field4",
							value: 1,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field5",
							value: 0,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field6",
							value: 1,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
						{
							name: "field8",
							value: 1,
							range: {
								min: 0,
								max: 1,
							},
							type: "int",
						},
					],
				},
			],
			type: "telemetry",
		};

		const raw = Buffer.alloc(1);
		raw[0] = parseInt("10110101", 2);

		const packet = parser.parsePacket(raw, {
			serviceType: 1,
			serviceSubType: 10,
		});

		expect(parser.formatPacket(packet, packet.key, "telemetry")).toEqual(
			expected
		);
	});

	it("encodes bitmap", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 10,
			},
			params: [[1, 0, 1, 1, 0, 1, 1]],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.alloc(1);
		expected[0] = parseInt("10110101", 2);

		expect(parser.encodePacket(packet)).toEqual(expected);
	});

	it("parses bitmap with linear and enum calibrations", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 11,
			},
			name: "sst11",
			params: [
				{
					name: "param1",
					value: [
						{ name: "field1", value: "yes" },
						{ name: "field2", value: 1 },
						{ name: "field3", value: 3 },
					],
				},
			],
			type: "telemetry",
		};

		const raw = Buffer.alloc(1);
		raw[0] = parseInt("10000011", 2);

		expect(
			parser.parsePacket(raw, {
				serviceType: 1,
				serviceSubType: 11,
			})
		).toEqual(expected);
	});

	it("encodes bitmap with linear and enum calibrations", () => {
		const packet = {
			key: {
				serviceType: 1,
				serviceSubType: 11,
			},
			category: "st1",
			name: "sst10",
			params: [["yes", 1, 3]],
			type: "telemetry" as packetType,
		};

		const expected = Buffer.alloc(1);
		expected[0] = parseInt("10000011", 2);

		expect(parser.encodePacket(packet)).toEqual(expected);
	});
});
