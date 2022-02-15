import type { satField, packet, playlist } from "./types";
import { config } from "@lib/stores";
import { isDayjs } from "dayjs";
/**
 * Filter satellite fields for telemetry or command
 * @param type telecommands or telemetry
 * @param satFields all the fields
 */
export function getSatFields(
	type: "telemetry" | "telecommands",
	satFields: satField[],
	isSending = false
) {
	const filtered = satFields.filter((x) => {
		if (type === "telemetry") return x.telemetryName !== undefined;
		else {
			if (x.commandName === undefined) return false;
			if (isSending && !x.onSend) return false;
			if (!isSending && !x.onHistory) return false;
			return true;
		}
	});
	return filtered;
}

/**
 * Check whether two packet keys are equal
 * @param expected
 * @param actual
 * @param format
 */
export function isKeyEqual(expected: any, actual: any, format: string) {
	switch (format) {
		case "MIB":
			return (
				expected.serviceType === actual.serviceType &&
				expected.serviceSubType === actual.serviceSubType
			);

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

/**
 * Return a date query to add to request URL
 * @param from
 * @param to
 */
export function getDateQuery(from?: string, to?: string) {
	const dateQuery: {
		$gte?: Date;
		$lte?: Date;
	} = {};
	if (from) dateQuery.$gte = new Date(from);
	if (to) dateQuery.$lte = new Date(to);
	return dateQuery;
}

/**
 * Send a command to a satellite
 * @param packet
 * @param endnode
 * @param satellite
 */
export async function sendPacket(
	packet: packet,
	endnode: string,
	satellite: string,
	format: string
) {
	if (!endnode) {
		M.toast({ classes: "red", html: "Please select an endnode" });
		return;
	}
	const packetToSend = encodePacketForSend(
		stripPacketsUnneededFields(packet, format),
		format
	);
	console.log(JSON.stringify(packetToSend));

	const res = await fetch(
		`${config.apiUrl}/${satellite}/sendPacket?endnode=${endnode}`,
		{
			method: "POST",
			body: JSON.stringify(packetToSend),
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
	if (!res.ok) {
		M.toast({ classes: "red", html: (await res.json()).msg });
		return false;
	} else {
		M.toast({ classes: "green", html: `Command sent successfully` });
	}
}

export function stripPacketsUnneededFields(packet: packet, format: string) {
	switch (format) {
		case "MIB":
			const { id, category, ...restPacket } = packet;
			return {
				...restPacket,
				params: packet.params.map((p) => {
					return {
						name: p.name,
						value: p.value,
					};
				}),
			};

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

export function encodePlaylistToSend(playlist: playlist, format: string) {
	return {
		...playlist,
		packets: playlist.packets.map((p) =>
			stripPacketsUnneededFields(p, format)
		),
	};
}

function encodePacketForSend(packet: packet, format: string) {
	switch (format) {
		case "MIB":
			return {
				...packet,
				params: packet.params.map((p) => {
					if (p.type === "bitmap") {
						return p.value.map((b) => b.value);
					} else return p.value;
				}),
			};

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

export function addIds(arr: Record<string, unknown>[]) {
	let id = +new Date();
	for (const obj of arr) {
		obj.id = id;
		id++;
	}
}

export function parsePlaylistsDayJsToString(playlists: playlist[]) {
	for (const playlist of playlists) {
		for (const packet of playlist.packets) {
			for (const param of packet.params) {
				if (isDayjs(param.value)) {
					param.value = param.value.format("YYYY-MM-DDTHH:mm:ss");
				}
			}
		}
	}
}
