/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { execFileSync } from 'child_process';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');

suite('Agent Skill generator compatibility', () => {
	test('representative Arduino, CyberBrick, and TXT workspaces retain golden output', () => {
		const result = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'verify-agent-skill-generator-output.js')], {
			cwd: ROOT,
			encoding: 'utf8',
		});
		assert.strictEqual(result, 'Agent Skill generator output is current.\n');
	});
});
