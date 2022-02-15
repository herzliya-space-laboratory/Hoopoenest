import { Server as SocketIO, Socket } from "socket.io";
import { EndNodeManager, endNodePacket } from "./types";
import dayjs from "dayjs";
import { commProtocolPacket } from "../../entities/commProtocols/types";

export default class EndNodeSocketIO implements EndNodeManager {
	private socket: SocketIO;
	private endNodes: {
		[key: string]: Socket;
	} = {};

	/**
	 * Creates an EndNode manager using Socket.IO
	 * @param port which port to run on
	 * @param onGotPacket callback for when an endnode sends packet
	 * @param onEndNodeChange callback for when an endonde connects or disconnects
	 */
	constructor(
		port: number,
		onGotPacket: (packet: endNodePacket) => void,
		onEndNodeChange: (endnodes: string[]) => void
	) {
		this.socket = new SocketIO(port);

		this.socket.use((socket: Socket, next: (err?: Error) => any) => {
			const name = (socket.handshake.query as any).name;
			if (typeof name === "string" && !(name in this.endNodes)) {
				return next();
			}
			return next(new Error("Endnode name should be a unique string"));
		});

		this.socket.on("connection", (socket: Socket) => {
			const name = (socket.handshake.query as any).name;
			this.endNodes[name] = socket;
			console.log(
				`${dayjs().format(
					"D/M/YYYY HH:mm:ss"
				)} - New endnode connection: ${name}`
			);
			onEndNodeChange(Object.keys(this.endNodes));

			socket.on("disconnect", () => {
				delete this.endNodes[name];
				console.log(
					`${dayjs().format(
						"D/M/YYYY HH:mm:ss"
					)} - EndNode "${name}" has disconnected`
				);
				onEndNodeChange(Object.keys(this.endNodes));
			});

			socket.on("gotPacket", (packet: endNodePacket) => {
				onGotPacket(packet);
			});
		});
	}

	/**
	 * Send a packet to endnode
	 * @param packet the packet to send
	 */
	public sendPacket(packet: commProtocolPacket, endNodeName: string) {
		const endnode = this.endNodes[endNodeName];
		if (endnode === undefined)
			throw new Error(`EndNode "${endNodeName}" was not found`);
		endnode.emit("sendPacket", packet);
	}

	/**
	 * Get connected endnodes names
	 */
	public getEndNodes() {
		return Object.keys(this.endNodes);
	}

	/**
	 * Close connection to endnode
	 */
	public close() {
		this.socket.close();
	}
}
