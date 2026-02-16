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
			autoTrigger: false,
			triggerDelay: 0,
			maxPerMinute: 0,
			contextDepth: 'none',
			maxSuggestions: 0,
			multiSuggestion: false,
			autoModel: false,
		};
	}

	// Helper: default enabled config
	function enabledConfig(): TierConfig {
		return {
			enabled: true,
			autoTrigger: true,
			triggerDelay: 1500,
			maxPerMinute: 10,
			contextDepth: 'standard',
			maxSuggestions: 3,
			multiSuggestion: true,
			autoModel: true,
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
			const suggestionsJson = JSON.stringify([
				{ blockType: 'math_number', connectionType: 'input', fields: { NUM: '10' } },
			]);
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

		test('Should return cached result for same context', async () => {
			const suggestionsJson = JSON.stringify([
				{ blockType: 'controls_repeat_ext', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(suggestionsJson));

			const context = createContext();

			// First call: should call sendPrompt
			const result1 = await service.requestSuggestion(context);
			assert.ok(result1);

			// Second call: should use cache (sendPrompt not called again)
			const sendPromptCallCount = mockModelManager.sendPrompt.callCount;
			const result2 = await service.requestSuggestion(context);

			assert.ok(result2);
			assert.deepStrictEqual(result1!.suggestions, result2!.suggestions);
			assert.strictEqual(mockModelManager.sendPrompt.callCount, sendPromptCallCount,
				'Should not call sendPrompt again for cached context');
		});

		test('Should return null when response has no valid suggestions', async () => {
			// Response with unknown block types
			const suggestionsJson = JSON.stringify([
				{ blockType: 'nonexistent_block', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(suggestionsJson));

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null, 'Should return null when all suggestions are invalid');
		});
	});

	suite('parseResponse() (tested via requestSuggestion)', () => {
		test('Should parse valid JSON array', async () => {
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
			]);
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

		test('Should filter out suggestions with invalid connectionType', async () => {
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
				{ blockType: 'math_number', connectionType: 'invalid_type' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await service.requestSuggestion(createContext());

			assert.ok(result);
			assert.strictEqual(result!.suggestions.length, 1, 'Should filter out invalid suggestion');
			assert.strictEqual(result!.suggestions[0].blockType, 'controls_if');
		});

		test('Should filter out suggestions with missing blockType', async () => {
			const json = JSON.stringify([
				{ connectionType: 'next' },
				{ blockType: 'math_number', connectionType: 'input' },
			]);
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
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			// First request triggers dictionary load
			await service.requestSuggestion(createContext());

			// Clear suggestion cache so it calls sendPrompt again
			service.clearCache();
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			// Second request should use cached dictionary (internal cache in service)
			const result = await service.requestSuggestion(createContext());

			assert.ok(result, 'Should work with cached dictionary');
		});

		test('Should handle dictionary load failure gracefully', async () => {
			// Create a fresh service pointing to non-existent path
			const freshService = new ShadowSuggestionService(mockModelManager as any, '/nonexistent/path');

			// Response with suggestions — won't be validated against dictionary since load failed
			const json = JSON.stringify([
				{ blockType: 'any_block', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			const result = await freshService.requestSuggestion(createContext());

			// When dictionary fails, blockTypeSet is undefined and validation passes
			assert.ok(result, 'Should still work when dictionary fails to load');
		});
	});

	suite('clearCache()', () => {
		test('Should clear all cached suggestions', async () => {
			const json = JSON.stringify([
				{ blockType: 'controls_if', connectionType: 'next' },
			]);
			mockModelManager.sendPrompt.resolves(createMockResponse(json));

			await service.requestSuggestion(createContext());

			service.clearCache();

			// After clearing, next call should trigger sendPrompt again
			mockModelManager.sendPrompt.resolves(createMockResponse(json));
			const callCountBefore = mockModelManager.sendPrompt.callCount;

			await service.requestSuggestion(createContext());

			assert.ok(mockModelManager.sendPrompt.callCount > callCountBefore,
				'Should call sendPrompt after cache clear');
		});
	});

	suite('Cancellation handling', () => {
		test('Should return null on cancellation error', async () => {
			mockModelManager.sendPrompt.rejects(new vscode.CancellationError());

			const result = await service.requestSuggestion(createContext());

			assert.strictEqual(result, null);
		});
	});
});
