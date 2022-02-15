import EndNodeTCPManager from "../../src/incomingAPIManager/TCPManager";
import TCPServerMock from "./TCPServerMockClass";

const port = 3000;

let server: TCPServerMock;
let client: EndNodeTCPManager;

let testPacket: Buffer;

const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
	server = new TCPServerMock(port, (data: Buffer) => {
		testPacket = data;
	});

	client = new EndNodeTCPManager("127.0.0.1", port, (data: Buffer) => {
		testPacket = data;
	});
	await client.connect();

	await wait(100);
});

afterEach(() => {
	client.close();
	server.close();
});

describe("TCP Manager", () => {
	test("should connect TCP client to TCP server correctly", () => {
		expect(Object.keys(server.clients)[0]).toBe(
			"::ffff:" +
				client.socket.localAddress +
				":" +
				String(client.socket.localPort)
		);
	});

	test("should disconnect correctly from TCP server", async () => {
		client.close();

		await wait(200);

		expect(server.clients).toEqual({});
	});

	test("should receive packet correctly from server", async () => {
		const samplePacket = Buffer.from("C000DBDDA8F2DBDC56DBDCC0", "hex");
		server.write(Object.keys(server.clients)[0], samplePacket);

		await wait(100);

		expect(testPacket).toEqual(samplePacket);
	});

	// test("should throw error when trying to send packet to server while not connect", async () => {
	// 	const samplePacket = Buffer.from("C000DBDDA8F2DBDC56DBDCC0", "hex");
	// 	client.close()

	// 	await wait(100);
	// 	client.write(samplePacket);
	// 	expect(() => client.write(samplePacket)).toThrowError();
	// });

	test("should try reconnect to server", async () => {
		server.close();

		server = new TCPServerMock(port, (data: Buffer) => {
			testPacket = data;
		});

		await wait(3000);

		expect(Object.keys(server.clients)[0]).toBeDefined();
	});

	test("should send packet correctly to client", async () => {
		const samplePacket = Buffer.from("C000DBDDA8F2DBDC56DBDCC0", "hex");
		client.write(samplePacket);

		await wait(100);

		expect(testPacket).toEqual(samplePacket);
	});
});
