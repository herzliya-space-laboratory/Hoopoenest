import {
	groupParamsFromSameKey,
	validateGraphOptions,
} from "../src/lib/graphs";

describe("graph options validation", () => {
	it("should pass valid options", () => {
		expect(
			validateGraphOptions(
				true,
				false,
				"2000-01-03T09:06:56",
				undefined,
				"MIB",
				[
					{
						packetKey: { serviceType: 1, serviceSubType: 1 },
						paramKey: 0,
					},
				]
			)
		).toBe(undefined);
	});

	it("should not pass invalid options", () => {
		expect(
			validateGraphOptions(true, false, undefined, undefined, "MIB", [
				{
					packetKey: { serviceType: undefined, serviceSubType: 1 },
					paramKey: undefined,
				},
			])
		).toBe("Start and end dates must be valid, if present");
	});
});

describe("Parameter grouping function", () => {
	it("should group parameters according to common packet keys", () => {
		const params = [
			{
				packetKey: { serviceType: 1, serviceSubType: 1 },
				paramKey: 1,
				packetType: "telemetry" as const,
			},
			{
				packetKey: { serviceType: 1, serviceSubType: 1 },
				paramKey: 2,
				packetType: "telemetry" as const,
			},
			{
				packetKey: { serviceType: 1, serviceSubType: 2 },
				paramKey: 2,
				packetType: "telemetry" as const,
			},
			{
				packetKey: { serviceType: 1, serviceSubType: 1 },
				paramKey: 1,
				packetType: "telecommands" as const,
			},
		];

		expect(groupParamsFromSameKey(params, "MIB")).toMatchObject([
			{
				packetKey: { serviceType: 1, serviceSubType: 1 },
				paramKeys: [1, 2],
				packetType: "telemetry" as const,
			},
			{
				packetKey: { serviceType: 1, serviceSubType: 2 },
				paramKeys: [2],
				packetType: "telemetry" as const,
			},
			{
				packetKey: { serviceType: 1, serviceSubType: 1 },
				paramKeys: [1],
				packetType: "telecommands" as const,
			},
		]);
	});
});
