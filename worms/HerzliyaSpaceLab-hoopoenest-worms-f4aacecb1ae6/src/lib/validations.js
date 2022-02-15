import config from "./config";
import dayjs from "dayjs";

export function validateParam(param, arr) {
	arr = filterItemArr(param, arr);
	const errorArr = [];
	const nameVal = validateName(param, arr);
	if (nameVal) errorArr.push(nameVal);
	const rangeVal = validateParamRange(param);
	if (rangeVal) errorArr.push(`Range for param "${param.name}": ${rangeVal}`);
	return errorArr;
}

export function validateCategory(cat, arr) {
	arr = filterItemArr(cat, arr);
	const errorArr = [];
	const nameVal = validateName(cat, arr);
	if (nameVal) errorArr.push(nameVal);
	const idVal = validateID(cat, arr);
	if (idVal) errorArr.push(`ID "${cat.id}": ${idVal}`);
	return errorArr;
}

export function validateCalibration(cal, arr) {
	if (cal.type === "linear") return validateLinearCal(cal, arr);
	else return validateEnumCal(cal, arr);
}

function validateLinearCal(cal, arr) {
	arr = filterItemArr(cal, arr);
	const errorArr = [];
	const nameVal = validateName(cal, arr);
	if (nameVal) errorArr.push(nameVal);
	const floatRegEx = /^[+-]?([0-9]+[.])?[0-9]+$/;
	if (!floatRegEx.test(cal.m) || !floatRegEx.test(cal.b))
		errorArr.push(`All calibraion options must be numbers`);
	return errorArr;
}

function validateEnumCal(cal, arr) {
	arr = filterItemArr(cal, arr);
	const errorArr = [];
	const nameVal = validateName(cal, arr);
	if (nameVal) errorArr.push(nameVal);
	for (const option of cal.options) {
		errorArr.push(...validateEnumOption(option, cal.options));
	}
	return errorArr;
}

function validateEnumOption(option, arr) {
	arr = filterItemArr(option, arr);
	const nameVal = validateName(option, arr);
	const errorArr = [];
	if (nameVal) errorArr.push(`Option ${nameVal}`);
	const valueVal = validateEnumValue(option, arr);
	if (valueVal) errorArr.push(`Value "${option.value}": ${valueVal}`);
	return errorArr;
}

function validateEnumValue(item, arr) {
	const value = item.value;
	if (!/^\d+$/.test(value)) return "must be an integer";
	if (value < 0 || value > 255) return "must be between 0 and 255";
	for (let i = 0; i < arr.length; i++) {
		const elem = arr[i];
		if (elem.value === value) {
			return "is already taken";
		}
	}
	return "";
}

function filterItemArr(item, arr) {
	return arr.filter((i) => i !== item);
}

export function validateName(item, arr) {
	const name = item.name;
	const nameValidRegex = /^[ -~]{2,}$/;
	if (!nameValidRegex.test(name))
		return `Name: ${name} must be longer than 2 ASCII characters`;
	for (let i = 0; i < arr.length; i++) {
		const elem = arr[i];
		if (elem.name === name) {
			return `Name: ${name} is already taken`;
		}
	}
	return "";
}

function validateID(item, arr) {
	const id = item.id;
	if (!/^\d+$/.test(id)) return "must be an integer";
	if (id < 0 || id > 255) return "must be between 0 and 255";
	for (let i = 0; i < arr.length; i++) {
		const elem = arr[i];
		if (elem.id === id) {
			return "is already taken";
		}
	}
	return "";
}

export function validateRange(start, end, min, max) {
	if (end != undefined && start != undefined && end < start)
		return "range start must be lower than end";
	if (start != undefined && (start > max || start < min))
		return "range must be inside type limits";
	if (end != undefined && (end > max || end < min))
		return "range must be inside type limits";
	return "";
}

function validateParamRange(param) {
	if (param.type === "datetime") return validateDateParam(param);
	const start = param.range?.min;
	const end = param.range?.max;
	const { min, max } = getParamPossibleRange(param);
	return validateRange(start, end, min, max);
}

function validateDateParam(param) {
	const start = dayjs(param.range?.min);
	const end = dayjs(param.range?.max);
	const min = dayjs(getParamPossibleRange(param).min, "DD/MM/YYYY HH:mm:ss");

	if (param.range?.min && start.isBefore(min))
		return "range must be inside type limits";
	if (param.range?.max && end.isBefore(min))
		return "range must be inside type limits";
	if (param.range?.min && param.range?.max && end.isBefore(start))
		return "range start must be lower than end";
	return "";
}

function getParamPossibleRange(param) {
	const type = config.types[param.type];
	if (type.min !== undefined || type.max !== undefined) {
		return {
			min: type.min,
			max: type.max,
		};
	}
	return {
		min: -Infinity,
		max: Infinity,
	};
}

function getParamSize(param) {
	const type = param.type;
	if (type === "buffer") return param.size;
	return config.types[type].size;
}

function validatePacketSize(packet, maxSize) {
	let size = 0;
	if (packet.params) {
		for (const param of packet.params) {
			size += getParamSize(param);
		}
		if (size > maxSize)
			return `${packet.name} packet size (${size} bytes) exceeded the maximum of ${maxSize}`;
	}

	return "";
}

function validatePacketsSizesPart(part, maxSize) {
	const errs = [];
	part.serviceTypes.forEach((st) => {
		st.serviceSubTypes.forEach((sst) => {
			const err = validatePacketSize(sst, maxSize);
			if (err !== "") {
				errs.push(err);
			}
		});
	});
	return errs;
}

function validatePacketSizes(data) {
	const telemetryMaxSize = config.telemetryPacketMaxLength;
	const commandMaxSize = config.telecommandPacketMaxLength;
	const errs = [
		...validatePacketsSizesPart(data.telemetry, telemetryMaxSize),
		...validatePacketsSizesPart(data.telecommands, commandMaxSize),
	];
	return errs;
}

function validateUnits(data, units) {
	return [
		...validatePartUnits(data.telemetry, units, "telemetry"),
		...validatePartUnits(data.telecommands, units, "telecommands"),
	];
}

function validatePartUnits(part, units, partName) {
	const errs = [];
	for (const st of part.serviceTypes) {
		for (const sst of st.serviceSubTypes) {
			if (sst.params) {
				for (const param of sst.params) {
					const unit = param.unit;
					if (unit != undefined && !units.has(unit)) {
						errs.push(
							`Param: ${param.name}'s (${partName}, Category: ${st.name}, Packet: ${sst.name}) unit: '${unit}' does not exist in units list`
						);
					}
				}
			}
		}
	}
	return errs;
}

function validateCalsExist(data) {
	return [
		...validatePartCalsExist(
			data.telemetry,
			data.calibrations,
			"telemetry"
		),
		...validatePartCalsExist(
			data.telecommands,
			data.calibrations,
			"telecommands"
		),
	];
}

function validatePartCalsExist(part, calibrations, partName) {
	const errs = [];
	for (const st of part.serviceTypes) {
		for (const sst of st.serviceSubTypes) {
			if (sst.params) {
				for (const param of sst.params) {
					const cal = param.calibration;
					if (
						cal != undefined &&
						!calibrations.find((c) => c.name === cal)
					) {
						errs.push(
							`Param: ${param.name}'s (${partName}, Category: ${st.name}, Packet: ${sst.name}) calibration does not exist in calibrations list`
						);
					}
					if (param.type === "bitmap") {
						for (const bitfield of param.bitfields) {
							const cal = bitfield.calibration;
							if (
								cal != undefined &&
								!calibrations.find((c) => c.name === cal)
							) {
								errs.push(
									`Bitfield: ${bitfield.name} on Param: ${param.name}'s (${partName}, Category: ${st.name}, Packet: ${sst.name}) calibration does not exist in calibrations list`
								);
							}
						}
					}
				}
			}
		}
	}
	return errs;
}

export function validateOnSave(data, units) {
	return [
		...validateUnits(data, units),
		...validatePacketSizes(data),
		...validateCalsExist(data),
	];
}

module.exports = {
	validatePacketSize,
	getParamPossibleRange,
	validateParamRange,
	validateRange,
	validateID,
	validateName,
	validateCalibration,
	validateCategory,
	validateParam,
	validateOnSave,
};
