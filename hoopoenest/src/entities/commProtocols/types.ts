export type commProtocolPacket = {
	data: Buffer;
	[key: string]: any;
};

export type protocolsFields = {
	name: string;
	telemetryName?: string;
	commandName?: string;
	onSend?: boolean;
	onHistory?: boolean;
	type: string | Record<string, any>;
	range?: {
		min?: any;
		max?: any;
	};
};

export interface commProtocol {
	decode: (encoded: Buffer) => commProtocolPacket;
	encode: (decoded: unknown) => Buffer;
	fields: protocolsFields[];
}
