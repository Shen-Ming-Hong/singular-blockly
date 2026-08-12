/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { BlockContractService } from '../../services/blockContractService';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const CONTRACT_PATH = path.join(
	PROJECT_ROOT,
	'resources',
	'project-skills',
	'singular-blockly',
	'canonical',
	'references',
	'block-contract.json'
);

suite('Project Skill Runtime Contract', () => {
	let contract: any;

	setup(() => {
		contract = new BlockContractService(PROJECT_ROOT).load().contract;
	});

	test('tracked contract matches the runtime, toolboxes, and dynamic flyouts', () => {
		const result = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'scripts', 'generate-skill-contract.js'), '--check'], {
			cwd: PROJECT_ROOT,
			encoding: 'utf8',
		});
		assert.strictEqual(result.status, 0, result.stderr || result.stdout);
	});

	test('index routes every block type to exactly one category shard', () => {
		const index = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
		assert.strictEqual(index.schemaVersion, 3);
		const categories = index.shards.map((shard: any) => shard.category);
		assert.deepStrictEqual(categories, [...categories].sort((left, right) => left.localeCompare(right, 'en')));
		const indexedTypes = index.shards.flatMap((shard: any) => shard.blockTypes);
		assert.strictEqual(new Set(indexedTypes).size, contract.blocks.length);
		assert.deepStrictEqual([...indexedTypes].sort((left, right) => left.localeCompare(right, 'en')), contract.blocks.map((block: any) => block.type));
		for (const shard of index.shards) {
			const document = JSON.parse(fs.readFileSync(path.join(path.dirname(CONTRACT_PATH), shard.path), 'utf8'));
			assert.strictEqual(document.schemaVersion, 3);
			assert.strictEqual(document.category, shard.category);
			assert.deepStrictEqual(document.blocks.map((block: any) => block.type), shard.blockTypes);
		}
	});

	test('category shard ids reject traversal and reserve shared for multi-category blocks', () => {
		const { splitContract } = require(path.join(PROJECT_ROOT, 'scripts', 'generate-skill-contract.js'));
		const contractBase = { schemaVersion: 3, blocklyVersion: '13.2.1', boards: [] };
		assert.throws(
			() => splitContract({ ...contractBase, blocks: [{ type: 'unsafe', categories: ['../escape'] }] }),
			/Unsafe block contract shard id/
		);
		assert.throws(
			() => splitContract({ ...contractBase, blocks: [{ type: 'reserved', categories: ['shared'] }] }),
			/Reserved block contract shard id/
		);
	});

	test('public types are unique, sorted, board-scoped, and exclude implementation-only mutators', () => {
		const types = contract.blocks.map((block: any) => block.type);
		assert.deepStrictEqual(types, [...types].sort((a, b) => a.localeCompare(b, 'en')));
		assert.strictEqual(new Set(types).size, types.length);
		assert.ok(types.includes('variables_get'));
		assert.ok(types.includes('variables_set'));
		assert.ok(types.includes('arduino_function'));
		assert.ok(types.includes('arduino_function_call'));
		assert.ok(!types.includes('arduino_function_mutator'));
		assert.ok(!types.includes('arduino_function_parameter'));
		const txt = contract.blocks.find((block: any) => block.type === 'txt_motor_speed');
		assert.deepStrictEqual(txt.boards, ['txt']);
	});

	test('connection absence differs from an unrestricted connection', () => {
		for (const block of contract.blocks) {
			for (const variant of Object.values(block.variants) as any[]) {
				for (const connection of Object.values(variant.connections) as any[]) {
					assert.strictEqual(typeof connection.enabled, 'boolean');
					assert.ok(connection.check === null || Array.isArray(connection.check));
				}
				for (const input of variant.inputs) {
					assert.strictEqual(typeof input.connection.enabled, 'boolean');
					assert.ok(input.connection.check === null || Array.isArray(input.connection.check));
				}
			}
		}
	});

	test('minimal states are normalized and all generated human-readable content is English', () => {
		for (const block of contract.blocks) {
			assert.deepStrictEqual(Object.keys(block.variants).sort(), block.boards);
			for (const variant of Object.values(block.variants) as any[]) {
				assert.strictEqual(variant.minimalState.type, block.type);
				assert.ok(!('id' in variant.minimalState));
			}
		}
		const index = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
		const generatedFiles = [CONTRACT_PATH, ...index.shards.map((shard: any) => path.join(path.dirname(CONTRACT_PATH), shard.path))];
		for (const filePath of generatedFiles) {
			assert.doesNotMatch(fs.readFileSync(filePath, 'utf8'), /[\u3400-\u9fff\u3040-\u30ff\u0400-\u04ff]/u);
		}
	});

	test('Arduino variants expose board-specific state and exclude ESP32-only blocks from Uno', () => {
		const analogRead = contract.blocks.find((block: any) => block.type === 'arduino_analog_read');
		assert.strictEqual(analogRead.variants.uno.minimalState.fields.PIN, 'A0');
		assert.strictEqual(analogRead.variants.esp32.minimalState.fields.PIN, '32');
		assert.ok(analogRead.variants.uno.fields.find((field: any) => field.name === 'PIN').options.includes('A0'));
		assert.ok(!analogRead.variants.uno.fields.find((field: any) => field.name === 'PIN').options.includes('32'));
		assert.strictEqual(analogRead.variants.uno.fields.find((field: any) => field.name === 'PIN').optionsMode, 'dynamic');
		const logicBoolean = contract.blocks.find((block: any) => block.type === 'logic_boolean');
		assert.strictEqual(logicBoolean.variants.uno.fields.find((field: any) => field.name === 'BOOL').optionsMode, 'static');
		const pwm = contract.blocks.find((block: any) => block.type === 'esp32_pwm_setup');
		assert.deepStrictEqual(pwm.boards, ['esp32', 'supermini']);
		assert.strictEqual(pwm.variants.uno, undefined);
	});
});
