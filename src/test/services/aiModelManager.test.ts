/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { AIModelManager, CopilotTier, TIER_DEFAULTS, getModelMaxOutputTokens } from '../../services/aiModelManager';

/**
 * 測試套件: AIModelManager
 *
 * 涵蓋範圍:
 * 1. detectCopilotTier() - 層級偵測邏輯
 * 2. listAvailableModels() - 列出模型
 * 3. selectModel() - 模型選取與回退
 * 4. getEffectiveConfig() - 設定合併
 * 5. sendPrompt() - 請求與重試
 * 6. dispose() - 資源清理
 *
 * 注意: vscode.lm 在測試環境中存在且為 non-configurable 屬性，
 * 因此我們直接 stub vscode.lm.selectChatModels 方法。
 */

suite('AIModelManager Tests', () => {
	let sandbox: sinon.SinonSandbox;
	let manager: AIModelManager;
	let selectChatModelsStub: sinon.SinonStub;
	let getConfigurationStub: sinon.SinonStub;

	// Whether vscode.lm is available and stubbable
	const lmAvailable = typeof vscode.lm !== 'undefined' && typeof vscode.lm.selectChatModels === 'function';

	// Helper: create mock model objects
	function createMockModel(family: string, name?: string): any {
		return {
			family,
			name: name || family,
			id: `${family}-2024`,
			vendor: 'copilot',
			version: '1.0',
			maxInputTokens: 4096,
			sendRequest: sandbox.stub(),
			countTokens: sandbox.stub(),
		};
	}

	setup(function () {
		sandbox = sinon.createSandbox();

		if (!lmAvailable) {
			// If vscode.lm is not available, skip tests that need it
			this.skip();
			return;
		}

		// Stub the selectChatModels method on the existing vscode.lm object
		selectChatModelsStub = sandbox.stub(vscode.lm, 'selectChatModels');

		// Stub workspace configuration
		getConfigurationStub = sandbox.stub(vscode.workspace, 'getConfiguration');
		getConfigurationStub.returns({
			get: sandbox.stub().callsFake((_key: string, defaultValue: any) => defaultValue),
		} as any);

		manager = new AIModelManager();
	});

	teardown(() => {
		if (manager) {
			manager.dispose();
		}
		sandbox.restore();
	});

	function configureEnabled(enabled: boolean): void {
		getConfigurationStub.returns({
			get: (key: string, defaultValue: unknown) => key === 'enabled' ? enabled : defaultValue,
		} as any);
	}

	function deferredModels(): { promise: Promise<any[]>; resolve: (models: any[]) => void } {
		let resolve!: (models: any[]) => void;
		const promise = new Promise<any[]>(res => { resolve = res; });
		return { promise, resolve };
	}

	suite('initialize lifecycle', () => {
		test('Disabled AI does not discover models or start a timer', async () => {
			configureEnabled(false);
			await manager.initialize();
			assert.ok(selectChatModelsStub.notCalled);
			assert.strictEqual(manager.isReady(), false);
			assert.strictEqual(manager.getEffectiveConfig().enabled, false);
			assert.strictEqual((manager as any)._redetectTimer, undefined);
		});

		test('Shares pending initialization and becomes ready only after selection', async () => {
			configureEnabled(true);
			const clock = sandbox.useFakeTimers();
			const selected = deferredModels();
			const model = createMockModel('gpt-4o');
			selectChatModelsStub.onFirstCall().resolves([model]);
			selectChatModelsStub.onSecondCall().returns(selected.promise);
			const events: boolean[] = [];
			manager.onDidChangeReadiness(ready => events.push(ready));

			const first = manager.initialize();
			assert.strictEqual(manager.initialize(), first);
			await clock.tickAsync(0);
			assert.strictEqual(manager.getTier(), 'free');
			assert.strictEqual(manager.isReady(), false);
			assert.strictEqual(manager.getEffectiveConfig().enabled, false);
			selected.resolve([model]);
			await first;
			assert.strictEqual(manager.isReady(), true);
			assert.strictEqual(manager.getEffectiveConfig().enabled, true);
			assert.deepStrictEqual(events, [true]);
			const timer = (manager as any)._redetectTimer;
			await manager.initialize();
			assert.strictEqual(selectChatModelsStub.callCount, 2);
			assert.strictEqual((manager as any)._redetectTimer, timer);
		});

		test('Discovery timeout returns safely and ignores a late result, then permits retry', async () => {
			configureEnabled(true);
			const clock = sandbox.useFakeTimers();
			const pending = deferredModels();
			selectChatModelsStub.returns(pending.promise);
			const initialization = manager.initialize();
			await clock.tickAsync(9_999);
			assert.strictEqual(manager.isReady(), false);
			await clock.tickAsync(1);
			await initialization;
			pending.resolve([createMockModel('gpt-4.1')]);
			await clock.tickAsync(0);
			assert.strictEqual(manager.getTier(), 'none');
			assert.strictEqual(manager.getCachedModel(), undefined);
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.initialize();
			assert.strictEqual(manager.isReady(), true);
		});

		test('Model selection timeout never reports ready and ignores its late result', async () => {
			configureEnabled(true);
			const clock = sandbox.useFakeTimers();
			const pending = deferredModels();
			selectChatModelsStub.onFirstCall().resolves([createMockModel('gpt-4o')]);
			selectChatModelsStub.onSecondCall().returns(pending.promise);
			const initialization = manager.initialize();
			await clock.tickAsync(10_000);
			await initialization;
			pending.resolve([createMockModel('gpt-4o')]);
			await clock.tickAsync(0);
			assert.strictEqual(manager.isReady(), false);
			assert.strictEqual(manager.getCachedModel(), undefined);
		});

		for (const failure of ['empty', 'error']) {
			test(`Selection ${failure} leaves AI unavailable despite a detected tier`, async () => {
				configureEnabled(true);
				selectChatModelsStub.onFirstCall().resolves([createMockModel('gpt-4o')]);
				if (failure === 'empty') { selectChatModelsStub.resolves([]); }
				else { selectChatModelsStub.rejects(new Error('Selection unavailable')); }
				await manager.initialize();
				assert.strictEqual(manager.getTier(), 'free');
				assert.strictEqual(manager.isReady(), false);
				assert.strictEqual(manager.getCachedModel(), undefined);
			});
		}

		test('Dispose invalidates a pending fallback selection', async () => {
			configureEnabled(true);
			const clock = sandbox.useFakeTimers();
			const pending = deferredModels();
			selectChatModelsStub.onFirstCall().resolves([createMockModel('gpt-4o')]);
			selectChatModelsStub.onSecondCall().resolves([]);
			selectChatModelsStub.onThirdCall().returns(pending.promise);
			const initialization = manager.initialize();
			await clock.tickAsync(0);
			assert.strictEqual(selectChatModelsStub.callCount, 3);
			manager.dispose();
			await initialization;
			pending.resolve([createMockModel('gpt-4o')]);
			await clock.tickAsync(0);
			assert.strictEqual(manager.getCachedModel(), undefined);
			assert.strictEqual(manager.isReady(), false);
			assert.strictEqual(clock.countTimers(), 0);
		});

		test('A readiness listener disposing the manager cannot create a late timer', async () => {
			configureEnabled(true);
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			manager.onDidChangeReadiness(ready => { if (ready) { manager.dispose(); } });
			await manager.initialize();
			assert.strictEqual(manager.isReady(), false);
			assert.strictEqual((manager as any)._redetectTimer, undefined);
		});

		for (const failure of ['empty', 'error']) {
			test(`Discovery ${failure} leaves AI unavailable and can be retried`, async () => {
				configureEnabled(true);
				if (failure === 'empty') { selectChatModelsStub.resolves([]); }
				else { selectChatModelsStub.rejects(new Error('Provider unavailable')); }
				await manager.initialize();
				assert.strictEqual(manager.isReady(), false);
				assert.strictEqual(manager.getEffectiveConfig().enabled, false);
				selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
				await manager.initialize();
				assert.strictEqual(manager.isReady(), true);
			});
		}

		test('Stop settles pending discovery immediately and re-enabling starts a fresh generation', async () => {
			configureEnabled(true);
			const clock = sandbox.useFakeTimers();
			const pending = deferredModels();
			selectChatModelsStub.returns(pending.promise);
			const old = manager.initialize();
			await clock.tickAsync(0);
			configureEnabled(false);
			manager.stop();
			await old;
			assert.strictEqual(clock.countTimers(), 0);
			configureEnabled(true);
			const model = createMockModel('gpt-4o');
			selectChatModelsStub.resolves([model]);
			await manager.initialize();
			pending.resolve([createMockModel('gpt-4.1')]);
			await clock.tickAsync(0);
			assert.strictEqual(manager.isReady(), true);
			assert.strictEqual(manager.getCachedModel(), model);
			assert.strictEqual(manager.getTier(), 'free');
			assert.strictEqual(clock.countTimers(), 1);
		});

		test('Disabling a ready manager resets readiness, cache and timer', async () => {
			configureEnabled(true);
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.initialize();
			const events: boolean[] = [];
			manager.onDidChangeReadiness(ready => events.push(ready));
			configureEnabled(false);
			assert.strictEqual(manager.isReady(), false);
			await manager.initialize();
			assert.strictEqual(manager.getCachedModel(), undefined);
			assert.strictEqual(manager.getTier(), 'none');
			assert.strictEqual((manager as any)._redetectTimer, undefined);
			assert.deepStrictEqual(events, [false]);
		});

		for (const phase of ['discovery', 'selection']) {
			test(`Dispose during ${phase} ignores late results and creates no timer`, async () => {
				configureEnabled(true);
				const clock = sandbox.useFakeTimers();
				const pending = deferredModels();
				if (phase === 'discovery') { selectChatModelsStub.returns(pending.promise); }
				else {
					selectChatModelsStub.onFirstCall().resolves([createMockModel('gpt-4o')]);
					selectChatModelsStub.onSecondCall().returns(pending.promise);
				}
				const initialization = manager.initialize();
				await clock.tickAsync(0);
				manager.dispose();
				await initialization;
				pending.resolve([createMockModel('gpt-4.1')]);
				await clock.tickAsync(0);
				assert.strictEqual(manager.isReady(), false);
				assert.strictEqual(manager.getCachedModel(), undefined);
				assert.strictEqual(manager.getTier(), 'none');
				assert.strictEqual(clock.countTimers(), 0);
				const calls = selectChatModelsStub.callCount;
				await manager.initialize();
				assert.strictEqual(selectChatModelsStub.callCount, calls);
			});
		}
	});

	suite('detectCopilotTier()', () => {
		test('Should return "none" when selectChatModels returns empty array', async () => {
			selectChatModelsStub.resolves([]);

			const tier = await manager.detectCopilotTier();
			assert.strictEqual(tier, 'none');
		});

		test('Should return "free" when only basic models available (gpt-4o)', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);

			const tier = await manager.detectCopilotTier();
			assert.strictEqual(tier, 'free');
		});

		test('Should return "pro" when mid-tier models available (gpt-4.1)', async () => {
			selectChatModelsStub.resolves([
				createMockModel('gpt-4o'),
				createMockModel('gpt-4.1'),
			]);

			const tier = await manager.detectCopilotTier();
			assert.strictEqual(tier, 'pro');
		});

		test('Should return "pro_plus" when advanced models available (o3)', async () => {
			selectChatModelsStub.resolves([
				createMockModel('gpt-4o'),
				createMockModel('gpt-4.1'),
				createMockModel('o3'),
			]);

			const tier = await manager.detectCopilotTier();
			assert.strictEqual(tier, 'pro_plus');
		});

		test('Should return "none" on API error', async () => {
			selectChatModelsStub.rejects(new Error('API unavailable'));

			const tier = await manager.detectCopilotTier();
			assert.strictEqual(tier, 'none');
		});

		test('Should fire onTierChanged when tier changes', async () => {
			selectChatModelsStub.resolves([]);

			// First detect: sets to 'none' (default is already 'none' so no change on first call)
			await manager.detectCopilotTier();

			// Now change to 'free'
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);

			let firedTier: CopilotTier | undefined;
			const disposable = manager.onTierChanged(tier => {
				firedTier = tier;
			});

			await manager.detectCopilotTier();

			assert.strictEqual(firedTier, 'free', 'Should fire event with new tier');
			disposable.dispose();
		});

		test('Should not fire onTierChanged when tier remains the same', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.detectCopilotTier();

			let fired = false;
			const disposable = manager.onTierChanged(() => {
				fired = true;
			});

			// Detect again with same result
			await manager.detectCopilotTier();

			assert.strictEqual(fired, false, 'Should not fire event when tier unchanged');
			disposable.dispose();
		});
	});

	suite('getTier()', () => {
		test('Should return current tier', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.detectCopilotTier();

			assert.strictEqual(manager.getTier(), 'free');
		});

		test('Should return "none" by default', () => {
			assert.strictEqual(manager.getTier(), 'none');
		});
	});

	suite('getModelMaxOutputTokens()', () => {
		test('Layer 1: returns maxOutputTokens from API property when valid', () => {
			const model = { family: 'gpt-4o', maxOutputTokens: 8192 } as any;
			assert.strictEqual(getModelMaxOutputTokens(model), 8192);
		});

		test('Layer 2: falls back to KNOWN_MAX_OUTPUT_TOKENS for gpt-4.1 (32768)', () => {
			const model = { family: 'gpt-4.1' } as any;
			assert.strictEqual(getModelMaxOutputTokens(model), 32768);
		});

		test('Layer 2: falls back to KNOWN_MAX_OUTPUT_TOKENS for claude-sonnet-4 (16000)', () => {
			const model = { family: 'claude-sonnet-4' } as any;
			assert.strictEqual(getModelMaxOutputTokens(model), 16000);
		});

		test('Layer 3: returns 16384 for unknown model with no API property', () => {
			const model = { family: 'unknown-model-xyz' } as any;
			assert.strictEqual(getModelMaxOutputTokens(model), 16384);
		});

		test('Edge case: ignores maxOutputTokens = 0, falls back to table', () => {
			const model = { family: 'gpt-4.1', maxOutputTokens: 0 } as any;
			assert.strictEqual(getModelMaxOutputTokens(model), 32768);
		});
	});

	suite('listAvailableModels()', () => {
		test('Should return model info array correctly', async () => {
			const mockModels = [
				createMockModel('gpt-4o', 'GPT 4o'),
				createMockModel('gpt-4.1', 'GPT 4.1'),
			];
			selectChatModelsStub.resolves(mockModels);

			const models = await manager.listAvailableModels();

			assert.strictEqual(models.length, 2);
			assert.strictEqual(models[0].family, 'gpt-4o');
			assert.strictEqual(models[0].name, 'GPT 4o');
			assert.strictEqual(models[0].id, 'gpt-4o-2024');
			assert.strictEqual(models[1].family, 'gpt-4.1');
		});

		test('Should return empty array on error', async () => {
			selectChatModelsStub.rejects(new Error('List failed'));

			const models = await manager.listAvailableModels();

			assert.deepStrictEqual(models, []);
		});
	});

	suite('selectModel()', () => {
		test('Should select specified model family', async () => {
			const mockModel = createMockModel('gpt-4.1', 'GPT 4.1');
			selectChatModelsStub.resolves([mockModel]);

			const model = await manager.selectModel('gpt-4.1');

			assert.ok(model, 'Should return a model');
			assert.strictEqual(model!.family, 'gpt-4.1');
		});

		test('Should fall back to any available model when specified family not found', async () => {
			const fallbackModel = createMockModel('gpt-4o', 'GPT 4o');

			// First call (specific family): return empty
			selectChatModelsStub.onFirstCall().resolves([]);
			// Second call (any model): return fallback
			selectChatModelsStub.onSecondCall().resolves([fallbackModel]);

			const model = await manager.selectModel('nonexistent-model');

			assert.ok(model, 'Should return fallback model');
			assert.strictEqual(model!.family, 'gpt-4o');
		});

		test('Should return undefined when no models available', async () => {
			selectChatModelsStub.resolves([]);

			const model = await manager.selectModel();

			assert.strictEqual(model, undefined);
		});

		test('Should return undefined on error', async () => {
			selectChatModelsStub.rejects(new Error('Select failed'));

			const model = await manager.selectModel();

			assert.strictEqual(model, undefined);
		});
	});

	suite('getEffectiveConfig()', () => {
		test('Should return tier defaults when no user settings', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.detectCopilotTier();

			const config = manager.getEffectiveConfig();

			assert.strictEqual(config.enabled, TIER_DEFAULTS.free.enabled);
			assert.strictEqual(config.contextDepth, TIER_DEFAULTS.free.contextDepth);
			assert.strictEqual(config.maxSuggestions, TIER_DEFAULTS.free.maxSuggestions);
		});

		test('Should merge user settings over tier defaults', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.detectCopilotTier();

			// User overrides 'enabled' to false
			getConfigurationStub.returns({
				get: sandbox.stub().callsFake((key: string, defaultValue: any) => {
					if (key === 'enabled') { return false; }
					if (key === 'triggerDelay') { return 5000; }
					return defaultValue;
				}),
			} as any);

			const config = manager.getEffectiveConfig();

			assert.strictEqual(config.enabled, false, 'User override should take precedence');
			assert.strictEqual(config.triggerDelay, 5000, 'User override should take precedence');
			// Non-overridden values remain defaults
			assert.strictEqual(config.contextDepth, TIER_DEFAULTS.free.contextDepth);
		});

		test('Should return "none" tier defaults when no models detected', () => {
			const config = manager.getEffectiveConfig();

			assert.strictEqual(config.enabled, false);
			assert.strictEqual(config.maxPerMinute, 0);
			assert.strictEqual(config.contextDepth, 'none');
		});
	});

	suite('sendPrompt()', () => {
		let mockModel: any;
		let mockToken: vscode.CancellationToken;

		function pendingResponse(): {
			promise: Promise<vscode.LanguageModelChatResponse>;
			resolve: (response: vscode.LanguageModelChatResponse) => void;
			reject: (error: unknown) => void;
		} {
			let resolve!: (response: vscode.LanguageModelChatResponse) => void;
			let reject!: (error: unknown) => void;
			const promise = new Promise<vscode.LanguageModelChatResponse>((res, rej) => { resolve = res; reject = rej; });
			return { promise, resolve, reject };
		}

		function quotaError(): Error {
			const error = Object.assign(new Error('Quota exhausted'), { code: 'quota_exceeded' });
			Object.setPrototypeOf(error, vscode.LanguageModelError.prototype);
			return error;
		}

		setup(() => {
			mockModel = createMockModel('gpt-4o', 'GPT 4o');
			mockToken = {
				isCancellationRequested: false,
				onCancellationRequested: sandbox.stub(),
			} as any;
		});

		test('Should return response on success', async () => {
			const mockResponse = { text: ['Hello world'] };
			mockModel.sendRequest.resolves(mockResponse);
			selectChatModelsStub.resolves([mockModel]);

			await manager.selectModel();
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.ok(response, 'Should return a response');
		});

		for (const invalidation of ['stop', 'cancel']) {
			test(`Late quota rejection after ${invalidation} does not select a fallback`, async () => {
				const cts = new vscode.CancellationTokenSource();
				try {
					const pending = pendingResponse();
					mockModel.sendRequest.returns(pending.promise);
					selectChatModelsStub.resolves([mockModel]);
					await manager.selectModel();
					const calls = selectChatModelsStub.callCount;
					const request = manager.sendPrompt([vscode.LanguageModelChatMessage.User('test')], cts.token);
					assert.ok(mockModel.sendRequest.calledOnce);
					if (invalidation === 'stop') { manager.stop(); }
					else { cts.cancel(); }
					pending.reject(quotaError());
					assert.strictEqual(await request, null);
					assert.strictEqual(selectChatModelsStub.callCount, calls, 'Stale request must not rediscover a model');
					assert.strictEqual(manager.getCachedModel(), invalidation === 'stop' ? undefined : mockModel);
				} finally { cts.dispose(); }
			});

			test(`Late successful response after ${invalidation} is discarded`, async () => {
				const cts = new vscode.CancellationTokenSource();
				try {
					const pending = pendingResponse();
					mockModel.sendRequest.returns(pending.promise);
					selectChatModelsStub.resolves([mockModel]);
					await manager.selectModel();
					const request = manager.sendPrompt([vscode.LanguageModelChatMessage.User('test')], cts.token);
					if (invalidation === 'stop') { manager.stop(); }
					else { cts.cancel(); }
					pending.resolve({ text: [] } as any);
					assert.strictEqual(await request, null);
				} finally { cts.dispose(); }
			});
		}

		for (const outcome of ['reject', 'resolve']) {
			test(`A fallback ${outcome} after stop cannot return a response or try another family`, async () => {
				const clock = sandbox.useFakeTimers();
				const pending = pendingResponse();
				const fallbackModel = createMockModel('gpt-5-mini');
				mockModel.sendRequest.rejects(quotaError());
				fallbackModel.sendRequest.returns(pending.promise);
				selectChatModelsStub.onFirstCall().resolves([mockModel]);
				selectChatModelsStub.onSecondCall().resolves([fallbackModel]);
				await manager.selectModel();
				const request = manager.sendPrompt([vscode.LanguageModelChatMessage.User('test')], mockToken);
				await clock.tickAsync(0);
				assert.ok(fallbackModel.sendRequest.calledOnce, 'Fallback request must already be in flight');
				assert.strictEqual(selectChatModelsStub.callCount, 2);
				manager.stop();
				if (outcome === 'reject') { pending.reject(new Error('Late fallback failure')); }
				else { pending.resolve({ text: [] } as any); }
				assert.strictEqual(await request, null);
				assert.strictEqual(selectChatModelsStub.callCount, 2, 'Stopped request must not query the next family');
				assert.strictEqual(manager.getCachedModel(), undefined);
				assert.strictEqual(clock.countTimers(), 0);
			});
		}

		test('Should return null when no model available', async () => {
			selectChatModelsStub.resolves([]);

			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.strictEqual(response, null);
		});

		test('Should retry on rate_limit error', async () => {
			// Create an error that mimics LanguageModelError with code 'rate_limit'
			const rateLimitError = Object.assign(new Error('Rate limited'), { code: 'rate_limit' });
			Object.setPrototypeOf(rateLimitError, vscode.LanguageModelError.prototype);

			const mockResponse = { text: ['Success after retry'] };

			mockModel.sendRequest.onFirstCall().rejects(rateLimitError);
			mockModel.sendRequest.onSecondCall().resolves(mockResponse);
			selectChatModelsStub.resolves([mockModel]);

			// Stub sleep to avoid actual delays
			const sleepStub = sandbox.stub(manager as any, 'sleep').resolves();

			await manager.selectModel();
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.ok(response, 'Should succeed after retry');
			assert.ok(sleepStub.calledOnce, 'Should have waited before retry');
		});

		test('Should fire onQuotaExhausted on quota_exceeded', async () => {
			const quotaError = Object.assign(new Error('Quota exceeded'), { code: 'quota_exceeded' });
			Object.setPrototypeOf(quotaError, vscode.LanguageModelError.prototype);

			mockModel.sendRequest.rejects(quotaError);
			selectChatModelsStub.resolves([mockModel]);

			let quotaFired = false;
			const disposable = manager.onQuotaExhausted(() => {
				quotaFired = true;
			});

			await manager.selectModel();
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.strictEqual(response, null);
			assert.strictEqual(quotaFired, true, 'Should fire onQuotaExhausted event');
			disposable.dispose();
		});

		test('Should return null on non-retryable error', async () => {
			mockModel.sendRequest.rejects(new Error('Unknown error'));
			selectChatModelsStub.resolves([mockModel]);

			await manager.selectModel();
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.strictEqual(response, null);
		});

		test('Should auto-select model if none cached', async () => {
			const mockResponse = { text: ['auto selected'] };
			mockModel.sendRequest.resolves(mockResponse);
			selectChatModelsStub.resolves([mockModel]);

			// Do NOT call selectModel first — sendPrompt should auto-select
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			const response = await manager.sendPrompt(messages, mockToken);

			assert.ok(response, 'Should auto-select model and return response');
		});

		test('Should send reasoning_effort: low in modelOptions for GPT model', async () => {
			const gptModel = createMockModel('gpt-4.1');
			gptModel.sendRequest.resolves({ text: ['response'] });
			selectChatModelsStub.resolves([gptModel]);

			await manager.selectModel('gpt-4.1');
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			await manager.sendPrompt(messages, mockToken);

			assert.ok(gptModel.sendRequest.calledOnce, 'sendRequest should be called');
			const modelOptions = gptModel.sendRequest.firstCall.args[1].modelOptions;
			assert.strictEqual(modelOptions.reasoning_effort, 'low');
			assert.strictEqual(modelOptions.effort, undefined);
		});

		test('Should send effort: low in modelOptions for Claude model (not reasoning_effort)', async () => {
			const claudeModel = createMockModel('claude-sonnet-4');
			claudeModel.sendRequest.resolves({ text: ['response'] });
			selectChatModelsStub.resolves([claudeModel]);

			await manager.selectModel('claude-sonnet-4');
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			await manager.sendPrompt(messages, mockToken);

			assert.ok(claudeModel.sendRequest.calledOnce, 'sendRequest should be called');
			const modelOptions = claudeModel.sendRequest.firstCall.args[1].modelOptions;
			assert.strictEqual(modelOptions.effort, 'low');
			assert.strictEqual(modelOptions.reasoning_effort, undefined);
		});

		test('Should send no reasoning param in modelOptions for Gemini model', async () => {
			const geminiModel = createMockModel('gemini-2.5-pro');
			geminiModel.sendRequest.resolves({ text: ['response'] });
			selectChatModelsStub.resolves([geminiModel]);

			await manager.selectModel('gemini-2.5-pro');
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			await manager.sendPrompt(messages, mockToken);

			assert.ok(geminiModel.sendRequest.calledOnce, 'sendRequest should be called');
			const modelOptions = geminiModel.sendRequest.firstCall.args[1].modelOptions;
			assert.strictEqual(modelOptions.reasoning_effort, undefined);
			assert.strictEqual(modelOptions.effort, undefined);
		});

		test('Should use known token limit 32768 for gpt-4.1 in modelOptions', async () => {
			const gptModel = createMockModel('gpt-4.1');
			gptModel.sendRequest.resolves({ text: ['response'] });
			selectChatModelsStub.resolves([gptModel]);

			await manager.selectModel('gpt-4.1');
			const messages = [vscode.LanguageModelChatMessage.User('test')];
			await manager.sendPrompt(messages, mockToken);

			assert.ok(gptModel.sendRequest.calledOnce, 'sendRequest should be called');
			const modelOptions = gptModel.sendRequest.firstCall.args[1].modelOptions;
			assert.strictEqual(modelOptions.max_output_tokens, 32768);
			assert.strictEqual(modelOptions.max_completion_tokens, 32768);
			assert.strictEqual(modelOptions.max_tokens, 32768);
		});
	});

	suite('dispose()', () => {
		test('Should clear the redetect timer', async () => {
			configureEnabled(true);
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.initialize();

			// After initialize, a redetect timer should exist
			assert.ok((manager as any)._redetectTimer, 'Timer should be set after initialize');

			manager.dispose();

			assert.strictEqual((manager as any)._redetectTimer, undefined, 'Timer should be cleared');
		});

		test('Should clear cached model', async () => {
			selectChatModelsStub.resolves([createMockModel('gpt-4o')]);
			await manager.selectModel();

			assert.ok((manager as any)._cachedModel, 'Cached model should exist');

			manager.dispose();

			assert.strictEqual((manager as any)._cachedModel, undefined, 'Cached model should be cleared');
		});
	});
});
