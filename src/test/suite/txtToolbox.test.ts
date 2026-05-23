/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

type ToolboxBlock = {
	kind?: string;
	type?: string;
	fields?: Record<string, string | number>;
	inputs?: Record<string, { shadow?: { type?: string; fields?: Record<string, string | number> } }>;
	contents?: ToolboxBlock[];
};

function collectBlocks(items: ToolboxBlock[] = [], blocks: ToolboxBlock[] = []): ToolboxBlock[] {
	for (const item of items) {
		if (item.kind === 'block') {
			blocks.push(item);
		}
		if (item.contents) {
			collectBlocks(item.contents, blocks);
		}
	}
	return blocks;
}

suite('TXT Toolbox Tests', () => {
	const toolboxPath = path.join(__dirname, '..', '..', '..', 'media', 'toolbox', 'categories', 'txt.json');

	test('TXT toolbox 應只有一個 component-aware M setting block 與一個 generic stop block', () => {
		const toolbox = JSON.parse(fs.readFileSync(toolboxPath, 'utf8')) as ToolboxBlock;
		const blocks = collectBlocks(toolbox.contents);
		const mSettingBlocks = blocks.filter(block => block.type === 'txt_motor_speed');
		const mStopBlocks = blocks.filter(block => block.type === 'txt_motor_stop');

		assert.strictEqual(mSettingBlocks.length, 1, 'toolbox should expose exactly one M setting block');
		assert.strictEqual(mStopBlocks.length, 1, 'toolbox should expose exactly one M stop block');
		assert.strictEqual(mSettingBlocks[0].fields?.COMPONENT, 'MOTOR', 'M setting block should default COMPONENT to MOTOR');
		assert.strictEqual(mSettingBlocks[0].inputs?.SPEED?.shadow?.type, 'math_number', 'M setting block should include a default number shadow');
		assert.strictEqual(mSettingBlocks[0].inputs?.SPEED?.shadow?.fields?.NUM, 512, 'M setting block should default speed/brightness to 512');
	});

	test('TXT toolbox 不應出現 lamp-specific M block types，且 O series entry 應維持存在', () => {
		const toolbox = JSON.parse(fs.readFileSync(toolboxPath, 'utf8')) as ToolboxBlock;
		const blockTypes = collectBlocks(toolbox.contents).map(block => block.type ?? '');

		assert.ok(blockTypes.includes('txt_output'), 'O series txt_output block should remain in toolbox');
		assert.deepStrictEqual(
			blockTypes.filter(type => /^txt_.*lamp|lamp.*txt/i.test(type)),
			[],
			'toolbox should not introduce lamp-specific block types'
		);
	});
});