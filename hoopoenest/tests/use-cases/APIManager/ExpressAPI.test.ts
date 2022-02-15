import ExpressAPI from "../../../src/use-cases/APIManager/ExpressAPI";
import { Express } from "express";
import { default as request } from "supertest";
import MongoDBManager from "../../../src/entities/DBManager/MongoDBManager";
import { MongoMemoryServer } from "mongodb-memory-server";
import dayjs from "dayjs";
import MIBParser from "../../../src/entities/formatParsers/MIB/MIBParser";
import { resolve } from "path";
import EndNodeSocketIO from "../../../src/use-cases/EndNodeManager/EndNodeSocketIO";
import { EndNodeManager } from "../../../src/use-cases/EndNodeManager/types";
import { io } from "socket.io-client";
import { packet, playlist, packetType } from "../../../src/types";
import spl from "../../../src/entities/commProtocols/spl";
import PacketManager from "../../../src/use-cases/PacketManager";

let mongoServer: MongoMemoryServer;
let enManager: EndNodeManager;
let db: MongoDBManager;
let server: ExpressAPI;
let app: Express;

let sentPacket: packet | undefined;

const port = 6000;
const endNodePort = 4000;

const wait = async (ms: number) => await new Promise((r) => setTimeout(r, ms));
const waitForConnection = async (socketClient: any) => {
	while (!socketClient.connected) await wait(100);
};
const waitForDisconnection = async (socketClient: any) => {
	await wait(100);
	while (!socketClient.disconnected) await wait(100);
};

const packetManager = new PacketManager(
	[spl],
	new MIBParser(resolve("tests", "use-cases", "APIManager", "mibMock.json"))
);

const mockPackets = [
	{
		key: {
			serviceType: 2,
			serviceSubType: 2,
		},
		category: "st2",
		name: "sst2",
		params: [],
		satellite: "sat1",
		groundTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
		type: "telemetry",
		raw: Buffer.alloc(0),
	},
	{
		key: {
			serviceType: 1,
			serviceSubType: 1,
		},
		category: "st1",
		name: "sst1",
		params: [{ name: "param1", value: 3 }],
		satellite: "sat1",
		groundTime: dayjs("12-25-1995", "MM-DD-YYYY").toDate(),
		type: "telemetry",
		raw: Buffer.alloc(0),
	},
];

const resPackets = mockPackets.map((item) => JSON.parse(JSON.stringify(item)));
resPackets[1].params[0] = {
	name: "param1",
	range: { min: 0, max: 255 },
	value: 3,
};

const mockPlaylists: playlist[] = [
	{
		name: "play1",
		creationTime: new Date(),
		packets: [
			{
				key: {
					serviceType: 2,
					serviceSubType: 2,
				},
				type: "telecommands",
				params: [],
			},
		],
	},
	{
		name: "play2",
		creationTime: new Date(),
		packets: [
			{
				key: {
					serviceType: 1,
					serviceSubType: 1,
				},
				type: "telecommands",
				params: [{ name: "param1", value: 3 }],
			},
		],
	},
];

const resPalylists = mockPlaylists
	.map((item) => JSON.parse(JSON.stringify(item)))
	.map((playlist) => ({
		...playlist,
		packets: playlist.packets.map((packet: any) =>
			packetManager.formatParser.formatPacket(
				packet,
				packet.key,
				"telecommands"
			)
		),
	}));

const satellites = {
	sat1: packetManager,
	sat2: packetManager,
};

beforeAll(async () => {
	mongoServer = new MongoMemoryServer();
	db = new MongoDBManager();
	const mongoUri = await mongoServer.getUri();

	await db.connect(mongoUri);
	mockPackets.forEach(async (item) => {
		await db.insertPacket(item);
	});
	mockPlaylists.forEach(async (playlist) => {
		await db.createPlaylist(playlist, "sat1");
	});
	enManager = new EndNodeSocketIO(
		endNodePort,
		/* eslint-disable */
		() => {},
		() => {}
		/* eslint-enable */
	);
	server = new ExpressAPI();
	server.start(
		db,
		enManager,
		satellites,
		async (packet, endnode) => {
			sentPacket = packet;
			await db.insertPacket(packet);
		},
		port
	);
	app = server.getApp();
});

afterAll(async () => {
	await server.close();
	await db.close();
	await mongoServer.stop();
	enManager.close();
});

describe("ExpressAPI", () => {
	it("returns all packets when requested", async () => {
		const res = await request(app).get("/sat1/telemetry");
		expect(res.body).toMatchObject(resPackets);
	});

	it("returns number of packets requested", async () => {
		const res = await request(app).get("/sat1/telemetry?num=1");
		expect(res.body).toMatchObject([resPackets[0]]);
	});

	it("returns packet according to where query", async () => {
		const res = await request(app).get(
			'/sat1/telemetry?key={"serviceType":2,"serviceSubType":2}'
		);
		expect(res.body).toMatchObject([resPackets[0]]);
	});

	it("returns an error on bad num request", async () => {
		const res = await request(app).get("/sat1/telemetry?num=fdvfvd");
		expect(res.status).toBe(400);
		expect(res.body).toEqual({
			msg: "Parameter 'num' should be a number",
		});
	});

	it("returns not found when it can't find a packet", async () => {
		const res = await request(app).get('/sat1/telemetry?id="qwerty"');
		expect(res.body).toEqual([]);
	});

	test("satellites endpoint returns all available satellites", async () => {
		const res = await request(app).get("/satellites");
		expect(res.body).toEqual(["sat1", "sat2"]);
	});

	test("keys endpoint returns all possible keys", async () => {
		const res = await request(app).get("/sat1/telemetry/keys");
		expect(res.body).toEqual([
			{ id: 1, name: "st1", subTypes: [{ id: 1, name: "sst1" }] },
			{ id: 2, name: "st2", subTypes: [{ id: 2, name: "sst2" }] },
		]);
	});

	it("returns a packet format correctly", async () => {
		const res = await request(app).get(
			'/sat1/telemetry/format?key={"serviceType":1,"serviceSubType":1}'
		);
		expect(res.body).toEqual({
			name: "sst1",
			category: "st1",
			key: { serviceType: 1, serviceSubType: 1 },
			params: [
				{
					name: "param1",
					type: "int",
					range: { min: 0, max: 255 },
				},
			],
		});
	});

	it("returns all packet formats correctly", async () => {
		const res = await request(app).get("/sat1/telemetry/formats");
		expect(res.body).toEqual([
			{
				name: "st1",
				id: 1,
				subTypes: [
					{
						id: 1,
						name: "sst1",
						category: "st1",
						key: { serviceType: 1, serviceSubType: 1 },
						params: [
							{
								name: "param1",
								type: "int",
								range: { min: 0, max: 255 },
							},
						],
					},
				],
			},
			{
				name: "st2",
				id: 2,
				subTypes: [
					{
						name: "sst2",
						category: "st2",
						id: 2,
						key: { serviceType: 2, serviceSubType: 2 },
						params: [],
					},
				],
			},
		]);
	});

	it("sends connected endnodes on connection", async (done) => {
		const endnode = io(`ws://localhost:${endNodePort}?name=en1`);
		await waitForConnection(endnode);

		const client = io(`ws://localhost:${port}?satellite=sat1`);
		client.on("endNodes", async (ens: any) => {
			endnode.close();
			client.close();
			await waitForDisconnection(client);
			expect(ens).toEqual(["en1"]);
			done();
		});
	});

	it("sends connected endnodes on endnode change", async (done) => {
		let callbackTimes = 0;
		const client = io(`ws://localhost:${port}?satellite=sat1`);

		client.on("endNodes", (ens: any) => {
			if (callbackTimes === 1) {
				//eslint-disable-next-line
				expect(ens).toEqual(["en1"]);
				endnode.close();
				done();
			}
			callbackTimes++;
		});
		const endnode = io(`ws://localhost:${endNodePort}?name=en1`);
		await waitForConnection(endnode);
		server.emitEndNodes(enManager.getEndNodes());
	});

	it("sends formatted packet to clients of a specific satellite", async (done) => {
		const packet = {
			name: "sst1",
			key: { serviceType: 1, serviceSubType: 1 },
			params: [{ name: "param1", value: 4 }],
			satellite: "sat1",
			type: "telemetry" as packetType,
			raw: "12345678",
		};
		const expected = {
			name: "sst1",
			key: { serviceType: 1, serviceSubType: 1 },
			params: [
				{
					value: 4,
					name: "param1",
					type: "int",
					range: { min: 0, max: 255 },
				},
			],
			satellite: "sat1",
			type: "telemetry",
			raw: "12345678",
			category: "st1",
		};

		const client1 = io(`ws://localhost:${port}?satellite=sat1`);
		const client2 = io(`ws://localhost:${port}?satellite=sat2`);

		client1.on("gotPacket", (apiPacket: any) => {
			expect(apiPacket).toEqual(expected);
			done();
		});

		client2.on("gotPacket", () => {
			throw new Error("This client should not get a message");
		});
		await waitForConnection(client1);
		await waitForConnection(client2);
		server.emitPacket(packet as any);
	});

	//eslint-disable-next-line
	test("server refuses to connect with unknown satellite", async (done) => {
		const client = io(`ws://localhost:${port}?satellite=sat3`);
		client.on("connect_error", (err: any) => {
			done();
		});
	});

	it("should pass sent packet to callback", async () => {
		const endnode = io(`ws://localhost:${endNodePort}?name=en1`);
		await waitForConnection(endnode);

		const packet = {
			name: "hi",
		};
		const expected = {
			...packet,
			satellite: "sat1",
			type: "telecommands",
			commandId: 0,
		};

		const res = await request(app)
			.post("/sat1/sendPacket?endnode=en1")
			.send(packet);

		endnode.close();
		await waitForDisconnection(endnode);
		expect(sentPacket).toMatchObject(expected);
	});

	test("two packets sent back-to-back don't get the same id", async () => {
		const endnode = io(`ws://localhost:${endNodePort}?name=en1`);
		await waitForConnection(endnode);

		const packet = {
			name: "hi",
			type: "telecommands",
		};

		const res = [
			request(app).post("/sat1/sendPacket?endnode=en1").send(packet),
			request(app).post("/sat1/sendPacket?endnode=en1").send(packet),
		];

		const [res1, res2] = await Promise.all(res);

		endnode.close();
		await waitForDisconnection(endnode);
		expect(res1.body.commandId).not.toEqual(res2.body.commandId);
	});

	it("should throw on sending packet to unknown satellite", async () => {
		const endnode = io(`ws://localhost:${endNodePort}?name=en1`);
		await waitForConnection(endnode);

		const res = await request(app)
			.post("/sat10/sendPacket?endnode=en1")
			.send({});

		endnode.close();
		await waitForDisconnection(endnode);
		expect(res.body).toEqual({ msg: `Satellite "sat10" doesn't exist` });
	});

	it("should throw on sending packet to unknown endnode", async () => {
		const res = await request(app)
			.post("/sat1/sendPacket?endnode=en1")
			.send({});

		expect(res.body).toEqual({ msg: `Endnode "en1" doesn't exist` });
	});

	it("returns 404 on unknown route", async () => {
		const res = await request(app).get("/csdcdscss");

		expect(res.body).toEqual({ msg: "Unidentified route, check your URL" });
	});

	it("returns the required fields and packet format", async () => {
		const res = await request(app).get("/sat1/requiredFields");

		expect(res.body).toEqual({
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
					telemetryName: "Satellite Time",
					commandName: "Execution Time",
					onSend: true,
					onHistory: true,
					type: "datetime",
					range: {
						min: new Date(0).toISOString(),
						max: new Date(4294967295 * 1000).toISOString(),
					},
				},
			],
		});
	});

	it("should return all playlists", async () => {
		const res = await request(app).get("/sat1/playlists");
		expect(res.body).toMatchObject(resPalylists);
	});

	it("should POST a new playlist", async () => {
		const playlist = {
			name: "play3",
			creationTime: new Date(),
			packets: {
				key: 3,
				params: [2],
			},
		};
		const res = await request(app).post("/sat1/playlists").send(playlist);
		expect(res.body).toHaveProperty("id");
		const playlists = await db.getPlaylists("sat1");
		expect(
			playlists.find((item) => item._id.toString() === res.body.id)
		).not.toBe(undefined);
	});

	it("should update a playlist", async () => {
		const playlist = {
			name: "play4",
			creationTime: new Date(),
			packets: [
				{
					key: 4,
					params: [100],
					type: "telecommands" as const,
				},
			],
		};
		const id = await db.createPlaylist(playlist, "sat1");
		const res = await request(app)
			.put(`/sat1/playlists/${id[1]}`)
			.send(playlist);
		expect(res.body).toHaveProperty("success");

		const playlists = await db.getPlaylists("sat1");

		expect(
			playlists.find((item) => item._id.toString() === id[1])
		).toMatchObject(playlist);
	});

	it("should delete a playlist", async () => {
		const playlist = {
			name: "play5",
			creationTime: new Date(),
			packets: [
				{
					key: 5,
					params: [230],
					type: "telecommands" as const,
				},
			],
		};
		const id = await db.createPlaylist(playlist, "sat1");
		const res = await request(app).delete(`/sat1/playlists/${id[1]}`);
		expect(res.body).toHaveProperty("success");

		const playlists = await db.getPlaylists("sat1");
		expect(playlists.find((item) => item._id === id[1])).toBe(undefined);
	});
});
