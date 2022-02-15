import EndNodeSocketIO from "../../../src/use-cases/EndNodeManager/EndNodeSocketIO";
import { endNodePacket } from "../../../src/use-cases/EndNodeManager/types";
import { io } from "socket.io-client";

const port = 3000;

let server: EndNodeSocketIO;
let clients: any[];

let testPakcet: endNodePacket;
let testEnList: string[];

const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));
const waitForConnection = async (socketClient: any) => {
	while (!socketClient.connected) await wait(100);
};
const waitForDisconnection = async (socketClient: any) => {
	await wait(100);
	while (!socketClient.disconnected) await wait(100);
};

beforeEach(async () => {
	server = new EndNodeSocketIO(
		port,
		(packet) => {
			testPakcet = packet;
		},
		(endnodes) => {
			testEnList = endnodes;
		}
	);
	clients = [
		io(`ws://localhost:${port}?name=en1`),
		io(`ws://localhost:${port}?name=en2`),
	];

	await waitForConnection(clients[0]);
	await waitForConnection(clients[1]);
});

afterEach(() => {
	clients.forEach((client) => {
		client.close();
	});
	server.close();
});

describe("EndNode socket.io manager", () => {
	it("should save endnodes list correctry", async () => {
		expect(testEnList.sort()).toEqual(["en1", "en2"].sort());
	});

	test("should update endnodes list when an endnode disconnects", async () => {
		testEnList = [];
		clients[0].disconnect();

		await waitForDisconnection(clients[0]);

		expect(testEnList).toEqual(["en2"]);
	});

	test("should send packet correctly to client", async (done) => {
		let recivedPacket = undefined;
		const samplePacket: endNodePacket = {
			satCallsign: "123",
			satSSID: 1,
			data: Buffer.from(
				"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
				"hex"
			),
		};

		clients[0].on("sendPacket", (packet: endNodePacket) => {
			recivedPacket = packet;
			expect(recivedPacket).toStrictEqual(samplePacket);
			done();
		});

		server.sendPacket(samplePacket, "en1");
	});

	test("should throw error tries to send packet when disconnected", async () => {
		const samplePacket: endNodePacket = {
			satCallsign: "123",
			satSSID: 1,
			data: Buffer.from(
				"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
				"hex"
			),
		};

		clients[0].disconnect();

		await waitForDisconnection(clients[0]);

		expect(() => server.sendPacket(samplePacket, "en1")).toThrowError();
	});

	test("should recive packet correctly from client", async () => {
		const samplePacket: endNodePacket = {
			satCallsign: "123",
			satSSID: 1,
			data: Buffer.from(
				"9E9C606292986468B06890A6866303F0ACAB05AFFF56",
				"hex"
			),
		};

		clients[0].emit("gotPacket", samplePacket);

		await wait(100);

		expect(testPakcet).toStrictEqual(samplePacket);
	});

	it("returns endnodes list when requested", async () => {
		expect(server.getEndNodes().sort()).toEqual(["en1", "en2"].sort());
	});
});
