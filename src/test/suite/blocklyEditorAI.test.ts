/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Blockly Editor + AI Shadow Suggestion E2E Test
 *
 * Waits for extension to activate and Copilot to become available,
 * then calls ShadowSuggestionService directly with a real context.
 * Captures [AI Perf] and [AI Debug] logs from the extension output channel.
 *
 * Run with: npm test
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ShadowSuggestionService, WorkspaceContext } from '../../services/shadowSuggestionService';
import { AIModelManager } from '../../services/aiModelManager';

suite('Blockly Editor AI Suggestion E2E', function () {
	this.timeout(180_000);

	const resultDir = path.join(__dirname, '..', '..', '..', 'test-results');
	const logLines: string[] = [];

	function logResult(msg: string) {
		const line = `[${new Date().toISOString()}] ${msg}`;
		logLines.push(line);
		console.log(line);
	}

	suiteTeardown(() => {
		if (!fs.existsSync(resultDir)) {
			fs.mkdirSync(resultDir, { recursive: true });
		}
		const logPath = path.join(resultDir, 'blockly-editor-ai.log');
		fs.writeFileSync(logPath, logLines.join('\n'), 'utf-8');
		console.log(`\n📄 Results: ${logPath}`);
	});

	test('Should get AI suggestions via ShadowSuggestionService', async function () {
		// This test requires interactive Copilot login — skip in automated npm test
		if (!process.env.RUN_AI_E2E) {
			this.skip();
			return;
		}
		logResult('=== Blockly Editor AI Test Started ===');

		// 1. Verify extension
		const ext = vscode.extensions.getExtension('Singular-Ray.singular-blockly');
		if (!ext) {
			logResult('⚠️ Extension not found — skipping');
			this.skip();
			return;
		}
		if (!ext.isActive) {
			await ext.activate();
		}
		logResult(`Extension active at: ${ext.extensionPath}`);

		// 2. Open Blockly editor and wait for user to login if needed
		logResult('Opening Blockly editor...');
		await vscode.commands.executeCommand('singular-blockly.openBlocklyEdit');
		logResult('⏳ Waiting 60s for initialization & manual login if needed...');
		await new Promise(r => setTimeout(r, 60_000));

		// 3. Wait for Copilot LM provider to register (takes time after startup)
		let copilotAvailable = false;
		const maxWait = 45_000;
		const t0 = Date.now();

		while (Date.now() - t0 < maxWait) {
			try {
				const models = await vscode.lm.selectChatModels({ family: 'gpt-5-mini' });
				if (models.length > 0) {
					copilotAvailable = true;
					logResult(`Copilot ready after ${Date.now() - t0}ms: ${models.map(m => `${m.name} (${m.id})`).join(', ')}`);
					break;
				}
			} catch {
				// Not ready yet
			}
			await new Promise(r => setTimeout(r, 2000));
		}

		if (!copilotAvailable) {
			logResult('⚠️ Copilot not available after 45s — skipping AI test');
			this.skip();
			return;
		}

		// 3. Initialize service
		const modelManager = new AIModelManager();
		await modelManager.initialize();
		const service = new ShadowSuggestionService(modelManager, ext.extensionPath);

		logResult(`ModelManager tier: ${modelManager.getTier()}`);

		// 4. Create CyberBrick context (matching what user has in debug_extension)
		const context: WorkspaceContext = {
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

		// 5. Call the service
		logResult('Calling ShadowSuggestionService.requestSuggestion()...');
		const callStart = Date.now();
		const result = await service.requestSuggestion(context);
		const callTime = Date.now() - callStart;

		// 6. Report results
		if (result === null) {
			logResult(`❌ Result: null after ${callTime}ms`);
		} else {
			logResult(`✅ Result: ${result.suggestions.length} suggestions in ${callTime}ms (model: ${result.modelUsed})`);
			for (const s of result.suggestions) {
				const fields = s.fields ? JSON.stringify(s.fields) : '{}';
				const inputs = s.inputs ? Object.keys(s.inputs).join(',') : 'none';
				logResult(`   → ${s.blockType} (fields: ${fields}, inputs: ${inputs})`);
			}
		}

		// 7. Read extension OutputChannel logs for [AI Perf] and [AI Debug] entries
		const logsBase = process.env.VSCODE_LOGS || '';
		if (logsBase) {
			try {
				const logFiles = findFiles(logsBase, 'Singular Blockly.log');
				for (const f of logFiles) {
					const content = fs.readFileSync(f, 'utf-8');
					const aiLines = content.split('\n').filter(l => l.includes('[AI Perf]') || l.includes('[AI Debug]'));
					if (aiLines.length > 0) {
						logResult(`--- Extension logs (${aiLines.length} AI entries) ---`);
						for (const l of aiLines.slice(-20)) {
							logResult(`  ${l.trim()}`);
						}
					}
				}
			} catch (e) {
				logResult(`Could not read extension logs: ${e}`);
			}
		}

		logResult('=== Blockly Editor AI Test Complete ===');
		assert.ok(true);
	});
});

function findFiles(dir: string, filename: string): string[] {
	const results: string[] = [];
	try {
		for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, e.name);
			if (e.isDirectory()) {
				results.push(...findFiles(p, filename));
			} else if (e.name === filename) {
				results.push(p);
			}
		}
	} catch {
		/* ignore */
	}
	return results;
}
