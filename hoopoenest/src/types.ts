import { packetValues } from "./entities/formatParsers/types";
import PacketManager from "./use-cases/PacketManager";

export type packetType = "telemetry" | "telecommands";

export type packet = {
	id?: string;
	satellite: string;
	key: any; // Will contain packet foramt ids; for MIB it will contain st and sst
	type: packetType;
	params: any[];
	groundTime: Date;
	raw: string;
	[key: string]: any; // Will contain parameters retreived from communication protocols
};

export type parameter = {
	name: string;
	value: any;
	type: string;
	[key: string]: any; //For everything not every parameter has
};

export type satellite = {
	name: string;
	SSID: number;
	callsign: string;
	packetManager: PacketManager;
};

export type playlist = {
	_id?: string;
	name: string;
	creationTime: Date;
	packets: any[];
};

export type config = {
	apiPort: number;
	endNodePort: number;
	dbURL: string;
	satellites: satConfig[];
};

export type satConfig = {
	name: string;
	callsign: string;
	SSID: number;
	commProtocols: string[];
	format: {
		parser: string;
		file: string;
	};
	[key: string]: any;
};
