/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { validateSanitizedScreenshot } from '../../services/feedbackScreenshot';

function png(width: number, height: number): string {
	const bytes = Buffer.alloc(24);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
	bytes.write('IHDR', 12, 'ascii');
	bytes.writeUInt32BE(width, 16);
	bytes.writeUInt32BE(height, 20);
	return bytes.toString('base64');
}

suite('FeedbackScreenshot Tests', () => {
	test('accepts canonical PNG bytes whose declared dimensions match magic bytes', () => {
		const screenshot = { mediaType: 'image/png' as const, bytesBase64: png(800, 600), width: 800, height: 600 };
		assert.deepStrictEqual(validateSanitizedScreenshot(screenshot), screenshot);
	});

	test('rejects a media type, dimension, or non-canonical base64 mismatch', () => {
		assert.strictEqual(validateSanitizedScreenshot({
			mediaType: 'image/jpeg', bytesBase64: png(800, 600), width: 800, height: 600,
		}), undefined);
		assert.strictEqual(validateSanitizedScreenshot({
			mediaType: 'image/png', bytesBase64: png(800, 600), width: 801, height: 600,
		}), undefined);
		assert.strictEqual(validateSanitizedScreenshot({
			mediaType: 'image/png', bytesBase64: `${png(800, 600)}\n`, width: 800, height: 600,
		}), undefined);
	});

	test('rejects oversized base64 before decoding it', () => {
		assert.strictEqual(validateSanitizedScreenshot({
			mediaType: 'image/png',
			bytesBase64: 'A'.repeat(4 * 1024 * 1024 + 4),
			width: 1,
			height: 1,
		}), undefined);
	});
});
