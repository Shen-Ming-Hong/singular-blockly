/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Feedback screenshot Webview contract', () => {
	const source = fs.readFileSync(path.resolve(__dirname, '../../../media/js/feedback.js'), 'utf8');
	const html = fs.readFileSync(path.resolve(__dirname, '../../../media/html/feedback.html'), 'utf8');

	test('re-encodes through Canvas with fixed dimensions and size limits', () => {
		assert.ok(source.includes('SCREENSHOT_SOURCE_BYTES_MAX'));
		assert.ok(source.includes('sourceImageDimensions(file)'));
		assert.ok(source.includes('SCREENSHOT_SOURCE_PIXELS_MAX'));
		assert.ok(source.includes('createImageBitmap(file)'));
		assert.ok(source.includes('document.createElement(\'canvas\')'));
		assert.ok(source.includes('canvas.toBlob'));
		assert.ok(source.includes('1920'));
		assert.ok(source.includes('3 * 1024 * 1024'));
	});

	test('discards screenshot work superseded by a new selection or removal', () => {
		assert.ok(source.includes('let screenshotGeneration = 0'));
		assert.ok(source.includes('const generation = ++screenshotGeneration'));
		assert.ok(source.includes('generation !== screenshotGeneration'));
	});

	test('provides explicit preview, privacy warning, and removal controls', () => {
		assert.ok(html.includes('id="screenshotPreview"'));
		assert.ok(html.includes('id="removeScreenshotButton"'));
		assert.ok(html.includes('id="screenshotPrivacyWarning"'));
		assert.ok(source.includes('URL.revokeObjectURL'));
	});

	test('does not send browser File metadata to the Extension Host', () => {
		assert.ok(!source.includes('file.name'));
		assert.ok(!source.includes('file.path'));
		assert.ok(!source.includes('file.lastModified'));
		assert.ok(source.includes('bytesBase64'));
	});
});
