import PacketManager from "../../src/use-cases/PacketManager";
import MIBParser from "../../src/entities/formatParsers/MIB/MIBParser";
import spl from "../../src/entities/commProtocols/spl";
import dayjs from "dayjs";
import { packetType } from "../../src/types";
import path from "path";

describe("PacketManager", () => {
	const manager = new PacketManager(
		[spl],
		new MIBParser(
			path.resolve(
				"tests",
				"entities",
				"formatParsers",
				"MIB",
				"MIBmock.json"
			)
		)
	);

	it("parses a raw packet with format and protocols", () => {
		const date = dayjs().millisecond(0).toDate();

		const raw = Buffer.from(
			"01010001" + dayjs(date).unix().toString(16) + "01",
			"hex"
		);

		const expected = {
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			name: "sst1",
			params: [{ name: "param1", value: 1 }],
			type: "telemetry",
			satellite: "sat",
			satelliteTime: date,
		};

		expect(manager.parsePacket(raw, "sat", "telemetry")).toMatchObject(
			expected
		);
	});

	it("encodes a decoded packet to raw binary properly", () => {
		const date = dayjs().subtract(1, "day").toDate();

		const expected = Buffer.from("00000001010100010000000001", "hex");

		const packet = {
			id: "asdf",
			key: {
				serviceType: 1,
				serviceSubType: 1,
			},
			params: [1],
			type: "telemetry" as packetType,
			satelliteTime: date,
			groundTime: new Date(),
			satellite: "sat",
			commandId: 1,
			raw: "",
		};

		expect(manager.encodePacket(packet)).toEqual(expected);
	});

	it("returns the required fields and packet format", () => {
		expect(manager.getCommProtocolsFields()).toEqual({
			format: "MIB",
			fields: [
				{
					name: "groundTime",
					type: "datetime",
					telemetryName: "Ground Time",
				},
				{
					name: "sentTime",
					type: "datetime",
					commandName: "Sent Time",
					onSend: false,
					onHistory: true,
				},
				{
					name: "commandId",
					type: "int",
					commandName: "Command Id",
					onSend: false,
					onHistory: true,
				},
				{
					name: "satelliteTime",
					type: "datetime",
					telemetryName: "Satellite Time",
					commandName: "Execution Time",
					onSend: true,
					onHistory: true,
					range: {
						min: new Date(0),
						max: new Date(4294967295 * 1000),
					},
				},
			],
		});
	});
});
