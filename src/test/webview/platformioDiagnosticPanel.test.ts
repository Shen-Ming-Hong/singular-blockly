/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { PlatformioDiagnosticPanel, _reset, _setVSCodeApi } from '../../webview/platformioDiagnosticPanel';
import { VSCodeMock } from '../helpers/mocks';
import {
	PlatformioDiagnosticPanelState,
	PlatformioDiagnosticSession,
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
		sectionOrder: ['summary', 'tools', 'scope'] as const,
	};
}

async function flushMicrotasks(): Promise<void> {
	await new Promise(resolve => setImmediate(resolve));
}

suite('PlatformioDiagnosticPanel Tests', () => {
	let vscodeMock: VSCodeMock;
	let serviceStub: any;
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

		panelManager = new PlatformioDiagnosticPanel(
			{ extensionPath: '/mock/extension', subscriptions: [] } as any,
			createLocaleServiceStub() as any,
			serviceStub,
			{
				promises: {
					readFile: async () =>
						'<!DOCTYPE html><html><head><title>{panelTitle}</title><link rel="stylesheet" href="{cssUri}"></head><body><script src="{jsUri}"></script></body></html>',
				},
			} as any
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
});
