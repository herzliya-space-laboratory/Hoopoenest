import spl from "./entities/commProtocols/spl";
import stubsSpl from "./entities/commProtocols/stubsSpl";
import MIBParser from "./entities/formatParsers/MIB/MIBParser";
import MongoDBManager from "./entities/DBManager/MongoDBManager";
import PacketManager from "./use-cases/PacketManager";
import EndNodeSocketIO from "./use-cases/EndNodeManager/EndNodeSocketIO";
import ExpressAPI from "./use-cases/APIManager/ExpressAPI";
import { resolve } from "path";
import dayjs from "dayjs";
import { readFileSync } from "fs";
import { config, satConfig, satellite } from "./types";
// eslint-disable-next-line
// @ts-ignore
import { version } from "../package.json";
import { hasDuplicateName } from "./entities/misc";

console.log(
	`HoopoeNest v${version}
Created with love by Amit Goldenberg, in collaboration of Shahar Zyss and Nikita Weil <3
2020-2021 ©\n`
);

console.log("Loading configuration...");

const config: config = JSON.parse(readFileSync("./config.json", "utf-8"));
const satConfigs: satConfig[] = config.satellites;

function parseUnixPath(path: string) {
	return resolve(...path.split("/"));
}

function getCommProtocol(protName: string, satConfig: satConfig) {
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

if (hasDuplicateName(satConfigs)) {
	throw new Error("Duplicate satellite names!");
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

console.log("Done!");

console.log("Connecting to Database...");
const db = new MongoDBManager();
db.connect(
	config.dbURL,
	satellites.map((s) => s.name)
).then(() => {
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
				`${dayjs().format(
					"D/M/YYYY H:m:s"
				)} - Got packet from satellite "${sat.name}"`
			);
			const packet = sat.packetManager.parsePacket(
				enPacket.data,
				sat.name
			);
			db.insertPacket(packet);
			api.emitPacket(packet);
			console.log(
				`Received telemetry with key ${JSON.stringify(
					packet.key
				)} from ${sat.name}`
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
			const sat = satellites.find(
				(sat) => sat.name === packet.satellite
			)!;
			const encodedPacket = sat.packetManager.encodePacket(packet);
			const enPacket = {
				destCallsign: sat.callsign,
				destSSID: sat.SSID,
				data: encodedPacket,
			};
			await endNodeServer.sendPacket(enPacket, endnode);
			await db.insertPacket({
				...sat.packetManager.formatParser.addParamsNames(packet),
				raw: encodedPacket.toString("hex").toUpperCase(),
			});
			console.log(
				`Sending command with key ${JSON.stringify(packet.key)} to ${
					sat.name
				}`
			);
		},
		config.apiPort
	);
	console.log(`API running on port ${config.apiPort}!`);

	const satNames = satellites
		.reduce((str, sat) => `${sat.name}, ${str}`, "")
		.slice(0, -2);
	console.log(`Satellites: ${satNames}`);

	console.log("\n=== Activated! ===\n");

	process.on("uncaughtException", (error: Error) => {
		console.log(error);
	});

	// Shutdown
	process.stdin.resume(); //so the program will not close instantly

	async function exitHandler(
		options: { cleanup?: boolean; exit?: boolean },
		code?: any
	) {
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

	//do something when app is closing
	process.on("exit", exitHandler.bind(null, { cleanup: true }));

	//catches ctrl+c event
	process.on("SIGINT", exitHandler.bind(null, { exit: true }));

	// catches "kill pid" (for example: nodemon restart)
	process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
	process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
});
