import {
	paramFormat,
	packetFormat,
	serviceTypeFormat,
	partFormat,
	mibOptions,
	serviceTypeOptions,
	partOptions,
	packetOptions,
	paramOptions,
	mibFormat,
	mibKey,
	settings,
	range,
	calibrationFormat,
	calibrationMap,
	bitfieldFormat,
	clientParamType,
	bitfieldOptions,
	linearCalibrationFormat,
} from "./types";
import {
	packetValues,
	formatParser,
	packetMetaInfo,
	packetForEncoding,
} from "../types";
import { packetType } from "../../../types";
import {
	getParamByteLength,
	getRangeParser,
	getTypeEncoder,
	getTypeParser,
	getCalibrationParser,
	getCalibrationEncoder,
	getFormat,
	getTypeRange,
	getTypeClientName,
} from "./typeParsers";

export default class MIBParser implements formatParser {
	private options: mibOptions;
	private settings: settings = {
		isDefaultLittleEndian: false,
	};
	private calibrations: calibrationMap;
	public readonly formatName = "MIB";

	/**
	 * @param path Path to format file
	 */
	constructor(path: string) {
		const format = getFormat(path);
		if (format.settings !== undefined) this.settings = format.settings;
		this.calibrations = this.generateCalibrationMap(format.calibrations);
		this.options = {
			telemetry: this.generatePartOptions(format.telemetry, "telemetry"),
			telecommands: this.generatePartOptions(
				format.telecommands,
				"telecommands"
			),
		};
	}

	private validateKey(key: any): key is mibKey {
		return (
			typeof key === "object" &&
			"serviceType" in key &&
			"serviceSubType" in key
		);
	}

	/**
	 * Parse a raw packet
	 * @param raw The raw data buffer
	 * @param type Whether a telemetry or a telecommand
	 * @param key A key object containing service type and subtype
	 */
	public parsePacket(
		raw: Buffer,
		key: unknown,
		type: packetType = "telemetry"
	): packetValues {
		if (!this.validateKey(key))
			throw new Error(
				"Packet key should contain service type and subtype. Did you set up correctly your communication protocols stack?"
			);

		const { serviceType, serviceSubType } = key;
		let packetOptions: packetOptions;
		try {
			packetOptions = this.options[type].serviceTypes[serviceType]
				.serviceSubTypes[serviceSubType];
		} catch (err) {
			throw new Error(
				`${type} with service type "${serviceType}" and sub type "${serviceSubType}" does not exist`
			);
		}
		const { params: paramsOptions } = packetOptions;

		const params = paramsOptions.map((param) => {
			const { parse, byteLength, name } = param;
			if (raw.length < byteLength)
				throw new Error(
					"Packet parsing failed: raw packet is too short"
				);
			const paramRaw = raw.slice(0, byteLength);
			const value = parse(paramRaw);
			raw = raw.slice(byteLength);
			return { value, name };
		});

		return {
			name: packetOptions.name,
			type,
			key,
			params,
		};
	}

	/**
	 * Encode a packet into a Buffer
	 * @param packet a packet object
	 */
	public encodePacket(packet: packetForEncoding): Buffer {
		const { params, key, type } = packet;
		if (!this.validateKey(key))
			throw new Error(
				"Packet key should contain service type and subtype. Did you set up correctly your communication protocols stack?"
			);

		const { serviceType: st, serviceSubType: sst } = key;
		let options: packetOptions;
		try {
			options = this.options[type].serviceTypes[st].serviceSubTypes[sst];
		} catch (err) {
			throw new Error(
				`${type} with service type "${st}" and sub type "${sst}" does not exist`
			);
		}
		if (options === undefined)
			throw new Error(
				`${type} with service type "${st}" and sub type "${sst}" does not exist`
			);
		if (params.length !== options.params.length)
			throw new Error(
				"Couldn't parse packet: number of parameters is invalid"
			);

		const buffers = params.map((value, idx) => {
			const { encode } = options.params[idx];
			return encode(value);
		});

		return Buffer.concat(buffers);
	}

	/**
	 * Get all possible packet keys
	 * @param type whether commands or telemetries
	 */
	public getKeys(type: packetType) {
		const sts = this.options[type].serviceTypes;
		const keys = [];

		for (const idStr in sts) {
			const id = parseInt(idStr);
			if (Object.prototype.hasOwnProperty.call(sts, id)) {
				const { name, serviceSubTypes: ssts } = sts[id];
				const sstKeys = [];

				for (const idStr in ssts) {
					const id = parseInt(idStr);
					if (Object.prototype.hasOwnProperty.call(ssts, id)) {
						const { name } = ssts[id];
						sstKeys.push({ id, name });
					}
				}
				keys.push({ id, name, subTypes: sstKeys });
			}
		}

		return keys;
	}

	/**
	 * Get all possible packet formats
	 * @param type whther a telecommand or telemetry
	 */
	public getAllPacketFormats(type: packetType) {
		const keys = this.getKeys(type);
		const formats = keys.reduce((formats: any, key) => {
			const subTypes = key.subTypes.reduce((sstFormats: any, sstKey) => {
				return [
					...sstFormats,
					{
						id: sstKey.id,
						...this.getPacketFormat(
							{
								serviceType: key.id,
								serviceSubType: sstKey.id,
							},
							type
						),
					},
				];
			}, []);

			return [
				...formats,
				{
					id: key.id,
					name: key.name,
					subTypes,
				},
			];
		}, []);

		return formats;
	}

	/**
	 * Combine packet values with format
	 * @param packet raw packet values
	 * @param key A key object containing service type and subtype
	 * @param type Whether telemetry or telecommand
	 */
	public formatPacket(packet: packetValues, key: unknown, type: packetType) {
		const format = this.getPacketFormat(key, type);
		const formattedParams = packet.params.map(({ value }, idx) => {
			if (format.params[idx].type !== "bitmap")
				return {
					value,
					...format.params[idx],
				};
			else {
				const { bitfields, ...paramFormat } = format.params[idx];
				const bitfieldsValue = bitfields.map(
					(bitfield: any, idx: number) => {
						return {
							...bitfield,
							value: value[idx].value,
						};
					}
				);
				return {
					...paramFormat,
					value: bitfieldsValue,
				};
			}
		});

		return {
			...packet,
			...format,
			params: formattedParams,
		};
	}

	public addParamsNames(packet: packetForEncoding): packetValues {
		const format = this.getPacketFormat(packet.key, packet.type);
		const formattedParams = packet.params.map((value, idx) => {
			if (format.params[idx].type !== "bitmap")
				return {
					value,
					name: format.params[idx].name,
				};
			else {
				const { bitfields, ...paramFormat } = format.params[idx];
				const bitfieldsValue = bitfields.map(
					(bitfield: any, idx: number) => {
						return {
							name: bitfield.name,
							value: value[idx],
						};
					}
				);
				return {
					name: paramFormat.name,
					value: bitfieldsValue,
				};
			}
		});

		return {
			...packet,
			params: formattedParams,
		};
	}

	/**
	 * Get packet format information (type, name, range, etc)
	 * @param key A key object containing service type and subtype
	 * @param type Whether telemetry or telecommand
	 */
	public getPacketFormat(key: unknown, type: packetType): packetMetaInfo {
		if (!this.validateKey(key))
			throw new Error(
				"MIB packet key should contain service type and subtype. Did you set up correctly your communication protocols stack?"
			);

		const { serviceType, serviceSubType } = key;
		let packetOptions: packetOptions;
		try {
			packetOptions = this.options[type].serviceTypes[serviceType]
				.serviceSubTypes[serviceSubType];
		} catch (err) {
			throw new Error(
				`${type} with service type "${serviceType}" and sub type "${serviceSubType}" does not exist`
			);
		}
		if (packetOptions === undefined)
			throw new Error(
				`Service type "${serviceType}" and sub type "${serviceSubType}" does not exist`
			);
		const { params: paramsOptions, name, id, ...metadata } = packetOptions;
		const category = this.options[type].serviceTypes[serviceType].name;

		const params = paramsOptions.map((param) => {
			const { byteLength, encode, parse, ...format } = param;
			return format;
		});

		return {
			name,
			key,
			category,
			params,
			...metadata,
		};
	}

	private generatePartOptions(
		partFormat: partFormat,
		packetType: packetType
	): partOptions {
		const serviceTypesOptions = {} as any;
		for (const stFormat of partFormat.serviceTypes) {
			serviceTypesOptions[stFormat.id] = this.generateServiceTypeOptions(
				stFormat,
				packetType
			);
		}
		return {
			serviceTypes: serviceTypesOptions,
		};
	}

	private generateServiceTypeOptions(
		stFormat: serviceTypeFormat,
		packetType: packetType
	): serviceTypeOptions {
		const packetsOptions = {} as any;
		for (const sstFormat of stFormat.serviceSubTypes) {
			packetsOptions[sstFormat.id] = this.generatePacketOptions(
				sstFormat,
				packetType
			);
		}
		return {
			name: stFormat.name,
			id: stFormat.id,
			serviceSubTypes: packetsOptions,
		};
	}

	private generatePacketOptions(
		packetFormat: packetFormat,
		packetType: packetType
	): packetOptions {
		const { params, description, name, id } = packetFormat;
		const paramsOptions = params.map((p) =>
			this.generateParamOptions(p, packetType)
		);

		return {
			id,
			name,
			...(description !== undefined && { description }),
			params: paramsOptions,
		};
	}

	private generateParamOptions(
		paramFormat: paramFormat,
		packetType: packetType
	): paramOptions {
		const parse = this.getBufferParser(paramFormat);
		const encode = this.getBufferEncoder(paramFormat);
		const byteLength = getParamByteLength(paramFormat);
		const format = this.generateParamMetaInfo(paramFormat, packetType);

		return {
			encode,
			parse,
			byteLength,
			...format,
		};
	}

	private generateParamMetaInfo(param: paramFormat, packetType: packetType) {
		const {
			name,
			type,
			description,
			unit,
			subSystem,
			size,
			calibration,
			bitfields,
		} = param;
		let values: any[] | undefined;
		let bitfieldsFormat: bitfieldOptions[] | undefined;
		let clientType = getTypeClientName(type);
		let range = this.parseRange(param, packetType, calibration);
		let clientCalibrationFormat: calibrationFormat | undefined = undefined;

		if (calibration !== undefined) {
			const calibrationFormat = this.calibrations[calibration].format;
			if (calibrationFormat.type === "enum") {
				clientType = "enum";
				range = undefined;
				values = calibrationFormat.options.map((op) => op.name);
			} else if (calibrationFormat.type === "linear") {
				clientCalibrationFormat = calibrationFormat;
			}
		} else if (clientType === "bitmap") {
			if (bitfields === undefined)
				throw new Error(`Bitmap "${name}" must have bitfields`);
			bitfieldsFormat = bitfields
				.map((b) => this.getBitfieldFormat(b, packetType))
				.filter((elem) => elem !== undefined) as bitfieldOptions[];
		}

		return {
			name,
			type: clientType,
			...(range !== undefined && { range }),
			...(values !== undefined && { values }),
			...(description !== undefined && {
				description,
			}),
			...(unit !== undefined && { unit }),
			...(subSystem !== undefined && { subSystem }),
			...(size !== undefined && { size }),
			...(bitfieldsFormat !== undefined && {
				bitfields: bitfieldsFormat,
			}),
			...(clientCalibrationFormat !== undefined && {
				calibration: clientCalibrationFormat,
			}),
		};
	}

	private getBitfieldFormat(
		{ name, isNull, size, calibration }: bitfieldFormat,
		packetType: packetType
	): bitfieldOptions | undefined {
		if (isNull) return undefined;
		let type: "int" | "enum" = "int";
		let values: any[] | undefined;
		let range: { min: any; max: any } | undefined = {
			min: 0,
			max: 2 ** size - 1,
		};
		let clientCalibrationFormat: calibrationFormat | undefined = undefined;

		if (calibration !== undefined) {
			const calibrationFormat = this.calibrations[calibration].format;
			if (calibrationFormat.type === "enum") {
				type = "enum";
				range = undefined;
				values = calibrationFormat.options.map((op) => op.name);
			} else if (calibrationFormat.type === "linear") {
				if (range?.max !== undefined)
					range.max = this.calibrations[calibrationFormat.name][
						packetType === "telemetry" ? "parse" : "encode"
					](range.max);
				if (range?.min !== undefined)
					range.min = this.calibrations[calibrationFormat.name][
						packetType === "telemetry" ? "parse" : "encode"
					](range.min);
				clientCalibrationFormat = calibrationFormat;
			}
		}

		return {
			name,
			type,
			...(values !== undefined && { values }),
			...(range !== undefined && { range }),
			...(clientCalibrationFormat !== undefined && {
				calibration: clientCalibrationFormat,
			}),
		};
	}

	private shouldBeLittleEndian(format: paramFormat): boolean {
		if (format.isLittleEndian !== undefined) return format.isLittleEndian;
		return this.settings.isDefaultLittleEndian;
	}

	private getBufferParser(paramFormat: paramFormat): (buffer: Buffer) => any {
		const parser = getTypeParser(paramFormat, this.calibrations);
		const calibrate =
			paramFormat.calibration !== undefined
				? this.calibrations[paramFormat.calibration].parse
				: (input: any) => input;
		if (calibrate === undefined)
			throw new Error(
				`Param ${paramFormat.name} - calibration "${paramFormat.calibration}" doesn't exist`
			);

		return this.shouldBeLittleEndian(paramFormat)
			? (buffer: Buffer) => calibrate(parser(buffer.slice().reverse()))
			: (buffer: Buffer) => calibrate(parser(buffer));
	}

	private getBufferEncoder(paramFormat: paramFormat): (input: any) => Buffer {
		const encoder = getTypeEncoder(paramFormat, this.calibrations);
		const calibrate =
			paramFormat.calibration !== undefined
				? this.calibrations[paramFormat.calibration].encode
				: (input: any) => input;
		if (calibrate === undefined)
			throw new Error(
				`Param ${paramFormat.name} - calibration "${paramFormat.calibration}" doesn't exist`
			);

		return this.shouldBeLittleEndian(paramFormat)
			? (input: any) => encoder(calibrate(input)).slice().reverse()
			: (input: any) => encoder(calibrate(input));
	}

	private generateCalibrationMap(
		calFormats: calibrationFormat[]
	): calibrationMap {
		return calFormats.reduce((map, calFormat) => {
			const { name } = calFormat;
			const cal = {
				parse: getCalibrationParser(calFormat),
				encode: getCalibrationEncoder(calFormat),
				format: calFormat,
			};
			return { ...map, [name]: cal };
		}, {});
	}

	private parseRange(
		format: paramFormat,
		packetType: packetType,
		calibration?: string
	): range | undefined {
		const calibrate =
			calibration !== undefined &&
			this.calibrations[calibration].format.type === "linear"
				? packetType === "telemetry"
					? this.calibrations[calibration].parse
					: this.calibrations[calibration].encode
				: (val: any) => val;

		const typeRange = getTypeRange(format.type);
		if (typeRange === undefined) return undefined;
		if (typeRange.min !== undefined)
			typeRange.min = calibrate(typeRange.min);
		if (typeRange.max !== undefined)
			typeRange.max = calibrate(typeRange.max);

		const { range: rangeFormat } = format;
		if (rangeFormat === undefined) return typeRange;
		const parse = getRangeParser(format);
		const paramRange = {
			...(rangeFormat.min !== undefined && {
				min: parse(rangeFormat.min),
			}),
			...(rangeFormat.max !== undefined && {
				max: parse(rangeFormat.max),
			}),
		};

		const min =
			typeRange.min !== undefined && paramRange.min !== undefined
				? typeRange.min > paramRange.min
					? typeRange.min
					: paramRange.min
				: typeRange.min !== undefined
				? typeRange.min
				: paramRange.min !== undefined
				? paramRange.min
				: undefined;

		const max =
			typeRange.max !== undefined && paramRange.max !== undefined
				? typeRange.max < paramRange.max
					? typeRange.max
					: paramRange.max
				: typeRange.max !== undefined
				? typeRange.max
				: paramRange.max !== undefined
				? paramRange.max
				: undefined;

		return {
			...(min !== undefined && { min }),
			...(max !== undefined && { max }),
		};
	}
}
