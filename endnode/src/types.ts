export type config = {
	name: string;
	serverURL: string;
	commProtocols: string[];
	callsign: string;
	ssid: number;
	groundArrays: {
		uplink: { port: number; address: string };
		downlink: { port: number; address: string };
	};
};
