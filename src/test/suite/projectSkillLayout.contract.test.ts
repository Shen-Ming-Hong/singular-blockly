/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');
const SKILL_ROOT = path.join(ROOT, 'resources', 'project-skills', 'singular-blockly');

suite('Project Skill Layout Contract', () => {
	test('canonical SKILL.md has exact frontmatter and direct progressive-disclosure references', () => {
		const skill = fs.readFileSync(path.join(SKILL_ROOT, 'canonical', 'SKILL.md'), 'utf8');
		const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
		assert.ok(frontmatter);
		const keys = frontmatter![1].split('\n').map(line => line.split(':')[0]);
		assert.deepStrictEqual(keys, ['name', 'description']);
		assert.match(skill, /name: singular-blockly/);
		for (const reference of ['references/workspace-format.md', 'references/block-contract.json', 'references/workspace.schema.json', 'project-notes.md']) {
			assert.match(skill, new RegExp(reference.replace('.', '\\.')));
		}
		assert.match(skill, /read only the referenced category shard files/i);
		assert.doesNotMatch(skill, /install Node|start MCP|absolute path/i);
	});

	test('Claude entry is a regular wrapper to the canonical Skill', () => {
		const wrapperPath = path.join(SKILL_ROOT, 'compatibility', 'claude-SKILL.md');
		assert.ok(!fs.lstatSync(wrapperPath).isSymbolicLink());
		const wrapper = fs.readFileSync(wrapperPath, 'utf8');
		assert.match(wrapper, /\.\.\/\.\.\/\.\.\/\.agents\/skills\/singular-blockly\/SKILL\.md/);
		assert.doesNotMatch(wrapper, /block-contract\.json|workspace\.schema\.json/);
	});

	test('manifest never hashes itself or grants authority to unknown paths', () => {
		const manifest = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, 'managed-manifest.json'), 'utf8'));
		assert.strictEqual(manifest.manifestTarget, '.agents/skills/singular-blockly/managed-manifest.json');
		assert.ok(!manifest.managedFiles.some((file: any) => file.target === manifest.manifestTarget));
		assert.strictEqual(new Set(manifest.managedFiles.map((file: any) => file.target)).size, manifest.managedFiles.length);
		assert.strictEqual(manifest.skillVersion, '2.0.0');
		assert.ok(manifest.managedFiles.some((file: any) => file.target === '.agents/skills/singular-blockly/references/block-contract/shared.json'));
	});

	test('all packaged human-readable Skill content is English', () => {
		for (const relative of ['canonical/SKILL.md', 'canonical/references/workspace-format.md', 'canonical/project-notes.md', 'compatibility/claude-SKILL.md']) {
			const content = fs.readFileSync(path.join(SKILL_ROOT, relative), 'utf8');
			assert.doesNotMatch(content, /[\u3400-\u9fff\u3040-\u30ff\u0400-\u04ff]/u, relative);
		}
	});
});
