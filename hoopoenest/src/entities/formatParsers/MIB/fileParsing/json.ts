import fs from "fs";
import { mibFormat } from "../types";

/**
 * @param path Path to the MIB packet JSON format file
 */
export default function parseJSON(path: string): mibFormat {
	try {
		return JSON.parse(fs.readFileSync(path).toString());
	} catch (err) {
		throw new Error(`Error while opening file: ${path}`);
	}
}
