import spl from "../src/entities/commProtocols/spl";
import stubsSpl from "../src/entities/commProtocols/stubsSpl";
import MIBParser from "../src/entities/formatParsers/MIB/MIBParser";
import MongoDBManager from "../src/entities/DBManager/MongoDBManager";
import PacketManager from "../src/use-cases/PacketManager";
import EndNodeSocketIO from "../src/use-cases/EndNodeManager/EndNodeSocketIO";
import ExpressAPI from "../src/use-cases/APIManager/ExpressAPI";
/* eslint-disable */
//@ts-ignore
import config from "../src/config.json";
//@ts-ignore
import satConfigs from "../src/satConfigs.json";
import { resolve } from "path";
import dayjs from "dayjs";
import { satellite } from "../src/types";
import readline from "readline";
// @ts-ignore
/* eslint-enable */
import { version } from "../package.json";

function parseUnixPath(path: string) {
	return resolve(...path.split("/"));
}

function getCommProtocol(protName: string, satConfig: { [key: string]: any }) {
	switch (protName) {
		case "spl":
			return spl;
		case "stubsSpl":
			if (satConfig.satId === undefined)
				throw new Error(
					"STUBS SPL satellite should have a satId config field"
				);
			return stubsSpl(satConfig.satId);
		default:
			throw new Error(`Communication protocol: ${protName} doen't exist`);
	}
}

function getFormatParser(format: { parser: string; [key: string]: any }) {
	switch (format.parser) {
		case "MIB":
			return new MIBParser(parseUnixPath(format.file));
		default:
			throw new Error(`Format parser: ${format.parser} doen't exist`);
	}
}

const satellites: satellite[] = satConfigs.map((sat) => {
	const commProtocols = sat.commProtocols.map((prot) =>
		getCommProtocol(prot, sat)
	);
	const formatParser = getFormatParser(sat.format);
	const packetManager = new PacketManager(commProtocols, formatParser);
	return {
		name: sat.name,
		SSID: sat.SSID,
		callsign: sat.callsign,
		packetManager,
	};
});

console.log(
	`HoopoeNest v${version}
Created with love by Amit Goldenberg, in collaboration of Shahar Zyss and Nikita Weil <3
2020 ©\n`
);

console.log("Connecting to Database...");
const db = new MongoDBManager();
(async () => await db.connect(config.dbURL))();
console.log("Connected!");

const api = new ExpressAPI();

const endNodeServer = new EndNodeSocketIO(
	config.endNodePort,
	(enPacket) => {
		if (!("srcSSID" in enPacket && "srcCallsign" in enPacket))
			throw new Error("Packet must have satellite SSID and callsign");

		const sat = satellites.find(
			(sat) =>
				sat.SSID === enPacket.srcSSID &&
				sat.callsign === enPacket.srcCallsign
		);
		if (sat === undefined)
			throw new Error(
				`Satellite with callsign: ${enPacket.srcCallsign} and SSID: ${enPacket.srcSSID} wasn't found`
			);
		console.log(
			`${dayjs().format("D/M/YYYY H:m:s")} - Got packet from satellite "${
				sat.name
			}"`
		);
		const packet = sat.packetManager.parsePacket(enPacket.data, sat.name);
		// db.insertPacket(packet);
		console.log(
			`Received telemetry with key ${JSON.stringify(packet.key)}`
		);
	},
	api.emitEndNodes.bind(api)
);
console.log(
	`EndNode server initialized, connect endnodes on port ${config.endNodePort}!`
);

api.start(
	db,
	endNodeServer,
	satellites.reduce((sats, sat) => {
		return { ...sats, [sat.name]: sat.packetManager };
	}, {}),
	async (packet, endnode) => {
		const sat = satellites.find((sat) => sat.name === packet.satellite)!;
		const encodedPacket = sat.packetManager.encodePacket(packet);
		const enPacket = {
			destCallsign: sat.callsign,
			destSSID: sat.SSID,
			data: encodedPacket,
		};
		await endNodeServer.sendPacket(enPacket, endnode);
		await db.insertPacket({
			...packet,
			raw: encodedPacket.toString("hex").toUpperCase(),
		});
	},
	config.apiPort
);
console.log(`API running on port ${config.apiPort}!`);

const satNames = satellites
	.reduce((str, sat) => `${sat.name}, ${str}`, "")
	.slice(0, -2);
console.log(`Satellites: ${satNames}`);

console.log("\n=== Activated! ===\n");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

rl.on("line", (line) => {
	if (line === "beacon") {
		api.getSocket()
			.to("sat1")
			.emit("gotPacket", {
				name: "beacon",
				satellite: "sat1",
				params: [
					{
						name: "hu",
						value: 22,
						subSystem: "OBC",
					},
					{
						name: "hi",
						value: 11,
						subSystem: "OBC",
					},
					{
						name: "ee",
						value: 6,
						subSystem: "ADCS",
					},
					{
						name: "eu",
						value: 22,
						subSystem: "ADCS",
					},
					{
						name: "hi",
						value: 11,
						subSystem: "OBC",
					},
					{
						name: "ha",
						value: 224,
						subSystem: "OBC",
					},
					{
						name: "he",
						value: 6,
						subSystem: "OBC",
					},
					{
						name: "ee",
						value: 6,
						subSystem: "ADCS",
					},
					{
						name: "eu",
						value: 22,
						subSystem: "TRXVU",
					},
					{
						name: "hi",
						value: 11,
						subSystem: "TRXVU",
					},
					{
						name: "ha",
						value: 224,
						subSystem: "TRXVU",
					},
					{
						name: "he",
						value: 6,
						subSystem: "OBC",
					},
				],
				key: { serviceType: 1, serviceSubType: 2 },
				groundTime: new Date(),
				type: "telemetry",
				raw: "csdcsdds",
			});
	}
	if (line === "telem") {
		api.emitPacket({
			name: "beacon",
			satellite: "sat1",
			params: [
				{
					name: "hu",
					value: 22,
				},
				{
					name: "hi",
					value: 11,
				},
			],
			key: { serviceType: 1, serviceSubType: 2 },
			groundTime: new Date(),
			type: "telemetry",
			raw: "csdcsdds",
		});
	}
});

// Shutdown
process.stdin.resume(); //so the program will not close instantly

async function exitHandler(options: any, code: any) {
	if (options.cleanup) {
		api.close();
		endNodeServer.close();
		await db.close();
	}
	if (options.exit) {
		console.log("\nGoodbye!");
		process.exit();
	}
}

process.on("uncaughtException", (error: Error) => {
	console.log(error);
});

//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
