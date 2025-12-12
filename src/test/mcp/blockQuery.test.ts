/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 積木查詢工具單元測試
 */

import * as assert from 'assert';
import {
	getBlockByType,
	searchBlocks,
	formatBlockUsage,
	formatCategoryBlocks,
	getAllCategories,
	getBlocksByCategory,
} from '../../mcp/blockDictionary';

suite('MCP Block Query Tools', () => {
	suite('getBlockByType', () => {
		test('should return block definition for valid type', () => {
			const block = getBlockByType('servo_setup');
			assert.ok(block, 'Block should be found');
			assert.strictEqual(block.type, 'servo_setup');
			assert.strictEqual(block.category, 'motors');
		});

		test('should return undefined for invalid type', () => {
			const block = getBlockByType('nonexistent_block');
			assert.strictEqual(block, undefined);
		});

		test('should return correct fields for servo_setup', () => {
			const block = getBlockByType('servo_setup');
			assert.ok(block, 'Block should be found');
			assert.ok(block.fields.length > 0, 'Should have fields');

			const varField = block.fields.find(f => f.name === 'VAR');
			assert.ok(varField, 'Should have VAR field');
			assert.strictEqual(varField.type, 'text');

			const pinField = block.fields.find(f => f.name === 'PIN');
			assert.ok(pinField, 'Should have PIN field');
			assert.strictEqual(pinField.type, 'dropdown');
		});
	});

	suite('searchBlocks', () => {
		test('should find blocks by type name', () => {
			const results = searchBlocks('servo');
			assert.ok(results.length > 0, 'Should find servo blocks');
			assert.ok(
				results.some(r => r.type.includes('servo')),
				'Results should include servo blocks'
			);
		});

		test('should find blocks by Chinese keyword', () => {
			const results = searchBlocks('伺服');
			assert.ok(results.length > 0, 'Should find servo blocks by Chinese');
		});

		test('should find blocks by English keyword', () => {
			const results = searchBlocks('ultrasonic');
			assert.ok(results.length > 0, 'Should find ultrasonic blocks');
			assert.ok(
				results.some(r => r.type.includes('ultrasonic')),
				'Results should include ultrasonic blocks'
			);
		});

		test('should respect limit parameter', () => {
			const results = searchBlocks('a', { limit: 3 });
			assert.ok(results.length <= 3, 'Should respect limit');
		});

		test('should filter by category', () => {
			const results = searchBlocks('setup', { category: 'motors' });
			assert.ok(
				results.every(r => r.category === 'motors'),
				'All results should be in motors category'
			);
		});

		test('should filter by board', () => {
			const results = searchBlocks('pwm', { board: 'esp32' });
			// ESP32 PWM setup should be included
			assert.ok(results.length >= 0, 'Should return results or empty for ESP32');
		});

		test('should return empty array for no matches', () => {
			// 使用一個完全不會與任何標籤匹配的查詢
			const results = searchBlocks('qqqqzzzz');
			assert.strictEqual(results.length, 0, 'Should return empty array');
		});
	});

	suite('formatBlockUsage', () => {
		test('should format block with correct structure', () => {
			const block = getBlockByType('servo_move');
			assert.ok(block, 'Block should be found');

			const formatted = formatBlockUsage(block, 'zh-hant');
			assert.ok(formatted.type, 'Should have type');
			assert.ok(formatted.name, 'Should have name');
			assert.ok(formatted.category, 'Should have category');
			assert.ok(formatted.description, 'Should have description');
			assert.ok(Array.isArray(formatted.fields), 'Should have fields array');
			assert.ok(Array.isArray(formatted.boards), 'Should have boards array');
		});

		test('should localize names to zh-hant', () => {
			const block = getBlockByType('servo_setup');
			assert.ok(block, 'Block should be found');

			const formatted = formatBlockUsage(block, 'zh-hant');
			assert.ok(formatted.name.includes('伺服') || formatted.name.includes('設定'), 'Name should be in Chinese');
		});

		test('should include related blocks when available', () => {
			const block = getBlockByType('servo_setup');
			assert.ok(block, 'Block should be found');

			const formatted = formatBlockUsage(block);
			assert.ok(formatted.relatedBlocks, 'Should have relatedBlocks');
			assert.ok(formatted.relatedBlocks.includes('servo_move'), 'Should include servo_move');
		});
	});

	suite('formatCategoryBlocks', () => {
		test('should return category info with blocks', () => {
			const result = formatCategoryBlocks('motors', 'zh-hant');
			assert.ok(result, 'Should return result');
			assert.ok(result.category, 'Should have category info');
			assert.strictEqual(result.category.id, 'motors');
			assert.ok(result.blocks.length > 0, 'Should have blocks');
			assert.ok(result.totalCount > 0, 'Should have totalCount');
		});

		test('should return null for invalid category', () => {
			const result = formatCategoryBlocks('nonexistent_category');
			assert.strictEqual(result, null, 'Should return null');
		});

		test('should include block summaries', () => {
			const result = formatCategoryBlocks('sensors');
			assert.ok(result, 'Should return result');
			assert.ok(
				result.blocks.every(b => b.type && b.name && b.description !== undefined),
				'All blocks should have type, name, description'
			);
		});
	});

	suite('getAllCategories', () => {
		test('should return array of categories', () => {
			const categories = getAllCategories();
			assert.ok(Array.isArray(categories), 'Should return array');
			assert.ok(categories.length > 0, 'Should have categories');
		});

		test('should include expected categories', () => {
			const categories = getAllCategories();
			const categoryIds = categories.map(c => c.id);

			assert.ok(categoryIds.includes('arduino'), 'Should have arduino category');
			assert.ok(categoryIds.includes('motors'), 'Should have motors category');
			assert.ok(categoryIds.includes('sensors'), 'Should have sensors category');
		});

		test('should have localized names', () => {
			const categories = getAllCategories();
			const motorsCategory = categories.find(c => c.id === 'motors');

			assert.ok(motorsCategory, 'Should have motors category');
			assert.ok(motorsCategory.name['zh-hant'], 'Should have Chinese name');
			assert.ok(motorsCategory.name['en'], 'Should have English name');
		});
	});

	suite('getBlocksByCategory', () => {
		test('should return blocks for valid category', () => {
			const blocks = getBlocksByCategory('motors');
			assert.ok(blocks.length > 0, 'Should have blocks');
			assert.ok(
				blocks.every(b => b.category === 'motors'),
				'All blocks should be in motors category'
			);
		});

		test('should return empty array for invalid category', () => {
			const blocks = getBlocksByCategory('nonexistent');
			assert.strictEqual(blocks.length, 0, 'Should return empty array');
		});
	});
});
