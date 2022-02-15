import MongoDBManager from "../../../src/entities/DBManager/MongoDBManager";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ObjectId } from "mongodb";
import dayjs from "dayjs";
import { packetType, packet } from "../../../src/types";

let mongoServer: MongoMemoryServer;
let db: MongoDBManager;
let mongo: MongoClient;

beforeEach(async () => {
	mongoServer = new MongoMemoryServer();
	db = new MongoDBManager();
	const mongoUri = await mongoServer.getUri();

	await db.connect(mongoUri);
	mongo = await MongoClient.connect(mongoUri);
});

afterEach(async () => {
	await db.close();
	await mongoServer.stop();
});

describe("MongoDB manager - packets", () => {
	it("should throw on invalid url", () => {
		expect.assertions(1);
		const db = new MongoDBManager();
		return db.connect("sdcdscdsc").catch((e) => expect(e).toBeTruthy());
	});

	it("throws when closing without opening connection", () => {
		expect.assertions(1);
		return new MongoDBManager()
			.close()
			.catch((e) => expect(e).toBeTruthy());
	});

	it("should insert packets correctly", async () => {
		const packet = {
			key: {
				serviceType: 3,
				serviceSubType: 4,
			},
			params: [],
			satellite: "sat1",
			groundTime: dayjs().toDate(),
			type: "telemetry",
		};
		const res = await db.insertPacket(packet);
		const dbPackets = await mongo
			.db("sat1")
			.collection("telemetry")
			.find({})
			.toArray();
		expect(dbPackets.length).toBe(1);
		expect(res).toEqual(dbPackets[0]._id);
	});

	it("returns all the packets of a satellite", async () => {
		const date1 = dayjs();
		const date2 = dayjs();
		const expected = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				satellite: "sat1",
				groundTime: date1.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				satellite: "sat1",
				groundTime: date2.toDate(),
				type: "telemetry",
			},
		];

		const dbPackets = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				groundTime: date1.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				groundTime: date2.toDate(),
				type: "telemetry",
			},
		];

		await mongo.db("sat1").collection("telemetry").insertMany(dbPackets);
		const res = (await db.getLatestPackets("sat1", "telemetry")) as any;

		expect(res[0]).toMatchObject(expected[0]);
		expect(res[1]).toMatchObject(expected[1]);
	});

	it("returns all the packets of a satellite which apply the query", async () => {
		const date1 = dayjs();
		const date2 = dayjs();
		const expected = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				satellite: "sat1",
				groundTime: date1.toDate(),
				type: "telemetry",
			},
		];

		const dbPackets = [
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				groundTime: date2.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				groundTime: date1.toDate(),
				type: "telemetry",
			},
		];

		await mongo.db("sat1").collection("telemetry").insertMany(dbPackets);
		const res = (await db.getLatestPackets("sat1", "telemetry", {
			key: {
				serviceType: 3,
				serviceSubType: 4,
			},
		})) as any;

		expect(res[0]).toMatchObject(expected[0]);
		expect(res.length).toBe(1);
	});

	it("returns packets sorted by groundTime", async () => {
		const dbPackets = [
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				groundTime: dayjs("12-25-1995", "MM-DD-YYYY").toDate(),
				type: "telemetry" as packetType,
			},
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				groundTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telemetry" as packetType,
			},
		];

		await mongo.db("sat1").collection("telemetry").insertMany(dbPackets);
		const res = await db.getLatestPackets("sat1", "telemetry");
		expect(res[0].key.serviceType).toBe(3);
	});

	it("joins telecommands with corresponding acks", async () => {
		const acks = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				name: "ack-dscsdc",
				commandId: 3,
				params: [],
				groundTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telemetry" as packetType,
			},
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				name: "ACK cdsc",
				params: [{ name: "CommandId", value: 3 }],
				groundTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telemetry" as packetType,
			},
			{
				key: {
					serviceType: 5,
					serviceSubType: 1,
				},
				name: "other",
				params: [],
				groundTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telemetry" as packetType,
			},
		];

		const commands = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				commandId: 3,
				params: [],
				sentTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telecommands" as packetType,
			},
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				commandId: 4,
				params: [],
				sentTime: dayjs("12-25-2020", "MM-DD-YYYY").toDate(),
				type: "telecommands" as packetType,
			},
		];

		await mongo.db("sat1").collection("telecommands").insertMany(commands);
		await mongo.db("sat1").collection("telemetry").insertMany(acks);

		const res = await db.getLatestPackets("sat1", "telecommands");

		expect(res[0].acks.length).toBe(2);
		expect(res[0].acks[0].commandId).toBe(undefined);
		expect(res[0].acks[0].params.length).toBe(0);

		expect(res[1].acks.length).toBe(0);
	});

	it("should skip the requested number of skips", async () => {
		const date1 = dayjs();
		const date2 = dayjs().add(1);
		const date3 = dayjs().add(2);
		const date4 = dayjs().add(3);

		const expected = [
			{
				key: {
					serviceType: 5,
					serviceSubType: 6,
				},
				params: [],
				groundTime: date3.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				satellite: "sat1",
				groundTime: date2.toDate(),
				type: "telemetry",
			},
		];

		const dbPackets = [
			{
				key: {
					serviceType: 3,
					serviceSubType: 4,
				},
				params: [],
				groundTime: date1.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 1,
					serviceSubType: 2,
				},
				params: [],
				groundTime: date2.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 5,
					serviceSubType: 6,
				},
				params: [],
				groundTime: date3.toDate(),
				type: "telemetry",
			},
			{
				key: {
					serviceType: 7,
					serviceSubType: 1,
				},
				params: [],
				groundTime: date4.toDate(),
				type: "telemetry",
			},
		];

		await mongo.db("sat1").collection("telemetry").insertMany(dbPackets);
		const res = await db.getLatestPackets("sat1", "telemetry", {}, 2, 1);
		expect(res).toMatchObject(expected);
	});
});

const playlist = {
	_id: undefined,
	name: "playlist1",
	creationTime: new Date(),
	packets: [
		{
			key: 1,
			type: "telecommands" as packetType,
			params: [],
		},
	],
};

describe("Mongodb manager - playlists", () => {
	it("inserts playlists correctly", async () => {
		const id = await db.createPlaylist(playlist, "sat1");
		const res = await mongo.db("sat1").collection("playlists").findOne({});

		expect(id[1]).toEqual(res._id.toString());
		expect(res).toMatchObject(playlist);
	});

	it("doesn't insert playlist if name already exists", async () => {
		const id = await db.createPlaylist(playlist, "sat1");
		playlist._id = undefined;
		const res = await db.createPlaylist(playlist, "sat1");

		expect(res[0]).toBe(false);
	});

	it("gets playlists correctly", async () => {
		await mongo.db("sat1").collection("playlists").insertOne(playlist);
		const res = await db.getPlaylists("sat1");
		expect(res).toMatchObject([playlist]);
	});

	it("updates playlist's packets correctly", async () => {
		const id = await (
			await mongo.db("sat1").collection("playlists").insertOne(playlist)
		).insertedId;

		const updated = {
			name: "bla",
			creationTime: playlist.creationTime,
			packets: [
				{
					key: 1,
					type: "telecommands" as packetType,
					params: [],
				},
			],
		};

		const ok = await db.updatePlaylist(updated, id, "sat1");

		const res = await mongo.db("sat1").collection("playlists").findOne({});
		expect(res).toMatchObject(updated);
		expect(ok[0]).toBe(true);
	});

	it("doesn't update playlist if duplicate name", async () => {
		const id = await (
			await mongo.db("sat1").collection("playlists").insertOne(playlist)
		).insertedId;

		const playlist2 = {
			name: "bla",
			creationTime: playlist.creationTime,
			packets: [
				{
					key: 1,
					type: "telecommands" as packetType,
					params: [],
				},
			],
		};

		await db.createPlaylist(playlist2, "sat1");
		const res = await db.updatePlaylist(
			{ ...playlist, name: "bla" },
			id,
			"sat1"
		);

		expect(res[0]).toBe(false);
	});

	it("deletes playlist correctly", async () => {
		const id = await (
			await mongo.db("sat1").collection("playlists").insertOne(playlist)
		).insertedId;

		const ok = await db.deletePlaylist(id, "sat1");

		const res = await mongo.db("sat1").collection("playlists").findOne({});
		expect(res).toEqual(null);
		expect(ok).toBe(true);
	});
});
