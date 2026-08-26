/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Feedback security contract', () => {
	const root = path.resolve(__dirname, '../../..');

	test('never sends the reporter secret to the Webview or logs free-text fields', () => {
		const panel = fs.readFileSync(path.join(root, 'src/webview/feedbackPanel.ts'), 'utf8');
		assert.ok(!/postMessage\([^)]*(?:reporterSecret|secret\s*:)/s.test(panel));
		for (const forbidden of [
			"log('[feedback] submission accepted', 'info', { feedback",
			"log('[feedback] operation failed', 'warn', { error",
			"log('[feedback] submission failed', 'warn', { error",
		]) {
			assert.ok(!panel.includes(forbidden), forbidden);
		}
	});

	test('keeps Webview networking disabled and renders dynamic data with textContent', () => {
		const panel = fs.readFileSync(path.join(root, 'src/webview/feedbackPanel.ts'), 'utf8');
		const script = fs.readFileSync(path.join(root, 'media/js/feedback.js'), 'utf8');
		assert.ok(panel.includes("default-src 'none'"));
		assert.ok(!panel.includes('connect-src'));
		assert.ok(script.includes('textContent'));
		assert.ok(!script.includes('innerHTML'));
	});

	test('binds pagination and detail rendering to the latest request identity', () => {
		const panel = fs.readFileSync(path.join(root, 'src/webview/feedbackPanel.ts'), 'utf8');
		const script = fs.readFileSync(path.join(root, 'media/js/feedback.js'), 'utf8');
		assert.ok(panel.includes('cursor: cursor ?? null'));
		assert.ok(panel.includes('cursor: message.cursor'));
		assert.ok(script.includes('if (listRequest) return'));
		assert.ok(script.includes('message.feedback.id !== latestDetailRequestId'));
		assert.ok(script.includes('message.cursor === messageRequest.cursor'));
		assert.ok(script.includes('message.feedbackId !== messageRequest.feedbackId'));
	});
});
