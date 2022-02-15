import SocketIOManager from "./APIManager/SocketIOManager";
import TCPManager from "./incomingAPIManager/TCPManager";
import commProtocolsHandler from "./CommProtocolHandler/ProtocolHandler";
import kiss from "./commProtocols/kiss";
import ax25 from "./commProtocols/ax25";
import { commProtocol } from "./commProtocols/types";
// eslint-disable-next-line
//@ts-ignore
import { version } from "../package.json";
import { readFileSync } from "fs";
import { config } from "./types";

const config: config = JSON.parse(readFileSync("./config.json", "utf8"));

function getProtocolsArray(): commProtocol[] {
	const commProtocolsArray: commProtocol[] = [];
	config.commProtocols.forEach((protocol) => {
		switch (protocol) {
			case "kiss":
				commProtocolsArray.push(kiss);
				break;

			case "ax25":
				commProtocolsArray.push(ax25(config.callsign, config.ssid));
				break;
		}
	});

	return commProtocolsArray;
}

const protocolsHandler = new commProtocolsHandler(getProtocolsArray());

console.log(
	`\nHoopoeNest-EndNode v${version}
Created with love by Amit Goldenberg, Shahar Zyss and Nikita Weil <3
2020 Herzliya Space Laboratory\n`
);

const hpnManager = new SocketIOManager();

console.log("\nInitializing TCP Connections...");

const uplinkManager = new TCPManager(
	config.groundArrays.uplink.address,
	config.groundArrays.uplink.port,
	() => ({})
);

const downlinkManager = new TCPManager(
	config.groundArrays.downlink.address,
	config.groundArrays.downlink.port,
	(data: Buffer) => {
		const decoded = protocolsHandler.decodePacket(data);
		console.log(
			`Got data: ${Buffer.from(decoded.data)
				.toString("hex")
				.match(/.{1,2}/g)
				?.join(" ")} from ${decoded.srcCallsign}`
		);
		hpnManager.gotPacket(decoded);
	}
);

downlinkManager.connect();
uplinkManager.connect().then(() => {
	console.log("\nConnecting to server...");

	hpnManager.start(config.name, config.serverURL, (decoded: any) => {
		const packet = protocolsHandler.encodePacket(decoded);
		uplinkManager.write(packet);
		console.log(
			`Sent: ${packet
				.toString("hex")
				.match(/.{1,2}/g)
				?.join(" ")}`
		);
	});
	console.log("=== Activated ===");
});

process.on("uncaughtException", (error: Error) => {
	console.log(error);
});

async function exitHandler(options: any, code: any) {
	if (options.cleanup) {
		hpnManager.close();
		uplinkManager.close();
		downlinkManager.close();
	}
	if (options.exit) {
		console.log("\nGoodbye!");
		process.exit();
	}
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
