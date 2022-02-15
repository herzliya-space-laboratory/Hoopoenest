const express = require("express");
const app = express();
const { readFileSync } = require("fs");
const config = JSON.parse(readFileSync("./config.json"));
const path = require("path");
const { mw } = require("request-ip");

const version = require("./package.json").version;

const { port, ...clientConf } = config;
clientConf.version = version;

const static = path.join(__dirname, "public");
app.use(express.static(static));

app.use(mw());

function isReqFromLocalNet(req) {
	const split = req.clientIp.split(":");
	const ip = split[split.length - 1];
	const ipNums = ip.split(".");
	return (
		ip === "127.0.0.1" ||
		ip === "1" ||
		(ipNums[0] === "172" && ipNums[1] === "16") ||
		(ipNums[0] === "192" && ipNums[1] === "168")
	);
}

app.get("/config", (req, res) => {
	if (isReqFromLocalNet(req))
		res.json({
			...clientConf,
			apiUrl: clientConf.localNetApiUrl,
			localNetApiUrl: undefined,
		});
	else
		res.json({
			...clientConf,
			localNetApiUrl: undefined,
		});
});

app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () =>
	console.log(`HoopoeNest-GUI v${version}
Created with love by Amit Goldenberg, in collaboration of Shahar Zyss and Nikita Weil <3
2020 ©\n
Running on port ${port}!\n
=== Activated! ===`)
);
