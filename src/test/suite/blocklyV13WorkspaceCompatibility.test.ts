/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { execFileSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const FIXTURE_ROOT = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'blockly-v13');

function hashFile(filePath: string): string {
	return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

suite('Blockly 13 workspace compatibility', () => {
	test('v12 JSON/XML fixtures 在 v13 load/save round-trip 後保留語意狀態', () => {
		const scriptPath = path.join(PROJECT_ROOT, 'scripts', 'validate-blockly-v13-fixtures.js');
		const output = execFileSync(process.env.npm_node_execpath || 'node', [scriptPath], {
			cwd: PROJECT_ROOT,
			encoding: 'utf8',
		});
		const report = JSON.parse(output);

		assert.match(report.blocklyVersion, /^13\./);
		assert.strictEqual(report.fixtures.length, 4);
		for (const fixture of report.fixtures) {
			assert.ok(fixture.blocks > 0, fixture.id);
			assert.ok(fixture.shadows > 0, fixture.id);
			assert.ok(fixture.lockedBlocks > 0, fixture.id);
			assert.ok(fixture.extraStates > 0, fixture.id);
			assert.ok(fixture.variables > 0, fixture.id);
		}
	});

	test('驗證器不得覆寫舊 XML 備份或任何輸入 fixture', () => {
		const manifest = JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, 'manifest.json'), 'utf8'));
		const inputPaths = manifest.fixtures.map((fixture: any) => path.join(FIXTURE_ROOT, fixture.input));
		const before = new Map(inputPaths.map((filePath: string) => [filePath, hashFile(filePath)]));

		execFileSync(process.env.npm_node_execpath || 'node', [path.join(PROJECT_ROOT, 'scripts', 'validate-blockly-v13-fixtures.js')], {
			cwd: PROJECT_ROOT,
			stdio: 'pipe',
		});

		for (const filePath of inputPaths) {
			assert.strictEqual(hashFile(filePath), before.get(filePath), path.basename(filePath));
		}
	});
});
