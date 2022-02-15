import { commProtocolPacket } from "../../src/commProtocols/types";

export interface APIManager {
	gotPacket: (packet: commProtocolPacket) => void;
	close: () => void;
}
