const { getParamPossibleRange } = require("./validations");

module.exports = function preParsing(data) {
	deleteCalIds(data.calibrations);
	sortDataById(data);
	return data;
};

function deleteCalIds(cals) {
	for (const cal of cals) {
		delete cal.id;
	}
}

function fixMissingRanges(data) {
	data.telemetry = fixPartMissingRanges(data.telemetry);
	data.telecommands = fixPartMissingRanges(data.telecommands);
	return data;
}

function fixPartMissingRanges(part) {
	part.serviceTypes.forEach((st) => {
		st.serviceSubTypes.forEach((sst) => {
			if (sst.params) {
				sst.params.forEach((p) => {
					p = addParamMissingRanges(p);
				});
			}
		});
	});
	return part;
}

function addParamMissingRanges(param) {
	const { min, max } = getParamPossibleRange(param);
	if (param.range?.min != undefined && param.range?.max == undefined) {
		param.range.max = max;
	}
	if (param.range?.min == undefined && param.range?.max != undefined) {
		param.range.min = min;
	}
	return param;
}

function parseCalibrationUUIDs(data) {
	data.telemetry = parsePartCalibrationUUIDs(data.telemetry);
	data.telecommands = parsePartCalibrationUUIDs(data.telecommands);
	return data;
}

function parsePartCalibrationUUIDs(part) {
	const start = findBiggestID(part.calibrations) + 1;
	const convMap = getUUIDConvertionMap(part.calibrations, start);
	part = convertPartCalUUIDs(part, convMap);
	part.calibrations = parsePartCalsIDs(part.calibrations, convMap);
	return part;
}

function convertPartCalUUIDs(part, convertionMap) {
	part.serviceTypes.forEach((st) => {
		st.serviceSubTypes.forEach((sst) => {
			if (sst.params) {
				sst.params.forEach((param) => {
					if (typeof param.calibration === "string") {
						param.calibration = convertionMap[param.calibration];
					}
					if (param.bitfields) {
						param.bitfields.forEach((bitfield) => {
							if (typeof bitfield.calibration === "string") {
								bitfield.calibration =
									convertionMap[bitfield.calibration];
							}
						});
					}
				});
			}
		});
	});
	return part;
}

function parsePartCalsIDs(cals, convertionMap) {
	return cals.map((cal) => {
		if (typeof cal.id === "string") {
			cal.id = convertionMap[cal.id];
		}
		return cal;
	});
}

function getUUIDConvertionMap(calibrations, start) {
	let map = {};
	calibrations.forEach((cal) => {
		if (typeof cal.id === "string") {
			map[cal.id] = start;
			start++;
		}
	});
	return map;
}

function findBiggestID(calibrations) {
	let max = -1;
	calibrations.forEach((cal) => {
		if (typeof cal.id === "number" && cal.id > max) max = cal.id;
	});
	return max;
}

function sortDataById(data) {
	sortPartById(data.telemetry);
	sortPartById(data.telecommands);
}

function sortPartById(part) {
	sortById(part.serviceTypes);
	part.serviceTypes.forEach((st) => {
		sortById(st.serviceSubTypes);
	});
}

function sortById(arr) {
	arr.sort((a, b) => a.id - b.id);
}

function clearEmptyParamArrays(data) {}
