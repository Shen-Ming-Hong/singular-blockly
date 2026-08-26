/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { FeedbackPanel, _reset, _setVSCodeApi } from '../../webview/feedbackPanel';
import { VSCodeMock } from '../helpers/mocks';

function png(width: number, height: number): string {
	const bytes = Buffer.alloc(24);
	Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
	bytes.write('IHDR', 12, 'ascii');
	bytes.writeUInt32BE(width, 16);
	bytes.writeUInt32BE(height, 20);
	return bytes.toString('base64');
}

suite('FeedbackPanel privacy Tests', () => {
	let vscodeMock: VSCodeMock;
	let client: { createFeedback: sinon.SinonStub };
	let manager: FeedbackPanel;

	setup(() => {
		vscodeMock = new VSCodeMock();
		_setVSCodeApi(vscodeMock as any);
		client = { createFeedback: sinon.stub() };
		manager = new FeedbackPanel(
			{ extensionPath: '/extension' } as any,
			{ getLocalizedMessage: async (_key: string, fallback: string) => fallback } as any,
			{ getOrCreateSecret: sinon.stub().resolves('a'.repeat(43)), createRecoveryUrl: sinon.stub() } as any,
			client as any,
			() => ({
				extensionVersion: '0.87.5', vscodeVersion: '1.109.0', platform: 'darwin', release: '25.3.0',
				arch: 'arm64', locale: 'en', remoteName: undefined, workspaceFoldersCount: 1, workspaceTrusted: true,
				recentEvents: [{ at: '2026-08-20T01:00:00.000Z', stage: 'upload', code: 'failed', outcome: 'failed' }],
			}),
			{ readFile: sinon.stub().resolves('<meta http-equiv="Content-Security-Policy" content="{csp}"><script nonce="{nonce}" src="{jsUri}"></script>') } as any,
		);
	});

	teardown(() => _reset());

	const draft = {
		kind: 'bug' as const,
		title: 'Upload fails after build',
		description: 'The upload stops after compilation completes.',
	};

	test('keeps recent-events opt-in independent from basic diagnostics in the exact preview', async () => {
		await manager.show();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: false, includeRecentEvents: true,
		});
		let preview = panel.webview.postMessage.lastCall.args[0].preview;
		assert.deepStrictEqual(preview.input.diagnostics, {
			recentEvents: [{ at: '2026-08-20T01:00:00.000Z', stage: 'upload', code: 'failed', outcome: 'failed' }],
		});

		await panel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: true,
		});
		preview = panel.webview.postMessage.lastCall.args[0].preview;
		assert.strictEqual(preview.input.diagnostics.recentEvents.length, 1);
	});

	test('binds the screenshot bytes and dimensions to the confirmation digest', async () => {
		await manager.show();
		const panel = manager.getPanel() as any;
		const screenshot = { mediaType: 'image/png', bytesBase64: png(800, 600), width: 800, height: 600 };
		await panel.webview.dispatchMessage({
			command: 'feedback:preview', draft, includeDiagnostics: true, includeRecentEvents: false, screenshot,
		});
		const preview = panel.webview.postMessage.lastCall.args[0].preview;

		await panel.webview.dispatchMessage({
			command: 'feedback:submit', confirmationId: preview.confirmationId, draft,
			includeDiagnostics: true, includeRecentEvents: false,
		});

		assert.strictEqual(client.createFeedback.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:error', code: 'preview_changed' }));
	});
});
