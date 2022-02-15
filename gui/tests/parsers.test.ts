import { jsonReviver, parseSocketPacket } from "../src/lib/parsers";
import dayjs from "dayjs";

describe("API parsers", () => {
	const apiObj = {
		hello: dayjs(),
		arr: [1, 2, 3, dayjs()],
	};
	describe("json reviver", () => {
		it("should parse date strings into dayjs", () => {
			const json = JSON.stringify(apiObj);
			const res = JSON.parse(json, jsonReviver);
			expect(res).toMatchObject(apiObj);
		});
	});
	describe("socket packet parser", () => {
		it("should parse date strings into dayjs", () => {
			const json = JSON.parse(JSON.stringify(apiObj));
			const res = parseSocketPacket(json);
			expect(res).toMatchObject(apiObj);
		});
	});
});
