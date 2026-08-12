/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_ROOT = path.join(ROOT, 'resources', 'project-skills', 'singular-blockly');

suite('Agent Skill Discovery Contract', () => {
	test('Codex and Claude entries resolve to the same canonical references', () => {
		const canonical = fs.readFileSync(path.join(SKILL_ROOT, 'canonical', 'SKILL.md'), 'utf8');
		const claude = fs.readFileSync(path.join(SKILL_ROOT, 'compatibility', 'claude-SKILL.md'), 'utf8');
		assert.match(canonical, /references\/block-contract\.json/);
		assert.match(canonical, /shards\[\]\.blockTypes/);
		assert.match(claude, /\.agents\/skills\/singular-blockly\/SKILL\.md/);
		const manifest = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'managed-manifest.json'), 'utf8'));
		const references = ['block-contract.json', 'workspace.schema.json', 'workspace-format.md'];
		for (const name of references) {
			const bytes = fs.readFileSync(path.join(SKILL_ROOT, 'canonical', 'references', name));
			const hash = createHash('sha256').update(bytes).digest('hex');
			const managed = manifest.managedFiles.find((file: any) => file.source.endsWith(name));
			assert.strictEqual(managed?.sha256, hash, `${name} hash must be shared by both discovery entries`);
		}

		const index = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'canonical', 'references', 'block-contract.json'), 'utf8'));
		for (const shard of index.shards) {
			const source = `canonical/references/${shard.path}`;
			const bytes = fs.readFileSync(path.join(SKILL_ROOT, ...source.split('/')));
			const managed = manifest.managedFiles.find((file: any) => file.source === source);
			assert.strictEqual(managed?.sha256, createHash('sha256').update(bytes).digest('hex'), `${shard.path} must be managed`);
		}
	});
});
