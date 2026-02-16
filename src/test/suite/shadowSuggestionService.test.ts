/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shadow Suggestion Service Tests
 *
 * 測試 AI 影子建議功能的核心邏輯，不需要實際的 LLM 呼叫或 VS Code 擴充主機。
 *
 * 驗證項目：
 * - Block Dictionary 的完整性與結構
 * - LLM 回應的 JSON 解析邏輯
 * - 建議物件的形狀驗證
 * - 多樣性過濾演算法
 *
 * 參考:
 * - src/services/shadowSuggestionService.ts
 * - src/mcp/block-dictionary.json
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Regex patterns from shadowSuggestionService.ts (lines 62-63)
const FENCED_JSON_RE = /```(?:json)?\s*([\s\S]*?)```/;
const BARE_ARRAY_RE = /\[[\s\S]*\]/;

/** BlockSuggestion shape (mirrors the interface in shadowSuggestionService.ts) */
interface BlockSuggestion {
	blockType: string;
	fields?: Record<string, string>;
	inputs?: Record<string, BlockSuggestion>;
	connectionType?: 'next' | 'input' | 'output';
	connectionTarget?: string;
	inputName?: string;
}

/**
 * 解析 LLM 回應文字為 BlockSuggestion 陣列
 * 重現 ShadowSuggestionService.parseResponse 的三層策略
 */
function parseResponse(text: string): unknown[] {
	let parsed: unknown;

	// Strategy 1: direct JSON.parse
	try {
		parsed = JSON.parse(text);
	} catch {
		// Strategy 2: extract from markdown fences
		const fenceMatch = text.match(FENCED_JSON_RE);
		if (fenceMatch) {
			try {
				parsed = JSON.parse(fenceMatch[1]);
			} catch {
				// fall through
			}
		}

		// Strategy 3: extract bare JSON array
		if (!parsed) {
			const arrayMatch = text.match(BARE_ARRAY_RE);
			if (arrayMatch) {
				try {
					parsed = JSON.parse(arrayMatch[0]);
				} catch {
					return [];
				}
			}
		}
	}

	if (!Array.isArray(parsed)) {
		return [];
	}

	return parsed;
}

/**
 * 驗證建議物件是否具有正確的形狀和已知的積木類型
 * 重現 ShadowSuggestionService.validateSuggestion 邏輯
 */
function validateSuggestion(suggestion: any, knownTypes?: Set<string>): boolean {
	if (!suggestion || typeof suggestion !== 'object') {
		return false;
	}

	if (typeof suggestion.blockType !== 'string' || !suggestion.blockType) {
		return false;
	}

	// Validate against known types if provided
	if (knownTypes && !knownTypes.has(suggestion.blockType)) {
		return false;
	}

	// Recursively validate inputs (child blocks)
	if (suggestion.inputs && typeof suggestion.inputs === 'object') {
		const inputNames = Object.keys(suggestion.inputs);
		for (const name of inputNames) {
			const child = suggestion.inputs[name];
			if (child && typeof child === 'object' && child.blockType) {
				if (!validateSuggestion(child, knownTypes)) {
					delete suggestion.inputs[name];
				}
			} else {
				delete suggestion.inputs[name];
			}
		}
		if (Object.keys(suggestion.inputs).length === 0) {
			delete suggestion.inputs;
		}
	}

	return true;
}

/**
 * 多樣性過濾 — 重現 filterForDiversity 邏輯
 */
function filterForDiversity(
	suggestions: BlockSuggestion[],
	existingBlockTypes: string[],
	categoryMap: Map<string, string>,
	focusBlockType?: string
): BlockSuggestion[] {
	const existingSet = new Set(existingBlockTypes);
	const categoryCounts = new Map<string, number>();
	const filtered: BlockSuggestion[] = [];
	const utilityBlocks = new Set([
		'text', 'math_number', 'math_arithmetic', 'logic_boolean', 'text_print',
		'cyberbrick_delay_ms', 'cyberbrick_delay_s', 'delay_ms', 'arduino_delay'
	]);

	const focusCategory = focusBlockType ? categoryMap.get(focusBlockType) : undefined;

	for (const suggestion of suggestions) {
		if (existingSet.has(suggestion.blockType) && !utilityBlocks.has(suggestion.blockType)) {
			continue;
		}

		const category = categoryMap.get(suggestion.blockType);
		if (category) {
			const currentCount = categoryCounts.get(category) || 0;
			const maxForCategory = (category === focusCategory) ? 3 : 2;
			if (currentCount >= maxForCategory) {
				continue;
			}
			categoryCounts.set(category, currentCount + 1);
		}

		filtered.push(suggestion);
	}

	if (filtered.length === 0 && suggestions.length > 0) {
		return [suggestions[0]];
	}

	return filtered;
}

// Resolve project root: compiled tests run from out/test/suite/
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

suite('Shadow Suggestion Service Tests', () => {

	// ── Block Dictionary ──────────────────────────────────────────

	suite('Block Dictionary', () => {
		let dictionary: any;
		const dictPath = path.join(PROJECT_ROOT, 'src', 'mcp', 'block-dictionary.json');

		setup(() => {
			const raw = fs.readFileSync(dictPath, 'utf-8');
			dictionary = JSON.parse(raw);
		});

		test('JSON 檔案可成功解析', () => {
			assert.ok(dictionary, 'dictionary should parse successfully');
			assert.ok(dictionary.blocks, 'dictionary should have a blocks property');
		});

		test('blocks 陣列至少包含 100 個項目', () => {
			assert.ok(Array.isArray(dictionary.blocks), 'blocks should be an array');
			assert.ok(
				dictionary.blocks.length >= 100,
				`Expected at least 100 blocks, got ${dictionary.blocks.length}`
			);
		});

		test('每個積木都有必要欄位: type, category', () => {
			for (const block of dictionary.blocks) {
				assert.ok(
					typeof block.type === 'string' && block.type.length > 0,
					`Block missing valid 'type': ${JSON.stringify(block)}`
				);
				assert.ok(
					typeof block.category === 'string' && block.category.length > 0,
					`Block ${block.type} missing valid 'category'`
				);
			}
		});

		test('每個積木都有 descriptions 物件且包含 en 鍵', () => {
			for (const block of dictionary.blocks) {
				assert.ok(
					block.descriptions && typeof block.descriptions === 'object',
					`Block ${block.type} missing 'descriptions' object`
				);
				assert.ok(
					typeof block.descriptions.en === 'string' && block.descriptions.en.length > 0,
					`Block ${block.type} missing 'descriptions.en'`
				);
			}
		});

		test('沒有重複的積木類型', () => {
			const types = dictionary.blocks.map((b: any) => b.type);
			const duplicates = types.filter((t: string, i: number) => types.indexOf(t) !== i);
			assert.deepStrictEqual(
				duplicates, [],
				`Duplicate block types found: ${duplicates.join(', ')}`
			);
		});

		test('關鍵積木都存在於字典中', () => {
			const typeSet = new Set(dictionary.blocks.map((b: any) => b.type));
			const criticalBlocks = [
				'arduino_setup_loop',
				'micropython_main',
				'cyberbrick_led_set_color',
				'cyberbrick_delay_ms',
				'text_print',
				'controls_if',
				'math_number',
			];
			for (const blockType of criticalBlocks) {
				assert.ok(
					typeSet.has(blockType),
					`Critical block '${blockType}' not found in dictionary`
				);
			}
		});
	});

	// ── Block Dictionary Completeness ─────────────────────────────

	suite('Block Dictionary Completeness', () => {
		let dictionaryTypes: Set<string>;
		const blocksDir = path.join(PROJECT_ROOT, 'media', 'blockly', 'blocks');
		const generatorsArduinoDir = path.join(PROJECT_ROOT, 'media', 'blockly', 'generators', 'arduino');
		const generatorsMpyDir = path.join(PROJECT_ROOT, 'media', 'blockly', 'generators', 'micropython');

		setup(() => {
			const dictPath = path.join(PROJECT_ROOT, 'src', 'mcp', 'block-dictionary.json');
			const raw = fs.readFileSync(dictPath, 'utf-8');
			const dictionary = JSON.parse(raw);
			dictionaryTypes = new Set(dictionary.blocks.map((b: any) => b.type));
		});

		test('具有 generator 的積木定義都應存在於字典中', () => {
			// Collect block types that have forBlock generators
			const generatorBlockTypes = new Set<string>();
			const forBlockPattern = /forBlock\['([^']+)'\]/g;

			const scanDir = (dir: string) => {
				if (!fs.existsSync(dir)) { return; }
				const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
				for (const file of files) {
					const content = fs.readFileSync(path.join(dir, file), 'utf-8');
					let match;
					while ((match = forBlockPattern.exec(content)) !== null) {
						generatorBlockTypes.add(match[1]);
					}
				}
			};

			scanDir(generatorsArduinoDir);
			scanDir(generatorsMpyDir);

			assert.ok(generatorBlockTypes.size > 0, 'Should find at least some generator block types');

			// Internal/framework blocks that may not appear in the dictionary
			const internalBlocks = new Set([
				'procedures_defnoreturn', 'procedures_defreturn', 'procedures_callnoreturn',
				'procedures_callreturn', 'procedures_ifreturn',
				'arduino_setup', 'arduino_loop',
			]);

			const missing: string[] = [];
			for (const blockType of generatorBlockTypes) {
				if (!dictionaryTypes.has(blockType) && !internalBlocks.has(blockType)) {
					missing.push(blockType);
				}
			}

			// Allow tolerance for dynamic/internal/built-in Blockly blocks
			assert.ok(
				missing.length <= 20,
				`Too many generator blocks missing from dictionary (${missing.length}): ${missing.join(', ')}`
			);
		});

		test('blocks 定義檔中的積木類型大多數存在於字典中', () => {
			const blockDefPattern = /Blockly\.Blocks\['([^']+)'\]/g;
			const definedBlockTypes = new Set<string>();

			if (fs.existsSync(blocksDir)) {
				const files = fs.readdirSync(blocksDir).filter(f => f.endsWith('.js'));
				for (const file of files) {
					const content = fs.readFileSync(path.join(blocksDir, file), 'utf-8');
					let match;
					while ((match = blockDefPattern.exec(content)) !== null) {
						definedBlockTypes.add(match[1]);
					}
				}
			}

			assert.ok(definedBlockTypes.size > 0, 'Should find at least some block definitions');

			let coveredCount = 0;
			for (const blockType of definedBlockTypes) {
				if (dictionaryTypes.has(blockType)) {
					coveredCount++;
				}
			}

			const coverageRatio = coveredCount / definedBlockTypes.size;
			assert.ok(
				coverageRatio >= 0.7,
				`Dictionary coverage of block definitions is too low: ${(coverageRatio * 100).toFixed(1)}% (${coveredCount}/${definedBlockTypes.size})`
			);
		});
	});

	// ── Response Parsing ──────────────────────────────────────────

	suite('Response Parsing', () => {

		test('乾淨的 JSON 陣列可直接解析', () => {
			const input = '[{"blockType":"text_print"}]';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 1);
			assert.strictEqual((result[0] as any).blockType, 'text_print');
		});

		test('Markdown 圍欄包裹的 JSON 可正確擷取', () => {
			const input = '```json\n[{"blockType":"text_print"}]\n```';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 1);
			assert.strictEqual((result[0] as any).blockType, 'text_print');
		});

		test('無語言標記的 Markdown 圍欄也可擷取', () => {
			const input = '```\n[{"blockType":"math_number","fields":{"NUM":"42"}}]\n```';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 1);
			assert.strictEqual((result[0] as any).blockType, 'math_number');
		});

		test('文字中的裸陣列可被擷取', () => {
			const input = 'Here are suggestions: [{"blockType":"text_print"}] hope this helps';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 1);
			assert.strictEqual((result[0] as any).blockType, 'text_print');
		});

		test('空陣列回傳空結果', () => {
			const input = '[]';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 0);
		});

		test('無效的 JSON 回傳空結果', () => {
			const input = 'not json at all';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 0);
		});

		test('非陣列的 JSON 回傳空結果', () => {
			const input = '{"blockType":"text_print"}';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 0);
		});

		test('多個建議的 JSON 陣列可正確解析', () => {
			const input = '[{"blockType":"text_print"},{"blockType":"math_number","fields":{"NUM":"10"}}]';
			const result = parseResponse(input);
			assert.strictEqual(result.length, 2);
			assert.strictEqual((result[0] as any).blockType, 'text_print');
			assert.strictEqual((result[1] as any).blockType, 'math_number');
		});
	});

	// ── Suggestion Validation ─────────────────────────────────────

	suite('Suggestion Validation', () => {

		test('有效的最小建議: { blockType: "text_print" }', () => {
			assert.ok(validateSuggestion({ blockType: 'text_print' }));
		});

		test('有效的建議含 fields', () => {
			assert.ok(validateSuggestion({ blockType: 'math_number', fields: { NUM: '42' } }));
		});

		test('有效的建議含巢狀 inputs', () => {
			const suggestion = {
				blockType: 'text_print',
				inputs: {
					TEXT: { blockType: 'text', fields: { TEXT: 'hi' } }
				}
			};
			assert.ok(validateSuggestion(suggestion));
			assert.ok(suggestion.inputs, 'inputs should be preserved');
		});

		test('null 為無效建議', () => {
			assert.strictEqual(validateSuggestion(null), false);
		});

		test('空物件 {} 為無效建議 (缺少 blockType)', () => {
			assert.strictEqual(validateSuggestion({}), false);
		});

		test('blockType 為數字是無效的', () => {
			assert.strictEqual(validateSuggestion({ blockType: 123 }), false);
		});

		test('blockType 為空字串是無效的', () => {
			assert.strictEqual(validateSuggestion({ blockType: '' }), false);
		});

		test('undefined 為無效建議', () => {
			assert.strictEqual(validateSuggestion(undefined), false);
		});

		test('已知類型集合過濾未知積木', () => {
			const knownTypes = new Set(['text_print', 'math_number']);
			assert.ok(validateSuggestion({ blockType: 'text_print' }, knownTypes));
			assert.strictEqual(validateSuggestion({ blockType: 'unknown_block' }, knownTypes), false);
		});

		test('無效的巢狀 input 被移除但不影響整體驗證', () => {
			const suggestion = {
				blockType: 'text_print',
				inputs: {
					TEXT: { blockType: 'text', fields: { TEXT: 'hi' } },
					BAD: { invalid: true }
				}
			};
			const knownTypes = new Set(['text_print', 'text']);
			assert.ok(validateSuggestion(suggestion, knownTypes));
			// BAD input should have been removed
			assert.strictEqual(suggestion.inputs?.BAD, undefined);
			// TEXT input should remain
			assert.ok(suggestion.inputs?.TEXT);
		});

		test('所有 inputs 無效時 inputs 物件被清除', () => {
			const suggestion: any = {
				blockType: 'text_print',
				inputs: {
					BAD1: { no_blockType: true },
					BAD2: 'not an object'
				}
			};
			assert.ok(validateSuggestion(suggestion));
			assert.strictEqual(suggestion.inputs, undefined);
		});
	});

	// ── Diversity Filter ──────────────────────────────────────────

	suite('Diversity Filter', () => {
		let categoryMap: Map<string, string>;

		setup(() => {
			categoryMap = new Map<string, string>([
				['text_print', 'text'],
				['text', 'text'],
				['text_join', 'text'],
				['math_number', 'math'],
				['math_arithmetic', 'math'],
				['math_modulo', 'math'],
				['controls_if', 'logic'],
				['logic_boolean', 'logic'],
				['logic_compare', 'logic'],
				['cyberbrick_led_set_color', 'led'],
				['cyberbrick_delay_ms', 'utility'],
				['servo_setup', 'servo'],
				['servo_write', 'servo'],
				['servo_detach', 'servo'],
				['digital_write', 'io'],
				['digital_read', 'io'],
				['analog_read', 'io'],
			]);
		});

		test('Utility 積木不受已存在過濾影響', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'text_print' },
				{ blockType: 'math_number' },
				{ blockType: 'cyberbrick_delay_ms' },
			];
			const existing = ['text_print', 'math_number', 'cyberbrick_delay_ms'];

			const result = filterForDiversity(suggestions, existing, categoryMap);

			// All are utility blocks, so none should be filtered out
			assert.strictEqual(result.length, 3);
		});

		test('已存在的非 utility 積木會被過濾', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'controls_if' },
				{ blockType: 'servo_setup' },
				{ blockType: 'text_print' },
			];
			const existing = ['controls_if', 'servo_setup'];

			const result = filterForDiversity(suggestions, existing, categoryMap);

			// controls_if and servo_setup are existing non-utility → filtered
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].blockType, 'text_print');
		});

		test('同類別最多 2 個建議', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'servo_setup' },
				{ blockType: 'servo_write' },
				{ blockType: 'servo_detach' },
			];

			const result = filterForDiversity(suggestions, [], categoryMap);

			assert.strictEqual(result.length, 2);
			assert.strictEqual(result[0].blockType, 'servo_setup');
			assert.strictEqual(result[1].blockType, 'servo_write');
		});

		test('焦點積木的類別允許 3 個建議', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'servo_setup' },
				{ blockType: 'servo_write' },
				{ blockType: 'servo_detach' },
			];

			const result = filterForDiversity(suggestions, [], categoryMap, 'servo_setup');

			// Focus block category (servo) allows up to 3
			assert.strictEqual(result.length, 3);
		});

		test('全部被過濾時回傳第一個建議作為 fallback', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'controls_if' },
				{ blockType: 'servo_setup' },
			];
			const existing = ['controls_if', 'servo_setup'];

			const result = filterForDiversity(suggestions, existing, categoryMap);

			// All filtered out → fallback to first
			assert.strictEqual(result.length, 1);
			assert.strictEqual(result[0].blockType, 'controls_if');
		});

		test('空建議陣列回傳空陣列', () => {
			const result = filterForDiversity([], [], categoryMap);
			assert.strictEqual(result.length, 0);
		});

		test('不在 categoryMap 中的積木不受類別限制', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'unknown_block_1' },
				{ blockType: 'unknown_block_2' },
				{ blockType: 'unknown_block_3' },
			];

			const result = filterForDiversity(suggestions, [], categoryMap);

			// No category mapping → no category limit applied
			assert.strictEqual(result.length, 3);
		});

		test('混合場景: utility + 已存在 + 類別限制', () => {
			const suggestions: BlockSuggestion[] = [
				{ blockType: 'math_number' },       // utility, existing → kept
				{ blockType: 'controls_if' },        // existing non-utility → filtered
				{ blockType: 'digital_write' },      // io category, count 1
				{ blockType: 'digital_read' },       // io category, count 2
				{ blockType: 'analog_read' },        // io category, count 3 → filtered (max 2)
				{ blockType: 'text_print' },         // utility → kept
			];
			const existing = ['math_number', 'controls_if'];

			const result = filterForDiversity(suggestions, existing, categoryMap);

			const types = result.map(r => r.blockType);
			assert.ok(types.includes('math_number'), 'utility block should be kept');
			assert.ok(!types.includes('controls_if'), 'existing non-utility should be filtered');
			assert.ok(types.includes('digital_write'), 'first io block should be kept');
			assert.ok(types.includes('digital_read'), 'second io block should be kept');
			assert.ok(!types.includes('analog_read'), 'third io block should exceed category limit');
			assert.ok(types.includes('text_print'), 'utility block should be kept');
		});
	});
});
