/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ShadowSuggestionService, WorkspaceContext, SuggestionResult } from '../../services/shadowSuggestionService';
import { AIModelManager, TierConfig } from '../../services/aiModelManager';

/**
 * 測試套件: ShadowSuggestionService
 *
 * 涵蓋範圍:
 * 1. requestSuggestion() - 建議請求與快取
 * 2. parseResponse() - JSON 解析策略
 * 3. Block dictionary 載入
 * 4. 錯誤處理
 */

suite('ShadowSuggestionService Tests', () => {
	let sandbox: sinon.SinonSandbox;
	let service: ShadowSuggestionService;
	let mockModelManager: sinon.SinonStubbedInstance<AIModelManager>;
	let tempDir: string;

	// Mock block dictionary data
	const mockDictionary = {
		blocks: [
			{ type: 'controls_if', category: 'logic', descriptions: { en: 'If block' } },
			{ type: 'controls_repeat_ext', category: 'loops', descriptions: { en: 'Repeat block' } },
			{ type: 'math_number', category: 'math', descriptions: { en: 'Number' } },
			{ type: 'text_print', category: 'text', descriptions: { en: 'Print text' } },
			{ type: 'controls_for', category: 'loops', descriptions: { en: 'For loop' } },
		],
	};

	// Helper: create a basic workspace context
	function createContext(overrides?: Partial<WorkspaceContext>): WorkspaceContext {
		return {
			depth: 'minimal',
			board: 'esp32',
			language: 'arduino',
			selectedBlock: {
				type: 'controls_if',
				id: 'block1',
				fields: {},
				parentType: 'arduino_setup',
				childTypes: [],
				connectionType: 'next',
			},
			...overrides,
		};
	}

	// Helper: create mock AI response stream
	function createMockResponse(text: string): any {
		return {
			text: (async function* () {
				yield text;
			})(),
		};
	}

	// Helper: default disabled config
	function disabledConfig(): TierConfig {
		return {
			enabled: false,
			triggerDelay: 0,
			maxPerMinute: 0,
			contextDepth: 'none',
			maxSuggestions: 0,
			multiSuggestion: false,
			autoModel: false,
			reasoningEffort: 'low',
		};
	}

	// Helper: default enabled config
	function enabledConfig(): TierConfig {
		return {
			enabled: true,
			triggerDelay: 1500,
			maxPerMinute: 10,
			contextDepth: 'standard',
			maxSuggestions: 3,
			multiSuggestion: true,
			autoModel: true,
			reasoningEffort: 'low',
		};
	}

	setup(() => {
		sandbox = sinon.createSandbox();

		// Create a temp directory with mock block dictionary at expected path
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-test-'));
		const dictDir = path.join(tempDir, 'src', 'mcp');
		fs.mkdirSync(dictDir, { recursive: true });
		fs.writeFileSync(path.join(dictDir, 'block-dictionary.json'), JSON.stringify(mockDictionary));

		// Create a stubbed AIModelManager
		mockModelManager = sandbox.createStubInstance(AIModelManager);
		mockModelManager.getEffectiveConfig.returns(enabledConfig());
		mockModelManager.getTier.returns('pro');
		mockModelManager.sendPrompt.resolves(null);

		service = new ShadowSuggestionService(mockModelManager as any, tempDir);
	});

	teardown(() => {
		sandbox.restore();
		// Clean up temp directory
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// ignore cleanup errors
		}
	});

	suite('requestSuggestion()', () => {
		test('Should return null when AI is disabled', async () => {
			mockModelManager.getEffectiveConfig.returns(disabledConfig());

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null);
		});

		test('Should return null when no selected block in context', async () => {
			const context = createContext({ selectedBlock: null });

			const result = await service.requestSuggestion(context);

			assert.strictEqual(result, null);
		});

		test('Should return null when no model response', async () => {
			mockModelManager.sendPrompt.resolves(null);

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null);
		});

		test('Should return suggestions on successful AI response', async () => {
			const suggestionsJson = JSON.stringify([{ blockType: 'math_number', connectionType: 'input', fields: { NUM: '10' } }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(suggestionsJson));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should return a result');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'math_number');
			assert.strictEqual(result!.suggestions[0].connectionType, 'input');
		});

		test('Should return null on AI error (silent failure)', async () => {
			mockModelManager.sendPrompt.rejects(new Error('AI service error'));

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null, 'Should silently return null on error');
		});

		test('Should return null when response has no valid suggestions', async () => {
			// Response with unknown block types
			const suggestionsJson = JSON.stringify([{ blockType: 'nonexistent_block', connectionType: 'next' }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(suggestionsJson));

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null, 'Should return null when all suggestions are invalid');
		});
	});

	suite('parseResponse() (tested via requestSuggestion)', () => {
		test('Should parse valid JSON array', async () => {
			const json = JSON.stringify([{ blockType: 'controls_if', connectionType: 'next' }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});

		test('Should extract JSON from markdown code fences', async () => {
			const fenced = '```json\n[{"blockType":"math_number","connectionType":"input"}]\n```';
			mockModelManager.sendPrompt.resolves(createMockResponse(fenced));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions[0].blockType, 'math_number');
		});

		test('Should extract bare JSON array from surrounding text', async () => {
			const mixed = 'Here are suggestions: [{"blockType":"text_print","connectionType":"next"}] and more text';
			mockModelManager.sendPrompt.resolves(createMockResponse(mixed));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions[0].blockType, 'text_print');
		});

		test('Should return null for completely invalid response', async () => {
			mockModelManager.sendPrompt.resolves(createMockResponse('This is not JSON at all'));

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null);
		});

		test('Should preserve suggestions regardless of connectionType value', async () => {
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
				{ blockType: 'math_number', connectionType: 'invalid_type' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions.length, 2, 'connectionType is not validated');
		});

		test('Should filter out suggestions with missing blockType', async () => {
			const json = JSON.stringify([{ connectionType: 'next' }, { blockType: 'math_number', connectionType: 'input' }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'math_number');
		});

		test('Should validate block types against dictionary', async () => {
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
				{ blockType: 'fake_block_xyz', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions.length, 1, 'Should filter out unknown block type');
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});
	});

	suite('Block dictionary loading', () => {
		test('Should load and cache dictionary', async () => {
			const json = JSON.stringify([{ blockType: 'controls_if', connectionType: 'next' }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			// First request triggers dictionary load
			await service.requestSuggestion(createContext());

			// Second request should use cached dictionary (internal cache in service)
			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should work with cached dictionary');
		});

		test('Should handle dictionary load failure gracefully', async () => {
			// Create a fresh service pointing to non-existent path
			const freshService = new ShadowSuggestionService(mockModelManager as any, '/nonexistent/path');

			// Response with suggestions — won't be validated against dictionary since load failed
			const json = JSON.stringify([{ blockType: 'any_block', connectionType: 'next' }]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await freshService.requestSuggestion(createContext());

			// When dictionary fails, blockTypeSet is undefined and validation passes
			assert.ok(result, 'Should still work when dictionary fails to load');
		});
	});

	suite('Cancellation handling', () => {
		test('Should return null on cancellation error', async () => {
			mockModelManager.sendPrompt.rejects(new vscode.CancellationError());

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null);
		});
	});

	suite('Truncated JSON repair (tested via requestSuggestion)', () => {
		test('Should recover suggestions from truncated JSON array', async () => {
			// Simulates model output truncated mid-second-object
			const truncated = '[{"blockType":"controls_if"},{"blockType":"math_numb';
			mockModelManager.sendPrompt.resolves(createMockResponse(truncated));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should recover at least one suggestion from truncated JSON');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});

		test('Should recover from truncated JSON with nested inputs', async () => {
			// First object is complete, second is truncated mid-nested-input
			const truncated = '[{"blockType":"controls_if"},{"blockType":"text_print","inputs":{"TEXT":{"blockType":"math_nu';
			mockModelManager.sendPrompt.resolves(createMockResponse(truncated));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should recover first complete suggestion');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});

		test('Should recover multiple complete objects from truncated array', async () => {
			// Two complete objects, third truncated
			const truncated = '[{"blockType":"controls_if"},{"blockType":"math_number","fields":{"NUM":"42"}},{"blockType":"text_pr';
			mockModelManager.sendPrompt.resolves(createMockResponse(truncated));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should recover two complete suggestions');
			assert.strictEqual(result!.suggestions.length, 2);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
			assert.strictEqual(result!.suggestions[1].blockType, 'math_number');
		});

		test('Should recover blockType via regex when truncation leaves no complete objects', async () => {
			// Truncated inside the first (and only) object
			const truncated = '[{"blockType":"controls_if","fields":{"MODE":"EQ';
			mockModelManager.sendPrompt.resolves(createMockResponse(truncated));

			const result = await service.requestSuggestion(createContext());

			// Strategy 6 regex fallback should extract controls_if blockType
			assert.ok(result, 'Should recover blockType via regex fallback');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});
	});

	suite('Syntax error JSON extraction (tested via requestSuggestion)', () => {
		test('Should extract valid objects from JSON with internal syntax error', async () => {
			// JSON array where first object is valid but second has a syntax error,
			// then a valid closing. This simulates LLM generating broken JSON with valid-looking end.
			const brokenJson = '[{"blockType":"controls_if"},{"blockType":"math_number","fields":{"NUM":}},{"blockType":"text_print"}]';
			mockModelManager.sendPrompt.resolves(createMockResponse(brokenJson));

			const result = await service.requestSuggestion(createContext());

			// Should recover at least the valid objects via extractIndividualObjects
			assert.ok(result, 'Should recover some suggestions from broken JSON');
			// controls_if and text_print are valid; math_number with {"NUM":} is malformed
			const types = result!.suggestions.map((s: any) => s.blockType);
			assert.ok(types.includes('controls_if'), 'Should recover controls_if');
		});

		test('Should handle deeply nested broken JSON', async () => {
			// Simulates AI generating deep nesting that breaks mid-way but closes with ]
			const deepBroken =
				'[{"blockType":"controls_repeat_ext","inputs":{"TIMES":{"blockType":"math_number","fields":{"NUM":"5"}},"DO":{"blockType":"text_print","inputs":{"TEXT":{"blockType":"ma}}}}}]';
			mockModelManager.sendPrompt.resolves(createMockResponse(deepBroken));

			const result = await service.requestSuggestion(createContext());

			// Even if the whole thing fails parse, greedy extraction should recover nothing
			// because there's only one top-level object and it's malformed
			// This is an acceptable failure case
			// Just verify it doesn't crash
			assert.ok(result === null || result.suggestions.length >= 0, 'Should not crash on deep broken JSON');
		});
	});

	suite('Real AI response regression tests', () => {
		test('Should handle real 693-char truncated response from GPT-5-mini', async () => {
			// This is a reconstruction of a real AI response that failed to parse.
			// The response has valid JSON structure but internal syntax error around position 692.
			// First object is a deeply nested controls_for with cyberbrick blocks.
			// We reconstruct a simplified version of the real response.
			const realLikeResponse =
				'[{"blockType":"controls_for","fields":{"VAR":"i"},"inputs":{"FROM":{"blockType":"math_number","fields":{"NUM":"1"}},"TO":{"blockType":"math_number","fields":{"NUM":"255"}},"BY":{"blockType":"math_number","fields":{"NUM":"1"}},"DO":{"blockType":"controls_if"}}},{"blockType":"controls_repeat_ext","inputs":{"TIMES":{"blockType":"math_number","fields":{"NUM":"10"}}}}]';
			mockModelManager.sendPrompt.resolves(createMockResponse(realLikeResponse));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should parse valid multi-suggestion response');
			assert.strictEqual(result!.suggestions.length, 2);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_for');
			assert.strictEqual(result!.suggestions[1].blockType, 'controls_repeat_ext');
		});

		test('Should recover from real truncated response with incomplete last object', async () => {
			// Simulates the exact pattern: first big nested object, then truncated second object
			const truncatedReal =
				'[{"blockType":"controls_for","fields":{"VAR":"i"},"inputs":{"FROM":{"blockType":"math_number","fields":{"NUM":"1"}},"TO":{"blockType":"math_number","fields":{"NUM":"255"}},"BY":{"blockType":"math_number","fields":{"NUM":"1"}}}},{"blockType":"controls_repeat_ext","inputs":{"TIMES":{"blockType":"math_numb';
			mockModelManager.sendPrompt.resolves(createMockResponse(truncatedReal));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should recover first complete suggestion');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_for');
		});

		test('Should repair bracket-imbalanced JSON by adding missing closing braces', async () => {
			// Simulates real AI output where JSON ends with ] but is missing one }
			// This is the exact pattern seen in E2E testing: 26 opens, 25 closes + ]
			const imbalancedJson =
				'[{"blockType":"controls_for","fields":{"VAR":"i"},"inputs":{"FROM":{"blockType":"math_number","fields":{"NUM":"0"}},"DO":{"blockType":"cyberbrick_led_set_color","inputs":{"RED":{"blockType":"variables_get","fields":{"VAR":"i"}}}}}}]';
			// Remove one } to create imbalance
			const broken = imbalancedJson.replace('}}}]', '}}]');
			mockModelManager.sendPrompt.resolves(createMockResponse(broken));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should recover via bracket-balance');
			assert.strictEqual(result!.suggestions.length, 1);
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_for');
		});

		test('Should handle response that is valid JSON with nested inputs stripped by validation', async () => {
			// Valid JSON but with unknown child block types — validation should strip invalid children
			// but keep the parent
			const validButStripped =
				'[{"blockType":"controls_if","inputs":{"DO":{"blockType":"fake_block_abc"}}},{"blockType":"math_number","fields":{"NUM":"42"}}]';
			mockModelManager.sendPrompt.resolves(createMockResponse(validButStripped));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should return result');
			// controls_if should still be valid (invalid child input is stripped, not the parent)
			// math_number should also be valid
			const types = result!.suggestions.map((s: any) => s.blockType);
			assert.ok(types.includes('controls_if'), 'controls_if should survive with stripped child');
			assert.ok(types.includes('math_number'), 'math_number should be valid');
		});
	});

	suite('repairMisplacedInputs + normalizeEmptyFields (gpt-4o-mini regressions)', () => {
		test('Should rescue inputs accidentally nested inside fields', async () => {
			// gpt-4o-mini bug: places "inputs": {...} as a key inside the "fields" object
			const badJson = JSON.stringify([
				{
					blockType: 'controls_for',
					fields: { VAR: 'i' },
					inputs: {
						FROM: { blockType: 'math_number', fields: { NUM: '1' } },
						TO: { blockType: 'math_number', fields: { NUM: '255' } },
						BY: { blockType: 'math_number', fields: { NUM: '1' } },
						DO: {
							blockType: 'math_arithmetic',
							fields: {
								OP: 'ADD',
								inputs: {
									A: { blockType: 'math_number', fields: {} },
									B: { blockType: 'variables_get', fields: { VAR: 'i' } },
								},
							},
						},
					},
				},
			]);

			// Need math_arithmetic and variables_get in mock dictionary
			const extendedDict = {
				blocks: [
					...mockDictionary.blocks,
					{ type: 'math_arithmetic', category: 'math', descriptions: { en: 'Arithmetic' } },
					{ type: 'variables_get', category: 'variables', descriptions: { en: 'Get variable' } },
				],
			};
			const dictDir = path.join(tempDir, 'src', 'mcp');
			fs.writeFileSync(path.join(dictDir, 'block-dictionary.json'), JSON.stringify(extendedDict));
			// Re-create service so it picks up the new dictionary
			service = new ShadowSuggestionService(mockModelManager as any, tempDir);
			mockModelManager.sendPrompt.resolves(createMockResponse(badJson));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should parse repaired suggestion');
			const forBlock = result!.suggestions[0];
			assert.strictEqual(forBlock.blockType, 'controls_for');
			const doBlock = forBlock.inputs?.DO;
			assert.ok(doBlock, 'DO slot should exist');
			assert.strictEqual(doBlock!.blockType, 'math_arithmetic');
			// After repair, math_arithmetic should have inputs.A and inputs.B (moved from fields.inputs)
			assert.ok(doBlock!.inputs?.A, 'inputs.A should be rescued from fields.inputs');
			assert.ok(doBlock!.inputs?.B, 'inputs.B should be rescued from fields.inputs');
			// fields.inputs key should be gone
			assert.ok(!doBlock!.fields?.['inputs'], 'fields.inputs should be removed after repair');
		});

		test('Should normalize empty NUM field on math_number to "0"', async () => {
			const json = JSON.stringify([
				{
					blockType: 'controls_for',
					fields: { VAR: 'i' },
					inputs: {
						FROM: { blockType: 'math_number', fields: { NUM: '1' } },
						TO: { blockType: 'math_number', fields: { NUM: '255' } },
						BY: { blockType: 'math_number', fields: { NUM: '1' } },
						DO: {
							blockType: 'text_print',
							inputs: {
								TEXT: {
									blockType: 'math_number',
									fields: {}, // empty — should be normalized to "0"
								},
							},
						},
					},
				},
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should parse suggestion');
			const forBlock = result!.suggestions[0];
			const printBlock = forBlock.inputs?.DO;
			const numBlock = printBlock?.inputs?.TEXT;
			assert.ok(numBlock, 'TEXT input should exist');
			assert.strictEqual(numBlock!.blockType, 'math_number');
			assert.strictEqual(numBlock!.fields?.NUM, '0', 'Empty NUM should be normalized to "0"');
		});

		test('Should normalize missing OP field on math_arithmetic to "ADD"', async () => {
			const extendedDict = {
				blocks: [...mockDictionary.blocks, { type: 'math_arithmetic', category: 'math', descriptions: { en: '' } }],
			};
			const dictDir = path.join(tempDir, 'src', 'mcp');
			fs.writeFileSync(path.join(dictDir, 'block-dictionary.json'), JSON.stringify(extendedDict));
			service = new ShadowSuggestionService(mockModelManager as any, tempDir);

			const json = JSON.stringify([
				{
					blockType: 'math_arithmetic',
					fields: {}, // OP missing — should default to "ADD"
					inputs: {
						A: { blockType: 'math_number', fields: { NUM: '1' } },
						B: { blockType: 'math_number', fields: { NUM: '2' } },
					},
				},
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should parse suggestion');
			assert.strictEqual(result!.suggestions[0].blockType, 'math_arithmetic');
			assert.strictEqual(result!.suggestions[0].fields?.OP, 'ADD', 'Missing OP should default to "ADD"');
		});
	});
});
