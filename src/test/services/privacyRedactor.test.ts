/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PrivacyRedactor } from '../../services/privacyRedactor';

suite('PrivacyRedactor Tests', () => {
	test('redacts longest local paths before their parent paths', () => {
		const redactor = new PrivacyRedactor({
			homeDir: '/Users/alice',
			workspacePath: '/Users/alice/Documents/secret-project',
		});
		const output = redactor.redact('/Users/alice/Documents/secret-project/main.json /Users/alice/.tool');
		assert.strictEqual(output, '<workspace>/main.json <home>/.tool');
	});

	test('redacts bearer, GitHub and environment-shaped secrets', () => {
		const redactor = new PrivacyRedactor();
		const githubToken = `ghp_${'A'.repeat(36)}`;
		const output = redactor.redact(`Bearer ${githubToken} API_KEY=super-secret-value-that-is-long`);
		assert.ok(!output.includes(githubToken));
		assert.ok(!output.includes('super-secret-value'));
		assert.ok(output.includes('<token>'));
	});
});
