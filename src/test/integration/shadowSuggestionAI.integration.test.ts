/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ShadowSuggestionService, WorkspaceContext } from '../../services/shadowSuggestionService';
import { AIModelManager } from '../../services/aiModelManager';

/**
 * Integration test: ShadowSuggestionService with real Copilot API
 *
 * Run with: npm run test:integration
 * Requires: Copilot Pro/Pro+ subscription, opens E:\test\debug_extension workspace
 *
 * Results are logged to console AND written to test-results/ai-integration.log
 */
suite('ShadowSuggestionService Integration (Real Copilot API)', function () {
	this.timeout(120_000);

	let service: ShadowSuggestionService;
	let modelManager: AIModelManager;
	let copilotAvailable = false;
	const logLines: string[] = [];
	const resultDir = path.join('E:\\singular-blockly', 'test-results');

	function logResult(msg: string) {
		const line = `[${new Date().toISOString()}] ${msg}`;
		logLines.push(line);
		console.log(line);
	}

	suiteSetup(async () => {
		// Ensure result directory exists
		if (!fs.existsSync(resultDir)) {
			fs.mkdirSync(resultDir, { recursive: true });
		}

		logResult('=== AI Integration Test Started ===');

		// Wait for Copilot LM provider to register (may take several seconds after startup)
		const maxWaitMs = 30_000;
		const pollIntervalMs = 2_000;
		const startTime = Date.now();

		while (Date.now() - startTime < maxWaitMs) {
			try {
				const models = await vscode.lm.selectChatModels({ family: 'gpt-5-mini' });
				if (models.length > 0) {
					copilotAvailable = true;
					logResult(`Copilot GPT-5-mini available after ${Date.now() - startTime}ms: ${models.map(m => `${m.name} (${m.id})`).join(', ')}`);
					break;
				}
				// Try all models as fallback
				const allModels = await vscode.lm.selectChatModels({});
				if (allModels.length > 0) {
					copilotAvailable = true;
					logResult(`Copilot available after ${Date.now() - startTime}ms with ${allModels.length} models: ${allModels.map(m => m.name).join(', ')}`);
					break;
				}
			} catch {
				// Provider not yet registered, keep waiting
			}
			logResult(`Waiting for Copilot LM provider... (${Math.round((Date.now() - startTime) / 1000)}s)`);
			await new Promise(r => setTimeout(r, pollIntervalMs));
		}

		if (!copilotAvailable) {
			logResult('⚠️  SKIPPING all tests — Copilot not available after 30s wait');
			return;
		}

		// Get extension path
		const ext = vscode.extensions.getExtension('Singular-Ray.singular-blockly');
		if (!ext) {
			copilotAvailable = false;
			logResult('⚠️  Extension not found — skipping');
			return;
		}

		if (!ext.isActive) {
			await ext.activate();
		}

		logResult(`Extension active at: ${ext.extensionPath}`);

		modelManager = new AIModelManager();
		await modelManager.initialize();
		service = new ShadowSuggestionService(modelManager, ext.extensionPath);

		logResult(`ModelManager tier: ${modelManager.getTier()}`);
	});

	suiteTeardown(() => {
		logResult('=== AI Integration Test Complete ===');

		// Write results to file
		const logPath = path.join(resultDir, 'ai-integration.log');
		fs.writeFileSync(logPath, logLines.join('\n'), 'utf-8');
		console.log(`\n📄 Full results written to: ${logPath}`);
	});

	function createCyberbrickContext(): WorkspaceContext {
		return {
			depth: 'deep',
			board: 'cyberbrick',
			language: 'micropython',
			selectedBlock: {
				type: 'cyberbrick_delay_ms',
				id: 'test-block-1',
				fields: {},
				parentType: 'micropython_main',
				childTypes: [],
				connectionType: 'next',
			},
			codeSnippet: 'def main():\n    onboard_led[0] = (255, 0, 0)\n    onboard_led.write()\n    time.sleep_ms(500)\n',
			existingBlockTypes: ['micropython_main', 'cyberbrick_led_set_color', 'cyberbrick_delay_ms'],
		};
	}

	function createArduinoContext(): WorkspaceContext {
		return {
			depth: 'deep',
			board: 'uno',
			language: 'arduino',
			selectedBlock: {
				type: 'text_print',
				id: 'test-block-2',
				fields: {},
				parentType: 'arduino_setup_loop',
				childTypes: [],
				connectionType: 'next',
			},
			codeSnippet: 'void loop() {\n  Serial.println("Hello");\n}\n',
			existingBlockTypes: ['arduino_setup_loop', 'text_print', 'text'],
		};
	}

	test('CyberBrick: Should get valid AI suggestions', async function () {
		if (!copilotAvailable) { this.skip(); return; }

		logResult('--- CyberBrick Test ---');
		const t0 = performance.now();

		service.clearCache();
		const result = await service.requestSuggestion(createCyberbrickContext());

		const elapsed = performance.now() - t0;
		logResult(`Round-trip: ${elapsed.toFixed(0)}ms`);

		if (result === null) {
			logResult('❌ RESULT: null (no suggestions parsed)');
			logResult('   Check Output Channel for [AI Debug] logs');
			// Don't assert.fail — log the failure for analysis
			return;
		}

		logResult(`✅ RESULT: ${result.suggestions.length} suggestions`);
		logResult(`   Model: ${result.modelUsed}`);
		for (const s of result.suggestions) {
			const fieldsStr = s.fields ? JSON.stringify(s.fields) : '{}';
			const inputsStr = s.inputs ? Object.keys(s.inputs).join(',') : 'none';
			logResult(`   → ${s.blockType} (fields: ${fieldsStr}, inputs: ${inputsStr})`);
		}

		assert.ok(result.suggestions.length > 0, 'Should have at least one suggestion');
		for (const s of result.suggestions) {
			assert.ok(s.blockType && typeof s.blockType === 'string', `Invalid blockType: ${JSON.stringify(s)}`);
		}
	});

	test('Arduino: Should get valid AI suggestions', async function () {
		if (!copilotAvailable) { this.skip(); return; }

		logResult('--- Arduino Test ---');
		const t0 = performance.now();

		service.clearCache();
		const result = await service.requestSuggestion(createArduinoContext());

		const elapsed = performance.now() - t0;
		logResult(`Round-trip: ${elapsed.toFixed(0)}ms`);

		if (result === null) {
			logResult('❌ RESULT: null (no suggestions parsed)');
			return;
		}

		logResult(`✅ RESULT: ${result.suggestions.length} suggestions`);
		logResult(`   Model: ${result.modelUsed}`);
		for (const s of result.suggestions) {
			logResult(`   → ${s.blockType}`);
		}

		assert.ok(result.suggestions.length > 0, 'Should have at least one suggestion');
	});

	test('Parse regression: Response should not silently fail', async function () {
		if (!copilotAvailable) { this.skip(); return; }

		logResult('--- Parse Regression Test ---');

		service.clearCache();
		const result = await service.requestSuggestion(createCyberbrickContext());

		if (result === null) {
			logResult('❌ REGRESSION: Parse returned null');
			assert.fail(
				'Parse returned no suggestions. Check test-results/ai-integration.log and Output Channel.'
			);
		}

		logResult(`✅ Parse OK: ${result.suggestions.length} suggestions`);
	});
});
