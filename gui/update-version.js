const dayjs = require("dayjs");
const prettier = require("prettier");
const fs = require("fs");

const package = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

let newVersion = dayjs().format("YY.M.D").slice(1);

const nums = package.version.split(/[.-]/);
if (nums.slice(0, 3).join(".") == newVersion) {
	if (nums.length > 3) {
		const lastNum = parseInt(nums[nums.length - 1]) + 1;
		newVersion = newVersion + "-" + lastNum;
	} else {
		newVersion = newVersion + "-1";
	}
}

package.version = newVersion;
const json = JSON.stringify(package);

prettier.resolveConfig("./package.json").then((options) => {
	const formatted = prettier.format(json, { ...options, parser: "json" });
	fs.writeFileSync("./package.json", formatted, "utf-8");
});
