/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Block Dictionary 單元測試
 */

import * as assert from 'assert';
import * as path from 'path';
import { pathToFileURL } from 'url';

// 動態載入測試目標
const blockDictionaryPath = path.resolve(__dirname, '../../mcp/blockDictionary');

suite('Block Dictionary Tests', () => {
	let blockDictionary: typeof import('../../mcp/blockDictionary');

	suiteSetup(async () => {
		// 動態載入模組 - 使用 file:// URL 以支援 Windows 路徑
		const fileUrl = pathToFileURL(blockDictionaryPath + '.js').href;
		blockDictionary = await import(fileUrl);
	});

	suite('getBlockDictionary()', () => {
		test('should return a valid dictionary object', () => {
			const dict = blockDictionary.getBlockDictionary();

			assert.ok(dict, 'Dictionary should exist');
			assert.ok(dict.version, 'Dictionary should have version');
			assert.ok(Array.isArray(dict.blocks), 'Dictionary should have blocks array');
			assert.ok(Array.isArray(dict.categories), 'Dictionary should have categories array');
		});

		test('should have blocks with required properties', () => {
			const dict = blockDictionary.getBlockDictionary();

			for (const block of dict.blocks) {
				assert.ok(block.type, `Block should have type`);
				assert.ok(block.category, `Block ${block.type} should have category`);
				assert.ok(block.descriptions, `Block ${block.type} should have descriptions`);
				assert.ok(
					block.descriptions['zh-hant'] || block.descriptions['en'],
					`Block ${block.type} should have zh-hant or en description`
				);
			}
		});
	});

	suite('getBlockByType()', () => {
		test('should find existing block', () => {
			// 使用字典中存在的積木類型
			const block = blockDictionary.getBlockByType('servo_move');

			assert.ok(block, 'Should find servo_move block');
			assert.strictEqual(block?.type, 'servo_move');
		});

		test('should return undefined for non-existent block', () => {
			const block = blockDictionary.getBlockByType('non_existent_block_12345');

			assert.strictEqual(block, undefined, 'Should return undefined for non-existent block');
		});
	});

	suite('searchBlocks()', () => {
		test('should find blocks by keyword', () => {
			const results = blockDictionary.searchBlocks('伺服');

			assert.ok(results.length > 0, 'Should find servo-related blocks');
		});

		test('should return empty array for no matches', () => {
			// 使用一個完全不會與任何標籤匹配的查詢
			const results = blockDictionary.searchBlocks('qqqqzzzz');

			assert.strictEqual(results.length, 0, 'Should return empty array');
		});

		test('should filter by category', () => {
			const results = blockDictionary.searchBlocks('', { category: 'motors' });

			assert.ok(results.length > 0, 'Should find motor blocks');
			for (const result of results) {
				assert.strictEqual(result.category, 'motors');
			}
		});
	});

	suite('formatBlockUsage()', () => {
		test('should format block usage as structured object', () => {
			// 使用字典中存在的積木類型
			const block = blockDictionary.getBlockByType('servo_move');
			if (!block) {
				assert.fail('servo_move block not found');
				return;
			}

			const formatted = blockDictionary.formatBlockUsage(block);

			assert.strictEqual(formatted.type, 'servo_move', 'Should include block type');
			assert.ok(formatted.name, 'Should have name');
			assert.ok(formatted.category, 'Should have category');
		});
	});

	suite('formatCategoryBlocks()', () => {
		test('should format category blocks as structured object', () => {
			const formatted = blockDictionary.formatCategoryBlocks('logic');

			assert.ok(formatted, 'Should return formatted object');
			assert.strictEqual(formatted?.category.id, 'logic', 'Should include category id');
			assert.ok(Array.isArray(formatted?.blocks), 'Should have blocks array');
		});

		test('should return null for non-existent category', () => {
			const formatted = blockDictionary.formatCategoryBlocks('non_existent_category');

			assert.strictEqual(formatted, null, 'Should return null');
		});
	});
});
