/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeTxtVirtualControlsDocument } from '../../types/txtVirtualControls';

type SerializedBlock = {
	type?: string;
	id?: string;
	fields?: Record<string, string>;
	inputs?: Record<string, { block?: SerializedBlock }>;
	next?: { block?: SerializedBlock };
};

suite('TXT Workspace Fixture Tests', () => {
	const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
	const fixturePaths = [
			path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-workspace-main.json'),
			path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-workspace-main.bak.json'),
			path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-m-output-legacy.json'),
			path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-m-output-motor-lamp.json'),
	];

	function collectBlockTypes(block: SerializedBlock | undefined, blockTypes: string[]): void {
		if (!block || !block.type) {
			return;
		}

		blockTypes.push(block.type);

		if (block.inputs) {
			for (const input of Object.values(block.inputs)) {
				collectBlockTypes(input.block, blockTypes);
			}
		}

		collectBlockTypes(block.next?.block, blockTypes);
	}

	function collectBlocks(block: SerializedBlock | undefined, blocks: SerializedBlock[]): void {
		if (!block || !block.type) {
			return;
		}

		blocks.push(block);

		if (block.inputs) {
			for (const input of Object.values(block.inputs)) {
				collectBlocks(input.block, blocks);
			}
		}

		collectBlocks(block.next?.block, blocks);
	}

	test('TXT fixtures 應只使用 txt_setup + txt_process 新模型', () => {
		for (const fixturePath of fixturePaths) {
			const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
				board?: string;
				workspace?: { blocks?: { blocks?: SerializedBlock[] } };
			};

			assert.strictEqual(fixture.board, 'txt', `${path.basename(fixturePath)} should target TXT board`);

			const topBlocks = fixture.workspace?.blocks?.blocks ?? [];
			const topTypes = topBlocks.map(block => block.type);
			assert.ok(topTypes.includes('txt_setup'), `${path.basename(fixturePath)} should include a top-level txt_setup block`);
			assert.ok(topTypes.includes('txt_process'), `${path.basename(fixturePath)} should include a top-level txt_process block`);

			const allTypes: string[] = [];
			for (const block of topBlocks) {
				collectBlockTypes(block, allTypes);
			}

			const legacyTypes = allTypes.filter(type => ['txt_main', 'txt_init', 'txt_input_read'].includes(type));
			assert.deepStrictEqual(
				legacyTypes,
				[],
				`${path.basename(fixturePath)} should not contain legacy TXT block types: ${legacyTypes.join(', ')}`
			);
		}
	});

	test('TXT fixtures 應維持與可選 txtVirtualControls 欄位相容的 wrapper 結構', () => {
		for (const fixturePath of fixturePaths) {
			const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
				board?: string;
				workspace?: unknown;
				txtVirtualControls?: unknown;
			};

			assert.ok(fixture.workspace, `${path.basename(fixturePath)} should keep the workspace wrapper shape`);
			const normalizedDocument = normalizeTxtVirtualControlsDocument(fixture.txtVirtualControls);
			assert.strictEqual(normalizedDocument.schemaVersion, 1);
			assert.strictEqual(normalizedDocument.canvas.mode, 'editing');
			assert.ok(Array.isArray(normalizedDocument.controls), 'txtVirtualControls should normalize to a controls array');
		}
	});

	test('TXT M output fixtures 應覆蓋 legacy fallback 與混合 MOTOR/LAMP component 欄位', () => {
		const legacyFixturePath = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-m-output-legacy.json');
		const mixedFixturePath = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'txt-m-output-motor-lamp.json');

		const legacyFixture = JSON.parse(fs.readFileSync(legacyFixturePath, 'utf8')) as {
			workspace?: { blocks?: { blocks?: SerializedBlock[] } };
		};
		const mixedFixture = JSON.parse(fs.readFileSync(mixedFixturePath, 'utf8')) as {
			workspace?: { blocks?: { blocks?: SerializedBlock[] } };
		};

		const legacyBlocks: SerializedBlock[] = [];
		for (const block of legacyFixture.workspace?.blocks?.blocks ?? []) {
			collectBlocks(block, legacyBlocks);
		}
		const legacyMotorBlock = legacyBlocks.find(block => block.type === 'txt_motor_speed');
		assert.ok(legacyMotorBlock, 'legacy fixture should include txt_motor_speed');
		assert.ok(!legacyMotorBlock.fields || !('COMPONENT' in legacyMotorBlock.fields), 'legacy fixture should omit COMPONENT field');

		const mixedBlocks: SerializedBlock[] = [];
		for (const block of mixedFixture.workspace?.blocks?.blocks ?? []) {
			collectBlocks(block, mixedBlocks);
		}
		const components = mixedBlocks
			.filter(block => block.type === 'txt_motor_speed')
			.map(block => block.fields?.COMPONENT)
			.sort();
		assert.deepStrictEqual(components, ['LAMP', 'MOTOR']);
	});

	test('TXT fixtures 不應使用獨立 lamp setting 或 lamp stop block type', () => {
		for (const fixturePath of fixturePaths) {
			const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as {
				workspace?: { blocks?: { blocks?: SerializedBlock[] } };
			};

			const blocks: SerializedBlock[] = [];
			for (const block of fixture.workspace?.blocks?.blocks ?? []) {
				collectBlocks(block, blocks);
			}

			const lampSpecificTypes = blocks
				.map(block => block.type ?? '')
				.filter(type => /^txt_.*lamp|lamp.*txt/i.test(type));
			assert.deepStrictEqual(lampSpecificTypes, [], `${path.basename(fixturePath)} should not contain lamp-specific block types`);
		}
	});
});
