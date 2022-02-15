export interface incomingAPIManager {
	connect(): void;
	write(data: Buffer): void;
	close(): void;
}
