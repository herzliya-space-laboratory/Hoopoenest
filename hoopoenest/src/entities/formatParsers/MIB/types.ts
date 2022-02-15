export type mibKey = {
	serviceType: number;
	serviceSubType: number;
};

export type paramType =
	| "byte"
	| "uint16"
	| "int16"
	| "uint32"
	| "int32"
	| "float"
	| "double"
	| "datetime"
	| "buffer"
	| "bitmap";

// MIB format
export type paramFormat = {
	name: string;
	type: paramType;
	isLittleEndian?: boolean;
	unit?: string;
	description?: string;
	calibration?: string;
	size?: number;
	bitfields?: bitfieldFormat[];
	range?: {
		min?: any;
		max?: any;
	};
	subSystem?: string;
};

export type packetFormat = {
	name: string;
	id: number;
	params: paramFormat[];
	description?: string;
};

export type serviceTypeFormat = {
	name: string;
	id: number;
	serviceSubTypes: packetFormat[];
};

export type partFormat = {
	serviceTypes: serviceTypeFormat[];
};

export type settings = {
	isDefaultLittleEndian: boolean;
};

export type bitfieldFormat = {
	name: string;
	isNull: boolean;
	size: number;
	calibration?: string;
};

export type linearCalibrationFormat = {
	name: string;
	type: "linear";
	m: number;
	b: number;
};

export type enumCalibrationFormat = {
	name: string;
	type: "enum";
	options: { name: string; value: number }[];
};

export type calibrationFormat = linearCalibrationFormat | enumCalibrationFormat;

export type mibFormat = {
	settings?: settings;
	telemetry: partFormat;
	telecommands: partFormat;
	calibrations: calibrationFormat[];
};

// MIB options
export type bitfieldOptions = {
	name: string;
	type: "enum" | "int";
	range?: range;
	values?: string[];
};

export type paramOptions = {
	name: string;
	parse: (buffer: Buffer) => any;
	encode: (input: any) => Buffer;
	byteLength: number;
	type: clientParamType;
	unit?: string;
	description?: string;
	range?: range;
	bitfields?: bitfieldOptions[];
};

export type range = {
	min?: any;
	max?: any;
};

export type packetOptions = {
	name: string;
	id: number;
	params: paramOptions[];
	description?: string;
};

export type serviceTypeOptions = {
	name: string;
	id: number;
	serviceSubTypes: { [key: string]: packetOptions };
};

export type partOptions = {
	serviceTypes: { [key: string]: serviceTypeOptions };
};

export type mibOptions = {
	telemetry: partOptions;
	telecommands: partOptions;
};

export type calibrationMap = {
	[key: string]: {
		parse: (input: any) => any;
		encode: (input: any) => any;
		format: calibrationFormat;
	};
};

export type clientParamType =
	| "int"
	| "float"
	| "enum"
	| "bitmap"
	| "datetime"
	| "buffer";
