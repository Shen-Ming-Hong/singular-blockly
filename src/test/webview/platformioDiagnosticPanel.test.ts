/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { PlatformioDiagnosticPanel, _reset, _setVSCodeApi } from '../../webview/platformioDiagnosticPanel';
import { VSCodeMock } from '../helpers/mocks';
import {
	EnvironmentFingerprint,
	PlatformioDiagnosticPanelState,
	PlatformioDiagnosticSession,
	RepairFlow,
} from '../../types/platformioDiagnostic';

function createLocaleServiceStub() {
	return {
		async getLocalizedMessage(_key: string, fallbackOrArg?: string | any, ...args: any[]) {
			let template = typeof fallbackOrArg === 'string' ? fallbackOrArg : _key;
			const values = typeof fallbackOrArg === 'string' ? args : [fallbackOrArg, ...args].filter(value => value !== undefined);
			values.forEach((value, index) => {
				template = template.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value));
			});
			return template;
		},
	};
}

function createSession(requestedAt: string): PlatformioDiagnosticSession {
	return {
		requestedAt,
		workspacePath: '/workspace/demo',
		overallStatus: 'operational',
		items: [
			{
				id: 'pio',
				kind: 'executable',
				status: 'ok',
				resolvedPath: '/custom/bin/pio',
				source: 'path-search',
				exists: true,
				isFromDetectedPenv: null,
				reason: 'pio ready',
				versionProbe: { command: 'pio --version', succeeded: true, output: 'PlatformIO Core, version 6.1.18', durationMs: 10 },
			},
			{
				id: 'penvRoot',
				kind: 'derived-directory',
				status: 'ok',
				resolvedPath: '/custom',
				source: 'resolved-pio-sibling',
				exists: true,
				isFromDetectedPenv: null,
				reason: 'penv ready',
			},
			{
				id: 'python',
				kind: 'executable',
				status: 'ok',
				resolvedPath: '/custom/bin/python3',
				source: 'derived-from-penv',
				exists: true,
				isFromDetectedPenv: true,
				reason: 'python ready',
				versionProbe: { command: 'python3 --version', succeeded: true, output: 'Python 3.12.0', durationMs: 8 },
			},
			{
				id: 'pip',
				kind: 'executable',
				status: 'ok',
				resolvedPath: '/custom/bin/pip3',
				source: 'derived-from-penv',
				exists: true,
				isFromDetectedPenv: true,
				reason: 'pip ready',
				versionProbe: { command: 'pip3 --version', succeeded: true, output: 'pip 24.0', durationMs: 7 },
			},
			{
				id: 'mpremote',
				kind: 'executable',
				status: 'ok',
				resolvedPath: '/custom/bin/mpremote',
				source: 'derived-from-penv',
				exists: true,
				isFromDetectedPenv: true,
				reason: 'mpremote ready',
				versionProbe: { command: 'mpremote version', succeeded: true, output: 'mpremote 1.24.0', durationMs: 9 },
			},
		],
		scopeNotice: 'diagnostic scope notice',
	};
}

function createState(runState: PlatformioDiagnosticPanelState['runState'], session: PlatformioDiagnosticSession | null, topLevelError: string | null) {
	return {
		runState,
		session,
		topLevelError,
		availableActions: ['retest', 'copySummary'],
		sectionOrder: ['summary', 'tools', 'repair', 'exports', 'scope'],
	};
}

function createFlow(): RepairFlow {
	return {
		id: 'repair-mpremote-in-detected-python',
		title: 'Repair mpremote',
		summary: 'Install mpremote',
		triggerFindingIds: ['mpremote'],
		riskLevel: 'low',
		requiresConfirmation: true,
		steps: [
			{
				id: 'install-mpremote',
				title: 'Install mpremote',
				description: 'Install mpremote in user space',
				kind: 'user-space-python-package',
				commandPreview: 'python -m pip install --user --upgrade mpremote',
				timeoutMs: 120000,
				mutatesUserSpace: true,
				blockingFailureCodes: ['network-or-proxy'],
			},
		],
		stopPolicy: 'stop-on-success-or-blocking-failure',
		estimatedDurationMs: 120000,
		primaryFix: 'Install mpremote',
		fallbackFix: 'Copy AI packet',
		verification: 'Run diagnostics again',
		recommendationReason: 'mpremote missing',
		stillManualSteps: [],
	};
}

function createFingerprint(): EnvironmentFingerprint {
	return {
		fingerprintVersion: 1,
		workspaceHash: 'workspace-hash',
		platform: 'darwin',
		arch: 'arm64',
		settingsHash: 'settings-hash',
		pathHintsHash: 'path-hints-hash',
		toolVersions: {},
		createdAt: '2026-01-02T03:04:05.000Z',
	};
}

async function flushMicrotasks(): Promise<void> {
	await new Promise(resolve => setImmediate(resolve));
}

suite('PlatformioDiagnosticPanel Tests', () => {
	let vscodeMock: VSCodeMock;
	let serviceStub: any;
	let repairServiceStub: any;
	let historyStoreStub: any;
	let aiPacketServiceStub: any;
	let issueDraftServiceStub: any;
	let panelManager: PlatformioDiagnosticPanel;

	setup(() => {
		vscodeMock = new VSCodeMock();
		_setVSCodeApi(vscodeMock as any);
		serviceStub = {
			createLoadingState: sinon.stub().callsFake(() => createState('loading', null, null)),
			createReadyState: sinon.stub().callsFake((session: PlatformioDiagnosticSession) => createState('ready', session, null)),
			createErrorState: sinon.stub().callsFake((errorMessage: string) => createState('error', null, errorMessage)),
			collectDiagnostics: sinon.stub().resolves(createSession('2026-01-02T03:04:05.000Z')),
			buildClipboardSummary: sinon.stub().resolves({
				plainText: 'summary text',
				generatedAt: '2026-01-02T03:04:05.000Z',
				overallStatus: 'operational',
			}),
		};
		repairServiceStub = {
			planRepairFlows: sinon.stub().returns([createFlow()]),
			executeRepairFlow: sinon.stub().resolves({
				runId: 'run-1',
				flowId: 'repair-mpremote-in-detected-python',
				startedAt: '2026-01-02T03:04:05.000Z',
				finishedAt: '2026-01-02T03:04:10.000Z',
				status: 'succeeded',
				environmentFingerprint: createFingerprint(),
				initialSessionId: 'initial',
				finalSessionId: 'final',
				stepResults: [],
				userFacingSummary: 'succeeded',
			}),
		};
		historyStoreStub = {
			createEnvironmentFingerprint: sinon.stub().returns(createFingerprint()),
			loadSnapshot: sinon.stub().resolves(null),
			createEmptySnapshot: sinon.stub().returns({
				schemaVersion: 1,
				workspaceHash: 'workspace-hash',
				activeFingerprint: createFingerprint(),
				runs: [],
				lastClearedAt: null,
				staleReason: null,
			}),
			appendRun: sinon.stub().resolves({
				schemaVersion: 1,
				workspaceHash: 'workspace-hash',
				activeFingerprint: createFingerprint(),
				runs: [],
				lastClearedAt: null,
				staleReason: null,
			}),
			clear: sinon.stub().resolves({
				schemaVersion: 1,
				workspaceHash: 'workspace-hash',
				activeFingerprint: createFingerprint(),
				runs: [],
				lastClearedAt: '2026-01-02T03:04:05.000Z',
				staleReason: null,
			}),
		};
		aiPacketServiceStub = {
			buildPacket: sinon.stub().returns({
				plainText: 'AI packet text',
				generatedAt: '2026-01-02T03:04:05.000Z',
				featureVersion: 'test',
				problemStatement: 'problem',
				environmentSummary: 'environment',
				diagnosticSummary: 'diagnostics',
				attemptedRepairs: 'repairs',
				currentBlocker: 'blocker',
				knownConstraints: [],
				requestedResponseContract: 'contract',
				redacted: true,
				staleHistory: false,
			}),
		};
		issueDraftServiceStub = {
			buildDraft: sinon.stub().returns({
				title: 'Draft title',
				body: 'Issue draft body',
				labels: ['bug'],
				privacyChecklist: ['mask paths'],
				duplicateSearchHints: ['mpremote not found CyberBrick'],
				generatedAt: '2026-01-02T03:04:05.000Z',
				candidacy: 'recommended',
				source: 'human-confirmed',
				redactionWarning: 'Review privacy checklist',
			}),
		};

		panelManager = new PlatformioDiagnosticPanel(
			{ extensionPath: '/mock/extension', subscriptions: [] } as any,
			createLocaleServiceStub() as any,
			serviceStub,
			{
				promises: {
					readFile: async () =>
						'<!DOCTYPE html><html><head><title>{panelTitle}</title><link rel="stylesheet" href="{cssUri}"></head><body><script src="{jsUri}"></script></body></html>',
				},
			} as any,
			{
				repairService: repairServiceStub,
				historyStore: historyStoreStub,
				aiPacketService: aiPacketServiceStub,
				issueDraftService: issueDraftServiceStub,
			}
		);
	});

	teardown(() => {
		_reset();
		sinon.restore();
	});

	test('show creates a single panel and reveal reuses it', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;

		assert.ok(panel, 'Panel should be created on first show');
		assert.strictEqual(vscodeMock.window.createWebviewPanel.callCount, 1, 'Should create one panel');

		await panelManager.show();

		assert.strictEqual(vscodeMock.window.createWebviewPanel.callCount, 1, 'Second show should reuse existing panel');
		assert.ok(panel.reveal.calledOnce, 'Existing panel should be revealed');
	});

	test('ready message triggers loading then render exactly once', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;

		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		const commands = panel.webview.postMessage.getCalls().map((call: any) => call.args[0].command);
		assert.deepStrictEqual(commands.slice(0, 2), ['platformioDiagnostic:loading', 'platformioDiagnostic:render']);
		assert.strictEqual(serviceStub.collectDiagnostics.callCount, 1, 'Initial ready should run diagnostics once');

		await panelManager.show();
		assert.strictEqual(serviceStub.collectDiagnostics.callCount, 1, 'Revealing the panel should not rerun diagnostics');
	});

	test('copySummary writes clipboard text and reports success', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:copySummary' });

		assert.ok(vscodeMock.env.clipboard.writeText.calledOnceWith('summary text'));
		assert.ok(
			panel.webview.postMessage.calledWithMatch({
				command: 'platformioDiagnostic:copyResult',
				status: 'success',
			})
		);
	});

	test('retest message reruns diagnostics and posts a fresh render payload', async () => {
		const firstSession = createSession('2026-01-02T03:04:05.000Z');
		const secondSession = createSession('2026-01-02T03:04:08.000Z');
		serviceStub.collectDiagnostics.onFirstCall().resolves(firstSession);
		serviceStub.collectDiagnostics.onSecondCall().resolves(secondSession);

		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:retest' });
		await flushMicrotasks();
		await flushMicrotasks();

		assert.strictEqual(serviceStub.collectDiagnostics.callCount, 2, 'Retest should trigger a second diagnostic run');
		const renderMessages = panel.webview.postMessage
			.getCalls()
			.map((call: any) => call.args[0])
			.filter((message: any) => message.command === 'platformioDiagnostic:render');
		assert.strictEqual(renderMessages.length, 1, 'Retest cycle should finish with one render message');
		assert.strictEqual(renderMessages[0].panelState.session.requestedAt, secondSession.requestedAt);
	});

	test('startAutoRepair posts a confirmation model for the selected flow', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:startAutoRepair', flowId: 'repair-mpremote-in-detected-python' });

		assert.ok(
			panel.webview.postMessage.calledWithMatch({
				command: 'platformioDiagnostic:render',
				panelState: {
					repairState: {
						confirmation: { flowId: 'repair-mpremote-in-detected-python' },
					},
				},
			})
		);
	});

	test('confirmAutoRepair executes the flow, persists history, and rerenders', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:confirmAutoRepair', flowId: 'repair-mpremote-in-detected-python' });
		await flushMicrotasks();
		await flushMicrotasks();

		assert.ok(repairServiceStub.executeRepairFlow.calledOnce);
		assert.ok(historyStoreStub.appendRun.calledOnce);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'platformioDiagnostic:render' }));
	});

	test('cancelAutoRepair clears pending confirmation without executing the flow', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:startAutoRepair', flowId: 'repair-mpremote-in-detected-python' });

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:cancelAutoRepair' });

		assert.strictEqual(repairServiceStub.executeRepairFlow.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:render',
			panelState: { repairState: { confirmation: null } },
		}));
	});

	test('clearRepairHistory clears workspace history and rerenders state', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:clearRepairHistory' });

		assert.ok(historyStoreStub.clear.calledOnce);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'platformioDiagnostic:render' }));
	});

	test('retest is ignored while an auto repair run is active', async () => {
		let resolveRun!: (value: any) => void;
		repairServiceStub.executeRepairFlow.returns(new Promise(resolve => {
			resolveRun = resolve;
		}));

		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:confirmAutoRepair', flowId: 'repair-mpremote-in-detected-python' });
		await flushMicrotasks();
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:render',
			panelState: { repairState: { activeRun: { status: 'running' } } },
		}), 'Panel should render an active repair run while repair is in progress');
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:retest' });

		assert.strictEqual(serviceStub.collectDiagnostics.callCount, 1, 'Retest should not start while repair is active');
		resolveRun({
			runId: 'run-1',
			flowId: 'repair-mpremote-in-detected-python',
			startedAt: '2026-01-02T03:04:05.000Z',
			finishedAt: '2026-01-02T03:04:10.000Z',
			status: 'succeeded',
			environmentFingerprint: createFingerprint(),
			initialSessionId: 'initial',
			finalSessionId: 'final',
			stepResults: [],
			userFacingSummary: 'succeeded',
		});
		await flushMicrotasks();
	});

	test('copyAiRepairPacket writes redacted packet text and reports success', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:copyAiRepairPacket' });

		assert.ok(aiPacketServiceStub.buildPacket.calledOnce);
		assert.ok(vscodeMock.env.clipboard.writeText.calledWith('AI packet text'));
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:copyResult',
			status: 'success',
		}));
	});

	test('copyAiRepairPacket reports warning when diagnostics are not ready', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:copyAiRepairPacket' });

		assert.strictEqual(aiPacketServiceStub.buildPacket.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:copyResult',
			status: 'warning',
		}));
	});

	test('createIssueDraft writes local draft text and does not publish automatically', async () => {
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:createIssueDraft' });

		assert.ok(issueDraftServiceStub.buildDraft.calledOnce);
		assert.ok(vscodeMock.env.clipboard.writeText.calledWith('Issue draft body'));
		assert.strictEqual(vscodeMock.commands.executeCommand.callCount, 0, 'Should not call GitHub or any publish command');
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:copyResult',
			status: 'success',
		}));
	});

	test('createIssueDraft reports no-draft reason without writing clipboard', async () => {
		issueDraftServiceStub.buildDraft.returns({
			title: 'No draft',
			body: 'No issue draft recommended: diagnostics are operational.',
			labels: [],
			privacyChecklist: [],
			duplicateSearchHints: [],
			generatedAt: '2026-01-02T03:04:05.000Z',
			candidacy: 'not-recommended',
			noDraftReason: 'Diagnostics are operational',
			source: 'human-confirmed',
		});
		await panelManager.show();
		const panel = panelManager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:ready' });
		await flushMicrotasks();
		await flushMicrotasks();

		panel.webview.postMessage.resetHistory();
		await panel.webview.dispatchMessage({ command: 'platformioDiagnostic:createIssueDraft' });

		assert.ok(vscodeMock.env.clipboard.writeText.neverCalledWith('No issue draft recommended: diagnostics are operational.'));
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'platformioDiagnostic:copyResult',
			status: 'warning',
		}));
	});

	test('webview rendering escapes untrusted repair and export output', () => {
		const scriptPath = path.resolve(__dirname, '../../../media/js/platformioDiagnostic.js');
		const script = fs.readFileSync(scriptPath, 'utf8');

		assert.ok(script.includes('${escapeHtml(flow.title)}'), 'Repair flow titles must be escaped before HTML insertion');
		assert.ok(script.includes('${escapeHtml(flow.summary)}'), 'Repair summaries must be escaped before HTML insertion');
		assert.ok(script.includes('${escapeHtml(step.commandPreview)}'), 'Repair command previews must be escaped before HTML insertion');
		assert.ok(script.includes('elements.feedbackBanner.textContent = message;'), 'Feedback messages must use textContent');
		assert.ok(script.includes('elements.exportNotice.textContent = notice;'), 'Export notices must use textContent');
	});
});
