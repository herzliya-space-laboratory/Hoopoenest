import { isKeyEqual } from "./misc";
import type { packetType } from "./types";

const isoDateRe = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Check that all the graph options are valid
 * @param format
 * @param startDate date string
 * @param endDate date string
 * @param params
 */
export function validateGraphOptions(
	isStartDate: boolean,
	isEndDate: boolean,
	startDate: string,
	endDate: string,
	format: string,
	params: {
		packetKey: any;
		paramKey: any;
	}[]
) {
	if (
		(isStartDate && !isoDateRe.exec(startDate)) ||
		(isEndDate && !isoDateRe.exec(endDate))
	)
		return "Start and end dates must be valid, if present";
	if (params.length === 0) return "Please select at least one param";
	for (const p of params) {
		if (!validateKeyAndParam(p.packetKey, p.paramKey, format))
			return "All params must be valid";
	}
}

function validateKeyAndParam(key, paramId, format: string) {
	switch (format) {
		case "MIB":
			return (
				key !== undefined &&
				key.serviceType !== undefined &&
				key.serviceSubType !== undefined &&
				paramId !== undefined
			);

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

/**
 * Group parameters in packet keys to reduce number of requests
 * @param params
 * @param format
 */
export function groupParamsFromSameKey(
	params: {
		packetKey: any;
		paramKey: any;
		packetType: packetType;
	}[],
	format: string
) {
	const packetKeys: {
		packetKey: any;
		packetType: any;
		paramKeys: any[];
	}[] = [];

	for (const param of params) {
		const packetKey = packetKeys.find(
			(p) =>
				p.packetType === param.packetType &&
				isKeyEqual(param.packetKey, p.packetKey, format)
		);
		if (packetKey !== undefined) packetKey.paramKeys.push(param.paramKey);
		else
			packetKeys.push({
				packetKey: param.packetKey,
				packetType: param.packetType,
				paramKeys: [param.paramKey],
			});
	}
	return packetKeys;
}

/**
 * Fetch graph data
 * @param packetKeys
 * @param format
 * @param startDate
 * @param endDate
 */
export async function parseGraphData(
	packetKeys: {
		packetKey: any;
		packetType: packetType;
		paramKeys: any[];
	}[],
	json,
	format: string,
	dateField: string
) {
	const params: {
		data: { x: Date; y: number }[];
		label: string;
		fill: false;
	}[] = [];
	let annotations: {
		type: "line";
		mode: "horizontal";
		scaleID: "y-axis-0";
		value: number;
		borderWidth: 4;
		label: {
			content: string;
			enabled: true;
		};
	}[] = [];

	for (let i = 0; i < packetKeys.length; i++) {
		const key = packetKeys[i];
		for (const param of key.paramKeys) {
			const data = json[i].map((packet) => ({
				x: packet[
					dateField === "default"
						? key.packetType === "telemetry"
							? "groundTime"
							: "sentTime"
						: dateField
				].toDate(),
				y: getParamFromKey(packet.params, param, format).value,
			}));
			if (json[i][0]) {
				const { value, ...paramFormat } = getParamFromKey(
					json[i][0].params,
					param,
					format
				);
				params.push({
					label: getParamLabel(paramFormat, format),
					data,
					fill: false,
				});
				annotations = annotations.concat(
					generateRangeAnnotations(paramFormat, format)
				);
			}
		}
	}

	return { params, annotations };
}

function getParamFromKey(params: any[], key: any, format: string) {
	switch (format) {
		case "MIB":
			return params[key];

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

function getParamLabel(paramFormat, format: string) {
	switch (format) {
		case "MIB":
			return paramFormat.name;

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}

function createRangeLineAnn(name: string, value: number) {
	return {
		type: "line",
		mode: "horizontal",
		scaleID: "y-axis-0",
		value: value,
		borderWidth: 4,
		label: {
			content: name,
			enabled: true,
		},
	};
}

function generateRangeAnnotations(paramFormat, format: string) {
	switch (format) {
		case "MIB":
			const { range, name } = paramFormat;
			const annotationArr = [];
			if (range !== undefined) {
				if (range.min !== undefined) {
					annotationArr.push(
						createRangeLineAnn(`${name}'s min`, range.min)
					);
				}
				if (range.max !== undefined) {
					annotationArr.push(
						createRangeLineAnn(`${name}'s max`, range.max)
					);
				}
			}
			return annotationArr;

		default:
			throw new Error(`Format "${format}" not supported`);
	}
}
