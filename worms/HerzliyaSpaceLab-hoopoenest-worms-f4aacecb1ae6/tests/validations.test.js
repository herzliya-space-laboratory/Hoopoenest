const {
	validateName,
	validateID,
	validateParamRange,
	validatePacketSize,
} = require("../src/lib/validations");

describe("Name validations", () => {
	test("it fails when name is too short", () => {
		expect(validateName({ name: "" }, [])).toBe(
			"must be longer than 2 ASCII characters"
		);
	});
	test("it fails when name has non ascii characters", () => {
		expect(validateName({ name: "דבגיבדגבדג" }, [])).toBe(
			"must be longer than 2 ASCII characters"
		);
	});
	test("it fails when name has been taken", () => {
		expect(
			validateName({ name: "name" }, [{ name: "name" }, { name: "name" }])
		).toBe("is already taken");
	});
	test("it passes with an empty name array", () => {
		expect(validateName({ name: "name" }, [])).toBe("");
	});
	test("it passes with a good name", () => {
		expect(validateName({ name: "name" }, [{ name: "bal" }])).toBe("");
	});
});

describe("ID validations", () => {
	test("it fails when id is too small", () => {
		expect(validateID({ id: -1 }, [])).toBe("must be between 0 and 255");
	});
	test("it fails when id is too big", () => {
		expect(validateID({ id: 256 }, [])).toBe("must be between 0 and 255");
	});
	test("it fails when id has been taken", () => {
		expect(validateID({ id: 1 }, [{ id: 1 }, { id: 1 }])).toBe(
			"is already taken"
		);
	});
	test("it passes with an empty id array", () => {
		expect(validateID({ id: 1 }, [])).toBe("");
	});
	test("it passes with a good id", () => {
		expect(validateID({ id: 1 }, [{ name: 2 }])).toBe("");
	});
});

describe("Range validations", () => {
	test("it fails if end is smaller than start", () => {
		const param = {
			type: "int32",
			range: {
				min: 3,
				max: -1,
			},
		};
		expect(validateParamRange(param)).toBe(
			"range start must be lower than end"
		);
	});
	test("it range is outside of type range", () => {
		const param = {
			type: "uint32",
			range: {
				min: -1,
				max: 10,
			},
		};
		expect(validateParamRange(param)).toBe(
			"range must be inside type limits"
		);
	});
	test("it passes with good ranges", () => {
		const param = {
			type: "int32",
			range: {
				min: 3,
				max: 100,
			},
		};
		expect(validateParamRange(param)).toBe("");
	});
});

describe("Packet size validations", () => {
	test("it fails when packet is larger than max", () => {
		const packet = {
			params: [
				{
					type: "int32",
				},
				{
					type: "double",
				},
			],
		};
		expect(validatePacketSize(packet, 10)).toBe(
			"max size packet size (12 bytes) exceeded the maximum of 10"
		);
	});
	test("it passes when the packet's length is equal max", () => {
		const packet = {
			params: [
				{
					type: "int16",
				},
				{
					type: "double",
				},
			],
		};
		expect(validatePacketSize(packet, 10)).toBe("");
	});
	test("it passes when packet shorter than max", () => {
		const packet = {
			params: [
				{
					type: "buffer",
					size: 4,
				},
			],
		};
		expect(validatePacketSize(packet, 10)).toBe("");
	});
});
