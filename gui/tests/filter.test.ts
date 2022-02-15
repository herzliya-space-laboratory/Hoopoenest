import dayjs from "dayjs";
import { filter, filterUrlQuery } from "../src/lib/filter";

const satFields = [
	{
		name: "groundTime",
		type: "datetime",
		telemetryName: "Ground Time",
	},
	{
		name: "commandId",
		telemetryName: "Command Id",
		type: "int",
	},
	{
		name: "isForAllSats",
		commandName: "Is for all satellites?",
		onlyOnSend: true,
		type: "boolean",
	},
];

const testPacket = {
	key: { serviceType: 1, serviceSubType: 1 },
	commandId: 1,
	groundTime: dayjs(),
};

const notConformantPacket = {
	key: { serviceType: 1, serviceSubType: 1 },
	commandId: 2,
	groundTime: dayjs(),
};

const filterQuery = {
	key: { serviceType: 1, serviceSubType: 1 },
	commandId: 1,
	groundTime: {
		from: dayjs().subtract(2, "day").toISOString(),
		to: dayjs().add(2, "day").toISOString(),
	},
};

describe("URL filter query generator", () => {
	it("should return empty string with empty query", () => {
		expect(filterUrlQuery({}, satFields)).toBe("");
	});

	it("should return correct url query for every filter query", () => {
		expect(filterUrlQuery(filterQuery, satFields)).toBe(
			`&key={"serviceType":1,"serviceSubType":1}&groundTime={"$gte":"${filterQuery.groundTime.from}","$lte":"${filterQuery.groundTime.to}"}&commandId=1`
		);
	});
});

describe("packet filter checker", () => {
	it("should pass packets that conform to the query", () => {
		expect(filter(filterQuery, testPacket as any, satFields, "MIB")).toBe(
			true
		);
	});

	it("should filter out packets which don't conform to the query", () => {
		expect(
			filter(filterQuery, notConformantPacket as any, satFields, "MIB")
		).toBe(false);
	});
});
