import MibParser from "../../../../src/entities/formatParsers/MIB/MIBParser";
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
			"mibFormatTest.json"
		)
	);
});

describe("MIB parser format parser", () => {
	it("should throw when requesting a non-existing packet format", () => {
		expect(() =>
			parser.getPacketFormat(
				{ serviceType: 1, serviceSubType: 7 },
				"telecommands"
			)
		).toThrow();
	});
	it("should return all keys", () => {
		const parser = new MibParser(
			path.resolve(
				"tests",
				"entities",
				"formatParsers",
				"MIB",
				"fileParsing",
				"test.json"
			)
		);
		expect(parser.getKeys("telemetry")).toEqual([
			{
				id: 1,
				name: "st1",
				subTypes: [{ id: 1, name: "sst1" }],
			},
			{
				id: 2,
				name: "st2",
				subTypes: [{ id: 2, name: "sst2" }],
			},
		]);
	});

	it("should return all packets formats", () => {
		const parser = new MibParser(
			path.resolve(
				"tests",
				"entities",
				"formatParsers",
				"MIB",
				"fileParsing",
				"test.json"
			)
		);
		expect(parser.getAllPacketFormats("telemetry")).toEqual([
			{
				id: 1,
				name: "st1",
				subTypes: [
					{
						category: "st1",
						id: 1,
						key: {
							serviceSubType: 1,
							serviceType: 1,
						},
						name: "sst1",
						params: [
							{
								name: "param1",
								range: {
									max: 255,
									min: 0,
								},
								type: "int",
							},
						],
					},
				],
			},
			{
				id: 2,
				name: "st2",
				subTypes: [
					{
						category: "st2",
						id: 2,
						key: {
							serviceSubType: 2,
							serviceType: 2,
						},
						name: "sst2",
						params: [],
					},
				],
			},
		]);
	});
	it("should return packet format requested", () => {
		expect(
			parser.getPacketFormat(
				{ serviceType: 1, serviceSubType: 1 },
				"telemetry"
			)
		).toEqual({
			name: "sst1",
			category: "st1",
			key: { serviceType: 1, serviceSubType: 1 },
			params: [
				{
					name: "param1",
					type: "int",
					range: {
						min: 0,
						max: 255,
					},
				},
			],
		});
	});
	it("should return only possible values for params with enum calibration", () => {
		expect(
			parser.getPacketFormat(
				{ serviceType: 1, serviceSubType: 2 },
				"telemetry"
			)
		).toEqual({
			name: "sst2",
			category: "st1",
			key: { serviceType: 1, serviceSubType: 2 },
			params: [
				{
					name: "param1",
					type: "enum",
					values: ["yes", "no"],
				},
			],
		});
	});
	it("parses number and date ranges", () => {
		const expected = {
			name: "sst5",
			category: "st1",
			key: {
				serviceType: 1,
				serviceSubType: 5,
			},
			params: [
				{
					name: "param1",
					type: "datetime",
					range: {
						min: dayjs(
							"01/01/2000 01:01:01",
							"DD/MM/YYYY HH:mm:ss"
						).toDate(),
					},
				},
				{
					name: "param2",
					type: "int",
					range: {
						min: 3,
						max: 9,
					},
				},
			],
		};

		expect(
			parser.getPacketFormat(
				{
					serviceType: 1,
					serviceSubType: 5,
				},
				"telemetry"
			)
		).toEqual(expected);
	});
	it("should return type range adjusted to linear calibration, but not explicit range", () => {
		expect(
			parser.getPacketFormat(
				{ serviceType: 1, serviceSubType: 3 },
				"telemetry"
			)
		).toEqual({
			name: "sst3",
			category: "st1",
			key: { serviceType: 1, serviceSubType: 3 },
			params: [
				{
					name: "param1",
					type: "int",
					range: {
						min: 200,
						max: 1021,
					},
					calibration: {
						b: 1,
						m: 4,
						name: "cal1",
						type: "linear",
					},
				},
			],
		});
	});

	it("parses description and unit", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 6,
			},
			category: "st1",
			name: "sst6",
			description: "a test packet",
			params: [
				{
					name: "param1",
					type: "int",
					range: {
						min: 0,
						max: 255,
					},
					description:
						"I'm Alon Grossman and I have scribbled on the HoopoeNest codebase",
					unit: "Nikita Viles",
				},
			],
		};

		expect(
			parser.getPacketFormat(
				{
					serviceType: 1,
					serviceSubType: 6,
				},
				"telemetry"
			)
		).toEqual(expected);
	});

	it("parses subSystem metadata", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 7,
			},
			category: "st1",
			name: "sst7",
			params: [
				{
					name: "param1",
					type: "int",
					range: {
						min: 0,
						max: 255,
					},
					subSystem: "ADCS",
				},
			],
		};

		expect(
			parser.getPacketFormat(
				{
					serviceType: 1,
					serviceSubType: 7,
				},
				"telemetry"
			)
		).toEqual(expected);
	});

	it("returns buffer size in format", () => {
		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 8,
			},
			category: "st1",
			name: "sst8",
			params: [
				{
					name: "param1",
					type: "buffer",
					size: 3,
				},
			],
		};

		expect(
			parser.getPacketFormat(
				{
					serviceType: 1,
					serviceSubType: 8,
				},
				"telemetry"
			)
		).toEqual(expected);
	});

	it("should work with bitmap i guess", () => {
		expect(
			parser.getPacketFormat(
				{ serviceType: 1, serviceSubType: 4 },
				"telemetry"
			)
		).toEqual({
			name: "sst4",
			category: "st1",
			key: { serviceType: 1, serviceSubType: 4 },
			params: [
				{
					name: "param1",
					type: "bitmap",
					bitfields: [
						{
							name: "field1",
							type: "enum",
							values: ["yes", "no"],
						},
						{
							name: "field2",
							type: "int",
							range: {
								min: 1,
								max: 5,
							},
							calibration: {
								b: 1,
								m: 4,
								name: "cal1",
								type: "linear",
							},
						},
						{
							name: "field4",
							range: { min: 0, max: 31 },
							type: "int",
						},
					],
				},
			],
		});
	});

	it("should add param names", () => {
		const packet = {
			commandId: 11,
			key: { serviceType: 1, serviceSubType: 4 },
			params: [["yes", 5, 1]],
			type: "telemetry" as const,
		};

		expect(parser.addParamsNames(packet)).toEqual({
			commandId: 11,
			key: { serviceType: 1, serviceSubType: 4 },
			params: [
				{
					name: "param1",
					value: [
						{ name: "field1", value: "yes" },
						{ name: "field2", value: 5 },
						{ name: "field4", value: 1 },
					],
				},
			],
			type: "telemetry" as const,
		});
	});
});
