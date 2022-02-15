import EndNodeSocketIOManager from "../../src/APIManager/SocketIOManager";
import ServerMock from "./SocketIOServerMock";
import { commProtocolPacket } from "../../src/commProtocols/types";
import io from "socket.io";

const port = 3001;
let testReceviedPacket: commProtocolPacket;
let testSentPacket: commProtocolPacket;
let isConnected: boolean;

let server1: ServerMock;
let endCLient: EndNodeSocketIOManager;

const gotPacketCallback = (packet: commProtocolPacket) => {
	testSentPacket = packet;
};
const sentPacketCallback = (packet: commProtocolPacket) => {
	testReceviedPacket = packet;
};
const connectionCallback = (socket: io.Socket) => {
	isConnected = socket.connected;
};

const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
	server1 = new ServerMock(port, gotPacketCallback, connectionCallback);

	endCLient = new EndNodeSocketIOManager();
	endCLient.start("en1", `http://localhost:${port}`, sentPacketCallback);

	await wait(100);
});

afterEach(async () => {
	endCLient.close();
	server1.close();
});

describe("SocketIO Manager", () => {
	test("should connect successfully to server", () => {
		expect(isConnected).toEqual(true);
	});

	test("should disconnect successfully from server", async () => {
		endCLient.close();

		await wait(100);

		expect(isConnected).toEqual(false);
	});

	test("should reconnect to server", async () => {
		server1.close();

		server1 = new ServerMock(port, gotPacketCallback, connectionCallback);

		await wait(2000);

		expect(isConnected).toEqual(true);
	});

	// test("should throw error when tryng to send packet when disconnected", async () => {
	// 	const samplePacket = {
	// 		satCallsign: "123",
	// 		satSSID: 1,
	// 		data: Buffer.from(
	// 			"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
	// 			"hex"
	// 		),
	// 	};

	// 	endCLient.close();

	// 	await wait(100);

	// 	expect(() => endCLient.gotPacket(samplePacket)).to();
	// });

	test("should send packet correctly to server", async () => {
		const samplePacket = {
			satCallsign: "123",
			satSSID: 1,
			data: Buffer.from(
				"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
				"hex"
			),
		};

		endCLient.gotPacket(samplePacket);

		await wait(100);

		expect(testSentPacket).toStrictEqual(samplePacket);
	});

	test("should recive packet correctly from server", async () => {
		const samplePacket = {
			data: Buffer.from(
				"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
				"hex"
			),
		};

		server1.send(samplePacket);

		await wait(100);

		expect(testReceviedPacket).toStrictEqual(samplePacket);
	});
});
