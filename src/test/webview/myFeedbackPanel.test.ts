/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { FeedbackPanel, _reset, _setVSCodeApi } from '../../webview/feedbackPanel';
import { VSCodeMock } from '../helpers/mocks';

const template = '<meta http-equiv="Content-Security-Policy" content="{csp}"><script nonce="{nonce}" src="{jsUri}"></script>';
const id = '11111111-1111-4111-8111-111111111111';

suite('My Feedback Panel Tests', () => {
	let vscodeMock: VSCodeMock;
	let client: Record<string, sinon.SinonStub>;
	let identity: {
		serviceOrigin: string;
		getSecret: sinon.SinonStub;
		getOrCreateSecret: sinon.SinonStub;
		clearSecret: sinon.SinonStub;
		getPendingDeleteOneKey: sinon.SinonStub;
		storePendingDeleteOneKey: sinon.SinonStub;
		clearPendingDeleteOneKey: sinon.SinonStub;
			createRecoveryUrl: sinon.SinonStub;
			getPendingDeleteAllKey: sinon.SinonStub;
			storePendingDeleteAllKey: sinon.SinonStub;
			clearPendingDeleteAllKey: sinon.SinonStub;
			getPendingMessage: sinon.SinonStub;
			storePendingMessage: sinon.SinonStub;
			clearPendingMessage: sinon.SinonStub;
	};
	let manager: FeedbackPanel;

	setup(() => {
		vscodeMock = new VSCodeMock();
		_setVSCodeApi(vscodeMock as any);
		client = {
			createFeedback: sinon.stub(),
			listFeedback: sinon.stub().resolves({ items: [], nextCursor: null }),
			listFeedbackMessages: sinon.stub().resolves({ items: [], nextCursor: null }),
			getFeedback: sinon.stub().resolves({
				id, reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Owned feedback', status: 'received', decision: 'unreviewed',
				createdAt: '2026-08-20T01:00:00.000Z', updatedAt: '2026-08-20T01:00:00.000Z', description: 'Private body',
				diagnostics: {}, hasAttachment: false, messages: [], nextMessageCursor: null,
			}),
			addMessage: sinon.stub().resolves({}),
			deleteFeedback: sinon.stub().resolves(),
			deleteAllFeedback: sinon.stub().resolves(),
		};
		identity = {
			serviceOrigin: 'https://support.example.test',
			getSecret: sinon.stub().resolves('a'.repeat(43)),
			getOrCreateSecret: sinon.stub().resolves('a'.repeat(43)),
			clearSecret: sinon.stub().resolves(),
			getPendingDeleteOneKey: sinon.stub().resolves(undefined),
			storePendingDeleteOneKey: sinon.stub().resolves(),
			clearPendingDeleteOneKey: sinon.stub().resolves(),
				createRecoveryUrl: sinon.stub(),
				getPendingDeleteAllKey: sinon.stub().resolves(undefined),
				storePendingDeleteAllKey: sinon.stub().resolves(),
				clearPendingDeleteAllKey: sinon.stub().resolves(),
				getPendingMessage: sinon.stub().resolves(undefined),
				storePendingMessage: sinon.stub().resolves(),
				clearPendingMessage: sinon.stub().resolves(),
		};
		manager = new FeedbackPanel(
			{ extensionPath: '/extension' } as any,
			{ getLocalizedMessage: async (_key: string, fallback: string) => fallback } as any,
			identity as any,
			client as any,
			() => ({ extensionVersion: '1', vscodeVersion: '1', platform: 'darwin', release: '1', arch: 'arm64', locale: 'en', remoteName: undefined, workspaceFoldersCount: 0, workspaceTrusted: true }),
			{ readFile: sinon.stub().resolves(template) } as any,
		);
	});

	teardown(() => _reset());

	test('opens in list mode and does not create a credential for an empty installation', async () => {
		identity.getSecret.resolves(undefined);
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'feedback:list' });

		assert.strictEqual(client.listFeedback.callCount, 0);
		assert.strictEqual(identity.getOrCreateSecret.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:listResult', items: [], hasCredential: false }));
	});

	test('lists and reads only through the stored reporter secret', async () => {
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'feedback:list' });
		await panel.webview.dispatchMessage({ command: 'feedback:detail', feedbackId: id });

		assert.ok(client.listFeedback.calledWith('a'.repeat(43), undefined));
		assert.ok(client.getFeedback.calledWith('a'.repeat(43), id));
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:listResult', hasCredential: true }));
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:detailResult', feedback: { id } }));
	});

	test('continues a message timeline only for an exact owned-detail request', async () => {
		client.listFeedbackMessages.resolves({
			items: [{
				id: '22222222-2222-4222-8222-222222222222',
				author: 'reporter',
				body: 'More detail',
				createdAt: '2026-08-20T01:01:00.000Z',
			}],
			nextCursor: null,
		});
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'feedback:messages', feedbackId: id, cursor: 'signed-cursor' });

		assert.ok(client.listFeedbackMessages.calledWith('a'.repeat(43), id, 'signed-cursor'));
			assert.deepStrictEqual(panel.webview.postMessage.lastCall.args[0], {
				command: 'feedback:messagesResult',
				feedbackId: id,
				cursor: 'signed-cursor',
				items: [{
				id: '22222222-2222-4222-8222-222222222222',
				author: 'reporter',
				body: 'More detail',
				createdAt: '2026-08-20T01:01:00.000Z',
			}],
			nextCursor: null,
		});
	});

	test('returns the exact message request identity when pagination fails', async () => {
		client.listFeedbackMessages.rejects(Object.assign(new Error('timeout'), { code: 'timeout' }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:messages', feedbackId: id, cursor: 'failed-signed-cursor',
		});

		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult',
			operation: 'messages',
			success: false,
			feedbackId: id,
			cursor: 'failed-signed-cursor',
		}));
	});

	test('returns the selected feedback identity when detail loading fails', async () => {
		client.getFeedback.rejects(Object.assign(new Error('timeout'), { code: 'timeout' }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({ command: 'feedback:detail', feedbackId: id });

		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult',
			operation: 'detail',
			success: false,
			feedbackId: id,
		}));
	});

	test('preserves message request identity when the reporter credential is absent', async () => {
		identity.getSecret.resolves(undefined);
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:messages', feedbackId: id, cursor: 'signed-cursor',
		});

		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult',
			operation: 'messages',
			success: false,
			feedbackId: id,
			cursor: 'signed-cursor',
		}));
	});

	test('reuses a persisted message key after an uncertain response and clears it after success', async () => {
		const persistedKey = '66666666-6666-4666-8666-666666666666';
		const suppliedKey = '77777777-7777-4777-8777-777777777777';
		const body = 'The same information after reopening the panel.';
		const digest = createHash('sha256').update(JSON.stringify({ feedbackId: id, body })).digest('hex');
		identity.getPendingMessage.resolves({ digest, idempotencyKey: persistedKey });
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:addMessage', feedbackId: id, body, idempotencyKey: suppliedKey,
		});

		assert.ok(client.addMessage.calledWith('a'.repeat(43), id, body, persistedKey));
		assert.ok(identity.getPendingMessage.calledWith(id, digest));
		assert.ok(identity.storePendingMessage.calledWith(id, { digest, idempotencyKey: persistedKey }));
		assert.ok(identity.clearPendingMessage.calledWith(id, digest));
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult',
			operation: 'addMessage',
			success: true,
			feedbackId: id,
			idempotencyKey: suppliedKey,
		}));
	});

	test('returns add-message request identity on failure', async () => {
		const suppliedKey = '88888888-8888-4888-8888-888888888888';
		client.addMessage.rejects(Object.assign(new Error('timeout'), { code: 'timeout', retryable: true }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:addMessage', feedbackId: id, body: 'Uncertain message', idempotencyKey: suppliedKey,
		});

		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult',
			operation: 'addMessage',
			success: false,
			feedbackId: id,
			idempotencyKey: suppliedKey,
		}));
	});

	test('rejects sensitive message text locally before reading credentials or invoking the client', async () => {
		const suppliedKey = '99999999-9999-4999-8999-999999999999';
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:addMessage', feedbackId: id,
			body: 'Calling digitalWrite(LED_BUILTIN, HIGH); makes the upload fail.',
			idempotencyKey: suppliedKey,
		});

		assert.strictEqual(identity.getSecret.callCount, 0);
		assert.strictEqual(client.addMessage.callCount, 0);
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult', operation: 'addMessage', success: false,
			code: 'sensitive_content', feedbackId: id, idempotencyKey: suppliedKey,
		}));
	});

	test('keeps different uncertain message keys so an older body can retry without duplication', async () => {
		const pending = new Map<string, { digest: string; idempotencyKey: string }>();
		identity.getPendingMessage.callsFake(async (_feedbackId: string, digest: string) => pending.get(digest));
		identity.storePendingMessage.callsFake(async (_feedbackId: string, value: { digest: string; idempotencyKey: string }) => {
			pending.set(value.digest, value);
		});
		identity.clearPendingMessage.callsFake(async (_feedbackId: string, digest: string) => {
			pending.delete(digest);
		});
		client.addMessage.rejects(Object.assign(new Error('timeout'), { code: 'timeout', retryable: true }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		const firstKey = '11111111-2222-4333-8444-555555555555';
		const secondKey = '22222222-3333-4444-8555-666666666666';

		await panel.webview.dispatchMessage({ command: 'feedback:addMessage', feedbackId: id, body: 'First uncertain body', idempotencyKey: firstKey });
		await panel.webview.dispatchMessage({ command: 'feedback:addMessage', feedbackId: id, body: 'Second uncertain body', idempotencyKey: secondKey });
		await panel.webview.dispatchMessage({
			command: 'feedback:addMessage', feedbackId: id, body: 'First uncertain body',
			idempotencyKey: '33333333-4444-4555-8666-777777777777',
		});

		assert.deepStrictEqual(client.addMessage.getCalls().map(call => call.args[3]), [firstKey, secondKey, firstKey]);
		assert.strictEqual(pending.size, 2);
	});

	test('requires exact destructive confirmation and clears SecretStorage only after delete-all succeeds', async () => {
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({
			command: 'feedback:deleteOne', feedbackId: id, confirmationText: 'delete',
			idempotencyKey: '22222222-2222-4222-8222-222222222222',
		});
		assert.strictEqual(client.deleteFeedback.callCount, 0);

		await panel.webview.dispatchMessage({
			command: 'feedback:deleteAll', confirmationText: 'DELETE ALL',
			idempotencyKey: '33333333-3333-4333-8333-333333333333',
		});
		assert.strictEqual(client.deleteAllFeedback.callCount, 1);
		assert.strictEqual(identity.storePendingDeleteAllKey.callCount, 1);
		assert.strictEqual(identity.clearSecret.callCount, 1);
		assert.strictEqual(identity.clearPendingDeleteAllKey.callCount, 1);
		assert.ok(panel.webview.postMessage.calledWithMatch({ command: 'feedback:mutationResult', operation: 'deleteAll', success: true }));
	});

	test('reuses the persisted delete-all key when a reopened webview supplies a new key', async () => {
		const persistedKey = '44444444-4444-4444-8444-444444444444';
		identity.getPendingDeleteAllKey.resolves(persistedKey);
		client.deleteAllFeedback.rejects(Object.assign(new Error('unavailable'), { code: 'service_unavailable' }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:deleteAll', confirmationText: 'DELETE ALL',
			idempotencyKey: '55555555-5555-4555-8555-555555555555',
		});

		assert.ok(client.deleteAllFeedback.calledWith('a'.repeat(43), persistedKey));
		assert.ok(identity.storePendingDeleteAllKey.calledWith(persistedKey));
		assert.strictEqual(identity.clearSecret.callCount, 0);
		assert.strictEqual(identity.clearPendingDeleteAllKey.callCount, 0);
	});

	test('reuses a persisted single-feedback deletion key after reopening', async () => {
		const persistedKey = '66666666-6666-4666-8666-666666666666';
		identity.getPendingDeleteOneKey.resolves(persistedKey);
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({
			command: 'feedback:deleteOne', feedbackId: id, confirmationText: 'DELETE',
			idempotencyKey: '77777777-7777-4777-8777-777777777777',
		});

		assert.ok(client.deleteFeedback.calledWith('a'.repeat(43), id, persistedKey));
		assert.ok(identity.storePendingDeleteOneKey.calledWith(id, persistedKey));
		assert.ok(identity.clearPendingDeleteOneKey.calledWith(id));
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:mutationResult', operation: 'deleteOne', success: true,
			feedbackId: id,
			idempotencyKey: '77777777-7777-4777-8777-777777777777',
		}));
	});

	test('clears a reporter secret revoked through the recovery portal and renders an empty list', async () => {
		client.listFeedback.rejects(Object.assign(new Error('revoked'), { code: 'invalid_reporter', retryable: false }));
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;

		await panel.webview.dispatchMessage({ command: 'feedback:list' });

		assert.ok(identity.clearSecret.calledOnce);
		assert.ok(identity.clearPendingDeleteAllKey.calledOnce);
		assert.ok(panel.webview.postMessage.calledWithMatch({
			command: 'feedback:listResult', items: [], nextCursor: null, hasCredential: false,
		}));
	});

	test('rejects unknown fields and non-UUID identifiers before client calls', async () => {
		await manager.showMyFeedback();
		const panel = manager.getPanel() as any;
		await panel.webview.dispatchMessage({ command: 'feedback:detail', feedbackId: '../foreign', extra: true });
		assert.strictEqual(client.getFeedback.callCount, 0);
	});

	test('localizes navigation, status metadata, dates, and timeline authors', () => {
		const script = fs.readFileSync(path.join(__dirname, '../../../media/js/feedback.js'), 'utf8');
		const html = fs.readFileSync(path.join(__dirname, '../../../media/html/feedback.html'), 'utf8');
		const css = fs.readFileSync(path.join(__dirname, '../../../media/css/feedback.css'), 'utf8');
		for (const key of ['strings.navigation', 'strings.statusLabel', 'strings.createdLabel', 'strings.authorReporter', 'strings.authorMaintainer']) {
			assert.ok(script.includes(key), `missing localized feedback UI binding: ${key}`);
		}
		assert.doesNotMatch(script, /appendDefinition\([^\n]+,\s*['"](?:Status|Created)['"]/);
		assert.match(html, /id="modeNavigation"/);
		assert.match(html, /<html lang="\{lang\}">/);
		assert.match(html, /id="diagnosticsOffWarning"[^>]+aria-live="polite"/);
		assert.match(html, /id="deleteAllZone" class="danger-zone hidden"/);
		assert.match(html, /id="deleteOneConfirmation"[^>]+aria-labelledby="deleteOneLabel deleteOneHelp"/);
		assert.match(html, /id="deleteAllConfirmation"[^>]+aria-labelledby="deleteAllLabel deleteAllHelp"/);
		assert.match(html, /id="deleteOneBackup"[^>]+class="notice warning"/);
		assert.match(html, /id="deleteAllBackup"[^>]+class="notice warning"/);
		assert.match(html, /id="resultStatusLabel">Status<\/dt><dd id="resultStatusValue"/);
		assert.match(script, /deleteAllZone\.classList\.toggle\('hidden', message\.hasCredential !== true\)/);
		assert.match(script, /message\.operation === 'deleteAll'[\s\S]+listRequest = \{ cursor: null \};[\s\S]+feedbackList\.replaceChildren\(\)/);
		assert.match(script, /feedback_delete_pending/);
		assert.match(script, /code === 'sensitive_content'[\s\S]+strings\.errorSensitiveContent/);
		assert.match(script, /diagnosticsOffWarning\.classList\.toggle\('hidden', elements\.includeDiagnostics\.checked\)/);
		assert.match(script, /command: 'feedback:messages'/);
		assert.match(script, /message\.feedbackId !== messageRequest\.feedbackId[\s\S]+message\.cursor !== messageRequest\.cursor[\s\S]+message\.feedbackId !== selectedFeedbackId/);
		assert.match(script, /message\.operation === 'detail'[\s\S]+message\.feedbackId !== latestDetailRequestId[\s\S]+latestDetailRequestId = null/);
		assert.match(script, /function mutationSlot\(operation, fingerprint\)[\s\S]+mutationKeys\.set\(slot, \{ operation, fingerprint, key \}\)/);
		assert.match(script, /message\.operation === 'addMessage'[\s\S]+mutationByKey\('addMessage', message\.idempotencyKey\)[\s\S]+message\.feedbackId !== selectedFeedbackId[\s\S]+return/);
		assert.match(script, /message\.operation === 'deleteOne'[\s\S]+mutationByKey\('deleteOne', message\.idempotencyKey\)[\s\S]+message\.feedbackId !== selectedFeedbackId[\s\S]+return/);
		assert.match(script, /const messageDrafts = new Map\(\)/);
		assert.match(script, /function persistCurrentMessageDraft\(\)[\s\S]+messageDrafts\.set\(selectedFeedbackId, elements\.additionalMessage\.value\)/);
		assert.match(script, /function requestFeedbackDetail\(feedbackId\) \{[\s\S]+persistCurrentMessageDraft\(\);[\s\S]+selectedFeedbackId = null/);
		assert.match(script, /const existingMessageDraft = messageDrafts\.get\(feedback\.id\) \|\| '';[\s\S]+additionalMessage\.value = existingMessageDraft/);
		assert.match(script, /additionalMessage\.addEventListener\('input',\s*persistCurrentMessageDraft\)/);
		assert.match(script, /addMessageMutation\.fingerprint === `\$\{selectedFeedbackId\}:\$\{elements\.additionalMessage\.value\.trim\(\)\}`[\s\S]+additionalMessage\.value = ''/);
		assert.match(script, /message\.operation === 'addMessage'[\s\S]+if \(message\.success\) \{[\s\S]+messageDrafts\.get\(message\.feedbackId\)[\s\S]+messageDrafts\.delete\(message\.feedbackId\)/);
		assert.match(script, /message\.success && deleteOneMutation[\s\S]+removeFeedbackListItem\(message\.feedbackId\)[\s\S]+requestFeedbackList\(\)[\s\S]+message\.feedbackId === selectedFeedbackId/);
		assert.match(script, /listRefreshPending[\s\S]+message\.operation === 'list'[\s\S]+requestFeedbackList\(\)/);
		assert.match(script, /function requestFeedbackDetail\(feedbackId\) \{[\s\S]+selectedFeedbackId = null;[\s\S]+feedbackDetail\.classList\.add\('hidden'\);[\s\S]+addMessageButton\.disabled = true;[\s\S]+deleteOneButton\.disabled = true;/);
		assert.match(script, /function renderDetail\(feedback\) \{[\s\S]+selectedFeedbackId = feedback\.id;[\s\S]+addMessageButton\.disabled = false;[\s\S]+deleteOneButton\.disabled = false;/);
		assert.match(html, /id="messageLoadMoreButton"/);
		assert.match(script, /function clearSubmittedDraft\(\)[\s\S]+feedbackForm\.reset\(\)[\s\S]+removeScreenshot\(\)/);
		assert.match(script, /const textLength = value => Array\.from\(value\)\.length/);
		assert.doesNotMatch(html, /(?:minlength|maxlength)=/);
		assert.match(script, /message\.command === 'feedback:submitted'[\s\S]+message\.confirmationId === confirmationId[\s\S]+clearSubmittedDraft\(\)[\s\S]+showStep\('result'\)/);
		assert.match(script, /message\.command === 'feedback:error'[\s\S]+message\.confirmationId[\s\S]+message\.confirmationId !== confirmationId[\s\S]+return/);
		assert.match(script, /resultStatusValue\.textContent = statusLabel\(message\.feedback\.status\)/);
		for (const field of ['detailSteps', 'detailExpected', 'detailDiagnostics', 'detailAttachmentStatus']) {
			assert.match(html, new RegExp(`id="${field}"`));
			assert.ok(script.includes(`elements.${field}.textContent`), `missing detail renderer for ${field}`);
		}
		assert.match(script, /message\.command === 'feedback:error'[\s\S]+resultStep\.classList\.contains\('hidden'\)[\s\S]+recoveryStatus\.textContent = errorMessage/);
		assert.strictEqual((script.match(/clearSubmittedDraft\(\);/g) ?? []).length, 1, 'draft reset must only occur after confirmed success');
		assert.match(css, /\*, \*::before, \*::after \{ box-sizing: border-box; \}/);
		assert.match(css, /\.shell \{ width: 100%; max-width: 760px;/);
		assert.match(css, /fieldset, pre \{ min-width: 0; \}/);
	});
});
