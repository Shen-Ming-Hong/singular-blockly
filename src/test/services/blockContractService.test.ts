/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BlockContractService } from '../../services/blockContractService';

suite('BlockContractService Tests', () => {
	let tempDir: string;
	const referencesRelative = path.join('project-skills', 'singular-blockly', 'canonical', 'references');
	const shardRelative = 'block-contract/logic.json';
	const validBlock = {
		type: 'controls_if', categories: ['logic'], boards: ['uno'],
		variants: {
			uno: {
				connections: {
					previous: { enabled: true, check: null }, next: { enabled: true, check: null }, output: { enabled: false, check: null },
				},
				inputs: [], fields: [], minimalState: { type: 'controls_if' },
			},
		},
	};
	const validIndex = {
		schemaVersion: 3,
		blocklyVersion: '13.2.1',
		boards: [{ id: 'uno', language: 'arduino', toolbox: 'index' }],
		shards: [{ category: 'logic', path: shardRelative, blockTypes: ['controls_if'] }],
	};
	const validShard = { schemaVersion: 3, category: 'logic', blocks: [validBlock] };

	setup(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-contract-'));
	});

	teardown(() => fs.rmSync(tempDir, { recursive: true, force: true }));

	function writeJson(filePath: string, value: unknown): Buffer {
		const bytes = Buffer.from(JSON.stringify(value));
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, bytes);
		return bytes;
	}

	function writeContract(base: 'resources' | 'dist', index = validIndex, shard = validShard): string {
		const referencesRoot = path.join(tempDir, base, referencesRelative);
		writeJson(path.join(referencesRoot, 'block-contract.json'), index);
		writeJson(path.join(referencesRoot, ...shardRelative.split('/')), shard);
		return referencesRoot;
	}

	function expectedHash(referencesRoot: string): string {
		const indexBytes = fs.readFileSync(path.join(referencesRoot, 'block-contract.json'));
		const shardBytes = fs.readFileSync(path.join(referencesRoot, ...shardRelative.split('/')));
		return createHash('sha256')
			.update('block-contract.json\0')
			.update(indexBytes)
			.update(`\0${shardRelative}\0`)
			.update(shardBytes)
			.digest('hex');
	}

	test('development and packaged shards load as one cached contract hash', () => {
		const developmentRoot = writeContract('resources');
		const service = new BlockContractService(tempDir);
		const development = service.load();
		assert.strictEqual(development.sha256, expectedHash(developmentRoot));
		assert.strictEqual(service.load(), development, 'subsequent reads should use the validated cache');
		assert.strictEqual(service.getBlock('controls_if')?.type, 'controls_if');
		assert.strictEqual(service.getBlock('missing'), undefined);

		fs.rmSync(path.join(tempDir, 'resources'), { recursive: true, force: true });
		const packagedRoot = writeContract('dist');
		const packaged = new BlockContractService(tempDir).load();
		assert.strictEqual(packaged.sha256, expectedHash(packagedRoot));
		assert.strictEqual(packaged.sha256, development.sha256);
	});

	test('development resources take precedence over stale packaged output', () => {
		writeContract('resources');
		const packagedRoot = writeContract('dist');
		writeJson(path.join(packagedRoot, 'block-contract.json'), { ...validIndex, schemaVersion: 2 });
		assert.strictEqual(new BlockContractService(tempDir).load().contract.blocks[0].type, 'controls_if');
	});

	test('missing index and shard have stable error codes', () => {
		assert.throws(() => new BlockContractService(tempDir).load(), /BLOCK_CONTRACT_MISSING/);
		const referencesRoot = writeContract('resources');
		fs.unlinkSync(path.join(referencesRoot, ...shardRelative.split('/')));
		assert.throws(() => new BlockContractService(tempDir).load(), /BLOCK_CONTRACT_SHARD_MISSING/);
	});

	test('invalid JSON in the index or a shard is rejected', () => {
		const referencesRoot = writeContract('resources');
		fs.writeFileSync(path.join(referencesRoot, 'block-contract.json'), '{');
		assert.throws(() => new BlockContractService(tempDir).load(), /BLOCK_CONTRACT_INVALID_JSON/);
		writeJson(path.join(referencesRoot, 'block-contract.json'), validIndex);
		fs.writeFileSync(path.join(referencesRoot, ...shardRelative.split('/')), '{');
		assert.throws(() => new BlockContractService(tempDir).load(), /BLOCK_CONTRACT_INVALID_JSON/);
	});

	test('rejects malformed indexes and unsafe shard paths', () => {
		const cases: unknown[] = [
			null,
			{ ...validIndex, schemaVersion: 2 },
			{ ...validIndex, boards: [] },
			{ ...validIndex, boards: null },
			{ ...validIndex, boards: [...validIndex.boards, validIndex.boards[0]] },
			{ ...validIndex, shards: null },
			{ ...validIndex, shards: [] },
			{ ...validIndex, shards: [{ ...validIndex.shards[0], path: '../outside.json' }] },
			{ ...validIndex, shards: [{ ...validIndex.shards[0], category: 'other' }] },
			{ ...validIndex, shards: [{ ...validIndex.shards[0], blockTypes: [] }] },
				{ ...validIndex, shards: [{ ...validIndex.shards[0], blockTypes: [1, 2] }] },
				{ ...validIndex, shards: [{ ...validIndex.shards[0], blockTypes: ['z', 'a'] }] },
				{ ...validIndex, shards: [...validIndex.shards, validIndex.shards[0]] },
				{
					...validIndex,
					shards: [
						validIndex.shards[0],
						{ category: 'loops', path: 'block-contract/loops.json', blockTypes: ['controls_if'] },
					],
				},
			];
		for (const [index, candidate] of cases.entries()) {
			const caseRoot = path.join(tempDir, String(index));
			const referencesRoot = path.join(caseRoot, 'resources', referencesRelative);
			writeJson(path.join(referencesRoot, 'block-contract.json'), candidate);
			assert.throws(() => new BlockContractService(caseRoot).load(), /BLOCK_CONTRACT_INVALID_SCHEMA/);
		}
	});

	test('rejects malformed shard metadata and block boundaries', () => {
		const cases: unknown[] = [
			null,
			{ ...validShard, schemaVersion: 2 },
			{ ...validShard, category: 'other' },
			{ ...validShard, blocks: null },
			{ ...validShard, blocks: [] },
			{ ...validShard, blocks: [{ ...validBlock, type: 'other' }] },
			{ ...validShard, blocks: [{ ...validBlock, categories: ['logic', 'loops'] }] },
			{ ...validShard, blocks: [{ ...validBlock, categories: [null, null] }] },
			{ ...validShard, blocks: [{ ...validBlock, boards: [] }] },
			{ ...validShard, blocks: [{ ...validBlock, boards: ['uno', 'uno'] }] },
			{ ...validShard, blocks: [{ ...validBlock, boards: ['missing-board'] }] },
			{ ...validShard, blocks: [{ ...validBlock, variants: {} }] },
			{ ...validShard, blocks: [{ ...validBlock, variants: { uno: { ...validBlock.variants.uno, connections: null } } }] },
			{ ...validShard, blocks: [{ ...validBlock, variants: { uno: { ...validBlock.variants.uno, minimalState: { type: 'other' } } } }] },
			{
				...validShard,
				blocks: [{
					...validBlock,
					variants: {
						uno: {
							...validBlock.variants.uno,
							fields: [{ name: 'MODE', kind: 'field_dropdown', optionsMode: 'unknown' }],
						},
					},
				}],
			},
		];
		for (const [index, candidate] of cases.entries()) {
			const caseRoot = path.join(tempDir, `shard-${index}`);
			const referencesRoot = path.join(caseRoot, 'resources', referencesRelative);
			writeJson(path.join(referencesRoot, 'block-contract.json'), validIndex);
			writeJson(path.join(referencesRoot, ...shardRelative.split('/')), candidate);
			assert.throws(() => new BlockContractService(caseRoot).load(), /BLOCK_CONTRACT_INVALID_SCHEMA/);
		}
	});

	test('shared shards only accept blocks that belong to multiple categories', () => {
		const sharedIndex = {
			...validIndex,
			shards: [{ category: 'shared', path: 'block-contract/shared.json', blockTypes: ['controls_if'] }],
		};
		const sharedShard = {
			...validShard,
			category: 'shared',
			blocks: [{ ...validBlock, categories: ['logic', 'loops'] }],
		};
		writeContract('resources', sharedIndex, sharedShard);
		const referencesRoot = path.join(tempDir, 'resources', referencesRelative);
		fs.renameSync(
			path.join(referencesRoot, ...shardRelative.split('/')),
			path.join(referencesRoot, 'block-contract', 'shared.json')
		);
		assert.strictEqual(new BlockContractService(tempDir).load().contract.blocks[0].categories.length, 2);
	});
});
