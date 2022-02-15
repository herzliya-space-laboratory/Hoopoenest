import { packet } from "../../types";

export interface APIManager {
	emitPacket(packet: packet): void;
	emitEndNodes(endNodes: string[]): void;
	close(): void;
}
