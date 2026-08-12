/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILL_ROOT = path.join(ROOT, 'resources', 'project-skills', 'singular-blockly');
const MANIFEST_PATH = path.join(SKILL_ROOT, 'managed-manifest.json');
const CONTRACT_INDEX_SOURCE = 'canonical/references/block-contract.json';
const STATIC_MANAGED_FILES = [
	['canonical/SKILL.md', '.agents/skills/singular-blockly/SKILL.md', 'canonical'],
	[CONTRACT_INDEX_SOURCE, '.agents/skills/singular-blockly/references/block-contract.json', 'reference'],
	['canonical/references/workspace-format.md', '.agents/skills/singular-blockly/references/workspace-format.md', 'reference'],
	['canonical/references/workspace.schema.json', '.agents/skills/singular-blockly/references/workspace.schema.json', 'reference'],
	['compatibility/claude-SKILL.md', '.claude/skills/singular-blockly/SKILL.md', 'compatibility'],
];
const SHARD_PATH_PATTERN = /^block-contract\/[a-z0-9][a-z0-9_-]*\.json$/;

function sha256(filePath) {
	return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function getManagedFiles() {
	const index = JSON.parse(fs.readFileSync(path.join(SKILL_ROOT, CONTRACT_INDEX_SOURCE), 'utf8'));
	if (index.schemaVersion !== 3 || !Array.isArray(index.shards)) {
		throw new Error('Invalid block contract index');
	}
	const shardPaths = index.shards.map(shard => {
		if (
			!shard || typeof shard.category !== 'string' ||
			typeof shard.path !== 'string' ||
			shard.path !== `block-contract/${shard.category}.json` ||
			!Array.isArray(shard.blockTypes) || shard.blockTypes.length === 0
		) {
			throw new Error('Invalid block contract shard descriptor');
		}
		return shard.path;
	});
	if (
		shardPaths.some(shardPath => typeof shardPath !== 'string' || !SHARD_PATH_PATTERN.test(shardPath)) ||
		new Set(shardPaths).size !== shardPaths.length
	) {
		throw new Error('Invalid block contract shard path');
	}
	return [
		...STATIC_MANAGED_FILES,
		...shardPaths.map(shardPath => [
			`canonical/references/${shardPath}`,
			`.agents/skills/singular-blockly/references/${shardPath}`,
			'reference',
		]),
	];
}

function buildManifest() {
	return {
		schemaVersion: 1,
		manager: 'singular-blockly',
		skillVersion: '2.0.0',
		manifestTarget: '.agents/skills/singular-blockly/managed-manifest.json',
		managedFiles: getManagedFiles().map(([source, target, kind]) => ({
			source,
			target,
			sha256: sha256(path.join(SKILL_ROOT, source)),
			kind,
		})),
		preservedFiles: [{
			source: 'canonical/project-notes.md',
			target: '.agents/skills/singular-blockly/project-notes.md',
			policy: 'create-if-missing',
		}],
	};
}

function main() {
	const contents = `${JSON.stringify(buildManifest(), null, 2)}\n`;
	if (process.argv.includes('--check')) {
		if (!fs.existsSync(MANIFEST_PATH) || fs.readFileSync(MANIFEST_PATH, 'utf8') !== contents) {
			console.error('Packaged project Skill manifest is stale.');
			process.exitCode = 1;
			return;
		}
		console.log('Packaged project Skill manifest is current.');
		return;
	}
	const temporary = `${MANIFEST_PATH}.tmp-${process.pid}`;
	try {
		fs.writeFileSync(temporary, contents);
		fs.renameSync(temporary, MANIFEST_PATH);
	} finally {
		if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
	}
	console.log('Generated packaged project Skill manifest.');
}

main();
