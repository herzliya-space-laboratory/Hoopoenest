import { commProtocolPacket } from "../../entities/commProtocols/types";

export interface EndNodeManager {
	close(): void;
	sendPacket(packet: commProtocolPacket, endNodeName: string): void;
	getEndNodes(): string[];
}

export type endNodePacket = {
	data: Buffer;
	[key: string]: any;
};
