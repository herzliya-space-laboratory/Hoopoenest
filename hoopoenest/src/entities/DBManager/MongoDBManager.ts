import { MongoClient, Db, ObjectId } from "mongodb";
import { packet, packetType, playlist } from "../../types";
import { DBManager } from "./types";
import { parseDBtypes } from "../misc";

export default class MongoDBManager implements DBManager {
	private client: MongoClient | null = null;

	/**
	 * Create a MongoDB manager and connect to db
	 * @param url MongoDB server URL
	 */
	public async connect(url: string, satellites: string[]) {
		try {
			this.client = await MongoClient.connect(url, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
			await this.createIndexes(satellites);
		} catch (err) {
			throw new Error("Couldn't connect to MongoDB: " + err);
		}
	}

	private async createIndexes(satellites: string[]) {
		for (const sat of satellites) {
			await this.client
				?.db(sat)
				.collection("telemetry")
				.createIndex({ key: 1 });
			await this.client
				?.db(sat)
				.collection("telemetry")
				.createIndex({ groundTime: 1 });
			await this.client
				?.db(sat)
				.collection("telecommands")
				.createIndex({ key: 1 });
			await this.client
				?.db(sat)
				.collection("telecommands")
				.createIndex({ sentTime: 1 });
		}
	}

	/**
	 * Close the database
	 */
	public async close() {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);
		await this.client.close();
	}

	private parseDBPacket(
		dbPacket: any,
		type: packetType,
		satellite: string
	): packet {
		dbPacket.satellite = satellite;
		const { _id, ...packet } = dbPacket;
		packet.id = _id;
		packet.type = type;
		return parseDBtypes(packet) as any;
	}

	private encodeDBPacket(
		packet: Omit<packet, "id">
	): { satellite: string; type: packetType; dbPacket: any } {
		const { satellite, type, ...dbPacket } = packet;
		return { satellite, type, dbPacket };
	}

	/**
	 * Get latest packet of specific satellite
	 * @param satellite satellite name
	 * @param where query which packet fields do you want and what should they be
	 */
	public async getLatestPacket(
		satellite: string,
		type: packetType,
		where: Partial<packet> = {}
	) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);
		where = this.parseWhereQuery(where);
		const db = this.client.db(satellite);
		const res = await db
			.collection(type)
			.find(where)
			.sort({ groundTime: -1 })
			.limit(1)
			.toArray();
		if (res.length === 0) return null;
		const packet = this.parseDBPacket(res[0], type, satellite);
		return packet;
	}

	private async getTelecommands(
		db: Db,
		where: Partial<packet> = {},
		num?: number,
		skip?: number
	) {
		const pipeline: any[] = [
			{ $match: where },
			{ $sort: { sentTime: -1 } },
			{
				$lookup: {
					from: "telemetry",
					let: {
						telCommandId: "$commandId",
					},
					pipeline: [
						{
							$match: {
								name: /^ack/i,
								$expr: {
									$or: [
										{
											$eq: [
												"$commandId",
												"$$telCommandId",
											],
										},
										{
											$gt: [
												{
													$size: {
														$filter: {
															input: "$params",
															as: "p",
															cond: {
																$and: [
																	{
																		$or: [
																			{
																				$eq: [
																					"$$p.name",
																					"commandId",
																				],
																			},
																			{
																				$eq: [
																					"$$p.name",
																					"CommandId",
																				],
																			},
																			{
																				$eq: [
																					"$$p.name",
																					"commandid",
																				],
																			},
																			{
																				$eq: [
																					"$$p.name",
																					"CommandID",
																				],
																			},
																			{
																				$eq: [
																					"$$p.name",
																					"commandID",
																				],
																			},
																		],
																	},
																	{
																		$eq: [
																			"$$p.value",
																			"$$telCommandId",
																		],
																	},
																],
															},
														},
													},
												},
												0,
											],
										},
									],
								},
							},
						},
						{
							$project: {
								commandId: 0,
							},
						},
					],
					as: "acks",
				},
			},
		];

		if (num !== undefined) pipeline.splice(2, 0, { $limit: num });
		if (skip !== undefined) pipeline.splice(2, 0, { $skip: skip });

		return (
			await db.collection("telecommands").aggregate(pipeline).toArray()
		).map((packet) => ({
			...packet,
			acks: packet.acks.map((ack: any) => ({
				...ack,
				params: ack.params.filter(
					(param: any) => param.name !== "commandId"
				),
			})),
		}));
	}

	/**
	 * Get all packets of a satellite sorted by ground time
	 * @param satellite satellite name
	 * @param where query which packet fields do you want and what should they be
	 * @param num how many packets
	 */
	public async getLatestPackets(
		satellite: string,
		type: packetType,
		where: Partial<packet> = {},
		num?: number,
		skip?: number
	) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);
		where = this.parseWhereQuery(where);
		const db = this.client.db(satellite);

		if (type === "telecommands") {
			const res = await this.getTelecommands(db, where, num, skip);
			return res.map((item) => this.parseDBPacket(item, type, satellite));
		} else {
			const res = await db
				.collection("telemetry")
				.find(where)
				.sort({ groundTime: -1 });
			const skipped = skip !== undefined ? await res.skip(skip) : res;
			const arr =
				num !== undefined
					? await skipped.limit(num).toArray()
					: await skipped.toArray();
			return arr.map((item) => this.parseDBPacket(item, type, satellite));
		}
	}

	private parseWhereQuery(whereQuery: Partial<packet>) {
		const obj = { ...whereQuery };
		if ("id" in obj) {
			obj._id = obj.id;
			delete obj.id;
		}
		return obj;
	}

	/**
	 * Insert a new packet to the db, returns id
	 * @param packet The packet to insert
	 */
	public async insertPacket(packet: Omit<packet, "id">) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);
		const { satellite, type, dbPacket } = this.encodeDBPacket(packet);
		const db = this.client.db(satellite);
		const res = await db.collection(type).insertOne(dbPacket);
		return res.insertedId;
	}

	/**
	 * create a new playlist in db, returns id
	 * @param playlist The playlist to inesrt
	 */
	public async createPlaylist(
		playlist: Omit<playlist, "id">,
		satellite: string
	): Promise<[boolean, string]> {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);

		if (!(await this.checkPlaylistUniqueName(satellite, playlist)))
			return [false, `Playlist "${playlist.name}" already exists`];

		const db = this.client.db(satellite);
		const res = await db.collection("playlists").insertOne(playlist);
		return [true, res.insertedId.toString()] as any;
	}

	/**
	 * get all playlists for satellite
	 * @param id
	 * @param satellite
	 */
	public async getPlaylists(satellite: string) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);
		const res = await this.client
			.db(satellite)
			.collection("playlists")
			.find({})
			.sort({ creationTime: -1 })
			.toArray();
		return res;
	}

	/**
	 * update a playlist
	 * @param playlist
	 * @param id
	 * @param satellite
	 */
	public async updatePlaylist(
		playlist: playlist,
		id: string,
		satellite: string
	) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);

		if (!(await this.checkPlaylistUniqueName(satellite, playlist)))
			return [false, `Playlist "${playlist.name} already exists"`] as any;

		const res = await this.client
			.db(satellite)
			.collection("playlists")
			.updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { name: playlist.name, packets: playlist.packets } }
			);
		return [Boolean(res.result.ok), ""] as any;
	}

	private async checkPlaylistUniqueName(
		satellite: string,
		playlist: playlist
	) {
		const res = await this.client!.db(satellite)
			.collection("playlists")
			.find({
				name: playlist.name,
				_id: { $ne: new ObjectId(playlist._id) },
			})
			.toArray();
		return res.length === 0;
	}

	/**
	 * Delete a playlist
	 * @param id
	 * @param satellite
	 */
	public async deletePlaylist(id: string, satellite: string) {
		if (this.client === null)
			throw new Error(
				"MongoDB isn't connected: Have you forgotten to connect?"
			);

		const res = await this.client
			.db(satellite)
			.collection("playlists")
			.deleteOne({ _id: new ObjectId(id) });
		return Boolean(res.result.ok);
	}
}
