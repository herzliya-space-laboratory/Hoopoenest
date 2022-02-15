import { Server, Socket } from "socket.io";
import { commProtocolPacket } from "../../src/commProtocols/types";

export default class ServerMock {
	private socket: Server;

	constructor(
		port: number,
		onGotPacket: (packet: commProtocolPacket) => void,
		onConnection: (socket: Socket) => void
	) {
		this.socket = new Server(port);

		this.socket.on("connection", (socket: any) => {
			onConnection(socket);
			// console.log("connected");

			socket.on("gotPacket", (packet: any) => {
				onGotPacket(packet);
			});

			socket.on("disconnect", () => {
				onConnection(socket);
				// console.log("disconnected");
			});
		});
	}

	public send(packet: commProtocolPacket): void {
		this.socket.emit("sendPacket", packet);
	}

	public close(): void {
		this.socket.close();
	}
}
