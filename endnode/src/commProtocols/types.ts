export type commProtocolPacket = {
	data: Buffer;
	[key: string]: any;
};

export interface commProtocol {
	decode: (encoded: Buffer) => commProtocolPacket;
	encode: (decoded: any) => Buffer;
}
