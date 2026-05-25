/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PlatformioPrivacyRedactor } from '../../services/platformioPrivacyRedactor';

suite('PlatformioPrivacyRedactor Tests', () => {
	test('redacts POSIX home and workspace paths while preserving useful suffixes', () => {
		const redactor = new PlatformioPrivacyRedactor({
			homeDir: '/Users/alice',
			workspacePath: '/Users/alice/Documents/我的專案',
		});

		const output = redactor.redact('pio at /Users/alice/.platformio/penv/bin/pio for /Users/alice/Documents/我的專案/blockly/main.json');

		assert.ok(!output.includes('/Users/alice'), 'Should remove the raw home path');
		assert.ok(!output.includes('我的專案'), 'Should remove the raw workspace folder name');
		assert.ok(output.includes('<home>/.platformio/penv/bin/pio'), 'Should retain path suffix after home masking');
		assert.ok(output.includes('<workspace>/blockly/main.json'), 'Should retain workspace-relative suffix');
	});

	test('redacts Windows user paths with non-ASCII workspace names', () => {
		const redactor = new PlatformioPrivacyRedactor({
			homeDir: 'C:\\Users\\王小明',
			workspacePath: 'C:\\Users\\王小明\\Documents\\積木專案',
		});

		const output = redactor.redact('C:\\Users\\王小明\\Documents\\積木專案\\src\\main.py uses C:\\Users\\王小明\\.platformio\\penv\\Scripts\\python.exe');

		assert.ok(!output.includes('王小明'), 'Should remove Windows username');
		assert.ok(!output.includes('積木專案'), 'Should remove Windows workspace folder name');
		assert.ok(output.includes('<workspace>\\src\\main.py'));
		assert.ok(output.includes('<home>\\.platformio\\penv\\Scripts\\python.exe'));
	});

	test('redacts proxy credentials without removing the proxy host', () => {
		const redactor = new PlatformioPrivacyRedactor();

		const output = redactor.redact('proxy=http://user.name:p@ssw0rd@example.internal:8080 and https://token:secret@proxy.example.com');

		assert.ok(!output.includes('user.name:p@ssw0rd'));
		assert.ok(!output.includes('token:secret'));
		assert.ok(output.includes('http://<redacted>@example.internal:8080'));
		assert.ok(output.includes('https://<redacted>@proxy.example.com'));
	});

	test('redacts token-like secrets', () => {
		const redactor = new PlatformioPrivacyRedactor();
		const token = 'ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD';
		const output = redactor.redact(`Authorization: Bearer ${token}\nPYPI_TOKEN=pypi-AgEIcHlwaS5vcmcCJGFiY2RlZmdoaWprbG1ub3BxcnN0`);

		assert.ok(!output.includes(token));
		assert.ok(!output.includes('pypi-AgEIcHlwaS5vcmcCJGFiY2RlZmdoaWprbG1ub3BxcnN0'));
		assert.ok(output.includes('<token>'));
	});
});
