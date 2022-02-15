import dayjs from "dayjs";
import { Binary, ObjectID } from "mongodb";
import {
	JSONifyBuffers,
	jsonReviver,
	parseDBtypes,
	parseObjTimeSpan,
} from "../../src/entities/misc";

describe("json reviver function", () => {
	it("should convert ISO date strings to Date objects", () => {
		const obj = {
			date: new Date().toISOString().split(".")[0],
		};

		const jsonParsed = JSON.parse(JSON.stringify(obj), jsonReviver);

		expect(jsonParsed.date instanceof Date).toBe(true);
	});
});

describe("timeSpan parser", () => {
	it("should convert JSON time stamps to date withh added time", () => {
		const date = new Date();
		const obj = {
			timeSpan: {
				type: "TimeSpan",
				secs: 1,
				mins: 1,
				hours: 1,
			},
			date,
		};

		const expected = {
			timeSpan: dayjs()
				.add(1, "hour")
				.add(1, "minute")
				.add(1, "second")
				.millisecond(0)
				.toDate(),
			date,
		};
		const res = parseObjTimeSpan(obj);

		expect(dayjs(res.timeSpan).millisecond(0).toDate()).toStrictEqual(
			expected.timeSpan
		);
		expect(res.date).toEqual(expected.date);
	});
});

describe("JSONify buffers parser", () => {
	it("should convert Buffers to JSON form", () => {
		const obj = {
			buf: Buffer.from("123", "ascii"),
			arr: [Buffer.from("123", "ascii")],
			obj: {
				a: Buffer.from("123", "ascii"),
			},
		};

		const expected = JSON.parse(JSON.stringify(obj));
		const res = JSONifyBuffers(obj);

		expect(res).toEqual(expected);
	});
});

describe("mongo Binary to buffer", () => {
	it("parses only binary to buffer and id to string", () => {
		const buf = Buffer.from("012345", "hex");
		const date = new Date();
		const obj = {
			b: new Binary(buf),
			c: date,
			d: new ObjectID("123456789012"),
		};

		expect(parseDBtypes(obj)).toEqual({
			b: buf,
			c: date,
			d: new ObjectID("123456789012").toHexString(),
		});
	});
});
