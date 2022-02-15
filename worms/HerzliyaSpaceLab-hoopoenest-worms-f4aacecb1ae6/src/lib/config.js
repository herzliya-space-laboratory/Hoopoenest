export default {
	telemetryPacketMaxLength: 227,
	telecommndPacketMaxLength: 185,
	types: {
		bitmap: {
			size: 1,
		},
		byte: {
			size: 1,
			min: 0,
			max: 255,
		},
		int16: {
			size: 2,
			min: -32768,
			max: 32767,
		},
		uint16: {
			size: 2,
			min: 0,
			max: 65535,
		},
		int32: {
			size: 4,
			min: -2147483648,
			max: 2147483647,
		},
		uint32: {
			size: 4,
			min: 0,
			max: 4294967295,
		},
		datetime: {
			size: 4,
			min: "01/01/1970 00:00:00",
		},
		float: {
			size: 4,
			min: -3.40282347e38,
			max: 3.40282347e38,
		},
		double: {
			size: 8,
			min: -1.7976931348623157e308,
			max: 1.7976931348623157e308,
		},
		buffer: {},
	},
};
