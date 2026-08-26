/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { FeedbackPanel, _reset, _setVSCodeApi } from '../../webview/feedbackPanel';
import { VSCodeMock } from '../helpers/mocks';

const template = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="{csp}"><link rel="stylesheet" href="{cssUri}"></head><body><script nonce="{nonce}" src="{jsUri}"></script></body></html>`;

function localeServiceStub() {
	return {
		getLocalizedMessage: async (_key: string, fallback: string) => fallback,
	};
}

function diagnosticsSource() {
	return {
		extensionVersion: '0.87.5',
		vscodeVersion: '1.109.0',
		platform: 'darwin',
		release: '25.3.0',
		arch: 'arm64',
		locale: 'en',
		remoteName: undefined,
		workspaceFoldersCount: 1,
		workspaceTrusted: true,
	};
}

suite('FeedbackPanel Tests', () => {
	let vscodeMock: VSCodeMock;
	let client: { createFeedback: sinon.SinonStub };
	let identity: { getOrCreateSecret: sinon.SinonStub; clearSecret: sinon.SinonStub; createRecoveryUrl: sinon.SinonStub };

	setup(() => {
		vscodeMock = new VSCodeMock();
		_setVSCodeApi(vscodeMock as any);
		client = {
			createFeedback: sinon.stub().resolves({
				id: '11111111-1111-4111-8111-111111111111',
				reference: 'SB-20260820-0001',
				kind: 'bug',
				title: 'Upload fails after build',
				status: 'received',
				decision: 'unreviewed',
				createdAt: '2026-08-20T01:00:00.000Z',
				updatedAt: '2026-08-20T01:00:00.000Z',
				description: 'The upload stops after compilation completes.',
				diagnostics: {},
				hasAttachment: false,
				messages: [],
				nextMessageCursor: null,
			}),
		};
		identity = {
			getOrCreateSecret: sinon.stub().resolves('a'.repeat(43)),
			clearSecret: sinon.stub().resolves(),
			createRecoveryUrl: sinon.stub().returns(`https://support.example.test/recover#secret=${'a'.repeat(43)}`),
		};
	});

	teardown(() => _reset());

	function createPanel(): FeedbackPanel {
		return new FeedbackPanel(
			{ extensionPath: '/extension' } as any,
			localeServiceStub() as any,
			identity as any,
			client as any,
			diagnosticsSource,
			{ readFile: sinon.stub().resolves(template) } as any,
		);
	}

	test('uses a nonce CSP and performs no network request when opened', async () => {
		const manager = createPanel();

		await manager.show();

		const panel = manager.getPanel() as any;
		assert.ok(panel.webview.html.includes("default-src 'none'"));
		assert.match(panel.webview.html, /script-src 'nonce-[A-Za-z0-9_-]+'/);
		assert.ok(panel.webview.html.includes('nonce="'));
		assert.strictEqual(client.createFeedback.callCount, 0);
		assert.strictEqual(identity.getOrCreateSecret.callCount, 0);
	});

	test('coalesces concurrent requests to open the feedback panel', async () => {
		const manager = createPanel();

		await Promise.all([manager.show(), manager.show()]);

		assert.strictEqual(vscodeMock.window.createWebviewPanel.callCount, 1);
	});

	test('rejects malformed messages without invoking the client', async () => {
		const manager = createPanel();
		await manager.show();

		await (manager.getPanel() as any).webview.dispatchMessage({ command: 'feedback:submit', confirmationId: 42 });

		assert.strictEqual(client.createFeedback.callCount, 0);
	});

	test('rejects sensitive reporter text locally before creating a credential or invoking the client', async () => {
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:preview',
			draft: {
				kind: 'bug',
				title: 'Upload fails after build',
				description: 'The selected serial port COM3 stops responding during upload.',
			},
			includeDiagnostics: true,
			includeRecentEvents: false,
		});

		assert.strictEqual(client.createFeedback.callCount, 0);
		assert.strictEqual(identity.getOrCreateSecret.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:error', code: 'sensitive_content' }));
	});

	test('counts Unicode code points when validating reporter-authored text', async () => {
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:preview',
			draft: {
				kind: 'bug',
				title: '😀'.repeat(3),
				description: 'The upload stops after compilation completes.',
			},
			includeDiagnostics: true,
			includeRecentEvents: false,
		});

		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:error', code: 'invalid_input' }));
		assert.ok(!panel.webview.postMessage.calledWithMatch({ command: 'feedback:previewReady' }));
	});

	test('binds confirmation to the exact reviewed payload', async () => {
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;
		const draft = {
			kind: 'bug',
			title: 'Upload fails after build',
			description: 'The upload stops after compilation completes.',
		};
		await panel.webview.dispatchMessage({
			command: 'feedback:preview',
			draft,
			includeDiagnostics: true,
			includeRecentEvents: false,
		});
		const preview = panel.webview.postMessage.getCalls()
			.map((call: any) => call.args[0])
			.find((message: any) => message.command === 'feedback:previewReady');

		await panel.webview.dispatchMessage({
			command: 'feedback:submit',
			confirmationId: preview.preview.confirmationId,
			draft: { ...draft, title: 'Changed after review' },
			includeDiagnostics: true,
			includeRecentEvents: false,
		});

		assert.strictEqual(client.createFeedback.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:error', code: 'preview_changed' }));
	});

	test('submits the exact reviewed payload only after explicit confirmation', async () => {
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;
		const message = {
			command: 'feedback:preview',
			draft: {
				kind: 'bug',
				title: 'Upload fails after build',
				description: 'The upload stops after compilation completes.',
			},
			includeDiagnostics: true,
			includeRecentEvents: false,
		};
		await panel.webview.dispatchMessage(message);
		const preview = panel.webview.postMessage.getCalls()
			.map((call: any) => call.args[0])
			.find((candidate: any) => candidate.command === 'feedback:previewReady');

		await panel.webview.dispatchMessage({
			command: 'feedback:submit',
			confirmationId: preview.preview.confirmationId,
			draft: message.draft,
			includeDiagnostics: true,
			includeRecentEvents: false,
		});

		assert.strictEqual(client.createFeedback.callCount, 1);
		assert.strictEqual(identity.getOrCreateSecret.callCount, 1);
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:submitted',
			feedback: { reference: 'SB-20260820-0001' },
		}));
	});

	test('does not deliver an old asynchronous submission result to a reopened panel', async () => {
		let resolveFeedback!: (feedback: unknown) => void;
		client.createFeedback.callsFake(() => new Promise(resolve => {resolveFeedback = resolve;}));
		const manager = createPanel();
		await manager.show();
		const firstPanel = manager.getPanel() as any;
		const draft = {
			kind: 'bug',
			title: 'Upload fails after build',
			description: 'The upload stops after compilation completes.',
		};
		await firstPanel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false,
		});
		const preview = firstPanel.webview.postMessage.lastCall.args[0].preview;
		const submission = firstPanel.webview.dispatchMessage({
			command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
			includeDiagnostics: true, includeRecentEvents: false,
		});
		await Promise.resolve();
		await Promise.resolve();

		firstPanel.dispose();
		await manager.show();
		const reopenedPanel = manager.getPanel() as any;
		resolveFeedback({
			id: '11111111-1111-4111-8111-111111111111', reference: 'SB-ABCDEFGH', kind: 'bug',
			title: draft.title, status: 'received', decision: 'unreviewed',
			createdAt: '2026-08-20T01:00:00.000Z', updatedAt: '2026-08-20T01:00:00.000Z',
			description: draft.description, diagnostics: {}, hasAttachment: false,
			messages: [], nextMessageCursor: null,
		});
		await submission;

		assert.ok(!reopenedPanel.webview.postMessage.calledWithMatch({ command: 'feedback:submitted' }));
	});

	test('reuses the preview idempotency key when the user retries an uncertain submission', async () => {
		client.createFeedback.onFirstCall().rejects(Object.assign(new Error('timeout'), { code: 'timeout' }));
		client.createFeedback.onSecondCall().resolves({
			id: '11111111-1111-4111-8111-111111111111',
			reference: 'SB-ABCDEFGH',
			kind: 'bug',
			title: 'Upload fails after build',
			status: 'received',
			decision: 'unreviewed',
			createdAt: '2026-08-20T01:00:00.000Z',
			updatedAt: '2026-08-20T01:00:00.000Z',
			description: 'The upload stops after compilation completes.',
			diagnostics: {},
			hasAttachment: false,
			messages: [],
			nextMessageCursor: null,
		});
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;
		const draft = {
			kind: 'bug',
			title: 'Upload fails after build',
			description: 'The upload stops after compilation completes.',
		};
		await panel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false,
		});
		const preview = panel.webview.postMessage.lastCall.args[0].preview;
		const submit = {
			command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
			includeDiagnostics: true, includeRecentEvents: false,
		};

		await panel.webview.dispatchMessage(submit);
		await panel.webview.dispatchMessage(submit);

		assert.strictEqual(client.createFeedback.callCount, 2);
		assert.strictEqual(client.createFeedback.firstCall.args[3], client.createFeedback.secondCall.args[3]);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:submitted' }));
	});

	test('does not recreate a reporter until the user explicitly retries after revocation', async () => {
		client.createFeedback.onFirstCall().rejects(Object.assign(new Error('invalid_reporter'), {
			code: 'invalid_reporter', status: 401, retryable: false,
		}));
		client.createFeedback.onSecondCall().resolves({
			id: '11111111-1111-4111-8111-111111111111', reference: 'SB-ABCDEFGH', kind: 'bug',
			title: 'Upload fails after build', status: 'received', decision: 'unreviewed',
			createdAt: '2026-08-20T01:00:00.000Z', updatedAt: '2026-08-20T01:00:00.000Z',
			description: 'The upload stops after compilation completes.', diagnostics: {}, hasAttachment: false,
			messages: [], nextMessageCursor: null,
		});
		identity.getOrCreateSecret.onFirstCall().resolves('a'.repeat(43));
		identity.getOrCreateSecret.onSecondCall().resolves('b'.repeat(43));
		const manager = createPanel();
		await manager.show();
		const panel = manager.getPanel() as any;
		const draft = {
			kind: 'bug',
			title: 'Upload fails after build',
			description: 'The upload stops after compilation completes.',
		};
		await panel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false,
		});
		const preview = panel.webview.postMessage.lastCall.args[0].preview;
		await panel.webview.dispatchMessage({
			command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
			includeDiagnostics: true, includeRecentEvents: false,
		});

		assert.strictEqual(identity.clearSecret.callCount, 1);
		assert.strictEqual(client.createFeedback.callCount, 1);
		assert.strictEqual(client.createFeedback.firstCall.args[0], 'a'.repeat(43));
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:error', code: 'invalid_reporter' }));

		await panel.webview.dispatchMessage({
			command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
			includeDiagnostics: true, includeRecentEvents: false,
		});

		assert.strictEqual(client.createFeedback.callCount, 2);
		assert.strictEqual(client.createFeedback.secondCall.args[0], 'b'.repeat(43));
		assert.strictEqual(client.createFeedback.firstCall.args[3], client.createFeedback.secondCall.args[3]);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:submitted' }));
	});

	test('keeps an uncertain submission key across preview expiry and panel reopening', async () => {
		const clock = sinon.useFakeTimers({ now: new Date('2026-08-20T01:00:00.000Z') });
		client.createFeedback.onFirstCall().rejects(Object.assign(new Error('timeout'), { code: 'timeout', retryable: true }));
		client.createFeedback.onSecondCall().resolves({
			id: '11111111-1111-4111-8111-111111111111', reference: 'SB-ABCDEFGH', kind: 'bug',
			title: 'Upload fails after build', status: 'received', decision: 'unreviewed',
			createdAt: '2026-08-20T01:00:00.000Z', updatedAt: '2026-08-20T01:00:00.000Z',
			description: 'The upload stops after compilation completes.', diagnostics: {}, hasAttachment: false,
			messages: [], nextMessageCursor: null,
		});
		try {
			const manager = createPanel();
			const draft = {
				kind: 'bug' as const,
				title: 'Upload fails after build',
				description: 'The upload stops after compilation completes.',
			};
			await manager.show();
			let panel = manager.getPanel() as any;
			await panel.webview.dispatchMessage({
				command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false,
			});
			let preview = panel.webview.postMessage.lastCall.args[0].preview;
			await panel.webview.dispatchMessage({
				command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
				includeDiagnostics: true, includeRecentEvents: false,
			});
			const firstKey = client.createFeedback.firstCall.args[3];

			panel.dispose();
			clock.tick(11 * 60 * 1000);
			await manager.show();
			panel = manager.getPanel() as any;
			await panel.webview.dispatchMessage({
				command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false,
			});
			preview = panel.webview.postMessage.lastCall.args[0].preview;
			await panel.webview.dispatchMessage({
				command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
				includeDiagnostics: true, includeRecentEvents: false,
			});

			assert.strictEqual(client.createFeedback.callCount, 2);
			assert.strictEqual(client.createFeedback.secondCall.args[3], firstKey);
		} finally {
			clock.restore();
		}
	});
});
