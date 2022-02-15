import type { Dayjs } from "dayjs";

export type packetType = "telemetry" | "telecommands";

export type packet = {
	satellite: string;
	key: any;
	type: packetType;
	params: any[];
	raw?: string;
	[key: string]: any;
};

export type telemetryPacket = packet & {
	type: "telemetry";
	groundTime: Dayjs;
};

export type commandPacket = packet & {
	type: "telecommands";
	sentTime: Dayjs;
	commandId: number;
};

export type satField = {
	name: string;
	telemetryName?: string;
	commandName?: string;
	onSend?: boolean;
	onHistory?: boolean;
	description?: string;
	type: string;
	range?: {
		min?: any;
		max?: any;
	};
};

export type playlist = {
	_id?: string;
	name?: string;
	creationTime?: Date;
	packets: packet[];
};

export type commandModalState =
	| "new-command"
	| "existing-command"
	| "send-steps"
	| "auto";
