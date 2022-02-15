export default function getUnits(json) {
	const telemetryUnits = getUnitsFromPart(json.telemetry);
	const telecommandsUnits = getUnitsFromPart(json.telecommands);
	const units = new Set([...telecommandsUnits, ...telemetryUnits]);
	return units;
}

function getUnitsFromPart(part) {
	const units = new Set();
	part.serviceTypes.forEach((st) => {
		st.serviceSubTypes.forEach((sst) => {
			if (sst.params) {
				sst.params.forEach((param) => {
					if (param.unit) units.add(param.unit);
				});
			}
		});
	});

	return units;
}
