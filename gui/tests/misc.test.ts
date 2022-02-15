import dayjs from "dayjs";
import { getDateQuery, getSatFields, isKeyEqual } from "../src/lib/misc";

describe("misc functions", () => {
	describe("getSatFields", () => {
		const mockSatFields = [
			{ name: "a", telemetryName: "hihihi", type: "int" },
			{ name: "b", telemetryName: "hsdc", type: "int" },
			{
				name: "c",
				commandName: "hihihi",
				type: "int",
				onlyOnSend: false,
			},
			{
				name: "d",
				commandName: "hihihi",
				type: "int",
				onlyOnSend: true,
			},
		];
		test("gets only telemetry fields", () => {
			const res = getSatFields("telemetry", mockSatFields);
			expect(res).toMatchObject([
				{ name: "a", telemetryName: "hihihi", type: "int" },
				{ name: "b", telemetryName: "hsdc", type: "int" },
			]);
		});

		test("gets only commands fields not for send", () => {
			const res = getSatFields("telecommands", mockSatFields);
			expect(res).toMatchObject([
				{ name: "c", commandName: "hihihi", type: "int" },
			]);
		});

		test("gets only commands fields for send", () => {
			const res = getSatFields("telecommands", mockSatFields, true);
			expect(res).toMatchObject([
				{
					name: "d",
					commandName: "hihihi",
					type: "int",
					onlyOnSend: true,
				},
			]);
		});
	});

	describe("isKeyEqual", () => {
		it("checks that MIB key is equal", () => {
			expect(
				isKeyEqual(
					{ serviceType: 2, serviceSubType: 1 },
					{ serviceType: 2, serviceSubType: 1 },
					"MIB"
				)
			).toBe(true);
			expect(
				isKeyEqual(
					{ serviceType: 1, serviceSubType: 1 },
					{ serviceType: 2, serviceSubType: 1 },
					"MIB"
				)
			).toBe(false);
		});
	});

	describe("getDateQuery", () => {
		const start = new Date().toISOString();
		const end = dayjs().add(2, "day").toDate().toISOString();
		it("adds only existing fields to the query", () => {
			expect(getDateQuery(start, end)).toMatchObject({
				$gte: new Date(start),
				$lte: new Date(end),
			});
			expect(getDateQuery(start, undefined)).toMatchObject({
				$gte: new Date(start),
			});
			expect(getDateQuery(undefined, end)).toMatchObject({
				$lte: new Date(end),
			});
		});
	});
});
