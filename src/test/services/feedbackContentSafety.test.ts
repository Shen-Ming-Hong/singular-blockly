/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import {
	containsBlockedFeedbackText,
	feedbackContentSafetyBrowserSource,
	redactFeedbackText,
} from '../../services/feedbackContentSafety';

interface BrowserSafety {
	containsBlockedFeedbackText(value: string): boolean;
	redactFeedbackText(value: string): string;
}

const SAMPLES = [
	'Connection failed at 192.168.1.20',
	'C:\\Users\\Ada Lovelace\\Documents\\Arduino\\blink\\blink.ino:12:5: error',
	'(C:\\Users\\alice\\a.ino), next',
	'\\\\server\\share\\x.txt',
	'/Users/Ada Lovelace/Library/project.py:3: error',
	'path=/home/alice/main.py and ~/project/a.py and ../x/y.py',
	'Host 2001:db8::1 failed at 12:30:45',
	'Ports COM3, /dev/ttyUSB0, /dev/cu.usbserial-1410',
	'Device 550e8400-e29b-41d4-a716-446655440000',
	'Open http://192.168.4.1/update and https://github.com/org/repo/issues/1',
	'Arduino/MicroPython and light/dark mode stay as written.',
	'Calling digitalWrite(LED_BUILTIN, HIGH); and npm ERR! stay as written.',
];

suite('feedbackContentSafety', () => {
	// The portal runs a generated copy of the same rules; it must agree with the
	// Extension Host and Worker so the echoed message body matches.
	const browser = new Function(`${feedbackContentSafetyBrowserSource()}; return { containsBlockedFeedbackText, redactFeedbackText };`)() as BrowserSafety;

	test('browser copy redacts exactly like the shared implementation', () => {
		for (const sample of SAMPLES) {
			assert.strictEqual(browser.redactFeedbackText(sample), redactFeedbackText(sample), sample);
		}
	});

	test('redaction is stable when applied twice', () => {
		for (const sample of SAMPLES) {
			const once = redactFeedbackText(sample);
			assert.strictEqual(redactFeedbackText(once), once, sample);
		}
	});

	test('only credentials are blocked', () => {
		for (const blocked of [`ghp_${'A'.repeat(24)}`, 'API_KEY=abc', '-----BEGIN RSA PRIVATE KEY-----', 'https://u:p@example.com/x']) {
			assert.strictEqual(containsBlockedFeedbackText(blocked), true, blocked);
			assert.strictEqual(browser.containsBlockedFeedbackText(blocked), true, blocked);
		}
		for (const sample of SAMPLES) {
			assert.strictEqual(containsBlockedFeedbackText(sample), false, sample);
			assert.strictEqual(browser.containsBlockedFeedbackText(sample), false, sample);
		}
	});
});
