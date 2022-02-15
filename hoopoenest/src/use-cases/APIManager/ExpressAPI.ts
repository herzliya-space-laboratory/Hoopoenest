import express, { Express } from "express";
import cors from "cors";
import { APIManager } from "./types";
import { DBManager } from "../../entities/DBManager/types";
import { packet, packetType, playlist } from "../../types";
import { createServer, Server } from "http";
import { Server as SocketIO, Socket } from "socket.io";
import { EndNodeManager } from "../EndNodeManager/types";
import helmet from "helmet";
import PacketManager from "../PacketManager";
import { jsonReviver, parseObjTimeSpan } from "../../entities/misc";
import { Mutex } from "async-mutex";

export default class ExpressAPI implements APIManager {
	private server: Server | undefined;
	private app: Express | undefined;
	private socket: SocketIO | undefined;
	private satellites: { [key: string]: PacketManager } | undefined;
	private satMutexes: Record<string, Mutex> = {};

	/**
	 * starts a new ExpressAPI instance
	 * @param db the db for the api to work with
	 * @param satellites format parser of each satellite
	 * @param enManager endnode manager to access endnodes
	 * @param port which port should it run on
	 */
	public start(
		db: DBManager,
		enManager: EndNodeManager,
		satellites: { [key: string]: PacketManager },
		onSendPacket: (packet: packet, endnode: string) => void,
		port: number
	) {
		this.satellites = satellites;
		Object.keys(satellites).forEach(
			(sat) =>
				(this.satMutexes = { ...this.satMutexes, [sat]: new Mutex() })
		);
		const app = express();
		app.use(cors());
		app.use(helmet());
		app.use(express.urlencoded({ extended: false }));
		app.use(express.json({ reviver: jsonReviver }));

		app.get("/satellites/", (req, res) => {
			res.json(Object.keys(satellites));
		});

		app.param("satellite", (req, res, next) => {
			const sat = req.params.satellite;
			if (!(sat in satellites)) {
				res.status(400).json({
					msg: `Satellite "${sat}" doesn't exist`,
				});
				return;
			}
			next();
		});

		function validatePlaylist(
			playlist: unknown
		): playlist is Omit<playlist, "creationTime"> {
			return (
				typeof playlist === "object" &&
				playlist !== null &&
				"name" in playlist &&
				"packets" in playlist
			);
		}

		app.get("/:satellite/playlists/", async (req, res) => {
			const { satellite } = req.params;
			const playlists = await db.getPlaylists(satellite);
			res.json(
				playlists.map((playlist) => ({
					...playlist,
					packets: playlist.packets.map((packet) =>
						satellites[satellite].formatParser.formatPacket(
							packet,
							packet.key,
							"telecommands"
						)
					),
				}))
			);
		});

		app.post("/:satellite/playlists/", async (req, res) => {
			if (!validatePlaylist(req.body)) {
				res.status(400).json({
					msg: "playlist should have a name and packets",
				});
				return;
			}
			const { satellite } = req.params;
			const dbRes = await db.createPlaylist(
				{ ...req.body, creationTime: new Date() },
				satellite
			);
			res.json({
				success: dbRes[0],
				...(dbRes[0] && { id: dbRes[1] }),
				...(!dbRes[0] && { msg: dbRes[1] }),
			});
		});

		app.put("/:satellite/playlists/:id/", async (req, res) => {
			if (!validatePlaylist(req.body)) {
				res.status(400).json({
					msg: "playlist should have a name and packets",
				});
				return;
			}
			const { satellite, id } = req.params;
			const dbRes = await db.updatePlaylist(
				req.body as any,
				id,
				satellite
			);
			res.json({
				success: dbRes[0],
				msg: dbRes[1],
			});
		});

		app.delete("/:satellite/playlists/:id/", async (req, res) => {
			const { satellite, id } = req.params;
			res.json({ success: await db.deletePlaylist(id, satellite) });
		});

		app.get("/:satellite/requiredFields/", (req, res) => {
			const { satellite } = req.params;
			const packetManager = satellites[satellite];
			res.json(packetManager.getCommProtocolsFields());
		});

		app.post("/:satellite/sendPacket/", async (req, res) => {
			const sat = req.params.satellite;
			const mutex = this.satMutexes[sat];
			const release = await mutex.acquire();
			const endnode = req.query.endnode as string;
			if (
				enManager.getEndNodes().find((en) => en === endnode) ===
				undefined
			) {
				res.status(400).json({
					msg: `Endnode "${endnode}" doesn't exist`,
				});
				return;
			}

			const { commandId: lastId } = (
				await db.getLatestPackets(sat, "telecommands", {}, 1)
			)[0] ?? { commandId: -1 };
			const packet = {
				satellite: sat,
				type: "telecommands",
				commandId: lastId !== undefined ? lastId + 1 : 0,
				sentTime: new Date(),
				...(parseObjTimeSpan(req.body) as any),
			};

			try {
				await onSendPacket(packet, endnode);
				res.status(200).json({
					msg: "Packet sent successfully!",
					commandId: packet.commandId,
				});
			} catch (err) {
				res.status(500).json({
					msg: `Couldn't send packet: ${err}`,
				});
			} finally {
				release();
			}
		});

		app.param("packetType", (req, res, next) => {
			const packetType = req.params.packetType;
			if (packetType !== "telecommands" && packetType !== "telemetry") {
				res.status(400).json({
					msg: 'Type should be "telecommands" or "telemetry"',
				});
				return;
			}
			next();
		});

		const parseWhereQuery = (where: { [key: string]: any }) => {
			return Object.entries(where).reduce((obj, [key, val]) => {
				return { ...obj, [key]: JSON.parse(val, jsonReviver) };
			}, {} as { [key: string]: any });
		};

		app.get("/:satellite/:packetType/", async (req, res) => {
			const { num: numString, skip: skipStr, ...whereString } = req.query;
			let num: number | undefined;
			let skip: number | undefined;
			let where: { [key: string]: any };
			try {
				where = parseWhereQuery(whereString);
			} catch (err) {
				res.status(400).json({
					msg: "URL query is invalid (should be JSON)",
				});
				return;
			}

			if (numString !== undefined) {
				num = +numString;
				if (isNaN(num)) {
					res.status(400).json({
						msg: "Parameter 'num' should be a number",
					});
					return;
				}
			}
			if (skipStr !== undefined) {
				skip = +skipStr;
				if (isNaN(skip)) {
					res.status(400).json({
						msg: "Parameter 'num' should be a number",
					});
					return;
				}
			}

			const { satellite, packetType } = req.params;
			const packets = await db.getLatestPackets(
				satellite,
				packetType as packetType,
				where!,
				num,
				skip
			);
			res.json(
				packets.map((packet) =>
					satellites[satellite].formatParser.formatPacket(
						packet,
						packet.key,
						packet.type
					)
				)
			);
		});

		app.get("/:satellite/:packetType/keys/", (req, res) => {
			const { satellite, packetType } = req.params;
			const packetManager = satellites[satellite];
			res.json(
				packetManager.formatParser.getKeys(packetType as packetType)
			);
		});

		app.get("/:satellite/:packetType/format/", (req, res) => {
			const { satellite, packetType } = req.params;
			const packetManager = satellites[satellite];
			if (typeof req.query.key !== "string")
				res.status(400).json({
					msg: `"key" query argument must be provided and must be a JSON parseable string`,
				});
			else {
				try {
					const key = JSON.parse(req.query.key);
					const format = packetManager.formatParser.getPacketFormat(
						key,
						packetType as packetType
					);
					if (format !== undefined) res.json(format);
					else
						res.status(404).json({
							msg: "Not found format with requested key",
						});
				} catch (err) {
					res.status(404).json({
						msg: "Not found format with requested key",
					});
				}
			}
		});

		app.get("/:satellite/:packetType/formats/", (req, res) => {
			const { satellite, packetType } = req.params;
			const packetManager = satellites[satellite];
			res.json(
				packetManager.formatParser.getAllPacketFormats(
					packetType as packetType
				)
			);
		});

		app.get("*", (req, res) =>
			res.status(404).json({
				msg: "Unidentified route, check your URL",
			})
		);

		this.app = app;
		this.server = createServer(app);
		this.socket = new SocketIO(this.server, {
			cors: {
				methods: ["GET", "POST"],
			},
		});

		this.socket.use((socket: Socket, next: (err?: Error) => any) => {
			const sat = (socket.handshake.query as any).satellite;
			if (typeof sat === "string" && sat in satellites) {
				return next();
			}
			return next(new Error("Satellite not found"));
		});
		this.socket.on("connection", (socket: Socket) => {
			socket.emit("endNodes", enManager.getEndNodes());
			socket.join((socket.handshake.query as any).satellite);
		});

		this.server.listen(port);
	}

	/**
	 * Returns the express.js intefrace, used for testing
	 */
	public getApp() {
		if (this.app === undefined)
			throw new Error(
				'Start the API server first (call the "start" method)'
			);
		return this.app;
	}
	/**
	 * Returns the express.js intefrace, used for testing
	 */
	public getSocket() {
		if (this.socket === undefined)
			throw new Error(
				'Start the API server first (call the "start" method)'
			);
		return this.socket;
	}

	/**
	 * notify clients about an endnode change
	 * @param endNodes connected endnodes names
	 */
	public emitEndNodes(endNodes: string[]) {
		if (this.socket === undefined)
			throw new Error(
				'Start the API server first (call the "start" method)'
			);
		this.socket.emit("endNodes", endNodes);
	}

	/**
	 * notify clients about a new packet received
	 * @param packet new packet
	 */
	public emitPacket(packet: packet) {
		if (this.socket === undefined || this.satellites === undefined)
			throw new Error(
				'Start the API server first (call the "start" method)'
			);
		const formattedPacket = this.satellites[
			packet.satellite
		].formatParser.formatPacket(packet, packet.key, packet.type);
		this.socket.to(packet.satellite).emit("gotPacket", formattedPacket);
	}

	/**
	 * Close the express API server
	 */
	public close() {
		if (this.server === undefined || this.socket === undefined)
			throw new Error(
				'Start the API server first (call the "start" method)'
			);
		this.socket.close();
		this.server.close();
	}
}
