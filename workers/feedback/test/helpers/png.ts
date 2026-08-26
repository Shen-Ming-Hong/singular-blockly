const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let value = 0; value < 256; value += 1) {
		let crc = value;
		for (let bit = 0; bit < 8; bit += 1) {crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);}
		table[value] = crc >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);}
	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const result = new Uint8Array(data.byteLength + 12);
	const view = new DataView(result.buffer);
	view.setUint32(0, data.byteLength);
	result.set(typeBytes, 4);
	result.set(data, 8);
	view.setUint32(8 + data.byteLength, crc32(result.subarray(4, 8 + data.byteLength)));
	return result;
}

export async function png(width: number, height: number, metadata = false): Promise<ArrayBuffer> {
	const ihdr = new Uint8Array(13);
	const ihdrView = new DataView(ihdr.buffer);
	ihdrView.setUint32(0, width);
	ihdrView.setUint32(4, height);
	ihdr.set([8, 6, 0, 0, 0], 8);
	const raw = new Uint8Array((width * 4 + 1) * height);
	const compressed = new Uint8Array(await new Response(
		new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'))
	).arrayBuffer());
	const chunks = [
		chunk('IHDR', ihdr),
		...(metadata ? [chunk('tEXt', new TextEncoder().encode('Author\0Alice'))] : []),
		chunk('IDAT', compressed),
		chunk('IEND', new Uint8Array()),
	];
	const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	const result = new Uint8Array(signature.byteLength + chunks.reduce((sum, item) => sum + item.byteLength, 0));
	result.set(signature);
	let offset = signature.byteLength;
	for (const item of chunks) {result.set(item, offset); offset += item.byteLength;}
	return result.buffer;
}
