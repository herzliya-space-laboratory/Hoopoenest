import net from "net";
import PromiseSocket from "promise-socket";
import { incomingAPIManager } from "./types";

export default class TCPManager implements incomingAPIManager {
	readonly socket: net.Socket;
	private promiseSocket: PromiseSocket<net.Socket>;
	private address: string;
	private port: number;
	private intervalConnect: any;

	constructor(address: string, port: number, onData: (data: Buffer) => void) {
		this.port = port;
		this.address = address;
		this.socket = new net.Socket();
		this.promiseSocket = new PromiseSocket(this.socket);
		this.intervalConnect = false;

		this.socket.on("data", onData);

		this.socket.on("connect", this.clearIntervalConnect.bind(this));

		this.socket.on("error", this.launchIntervalConnect.bind(this));
		this.socket.on("close", this.launchIntervalConnect.bind(this));
		this.socket.on("end", this.launchIntervalConnect.bind(this));
	}

	public async connect() {
		try {
			await this.promiseSocket.connect(this.port, this.address);
			console.log(
				`Connected to ground arrays on ${(this.address, this.port)}!`
			);
		} catch (err) {
			//eslint-disable-next-line
		}
	}

	private launchIntervalConnect() {
		if (false != this.intervalConnect) return;
		console.log("Disconnected from ground arrays, trying to reconnect...");
		this.intervalConnect = setInterval(this.connect.bind(this), 2000);
	}

	private clearIntervalConnect() {
		if (false == this.intervalConnect) return;
		clearInterval(this.intervalConnect);
		this.intervalConnect = false;
	}

	public write(data: Buffer) {
		if (this.socket.connecting === true) {
			console.log(
				`Connection to ${
					(this.address, this.port)
				} is not established yet... Please wait for connection!`
			);
			return;
		}
		this.socket.write(data);
	}

	public async close() {
		this.socket.removeAllListeners();
		this.promiseSocket.destroy();
	}
}
