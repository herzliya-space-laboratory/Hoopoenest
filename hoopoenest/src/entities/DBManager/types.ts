import { packet, packetType, playlist, satellite } from "../../types";
import { packetValues } from "../formatParsers/types";

export interface DBManager {
	getLatestPackets(
		satellite: string,
		type: packetType,
		where?: Partial<packet>,
		num?: number,
		skip?: number
	): Promise<packet[]>;
	insertPacket(packet: packet): Promise<boolean>;

	createPlaylist(
		playlist: Omit<playlist, "id">,
		satellite: string
	): Promise<[boolean, string]>;
	getPlaylists(satellite: string): Promise<playlist[]>;
	updatePlaylist(
		packets: playlist,
		id: string,
		satellite: string
	): Promise<[boolean, string]>;
	deletePlaylist(id: string, satellite: string): Promise<boolean>;

	connect(url: string, satellites: string[]): Promise<void>;
	close(): Promise<void>;
}
