import net from "net";

export default class TCPServerMock {
	private server: net.Server;
	readonly clients: { [key: string]: net.Socket };

	constructor(port: number, onData: (data: Buffer) => void) {
		this.server = net.createServer();
		this.clients = {};

		this.server.on("connection", (socket: net.Socket) => {
			this.clients[
				socket.remoteAddress + ":" + String(socket.remotePort)
			] = socket;

			socket.on("data", (data: Buffer) => {
				onData(data);
			});

			socket.once("close", () => {
				delete this.clients[
					socket.remoteAddress + ":" + String(socket.remotePort)
				];
			});
		});

		this.server.listen(port, () => {
			console.log(
				`TCP server listening on: ${JSON.stringify(
					this.server.address()
				)}`
			);
		});
	}

	public write(clientAddres: string, data: Buffer) {
		const client = this.clients[clientAddres];
		if (client === undefined) {
			throw new Error(
				`client with addres ${clientAddres} did not found...`
			);
		}
		client.write(data);
	}

	public close() {
		this.server.close((err) => {
			console.log(`Error: "${err}" accrued when closing`);
		});
	}
}
