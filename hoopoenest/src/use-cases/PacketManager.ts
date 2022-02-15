import { commProtocol, protocolsFields } from "../entities/commProtocols/types";
import { formatParser } from "../entities/formatParsers/types";
import { packet } from "../types";

export default class PacketManager {
	private commProtocols: commProtocol[];
	public readonly formatParser: formatParser;

	/**
	 * Create a packet manager
	 * @param commProtocols Communication protocols used
	 * @param formatParser Format parser used by parser
	 */
	constructor(commProtocols: commProtocol[], formatParser: formatParser) {
		this.commProtocols = commProtocols;
		this.formatParser = formatParser;
	}

	/**
	 * Parse a raw packet with communication protocols stack
	 * @param raw The raw binary data as a Buffer
	 * @param type Is it a telecommand or a telemetry
	 */
	public parsePacket(
		raw: Buffer,
		satellite: string,
		type: "telemetry" | "telecommands" = "telemetry"
	): packet {
		const originalRaw = raw.toString("hex").toUpperCase();

		const protocolsData: { [key: string]: any } = this.commProtocols.reduce(
			(acc, protcol) => {
				const { data, ...metadata } = protcol.decode(raw);
				raw = data;
				return { ...acc, ...metadata };
			},
			{}
		);

		if (!("key" in protocolsData))
			throw new Error(
				"Communication protocols stack must return a key object"
			);
		const { key, ...metadata } = protocolsData;
		const data = this.formatParser.parsePacket(raw, key, type);

		const packet = {
			groundTime: new Date(),
			raw: originalRaw,
			satellite,
			...data,
			...metadata,
		};
		return packet;
	}

	/**
	 * Encode a packet using the packet format and communication protocols
	 * @param packet The packet to encode
	 */
	public encodePacket(packet: packet) {
		return this.commProtocols
			.slice()
			.reverse()
			.reduce((buf, protocol) => {
				return protocol.encode({ ...packet, data: buf });
			}, this.formatParser.encodePacket(packet));
	}

	/**
	 * Get required fields of all protocol stack and format name
	 */
	public getCommProtocolsFields() {
		return {
			format: this.formatParser.formatName,
			fields: this.commProtocols.reduce(
				(arr, prot) => [...arr, ...prot.fields],
				[
					{
						name: "groundTime",
						type: "datetime",
						telemetryName: "Ground Time",
					},
					{
						name: "sentTime",
						type: "datetime",
						commandName: "Sent Time",
						onSend: false,
						onHistory: true,
					},
					{
						name: "commandId",
						type: "int",
						commandName: "Command Id",
						onSend: false,
						onHistory: true,
					},
				] as protocolsFields[]
			),
		};
	}
}
