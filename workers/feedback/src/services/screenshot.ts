import { decode as decodeJpeg } from 'jpeg-js';

const SCREENSHOT_BYTES_MAX = 3 * 1024 * 1024;
const SCREENSHOT_DIMENSION_MAX = 1920;

export interface ValidatedScreenshot {
	bytes: ArrayBuffer;
	mediaType: 'image/png' | 'image/jpeg';
	width: number;
	height: number;
	sha256: string;
	objectKey: string;
}

interface Dimensions {
	width: number;
	height: number;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
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

function pngChannels(colorType: number, bitDepth: number): number | undefined {
	const validDepths: Readonly<Record<number, readonly number[]>> = {
		0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16],
	};
	if (!validDepths[colorType]?.includes(bitDepth)) {return undefined;}
	return ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colorType];
}

async function validateDeflate(data: Uint8Array, expectedBytes: number, rowBytes: number): Promise<boolean> {
	let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
	try {
		reader = new Blob([Uint8Array.from(data).buffer]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();
		let total = 0;
		let rowOffset = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) {break;}
			for (const byte of value) {
				if (rowOffset === 0 && byte > 4) {return false;}
				rowOffset = (rowOffset + 1) % (rowBytes + 1);
			}
			total += value.byteLength;
			if (total > expectedBytes) {return false;}
		}
		return total === expectedBytes && rowOffset === 0;
	} catch {
		return false;
	} finally {
		await reader?.cancel().catch(() => undefined);
	}
}

async function pngDimensions(bytes: Uint8Array): Promise<Dimensions | undefined> {
	if (bytes.length < 57 || !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) {return undefined;}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const decoder = new TextDecoder('ascii', { fatal: true });
	let offset = 8;
	let dimensions: Dimensions | undefined;
	let bitDepth = 0;
	let channels = 0;
	let sawIdat = false;
	let idatEnded = false;
	const idat: Uint8Array[] = [];
	while (offset + 12 <= bytes.length) {
		const length = view.getUint32(offset);
		const chunkEnd = offset + 12 + length;
		if (length > SCREENSHOT_BYTES_MAX || chunkEnd > bytes.length) {return undefined;}
		const typeBytes = bytes.subarray(offset + 4, offset + 8);
		let type: string;
		try {type = decoder.decode(typeBytes);} catch {return undefined;}
		if (!/^[A-Za-z]{4}$/.test(type) || (typeBytes[2] & 0x20) !== 0) {return undefined;}
		if (crc32(bytes.subarray(offset + 4, offset + 8 + length)) !== view.getUint32(offset + 8 + length)) {
			return undefined;
		}
		const data = bytes.subarray(offset + 8, offset + 8 + length);
		if (!dimensions) {
			if (type !== 'IHDR' || length !== 13) {return undefined;}
			const width = view.getUint32(offset + 8);
			const height = view.getUint32(offset + 12);
			bitDepth = data[8];
			channels = pngChannels(data[9], bitDepth) ?? 0;
			if (!width || !height || !channels || data[10] !== 0 || data[11] !== 0 || data[12] !== 0) {return undefined;}
			dimensions = { width, height };
		} else if (type === 'IDAT') {
			if (idatEnded || length === 0) {return undefined;}
			sawIdat = true;
			idat.push(data);
		} else if (type === 'IEND') {
			if (!sawIdat || length !== 0 || chunkEnd !== bytes.length || !dimensions) {return undefined;}
			if (dimensions.width > SCREENSHOT_DIMENSION_MAX || dimensions.height > SCREENSHOT_DIMENSION_MAX) {
				return dimensions;
			}
			const rowBytes = Math.ceil(dimensions.width * channels * bitDepth / 8);
			const compressed = new Uint8Array(idat.reduce((sum, chunk) => sum + chunk.byteLength, 0));
			let cursor = 0;
			for (const chunk of idat) {compressed.set(chunk, cursor); cursor += chunk.byteLength;}
			return await validateDeflate(compressed, (rowBytes + 1) * dimensions.height, rowBytes)
				? dimensions
				: undefined;
		} else {
			if (sawIdat) {idatEnded = true;}
			// A freshly re-encoded screenshot needs no ancillary metadata.
			return undefined;
		}
		offset = chunkEnd;
	}
	return undefined;
}

function isStartOfFrame(marker: number): boolean {
	return (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
		|| (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
}

function jpegDimensions(bytes: Uint8Array): Dimensions | undefined {
	if (bytes.length < 10 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {return undefined;}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let offset = 2;
	let dimensions: Dimensions | undefined;
	let sawScan = false;
	while (offset < bytes.length) {
		if (bytes[offset] !== 0xff) {return undefined;}
		while (offset < bytes.length && bytes[offset] === 0xff) {offset += 1;}
		if (offset >= bytes.length) {return undefined;}
		const marker = bytes[offset++];
		if (marker === 0xd9) {return sawScan && dimensions && offset === bytes.length ? dimensions : undefined;}
		if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {continue;}
		if (offset + 2 > bytes.length) {return undefined;}
		const length = view.getUint16(offset);
		if (length < 2 || offset + length > bytes.length) {return undefined;}
		if (marker === 0xfe || (marker >= 0xe1 && marker <= 0xef && marker !== 0xee)) {return undefined;}
		if (isStartOfFrame(marker)) {
			if (length < 8) {return undefined;}
			dimensions = { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
			if (!dimensions.width || !dimensions.height) {return undefined;}
		}
		offset += length;
		if (marker !== 0xda) {continue;}
		sawScan = true;
		while (offset < bytes.length) {
			if (bytes[offset] !== 0xff) {offset += 1; continue;}
			if (offset + 1 >= bytes.length) {return undefined;}
			const escaped = bytes[offset + 1];
			if (escaped === 0x00 || (escaped >= 0xd0 && escaped <= 0xd7)) {offset += 2; continue;}
			break;
		}
	}
	return undefined;
}

function decodedJpegDimensions(bytes: Uint8Array): Dimensions | undefined {
	const declared = jpegDimensions(bytes);
	if (!declared) {return undefined;}
	if (declared.width > SCREENSHOT_DIMENSION_MAX || declared.height > SCREENSHOT_DIMENSION_MAX) {
		return declared;
	}
	try {
		const decoded = decodeJpeg(bytes, {
			useTArray: true,
			formatAsRGBA: false,
			tolerantDecoding: false,
			maxResolutionInMP: 4,
			maxMemoryUsageInMB: 64,
		});
		return decoded.width === declared.width && decoded.height === declared.height
			? declared
			: undefined;
	} catch {
		return undefined;
	}
}

function hex(bytes: Uint8Array): string {
	return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function validateScreenshot(file: File): Promise<ValidatedScreenshot> {
	if (file.size < 16 || file.size > SCREENSHOT_BYTES_MAX) {throw new Error('invalid_attachment_size');}
	if (file.type !== 'image/png' && file.type !== 'image/jpeg') {throw new Error('invalid_attachment_type');}
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	const dimensions = file.type === 'image/png' ? await pngDimensions(bytes) : decodedJpegDimensions(bytes);
	if (!dimensions) {throw new Error('invalid_attachment_format');}
	if (dimensions.width < 1 || dimensions.height < 1
		|| dimensions.width > SCREENSHOT_DIMENSION_MAX || dimensions.height > SCREENSHOT_DIMENSION_MAX) {
		throw new Error('invalid_attachment_dimensions');
	}
	const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
	return {
		bytes: buffer,
		mediaType: file.type,
		width: dimensions.width,
		height: dimensions.height,
		sha256: hex(digest),
		objectKey: hex(crypto.getRandomValues(new Uint8Array(16))),
	};
}
