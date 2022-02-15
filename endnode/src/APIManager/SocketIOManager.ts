import { io, Socket } from "socket.io-client";
import { APIManager } from "./types";
import { commProtocolPacket } from "../../src/commProtocols/types";

export default class SocketIOManager implements APIManager {
	private socket: Socket | undefined;

	public start(
		name: string,
		path: string,
		onSendPacket: (decoded: commProtocolPacket) => void
	) {
		this.socket = io(path + `?name=${name}`, { reconnection: true });

		this.socket.on("connect", () => {
			console.log(`Connected to server!`);
		});

		this.socket.on("sendPacket", (packet: commProtocolPacket) => {
			onSendPacket(packet);
		});

		this.socket.on("disconnect", () => {
			console.log("Disconnected from server, trying to reconnect...");
		});
	}

	public gotPacket(packet: commProtocolPacket): void {
		if (this.socket === undefined) {
			console.log('Start the API server first (call the "start" method)');
			return;
		}
		if (!this.socket.connected) {
			console.log(`Can't send packet when disconnected from server`);
			return;
		}
		this.socket.emit("gotPacket", packet);
	}

	public close(): void {
		if (this.socket === undefined) {
			console.log('Start the API server first (call the "start" method)');
			return;
		}
		this.socket.disconnect();
	}
}
