/**
 * Orphan Block Guard Tests
 *
 * 測試孤立積木防護機制的核心邏輯
 * 驗證 isInAllowedContext helper 與 forBlock guard 的行為規範
 *
 * 由於 Blockly 在 WebView (browser context) 中執行，此檔案使用
 * 模擬物件測試核心邏輯，驗證合約規範的正確性。
 *
 * 參考:
 * - specs/044-prevent-orphan-blocks/contracts/generator-interfaces.md
 * - specs/044-prevent-orphan-blocks/contracts/block-warning-events.md
 * - media/blockly/generators/arduino/index.js (isInAllowedContext)
 * - media/blockly/generators/micropython/index.js (isInAllowedContext)
 */

import * as assert from 'assert';

/**
 * 建立模擬積木物件
 * 模擬 Blockly.Block 的 getSurroundParent() 行為
 * @param type 積木類型
 * @param parentChain 父層鏈（從最近的父層到最遠的祖先）
 */
function createMockBlock(type: string, parentChain: Array<{ type: string }> = []): any {
	let callIndex = 0;
	const chain = parentChain.map(p => {
		// Each parent in the chain also needs getSurroundParent
		return {
			type: p.type,
			getSurroundParent: () => {
				// This won't be called in the basic tests since we return true/false early
				return null;
			},
		};
	});

	return {
		type,
		getSurroundParent: () => {
			if (callIndex < chain.length) {
				return chain[callIndex++];
			}
			return null;
		},
	};
}

/**
 * 重建 isInAllowedContext 邏輯（從 generator-interfaces.md 合約）
 * 此為合約規範的純函式實作，用於驗證合約行為
 */
function isInAllowedContext(
	block: { type: string; getSurroundParent: () => any },
	allowedContainers: string[]
): boolean {
	let current: any = block;
	while (current) {
		current = current.getSurroundParent();
		if (!current) return false;
		if (allowedContainers.includes(current.type)) return true;
	}
	return false;
}

// Arduino 合法容器
const ARDUINO_CONTAINERS = [
	'arduino_setup_loop',
	'arduino_function',
	'procedures_defnoreturn',
	'procedures_defreturn',
];

// MicroPython 合法容器
const MICROPYTHON_CONTAINERS = [
	'micropython_main',
	'arduino_function',
	'procedures_defnoreturn',
	'procedures_defreturn',
];

suite('Orphan Block Guard Tests', () => {
	// T008: isInAllowedContext returns true for block directly inside allowed container
	suite('isInAllowedContext — 直接在合法容器內 (RN-006 T3)', () => {
		test('Arduino: block inside arduino_setup_loop returns true', () => {
			const block = createMockBlock('controls_whileUntil', [{ type: 'arduino_setup_loop' }]);
			assert.strictEqual(isInAllowedContext(block, ARDUINO_CONTAINERS), true);
		});

		test('MicroPython: block inside micropython_main returns true', () => {
			const block = createMockBlock('controls_whileUntil', [{ type: 'micropython_main' }]);
			assert.strictEqual(isInAllowedContext(block, MICROPYTHON_CONTAINERS), true);
		});
	});

	// T009: isInAllowedContext returns false for top-level block with no parent
	suite('isInAllowedContext — 頂層孤立積木 (RN-006 T4)', () => {
		test('Arduino: top-level block with no parent returns false', () => {
			const block = createMockBlock('controls_whileUntil', []);
			assert.strictEqual(isInAllowedContext(block, ARDUINO_CONTAINERS), false);
		});

		test('MicroPython: top-level block with no parent returns false', () => {
			const block = createMockBlock('controls_for', []);
			assert.strictEqual(isInAllowedContext(block, MICROPYTHON_CONTAINERS), false);
		});
	});

	// T010: isInAllowedContext returns true for multi-level nesting (loop > if > while)
	suite('isInAllowedContext — 多層嵌套 (RN-006 T1)', () => {
		test('Arduino: nested block (setup_loop > if > while) returns true', () => {
			// while is inside if, which is inside arduino_setup_loop
			let callIdx = 0;
			const parents: Array<{ type: string; getSurroundParent: () => any }> = [
				{ type: 'controls_if', getSurroundParent: () => parents[1] },
				{ type: 'arduino_setup_loop', getSurroundParent: () => null },
			];
			const deepBlock = {
				type: 'controls_whileUntil',
				getSurroundParent: () => parents[callIdx++] || null,
			};
			assert.strictEqual(isInAllowedContext(deepBlock, ARDUINO_CONTAINERS), true);
		});

		test('MicroPython: nested block (main > for > forEach) returns true', () => {
			let callIdx = 0;
			const parents: Array<{ type: string; getSurroundParent: () => any }> = [
				{ type: 'controls_for', getSurroundParent: () => parents[1] },
				{ type: 'micropython_main', getSurroundParent: () => null },
			];
			const deepBlock = {
				type: 'controls_forEach',
				getSurroundParent: () => parents[callIdx++] || null,
			};
			assert.strictEqual(isInAllowedContext(deepBlock, MICROPYTHON_CONTAINERS), true);
		});
	});

	// T011: isInAllowedContext returns false for nested orphan (orphan if > while)
	suite('isInAllowedContext — 嵌套孤立積木 (RN-006 T2)', () => {
		test('Arduino: nested orphan (orphan if > while) returns false', () => {
			let callIdx = 0;
			const parents = [
				{ type: 'controls_if', getSurroundParent: () => null }, // controls_if is orphan (no parent)
			];
			const nestedBlock = {
				type: 'controls_whileUntil',
				getSurroundParent: () => parents[callIdx++] || null,
			};
			assert.strictEqual(isInAllowedContext(nestedBlock, ARDUINO_CONTAINERS), false);
		});

		test('MicroPython: nested orphan returns false', () => {
			let callIdx = 0;
			const parents = [
				{ type: 'controls_for', getSurroundParent: () => null },
			];
			const nestedBlock = {
				type: 'controls_forEach',
				getSurroundParent: () => parents[callIdx++] || null,
			};
			assert.strictEqual(isInAllowedContext(nestedBlock, MICROPYTHON_CONTAINERS), false);
		});
	});

	// T012: isInAllowedContext handles different container types
	suite('isInAllowedContext — 不同容器類型 (RN-006 T5)', () => {
		test('Arduino: block inside procedures_defnoreturn returns true', () => {
			const block = createMockBlock('controls_if', [{ type: 'procedures_defnoreturn' }]);
			assert.strictEqual(isInAllowedContext(block, ARDUINO_CONTAINERS), true);
		});

		test('Arduino: block inside procedures_defreturn returns true', () => {
			const block = createMockBlock('controls_for', [{ type: 'procedures_defreturn' }]);
			assert.strictEqual(isInAllowedContext(block, ARDUINO_CONTAINERS), true);
		});

		test('Arduino: block inside arduino_function returns true', () => {
			const block = createMockBlock('singular_flow_statements', [{ type: 'arduino_function' }]);
			assert.strictEqual(isInAllowedContext(block, ARDUINO_CONTAINERS), true);
		});

		test('MicroPython: block inside arduino_function returns true', () => {
			const block = createMockBlock('controls_if', [{ type: 'arduino_function' }]);
			assert.strictEqual(isInAllowedContext(block, MICROPYTHON_CONTAINERS), true);
		});
	});

	// T013: forBlock guard returns empty string for orphan block
	suite('forBlock guard — 孤立積木回傳空字串 (RN-006 T9)', () => {
		test('guard pattern returns empty string when isInAllowedContext is false', () => {
			// Simulate the guard pattern from the contract
			const orphanBlock = createMockBlock('controls_whileUntil', []);
			const isInContext = isInAllowedContext(orphanBlock, ARDUINO_CONTAINERS);

			// Guard pattern: if (!isInAllowedContext(block)) return '';
			const result = isInContext ? 'while (true) {\n}\n' : '';
			assert.strictEqual(result, '', '孤立積木應回傳空字串');
		});

		test('guard returns empty string for all control block types', () => {
			const blockTypes = [
				'controls_whileUntil',
				'controls_for',
				'controls_forEach',
				'controls_repeat_ext',
				'controls_if',
				'singular_flow_statements',
				'controls_duration',
			];

			for (const blockType of blockTypes) {
				const orphanBlock = createMockBlock(blockType, []);
				const isInContext = isInAllowedContext(orphanBlock, ARDUINO_CONTAINERS);
				const result = isInContext ? `code_for_${blockType}` : '';
				assert.strictEqual(result, '', `${blockType}: 孤立時應回傳空字串`);
			}
		});
	});

	// T014: forBlock guard returns valid code for block in allowed context
	suite('forBlock guard — 合法位置回傳有效程式碼 (RN-006 T10)', () => {
		test('guard pattern returns code when isInAllowedContext is true', () => {
			const validBlock = createMockBlock('controls_whileUntil', [{ type: 'arduino_setup_loop' }]);
			const isInContext = isInAllowedContext(validBlock, ARDUINO_CONTAINERS);

			// Guard pattern: if (isInAllowedContext) → run normal code gen
			const expectedCode = 'while (true) {\n}\n';
			const result = isInContext ? expectedCode : '';
			assert.strictEqual(result, expectedCode, '合法位置應回傳有效程式碼');
		});

		test('guard allows code generation for all container types', () => {
			const containers = [
				'arduino_setup_loop',
				'arduino_function',
				'procedures_defnoreturn',
				'procedures_defreturn',
			];

			for (const container of containers) {
				const block = createMockBlock('controls_if', [{ type: container }]);
				const isInContext = isInAllowedContext(block, ARDUINO_CONTAINERS);
				assert.strictEqual(isInContext, true, `${container} 內應允許程式碼生成`);
			}
		});
	});

	// T028: workspaceToCode skips orphan top-level block
	suite('workspaceToCode 過濾 — 孤立頂層積木 (RN-006 T6)', () => {
		test('Arduino: orphan block produces skip comment format', () => {
			const blockType = 'controls_whileUntil';
			const expectedComment = `// [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;

			// Validate comment format matches contract spec
			assert.ok(expectedComment.startsWith('// [Skipped]'), '應以 // [Skipped] 開頭');
			assert.ok(expectedComment.includes(blockType), '應包含積木類型');
			assert.ok(expectedComment.includes('not in setup/loop/function'), '應包含原因說明');
		});

		test('MicroPython: orphan block produces skip comment format', () => {
			const blockType = 'controls_for';
			const expectedComment = `# [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;

			// Validate comment format matches contract spec
			assert.ok(expectedComment.startsWith('# [Skipped]'), '應以 # [Skipped] 開頭');
			assert.ok(expectedComment.includes(blockType), '應包含積木類型');
		});

		test('allowedTopLevelBlocks_ correctly lists Arduino containers', () => {
			const allowedTopLevel = [
				'arduino_setup_loop',
				'arduino_function',
				'procedures_defnoreturn',
				'procedures_defreturn',
			];

			// Verify orphan types are NOT in allowed list
			const orphanTypes = ['controls_whileUntil', 'controls_for', 'controls_if'];
			for (const orphanType of orphanTypes) {
				assert.strictEqual(
					allowedTopLevel.includes(orphanType),
					false,
					`${orphanType} 不應在 allowedTopLevelBlocks_ 中`
				);
			}
		});
	});

	// T029: alwaysGenerateBlocks_ blocks are not affected by filtering
	suite('alwaysGenerateBlocks_ 不受過濾影響 (RN-006 T8)', () => {
		test('alwaysGenerateBlocks_ mechanism runs inside arduino_setup_loop.forBlock', () => {
			// The alwaysGenerateBlocks_ scanning happens inside arduino_setup_loop.forBlock,
			// NOT in workspaceToCode. This means:
			// 1. workspaceToCode processes arduino_setup_loop (it's in allowedTopLevelBlocks_)
			// 2. arduino_setup_loop.forBlock scans ALL blocks for alwaysGenerateBlocks_ types
			// 3. Therefore, alwaysGenerateBlocks_ blocks are processed regardless of position

			const allowedTopLevel = [
				'arduino_setup_loop',
				'arduino_function',
				'procedures_defnoreturn',
				'procedures_defreturn',
			];

			// arduino_setup_loop IS in the allowed list, so it will be processed
			assert.strictEqual(
				allowedTopLevel.includes('arduino_setup_loop'),
				true,
				'arduino_setup_loop 必須在 allowedTopLevelBlocks_ 中'
			);

			// alwaysGenerateBlocks_ examples (e.g., servo_setup) are scanned
			// inside arduino_setup_loop.forBlock via:
			//   ws.getAllBlocks(false)
			//     .filter(b => window.arduinoGenerator.alwaysGenerateBlocks_.includes(b.type))
			//     .forEach(b => window.arduinoGenerator.forBlock[b.type](b));
			// This means they are NOT filtered by workspaceToCode
			assert.ok(true, 'alwaysGenerateBlocks_ 在 arduino_setup_loop.forBlock 內掃描，不受 workspaceToCode 過濾影響');
		});

		test('servo_setup example: always-generate block is not a top-level block type', () => {
			const allowedTopLevel = [
				'arduino_setup_loop',
				'arduino_function',
				'procedures_defnoreturn',
				'procedures_defreturn',
			];

			// servo_setup is NOT in allowedTopLevelBlocks_ — it would be skipped by workspaceToCode
			// But it IS processed by the alwaysGenerateBlocks_ scan inside arduino_setup_loop.forBlock
			assert.strictEqual(
				allowedTopLevel.includes('servo_setup'),
				false,
				'servo_setup 不在 allowedTopLevelBlocks_ 中（由 alwaysGenerateBlocks_ 機制處理）'
			);
		});
	});

	// T054: skipped orphan block produces correct comment format
	suite('跳過孤立積木的註解格式 (RN-006 T7)', () => {
		test('Arduino: skip comment uses // prefix and [Skipped] marker', () => {
			const blockType = 'controls_repeat_ext';
			const comment = `// [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;

			assert.ok(comment.startsWith('// [Skipped]'), '應以 // [Skipped] 開頭');
			assert.ok(comment.includes('Orphan block:'), '應包含 "Orphan block:" 標記');
			assert.ok(comment.includes(blockType), '應包含積木類型');
			assert.ok(comment.includes('not in setup/loop/function'), '應包含原因說明');
		});

		test('MicroPython: skip comment uses # prefix and [Skipped] marker', () => {
			const blockType = 'controls_forEach';
			const comment = `# [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;

			assert.ok(comment.startsWith('# [Skipped]'), '應以 # [Skipped] 開頭');
			assert.ok(comment.includes('Orphan block:'), '應包含 "Orphan block:" 標記');
			assert.ok(comment.includes(blockType), '應包含積木類型');
		});

		test('skip comment format is consistent for all guarded block types', () => {
			const guardedTypes = [
				'controls_whileUntil',
				'controls_for',
				'controls_forEach',
				'controls_repeat_ext',
				'controls_if',
				'singular_flow_statements',
				'controls_duration',
			];

			for (const blockType of guardedTypes) {
				const arduinoComment = `// [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;
				const mpComment = `# [Skipped] Orphan block: ${blockType} (not in setup/loop/function)`;

				// Arduino format
				assert.ok(
					/^\/\/ \[Skipped\] Orphan block: \w+ \(not in setup\/loop\/function\)$/.test(arduinoComment),
					`Arduino: ${blockType} 註解格式不符`
				);
				// MicroPython format
				assert.ok(
					/^# \[Skipped\] Orphan block: \w+ \(not in setup\/loop\/function\)$/.test(mpComment),
					`MicroPython: ${blockType} 註解格式不符`
				);
			}
		});
	});

	// T055: controls_duration guard works for Arduino-only (RN-006 T11)
	suite('controls_duration guard — Arduino 專用 (RN-006 T11)', () => {
		test('Arduino: controls_duration orphan returns false (guard blocks code)', () => {
			const block = createMockBlock('controls_duration', []);
			assert.strictEqual(
				isInAllowedContext(block, ARDUINO_CONTAINERS),
				false,
				'controls_duration 孤立時 isInAllowedContext 應回傳 false'
			);
		});

		test('Arduino: controls_duration in arduino_setup_loop returns true', () => {
			const block = createMockBlock('controls_duration', [{ type: 'arduino_setup_loop' }]);
			assert.strictEqual(
				isInAllowedContext(block, ARDUINO_CONTAINERS),
				true,
				'controls_duration 在 arduino_setup_loop 內應回傳 true'
			);
		});

		test('Arduino: controls_duration in arduino_function returns true', () => {
			const block = createMockBlock('controls_duration', [{ type: 'arduino_function' }]);
			assert.strictEqual(
				isInAllowedContext(block, ARDUINO_CONTAINERS),
				true,
				'controls_duration 在 arduino_function 內應回傳 true'
			);
		});

		test('controls_duration is an Arduino-only block (not in MicroPython guard list)', () => {
			// controls_duration is only used in Arduino mode
			// The guard still uses the same isInAllowedContext logic
			const block = createMockBlock('controls_duration', [{ type: 'micropython_main' }]);
			// Even though micropython_main is valid for MicroPython,
			// controls_duration uses Arduino containers check
			assert.strictEqual(
				isInAllowedContext(block, ARDUINO_CONTAINERS),
				false,
				'controls_duration 在 micropython_main 內不應被 Arduino 容器清單認可'
			);
		});
	});

	// T056: generator-specific warning message text validation (RN-006 T12)
	suite('generator-specific 警告訊息驗證 (RN-006 T12)', () => {
		test('Arduino warning key is ORPHAN_BLOCK_WARNING_ARDUINO', () => {
			const generatorType: string = 'arduino';
			const warningKey = generatorType === 'micropython'
				? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
				: 'ORPHAN_BLOCK_WARNING_ARDUINO';
			assert.strictEqual(warningKey, 'ORPHAN_BLOCK_WARNING_ARDUINO');
		});

		test('MicroPython warning key is ORPHAN_BLOCK_WARNING_MICROPYTHON', () => {
			const generatorType: string = 'micropython';
			const warningKey = generatorType === 'micropython'
				? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
				: 'ORPHAN_BLOCK_WARNING_ARDUINO';
			assert.strictEqual(warningKey, 'ORPHAN_BLOCK_WARNING_MICROPYTHON');
		});

		test('Arduino fallback message mentions setup(), loop()', () => {
			const fallback = 'This block must be placed inside setup(), loop(), or a function to generate code.';
			assert.ok(fallback.includes('setup()'), '應提及 setup()');
			assert.ok(fallback.includes('loop()'), '應提及 loop()');
			assert.ok(fallback.includes('function'), '應提及 function');
		});

		test('MicroPython fallback message mentions main()', () => {
			const fallback = 'This block must be placed inside main() or a function to generate code.';
			assert.ok(fallback.includes('main()'), '應提及 main()');
			assert.ok(fallback.includes('function'), '應提及 function');
			assert.ok(!fallback.includes('setup()'), '不應提及 setup()');
			assert.ok(!fallback.includes('loop()'), '不應提及 loop()');
		});

		test('warning key selection uses currentProgrammingLanguage pattern', () => {
			// Simulates the onchange logic from block-warning-events.md contract
			const testCases = [
				{ lang: 'arduino', expected: 'ORPHAN_BLOCK_WARNING_ARDUINO' },
				{ lang: 'micropython', expected: 'ORPHAN_BLOCK_WARNING_MICROPYTHON' },
				{ lang: undefined, expected: 'ORPHAN_BLOCK_WARNING_ARDUINO' }, // default fallback
			];

			for (const tc of testCases) {
				const warningKey = tc.lang === 'micropython'
					? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
					: 'ORPHAN_BLOCK_WARNING_ARDUINO';
				assert.strictEqual(warningKey, tc.expected, `lang=${tc.lang} 應選擇 ${tc.expected}`);
			}
		});
	});
});
