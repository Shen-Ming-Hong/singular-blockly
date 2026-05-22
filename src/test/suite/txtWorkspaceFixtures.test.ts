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
	inputs?: Record<string, { block?: SerializedBlock }>;
	next?: { block?: SerializedBlock };
};

suite('TXT Workspace Fixture Tests', () => {
	const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
	const fixturePaths = [
		path.join(PROJECT_ROOT, 'extension_test', 'blockly', 'main.json'),
		path.join(PROJECT_ROOT, 'extension_test', 'blockly', 'main.json.bak'),
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
});
