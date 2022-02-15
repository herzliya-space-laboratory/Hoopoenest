import parseJSON from "../../../../../src/entities/formatParsers/MIB/fileParsing/json";
import path from "path";

describe("MIB JSON parser", () => {
	it("fails when passing a wrong path to constructor", () => {
		expect(() => parseJSON("sdcsdc.json")).toThrow();
	});

	it("returns the whole format when requested correctly", () => {
		const actual = parseJSON(
			path.resolve(
				"tests",
				"entities",
				"formatParsers",
				"MIB",
				"fileParsing",
				"test.json"
			)
		);

		const expected = {
			telemetry: {
				serviceTypes: [
					{
						id: 1,
						name: "st1",
						serviceSubTypes: [
							{
								id: 1,
								name: "sst1",
								params: [{ name: "param1", type: "byte" }],
							},
						],
					},
					{
						id: 2,
						name: "st2",
						serviceSubTypes: [
							{
								id: 2,
								name: "sst2",
								params: [],
							},
						],
					},
				],
			},
			telecommands: {
				serviceTypes: [],
			},
			calibrations: [],
		};

		expect(actual).toEqual(expected);
	});
});
