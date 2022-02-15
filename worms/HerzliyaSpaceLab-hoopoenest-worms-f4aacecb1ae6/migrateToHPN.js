const { readFileSync, writeFileSync } = require("fs");
const { deepStrictEqual } = require("assert");
const path = require("path");

const filePath = process.argv[2];

const json = JSON.parse(readFileSync(filePath));

function getCalIdsAndNames(cals) {
	const ids = {};
	for (const cal of cals) {
		ids[cal.id] = cal.name;
	}
	return ids;
}

const telemCalIds = getCalIdsAndNames(json.telemetry.calibrations);
const commCalIds = getCalIdsAndNames(json.telecommands.calibrations);

function mergeCals(telemCals, commCals) {
	const cals = [];
	for (let i = 0; i < telemCals.length; i++) {
		const telemCal = telemCals[i];
		const { id, ...noIdTelem } = telemCal;
		let foundEqualName = false;
		for (let j = 0; j < commCals.length; j++) {
			const commCal = commCals[j];
			const { id, ...noIdComm } = commCal;
			try {
				deepStrictEqual(noIdComm, noIdTelem);
				// Insert only one calibration if two are the same
				commCals.splice(j, 1);
				break;
			} catch (err) {
				if (telemCal.name === commCal.name) {
					// Rename if calibrations name clash
					const commCalName = commCal.name + "-telecomands";
					commCals[i].name = commCalName;
					commCalIds[commCal.id] = commCalName;
					foundEqualName = true;
					break;
				}
			}
		}
		if (foundEqualName) {
			const telemCalName = telemCal.name + "-telemetry";
			telemCalIds[telemCal.id] = telemCalName;
			telemCals[i] = telemCalName;
		}
		cals.push(telemCals[i]);
	}
	return cals.concat(commCals);
}

function transformCals(cals) {
	for (const cal of cals) {
		if (cal.type === "polynomial") cal.type = "linear";
		if (cal.type === "options") cal.type = "enum";
		delete cal.id;
	}
	return cals;
}

const cals = mergeCals(
	json.telemetry.calibrations,
	json.telecommands.calibrations
);
console.log(cals);
transformCals(cals);

function transformPart(part, name) {
	for (const st of part.serviceTypes) {
		for (const sst of st.serviceSubTypes) {
			const isBeacon = sst.name.toLowerCase() === "beacon";
			if (sst.params !== undefined) {
				for (const param of sst.params) {
					transfromParam(param, name, isBeacon);
				}
			} else {
				sst.params = [];
			}
		}
	}
}

function transfromParam(param, partName, isBeacon) {
	parseCalIdToName(param, partName);
	if (param.type === "string") param.type = "buffer";
	if (isBeacon) {
		param.subSystem = param.description.split(",")[0];
		param.description = param.description.split(/,(.+)/)[1];
		if (param.description !== undefined)
			param.description = param.description.trim();
	}
	transformRange(param);
	if (param.type === "bitmap") {
		for (const field of param.bitfields) {
			parseCalIdToName(field);
			transformRange(field);
		}
	}
}

function transformRange(item) {
	if (item.rangeStart != null || item.rangeEnd != null) {
		item.range = {
			min: item.rangeStart != null ? item.rangeStart : undefined,
			max: item.rangeEnd != null ? item.rangeEnd : undefined,
		};
		delete item.rangeEnd;
		delete item.rangeStart;
	}
}

function parseCalIdToName(param, partName) {
	if (param.calibration !== undefined) {
		if (partName === "telemetry")
			param.calibration = telemCalIds[param.calibration];
		else param.calibration = commCalIds[param.calibration];
	}
}

transformPart(json.telemetry, "telemetry");
transformPart(json.telecommands, "telecommands");

const newJson = {
	settings: {
		isDefaultLittleEndian: false,
	},
	telemetry: {
		serviceTypes: json.telemetry.serviceTypes,
	},
	telecommands: {
		serviceTypes: json.telecommands.serviceTypes,
	},
	calibrations: cals,
};

const newFilePath = path.resolve(
	path.dirname(filePath),
	`${path.basename(filePath, ".json")}-HPN.json`
);
writeFileSync(newFilePath, JSON.stringify(newJson));

console.log(`HoopoeNest-ready MIB is saved at:\n${newFilePath}`);
