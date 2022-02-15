const preParsing = require("../src/lib/preParsing");
const fs = require("fs");
const path = require("path");

describe("Pre-Parsing", () => {
	test("it converts calibration uuids into ids correctly and add missing ranges", () => {
		const file = fs.readFileSync(
			path.join(__dirname, "..", "MIBexamplePreParsed.json")
		);
		const mibExample = JSON.parse(file);
		const parsed = preParsing(mibExample);
		expect(parsed.telemetry.calibrations[1].id).toBe(2);
		expect(
			parsed.telemetry.serviceTypes[0].serviceSubTypes[0].params[0]
				.calibration
		).toBe(2);
		expect(
			parsed.telemetry.serviceTypes[0].serviceSubTypes[0].params[1]
				.bitfields[0].calibration
		).toBe(2);
		expect(
			parsed.telemetry.serviceTypes[0].serviceSubTypes[0].params[2].range
				.min
		).toBe(0);
	});
});
