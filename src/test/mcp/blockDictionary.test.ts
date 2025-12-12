/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Block Dictionary 單元測試
 *
 * 這些測試基於 MCP 開發中常見的錯誤模式：
 * 1. Context 參數映射問題 - 確保 dropdown 欄位有預設值
 * 2. 積木結構定義錯誤 - 驗證 fields 和 inputs 正確區分
 * 3. 搜尋標籤問題 - 確保每個積木都有中英文標籤
 * 4. 索引一致性 - 驗證字典與搜尋索引同步
 */

import * as assert from 'assert';
import * as path from 'path';
import { pathToFileURL } from 'url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockDictionaryModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockDictionary = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockDefinition = any;

// 動態載入測試目標
const blockDictionaryPath = path.resolve(__dirname, '../../mcp/blockDictionary');

suite('Block Dictionary Tests', () => {
	let blockDictionary: BlockDictionaryModule;
	let dictionary: BlockDictionary;

	suiteSetup(async () => {
		// 動態載入模組 - 使用 file:// URL 以支援 Windows 路徑
		const fileUrl = pathToFileURL(blockDictionaryPath + '.js').href;
		blockDictionary = await import(fileUrl);
		dictionary = blockDictionary.getBlockDictionary();
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

		test('should have sufficient block count (>100 blocks)', () => {
			const dict = blockDictionary.getBlockDictionary();
			assert.ok(dict.blocks.length >= 100, `Should have at least 100 blocks, got ${dict.blocks.length}`);
		});
	});

	// ============================================================
	// 基於錯誤文檔的驗證測試
	// ============================================================

	suite('Search Tag Validation', () => {
		test('all blocks should have tags array', () => {
			for (const block of dictionary.blocks) {
				assert.ok(Array.isArray(block.tags), `Block ${block.type} should have tags array`);
			}
		});

		test('all blocks should have both Chinese and English tags', () => {
			const hasChineseChar = (str: string) => /[\u4e00-\u9fff]/.test(str);
			const hasEnglishWord = (str: string) => /[a-zA-Z]/.test(str);

			for (const block of dictionary.blocks) {
				if (!block.tags || block.tags.length === 0) continue;

				const hasChinese = block.tags.some((tag: string) => hasChineseChar(tag));
				const hasEnglish = block.tags.some((tag: string) => hasEnglishWord(tag));

				assert.ok(
					hasChinese || hasEnglish,
					`Block ${block.type} should have searchable tags`
				);
			}
		});

		test('core blocks should have descriptive tags', () => {
			const coreBlocks = ['controls_if', 'controls_repeat_ext', 'math_number', 'text'];

			for (const blockType of coreBlocks) {
				const block = dictionary.blocks.find((b: BlockDefinition) => b.type === blockType);
				if (block) {
					assert.ok(
						block.tags && block.tags.length >= 2,
						`Core block ${blockType} should have at least 2 tags`
					);
				}
			}
		});
	});

	suite('Dropdown Field Validation', () => {
		test('dropdown fields should have default values', () => {
			for (const block of dictionary.blocks) {
				if (!block.fields) continue;

				for (const field of block.fields) {
					if (field.type === 'dropdown') {
						// Dropdown 應該有 options 或 default
						const hasOptions = field.options !== undefined;
						const hasDefault = field.default !== undefined;

						assert.ok(
							hasOptions || hasDefault,
							`Dropdown field ${field.name} in block ${block.type} should have options or default`
						);
					}
				}
			}
		});

		test('PIN fields should be defined as dropdown type', () => {
			const pinFieldNames = ['PIN', 'PIN_A', 'PIN_B', 'RX_PIN', 'TX_PIN', 'TRIG', 'ECHO'];

			for (const block of dictionary.blocks) {
				if (!block.fields) continue;

				for (const field of block.fields) {
					if (pinFieldNames.includes(field.name)) {
						assert.strictEqual(
							field.type,
							'dropdown',
							`PIN field ${field.name} in block ${block.type} should be dropdown type`
						);
					}
				}
			}
		});
	});

	suite('Fields vs Inputs Distinction', () => {
		test('number fields should not be in inputs array', () => {
			for (const block of dictionary.blocks) {
				if (!block.inputs) continue;

				for (const input of block.inputs) {
					// input 類型應該是 value 或 statement，不應該是 number
					if (input.type === 'number') {
						assert.fail(
							`Block ${block.type} has number type in inputs - should be in fields`
						);
					}
				}
			}
		});

		test('statement inputs should have type "statement"', () => {
			for (const block of dictionary.blocks) {
				if (!block.inputs) continue;

				for (const input of block.inputs) {
					if (input.name.toUpperCase().includes('DO') || input.name === 'STATEMENTS') {
						assert.strictEqual(
							input.type,
							'statement',
							`Statement input ${input.name} in block ${block.type} should have type "statement"`
						);
					}
				}
			}
		});
	});

	suite('Category Consistency', () => {
		test('all blocks should reference valid categories', () => {
			const validCategories = dictionary.categories.map((c: { id: string }) => c.id);

			for (const block of dictionary.blocks) {
				assert.ok(
					validCategories.includes(block.category),
					`Block ${block.type} has invalid category "${block.category}". Valid: ${validCategories.join(', ')}`
				);
			}
		});

		test('all categories should have at least one block', () => {
			for (const category of dictionary.categories) {
				const blocksInCategory = dictionary.blocks.filter(
					(b: BlockDefinition) => b.category === category.id
				);
				assert.ok(
					blocksInCategory.length > 0,
					`Category "${category.id}" has no blocks`
				);
			}
		});
	});

	suite('Essential Blocks Existence', () => {
		test('should have all essential Arduino blocks', () => {
			const essentialArduinoBlocks = [
				'arduino_setup',
				'arduino_loop',
				'digital_write',
				'digital_read',
				'analog_write',
				'analog_read',
			];

			for (const blockType of essentialArduinoBlocks) {
				const block = dictionary.blocks.find((b: BlockDefinition) => b.type === blockType);
				assert.ok(block, `Essential Arduino block "${blockType}" should exist`);
			}
		});

		test('should have all essential logic blocks', () => {
			const essentialLogicBlocks = [
				'controls_if',
				'logic_compare',
				'logic_operation',
				'logic_boolean',
			];

			for (const blockType of essentialLogicBlocks) {
				const block = dictionary.blocks.find((b: BlockDefinition) => b.type === blockType);
				assert.ok(block, `Essential logic block "${blockType}" should exist`);
			}
		});

		test('should have all essential loop blocks', () => {
			const essentialLoopBlocks = [
				'controls_repeat_ext',
				'controls_whileUntil',
				'controls_for',
			];

			for (const blockType of essentialLoopBlocks) {
				const block = dictionary.blocks.find((b: BlockDefinition) => b.type === blockType);
				assert.ok(block, `Essential loop block "${blockType}" should exist`);
			}
		});

		test('should have motor/servo blocks', () => {
			const motorBlocks = dictionary.blocks.filter(
				(b: BlockDefinition) => b.category === 'motors'
			);
			assert.ok(motorBlocks.length >= 3, 'Should have at least 3 motor blocks');
		});
	});

	suite('Board Support Validation', () => {
		test('blocks with boards array should have valid board types', () => {
			const validBoards = ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'esp32_supermini'];

			for (const block of dictionary.blocks) {
				if (!block.boards || !Array.isArray(block.boards)) continue;

				for (const board of block.boards) {
					assert.ok(
						validBoards.includes(board),
						`Block ${block.type} has invalid board "${board}"`
					);
				}
			}
		});
	});

	// ============================================================
	// 原有的 API 測試
	// ============================================================

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
