/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FEEDBACK_LIMITS, isSanitizedFeedbackScreenshot, type SanitizedFeedbackScreenshot } from '../types/feedback';

const SCREENSHOT_BASE64_LENGTH_MAX = 4 * Math.ceil(FEEDBACK_LIMITS.screenshotBytesMax / 3);

function pngDimensions(bytes: Buffer): { width: number; height: number } | undefined {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (bytes.length < 24 || !bytes.subarray(0, 8).equals(signature) || bytes.toString('ascii', 12, 16) !== 'IHDR') {
		return undefined;
	}
	return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDimensions(bytes: Buffer): { width: number; height: number } | undefined {
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {return undefined;}
	let offset = 2;
	while (offset + 4 <= bytes.length) {
		if (bytes[offset] !== 0xff) {return undefined;}
		const marker = bytes[offset + 1];
		offset += 2;
		if (marker === 0xd9 || marker === 0xda) {break;}
		if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {continue;}
		const length = bytes.readUInt16BE(offset);
		if (length < 2 || offset + length > bytes.length) {return undefined;}
		if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)
			|| (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
			if (length < 7) {return undefined;}
			return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
		}
		offset += length;
	}
	return undefined;
}

export function validateSanitizedScreenshot(value: unknown): SanitizedFeedbackScreenshot | undefined {
	if (!isSanitizedFeedbackScreenshot(value)
		|| value.bytesBase64.length > SCREENSHOT_BASE64_LENGTH_MAX
		|| !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.bytesBase64)) {
		return undefined;
	}
	const bytes = Buffer.from(value.bytesBase64, 'base64');
	if (bytes.length < 4
		|| bytes.length > FEEDBACK_LIMITS.screenshotBytesMax
		|| bytes.toString('base64') !== value.bytesBase64) {
		return undefined;
	}
	const dimensions = value.mediaType === 'image/png' ? pngDimensions(bytes) : jpegDimensions(bytes);
	if (!dimensions || dimensions.width !== value.width || dimensions.height !== value.height) {return undefined;}
	if (dimensions.width > FEEDBACK_LIMITS.screenshotDimensionMax
		|| dimensions.height > FEEDBACK_LIMITS.screenshotDimensionMax) {
		return undefined;
	}
	return { ...value };
}
