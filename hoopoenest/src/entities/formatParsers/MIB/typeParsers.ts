import {
	paramFormat,
	calibrationFormat,
	linearCalibrationFormat,
	bitfieldFormat,
	calibrationMap,
	range,
	clientParamType,
} from "./types";
import JSONParser from "./fileParsing/json";
import dayjs from "dayjs";
import { extname } from "path";

export function getFormat(path: string) {
	const fileType = extname(path);
	switch (fileType) {
		case ".json":
			return JSONParser(path);
		default:
			throw new Error(`MIB doesn't support file type "${fileType}"`);
	}
}

export function getTypeParser(
	paramFormat: paramFormat,
	calibrations: calibrationMap
): (buffer: Buffer) => any {
	switch (paramFormat.type) {
		case "byte":
			return (buffer) => buffer[0];
		case "uint16":
			return (buffer) => buffer.readUInt16BE();
		case "int16":
			return (buffer) => buffer.readInt16BE();
		case "uint32":
			return (buffer) => buffer.readUInt32BE();
		case "int32":
			return (buffer) => buffer.readInt32BE();
		case "float":
			return (buffer) => buffer.readFloatBE();
		case "double":
			return (buffer) => buffer.readDoubleBE();
		case "datetime":
			return (buffer) => new Date(buffer.readUInt32BE() * 1000);
		case "buffer":
			return (buffer) => buffer.toString("hex");
		case "bitmap":
			return getBitmapParser(paramFormat, calibrations);
		default:
			throw new Error(
				`Type "${paramFormat.type}" isn't supported in MIB`
			);
	}
}

function getBitmapParser(format: paramFormat, calibrations: calibrationMap) {
	if (format.bitfields === undefined)
		throw new Error(
			`Param "${format.name}": bitmap param should have bitfields`
		);
	return (buffer: Buffer) => {
		let bits = buffer[0].toString(2).padStart(8, "0");
		return (format.bitfields as bitfieldFormat[]).reduce(
			(arr, bitfield) => {
				const field = bits.slice(0, bitfield.size);
				bits = bits.slice(bitfield.size);

				if (bitfield.isNull) return arr;

				let value = parseInt(field, 2);
				if (bitfield.calibration !== undefined)
					value = calibrations[bitfield.calibration as any].parse(
						value
					);
				return [...arr, { value, name: bitfield.name }];
			},
			[] as { name: string; value: any }[]
		);
	};
}

export function getTypeEncoder(
	paramFormat: paramFormat,
	calibrations: calibrationMap
): (input: any) => Buffer {
	const validateNumber = (input: unknown) => {
		if (typeof input !== "number")
			throw new Error(
				`Can't encode param "${paramFormat.name}" - should be a number`
			);
	};

	const validateDate = (input: unknown) => {
		if (!(input instanceof Date))
			throw new Error(
				`Can't encode param "${paramFormat.name}" - should be a date`
			);
	};

	const validateBuffer = (input: unknown) => {
		if (
			!(typeof input === "string") &&
			!(input as string).match(/^0x[0-9a-f]+$/i)
		)
			throw new Error(
				`Can't encode param "${paramFormat.name}" - should be a hex string (buffer)`
			);
	};

	switch (paramFormat.type) {
		case "byte":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(1);
				buf[0] = input;
				return buf;
			};
		case "uint16":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(2);
				buf.writeUInt16BE(input);
				return buf;
			};
		case "int16":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(2);
				buf.writeInt16BE(input);
				return buf;
			};
		case "uint32":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(4);
				buf.writeUInt32BE(input);
				return buf;
			};
		case "int32":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(4);
				buf.writeInt32BE(input);
				return buf;
			};
		case "float":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(4);
				buf.writeFloatBE(input, 0);
				return buf;
			};
		case "double":
			return (input) => {
				validateNumber(input);
				const buf = Buffer.alloc(8);
				buf.writeDoubleBE(input, 0);
				return buf;
			};
		case "datetime":
			return (input) => {
				validateDate(input);
				const buf = Buffer.alloc(4);
				buf.writeUInt32BE(input.getTime() / 1000);
				return buf;
			};
		case "buffer":
			return (input) => {
				validateBuffer(input);
				return Buffer.from(input, "hex");
			};
		case "bitmap":
			return getBitmapEncoder(paramFormat, calibrations);
		default:
			throw new Error(
				`Type "${paramFormat.type}" isn't supported in MIB`
			);
	}
}

function getBitmapEncoder(
	paramFormat: paramFormat,
	calibrations: calibrationMap
) {
	if (paramFormat.bitfields === undefined)
		throw new Error(
			`Param "${paramFormat.name}": bitmap must have bitfields`
		);

	return (input: unknown) => {
		if (!Array.isArray(input))
			throw new Error(
				`Param "${paramFormat.name}" must have a bitfield array`
			);

		const bitfields = paramFormat.bitfields!;
		let j = 0;
		let binary = "";
		let totalSize = 0;
		for (let i = 0; i < bitfields.length; i++) {
			const fieldFormat = bitfields[i];
			totalSize += fieldFormat.size;
			if (fieldFormat.isNull) {
				binary += "0".repeat(fieldFormat.size);
				continue;
			}
			const field = input[j];
			const value =
				fieldFormat.calibration === undefined
					? field
					: calibrations[fieldFormat.calibration as any].encode(
							field
					  );
			if (typeof field !== "number" && Number.isInteger(field))
				throw new Error(
					`Can't encode param "${paramFormat.name}" - bitmap value must be an int array after calibration`
				);
			if (value.toString(2).length > fieldFormat.size)
				throw new Error(
					`Param ${paramFormat.name}: bitmap encode error - bitfield "${fieldFormat.name}" size is invalid`
				);

			binary += value.toString(2).padStart(fieldFormat.size, "0");
			j++;
		}

		if (totalSize !== binary.length)
			throw new Error(
				`Param "${paramFormat.name}": bitmap encode error - total size is invalid`
			);
		const buffer = Buffer.alloc(1);
		buffer[0] = parseInt(binary, 2);
		return buffer;
	};
}

export function getParamByteLength(paramFormat: paramFormat): number {
	switch (paramFormat.type) {
		case "bitmap":
		case "byte":
			return 1;
		case "int16":
		case "uint16":
			return 2;
		case "int32":
		case "uint32":
		case "float":
		case "datetime":
			return 4;
		case "double":
			return 8;
		case "buffer":
			if (paramFormat.size === undefined)
				throw new Error(
					`Param '${paramFormat.name}' of type buffer must have a size property`
				);
			return paramFormat.size;
		default:
			throw new Error(
				`Type "${paramFormat.type}" isn't supported in MIB`
			);
	}
}

export function getCalibrationParser(
	calFormat: calibrationFormat
): (input: any) => any {
	const validateNumber = (input: any) => {
		if (typeof input !== "number")
			throw new Error(
				`Can't perform calibration on type "${typeof input}" - should be a number`
			);
	};

	switch (calFormat.type) {
		case "linear":
			return (input: any) => {
				validateNumber(input);
				return input * calFormat.m + calFormat.b;
			};
		case "enum":
			const map = calFormat.options.reduce((obj, curr) => {
				return { ...obj, [curr.value]: curr.name };
			}, {} as any);
			return (input: any) => {
				validateNumber(input);
				if (!(input in map))
					throw new Error(
						`Value "${input}" doesn't exist on calibration "${calFormat.name}"`
					);
				return map[input];
			};
		default:
			throw new Error(
				`Calibration '${(calFormat as any).name} type "${
					(calFormat as any).type
				}" isn't supported`
			);
	}
}

export function getCalibrationEncoder(
	calFormat: calibrationFormat
): (input: any) => any {
	switch (calFormat.type) {
		case "linear":
			return (input: any) => {
				if (typeof input !== "number")
					throw new Error(
						`Can't perform linear calibration on type "${typeof input}" - should be a number`
					);
				return (input - calFormat.b) / calFormat.m;
			};
		case "enum":
			const map = calFormat.options.reduce((obj, curr) => {
				return { ...obj, [curr.name]: curr.value };
			}, {} as any);
			return (input: any) => {
				if (typeof input !== "string")
					throw new Error(
						`Can't perform enum calibration on type "${typeof input}" - should be a string`
					);
				if (!(input in map))
					throw new Error(
						`Value "${input}" doesn't exist on calibration "${calFormat.name}"`
					);
				return map[input];
			};
		default:
			throw new Error(
				`Calibration '${(calFormat as any).name} type "${
					(calFormat as any).type
				}" isn't supported`
			);
	}
}

export function getRangeParser(format: paramFormat): (input: string) => any {
	switch (format.type) {
		case "byte":
		case "int16":
		case "uint16":
		case "int32":
		case "uint32":
		case "float":
		case "double":
			return (input) => {
				if (typeof input !== "number")
					throw new Error(
						`Param "${format.name}": range isn't compatibale with type (number)`
					);
				return input;
			};
		case "datetime":
			return (input) => {
				const date = dayjs(input, "DD/MM/YYYY HH:mm:ss").toDate();
				if (isNaN(date.getTime()))
					throw new Error(
						`Param "${format.name}": range isn't compatibale with type (date, format: DD/MM/YYYY HH:mm:ss)`
					);
				return date;
			};
		default:
			throw new Error(
				`Param "${format.name}": type ${format.type} can't have range`
			);
	}
}

export function getTypeRange(type: string): range | undefined {
	switch (type) {
		case "byte":
			return {
				min: 0,
				max: 255,
			};
		case "int16":
			return {
				min: -32768,
				max: 32767,
			};
		case "uint16":
			return {
				min: 0,
				max: 65535,
			};
		case "int32":
			return {
				min: -2147483648,
				max: 2147483647,
			};
		case "uint32":
			return {
				min: 0,
				max: 4294967295,
			};
		case "datetime":
			return {
				min: new Date(0),
			};
		case "float":
			return {
				min: -3.40282347e38,
				max: 3.40282347e38,
			};
		case "double":
			return {
				min: -1.7976931348623157e308,
				max: 1.7976931348623157e308,
			};
		default:
			return undefined;
	}
}

export function getTypeClientName(type: string): clientParamType {
	switch (type) {
		case "byte":
		case "int16":
		case "uint16":
		case "int32":
		case "uint32":
			return "int";
		case "datetime":
			return "datetime";
		case "float":
		case "double":
			return "float";
		case "bitmap":
			return "bitmap";
		case "buffer":
			return "buffer";
		default:
			throw new Error(`Type "${type}" isn't supported in MIB`);
	}
}
