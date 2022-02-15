import {
	commProtocolPacket,
	commProtocol,
} from "../../src/commProtocols/types";

export default class commProtocolsHandler {
	private commProtocols: commProtocol[];

	constructor(commProtocols: commProtocol[]) {
		this.commProtocols = commProtocols;
	}

	public decodePacket(rawPacket: Buffer): commProtocolPacket {
		const protocolsData: {
			[key: string]: any;
			data: Buffer;
		} = this.commProtocols.reduce(
			(acc, protcol) => {
				const { data, ...metadata } = protcol.decode(rawPacket);
				rawPacket = data;
				return { ...acc, ...metadata, data: data };
			},
			{ data: rawPacket }
		);

		return protocolsData;
	}

	public encodePacket(decodedPacket: commProtocolPacket): Buffer {
		return this.commProtocols
			.slice()
			.reverse()
			.reduce((packet: any, protocol) => {
				packet = protocol.encode(packet);
				return packet;
			}, decodedPacket);
	}
}
