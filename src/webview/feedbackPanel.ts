/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomBytes, randomUUID } from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileService } from '../services/fileService';
import type { FeedbackClient } from '../services/feedbackClient';
import { containsSensitiveFeedbackText } from '../services/feedbackContentSafety';
import type { FeedbackDiagnosticsSource } from '../services/feedbackDiagnostics';
import { buildFeedbackDiagnostics } from '../services/feedbackDiagnostics';
import { validateSanitizedScreenshot } from '../services/feedbackScreenshot';
import type { FeedbackIdentityService } from '../services/feedbackIdentity';
import type { LocaleService } from '../services/localeService';
import { log } from '../services/logging';
import {
	FEEDBACK_LIMITS,
	type CreateFeedbackInput,
	type FeedbackDetail,
	type FeedbackDraft,
	type FeedbackPreview,
	type SanitizedFeedbackScreenshot,
	isFeedbackDraft,
	isSanitizedFeedbackScreenshot,
} from '../types/feedback';

interface FeedbackAssetReader {
	readFile(relativePath: string, defaultContent?: string): Promise<string>;
}

export interface FeedbackPanelPrefill extends Partial<FeedbackDraft> {}

interface FeedbackPreviewRequest {
	command: 'feedback:preview';
	draft: FeedbackDraft;
	includeDiagnostics: boolean;
	includeRecentEvents: boolean;
	screenshot?: SanitizedFeedbackScreenshot;
}

interface FeedbackSubmitRequest extends Omit<FeedbackPreviewRequest, 'command'> {
	command: 'feedback:submit';
	confirmationId: string;
}

interface FeedbackReadyRequest {
	command: 'feedback:ready';
}

interface FeedbackCopyRecoveryRequest {
	command: 'feedback:copyRecovery';
}

interface FeedbackListRequest {
	command: 'feedback:list';
	cursor?: string;
}

interface FeedbackDetailRequest {
	command: 'feedback:detail';
	feedbackId: string;
}

interface FeedbackMessagesRequest {
	command: 'feedback:messages';
	feedbackId: string;
	cursor: string;
}

interface FeedbackAddMessageRequest {
	command: 'feedback:addMessage';
	feedbackId: string;
	body: string;
	idempotencyKey: string;
}

interface FeedbackDeleteOneRequest {
	command: 'feedback:deleteOne';
	feedbackId: string;
	confirmationText: string;
	idempotencyKey: string;
}

interface FeedbackDeleteAllRequest {
	command: 'feedback:deleteAll';
	confirmationText: string;
	idempotencyKey: string;
}

interface FeedbackPolicyRequest {
	command: 'feedback:openPolicy';
	policy: 'privacy' | 'support' | 'terms';
}

type FeedbackWebviewMessage = FeedbackReadyRequest
	| FeedbackPreviewRequest
	| FeedbackSubmitRequest
	| FeedbackCopyRecoveryRequest
	| FeedbackListRequest
	| FeedbackDetailRequest
	| FeedbackMessagesRequest
	| FeedbackAddMessageRequest
	| FeedbackDeleteOneRequest
	| FeedbackDeleteAllRequest
	| FeedbackPolicyRequest;

interface BoundPreview {
	preview: FeedbackPreview;
	digest: string;
	idempotencyKey: string;
	expiresAt: number;
}

interface PendingSubmission {
	digest: string;
	idempotencyKey: string;
}

let vscodeApi: typeof vscode = vscode;

export function _setVSCodeApi(api: typeof vscode): void {
	vscodeApi = api;
}

export function _reset(): void {
	vscodeApi = vscode;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
	const actual = Object.keys(value).sort();
	return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function textLength(value: string): number {
	return Array.from(value).length;
}

function boundedText(value: string, min: number, max: number): boolean {
	const length = textLength(value.trim());
	return length >= min && length <= max;
}

function validDraft(draft: FeedbackDraft): boolean {
	return isFeedbackDraft(draft)
		&& boundedText(draft.title, FEEDBACK_LIMITS.titleMin, FEEDBACK_LIMITS.titleMax)
		&& boundedText(draft.description, FEEDBACK_LIMITS.descriptionMin, FEEDBACK_LIMITS.descriptionMax)
		&& (draft.steps === undefined || textLength(draft.steps.trim()) <= FEEDBACK_LIMITS.stepsMax)
		&& (draft.expected === undefined || textLength(draft.expected.trim()) <= FEEDBACK_LIMITS.expectedMax);
}

function containsSensitiveDraftText(draft: FeedbackDraft): boolean {
	return [draft.title, draft.description, draft.steps, draft.expected]
		.some(value => typeof value === 'string' && containsSensitiveFeedbackText(value));
}

function isPreviewMessage(value: unknown): value is FeedbackPreviewRequest {
	const keys = value && isRecord(value) && value.screenshot !== undefined
		? ['command', 'draft', 'includeDiagnostics', 'includeRecentEvents', 'screenshot']
		: ['command', 'draft', 'includeDiagnostics', 'includeRecentEvents'];
	return isRecord(value)
		&& exactKeys(value, keys)
		&& value.command === 'feedback:preview'
		&& isFeedbackDraft(value.draft)
		&& typeof value.includeDiagnostics === 'boolean'
		&& typeof value.includeRecentEvents === 'boolean'
		&& (value.screenshot === undefined || isSanitizedFeedbackScreenshot(value.screenshot));
}

function isSubmitMessage(value: unknown): value is FeedbackSubmitRequest {
	const keys = value && isRecord(value) && value.screenshot !== undefined
		? ['command', 'confirmationId', 'draft', 'includeDiagnostics', 'includeRecentEvents', 'screenshot']
		: ['command', 'confirmationId', 'draft', 'includeDiagnostics', 'includeRecentEvents'];
	return isRecord(value)
		&& exactKeys(value, keys)
		&& value.command === 'feedback:submit'
		&& typeof value.confirmationId === 'string'
		&& /^[A-Za-z0-9_-]{32}$/.test(value.confirmationId)
		&& isFeedbackDraft(value.draft)
		&& typeof value.includeDiagnostics === 'boolean'
		&& typeof value.includeRecentEvents === 'boolean'
		&& (value.screenshot === undefined || isSanitizedFeedbackScreenshot(value.screenshot));
}

function isMessage(value: unknown): value is FeedbackWebviewMessage {
	if (!isRecord(value) || typeof value.command !== 'string') {return false;}
	if (value.command === 'feedback:ready' || value.command === 'feedback:copyRecovery') {
		return exactKeys(value, ['command']);
	}
	if (value.command === 'feedback:list') {
		return exactKeys(value, value.cursor === undefined ? ['command'] : ['command', 'cursor'])
			&& (value.cursor === undefined || (typeof value.cursor === 'string' && value.cursor.length <= 256));
	}
	if (value.command === 'feedback:detail') {
		return exactKeys(value, ['command', 'feedbackId']) && isUuidString(value.feedbackId);
	}
	if (value.command === 'feedback:messages') {
		return exactKeys(value, ['command', 'cursor', 'feedbackId'])
			&& isUuidString(value.feedbackId)
			&& typeof value.cursor === 'string'
			&& value.cursor.length <= 256;
	}
	if (value.command === 'feedback:addMessage') {
		return exactKeys(value, ['body', 'command', 'feedbackId', 'idempotencyKey'])
			&& isUuidString(value.feedbackId)
			&& isUuidString(value.idempotencyKey)
			&& typeof value.body === 'string'
			&& boundedText(value.body, 1, FEEDBACK_LIMITS.messageMax);
	}
	if (value.command === 'feedback:deleteOne') {
		return exactKeys(value, ['command', 'confirmationText', 'feedbackId', 'idempotencyKey'])
			&& isUuidString(value.feedbackId)
			&& isUuidString(value.idempotencyKey)
			&& typeof value.confirmationText === 'string';
	}
	if (value.command === 'feedback:deleteAll') {
		return exactKeys(value, ['command', 'confirmationText', 'idempotencyKey'])
			&& isUuidString(value.idempotencyKey)
			&& typeof value.confirmationText === 'string';
	}
	if (value.command === 'feedback:openPolicy') {
		return exactKeys(value, ['command', 'policy'])
			&& (value.policy === 'privacy' || value.policy === 'support' || value.policy === 'terms');
	}
	return isPreviewMessage(value) || isSubmitMessage(value);
}

function isUuidString(value: unknown): value is string {
	return typeof value === 'string'
		&& /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export class FeedbackPanel implements vscode.Disposable {
	private panel: vscode.WebviewPanel | undefined;
	private opening: Promise<void> | undefined;
	private boundPreview: BoundPreview | undefined;
	private pendingSubmission: PendingSubmission | undefined;
	private prefill: FeedbackPanelPrefill | undefined;
	private mode: 'form' | 'list' = 'form';
	private readonly assets: FeedbackAssetReader;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly localeService: LocaleService,
		private readonly identityService: FeedbackIdentityService,
		private readonly client: FeedbackClient,
		private readonly diagnosticsSource: () => FeedbackDiagnosticsSource,
		assets?: FeedbackAssetReader,
	) {
		this.assets = assets ?? new FileService(context.extensionPath);
	}

	async show(prefill?: FeedbackPanelPrefill): Promise<void> {
		this.mode = 'form';
		this.prefill = prefill ? this.sanitizePrefill(prefill) : undefined;
		await this.ensurePanel();
		await this.postInitialState();
	}

	private async openPanel(): Promise<void> {
		const title = await this.localeService.getLocalizedMessage('FEEDBACK_PANEL_TITLE', 'Provide Feedback');
		const panel = vscodeApi.window.createWebviewPanel(
			'singularBlocklyFeedback',
			title,
			{ viewColumn: vscodeApi.ViewColumn.One, preserveFocus: false },
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [vscodeApi.Uri.file(path.join(this.context.extensionPath, 'media'))],
			}
		);
		this.panel = panel;
		panel.webview.onDidReceiveMessage(async message => this.handleMessage(message, panel));
		panel.onDidDispose(() => {
			if (this.panel !== panel) {return;}
			this.panel = undefined;
			this.boundPreview = undefined;
			this.prefill = undefined;
		});
		const html = await this.webviewHtml(panel.webview);
		if (this.panel !== panel) {return;}
		panel.webview.html = html;
		log('[feedback] panel opened', 'info');
	}

	private async ensurePanel(): Promise<void> {
		if (this.panel) {
			this.panel.reveal(vscodeApi.ViewColumn.One, true);
			return;
		}
		if (!this.opening) {
			this.opening = (async () => {
				try {await this.openPanel();}
				finally {this.opening = undefined;}
			})();
		}
		await this.opening;
	}

	async showMyFeedback(): Promise<void> {
		this.mode = 'list';
		this.prefill = undefined;
		await this.ensurePanel();
		await this.postInitialState();
	}

	getPanel(): vscode.WebviewPanel | undefined {
		return this.panel;
	}

	dispose(): void {
		this.panel?.dispose();
		this.panel = undefined;
		this.boundPreview = undefined;
	}

	private sanitizePrefill(prefill: FeedbackPanelPrefill): FeedbackPanelPrefill {
		const truncate = (value: string, maximum: number) => Array.from(value).slice(0, maximum).join('');
		return {
			kind: prefill.kind,
			title: typeof prefill.title === 'string' ? truncate(prefill.title, FEEDBACK_LIMITS.titleMax) : undefined,
			description: typeof prefill.description === 'string' ? truncate(prefill.description, FEEDBACK_LIMITS.descriptionMax) : undefined,
			steps: typeof prefill.steps === 'string' ? truncate(prefill.steps, FEEDBACK_LIMITS.stepsMax) : undefined,
			expected: typeof prefill.expected === 'string' ? truncate(prefill.expected, FEEDBACK_LIMITS.expectedMax) : undefined,
		};
	}

	private async handleMessage(message: unknown, sourcePanel: vscode.WebviewPanel): Promise<void> {
		if (this.panel !== sourcePanel) {return;}
		if (!isMessage(message)) {
			log('[feedback] rejected malformed webview message', 'warn');
			return;
		}
		if (message.command === 'feedback:ready') {
			await this.postInitialState();
			return;
		}
		if (message.command === 'feedback:preview') {
			await this.createPreview(message);
			return;
		}
		if (message.command === 'feedback:copyRecovery') {
			await this.copyRecoveryLink();
			return;
		}
		if (message.command === 'feedback:list') {await this.listFeedback(message.cursor); return;}
		if (message.command === 'feedback:detail') {await this.getFeedback(message.feedbackId); return;}
		if (message.command === 'feedback:messages') {await this.listFeedbackMessages(message); return;}
		if (message.command === 'feedback:addMessage') {await this.addMessage(message); return;}
		if (message.command === 'feedback:deleteOne') {await this.deleteOne(message); return;}
		if (message.command === 'feedback:deleteAll') {await this.deleteAll(message); return;}
		if (message.command === 'feedback:openPolicy') {
			const locale = this.diagnosticsSource().locale;
			await vscodeApi.env.openExternal(vscodeApi.Uri.parse(
				`${this.identityService.serviceOrigin}/${message.policy}?lang=${encodeURIComponent(locale)}`
			));
			return;
		}
		await this.submit(message, sourcePanel);
	}

	private async existingSecret(): Promise<string | undefined> {
		const secret = await this.identityService.getSecret();
		return secret && /^[A-Za-z0-9_-]{43}$/.test(secret) ? secret : undefined;
	}

	private async listFeedback(cursor?: string): Promise<void> {
		try {
			const secret = await this.existingSecret();
			const result = secret ? await this.client.listFeedback(secret, cursor) : { items: [], nextCursor: null };
			await this.panel?.webview.postMessage({
				command: 'feedback:listResult',
				...result,
				cursor: cursor ?? null,
				hasCredential: Boolean(secret),
			});
		} catch (error) {
			if (isRecord(error) && error.code === 'invalid_reporter') {
				await Promise.all([
					this.identityService.clearSecret(),
					this.identityService.clearPendingDeleteAllKey(),
				]);
				await this.panel?.webview.postMessage({
					command: 'feedback:listResult',
					items: [],
					nextCursor: null,
					cursor: cursor ?? null,
					hasCredential: false,
				});
				return;
			}
				await this.postStableOperationError('list', error, { cursor: cursor ?? null });
			}
		}

	private async getFeedback(feedbackId: string): Promise<void> {
		try {
			const secret = await this.existingSecret();
			if (!secret) {
				await this.postStableOperationError('detail', { code: 'invalid_reporter' }, { feedbackId });
				return;
			}
			const feedback = await this.client.getFeedback(secret, feedbackId);
			await this.panel?.webview.postMessage({ command: 'feedback:detailResult', feedback });
		} catch (error) {
			await this.postStableOperationError('detail', error, { feedbackId });
		}
	}

	private async listFeedbackMessages(message: FeedbackMessagesRequest): Promise<void> {
		try {
			const secret = await this.existingSecret();
			if (!secret) {
				await this.postStableOperationError('messages', { code: 'invalid_reporter' }, {
					feedbackId: message.feedbackId,
					cursor: message.cursor,
				});
				return;
			}
			const result = await this.client.listFeedbackMessages(secret, message.feedbackId, message.cursor);
			await this.panel?.webview.postMessage({
				command: 'feedback:messagesResult',
				feedbackId: message.feedbackId,
				cursor: message.cursor,
				...result,
			});
		} catch (error) {
			await this.postStableOperationError('messages', error, {
				feedbackId: message.feedbackId,
				cursor: message.cursor,
			});
		}
	}

	private async addMessage(message: FeedbackAddMessageRequest): Promise<void> {
		const body = message.body.trim();
		const requestIdentity = { feedbackId: message.feedbackId, idempotencyKey: message.idempotencyKey };
		if (containsSensitiveFeedbackText(body)) {
			await this.postStableOperationError('addMessage', { code: 'sensitive_content' }, requestIdentity);
			return;
		}
		const digest = createHash('sha256').update(JSON.stringify({ feedbackId: message.feedbackId, body })).digest('hex');
		let idempotencyKey = message.idempotencyKey;
		try {
			const secret = await this.existingSecret();
			if (!secret) {await this.postStableOperationError('addMessage', { code: 'invalid_reporter' }, requestIdentity); return;}
			const pending = await this.identityService.getPendingMessage(message.feedbackId, digest);
			if (pending?.digest === digest) {idempotencyKey = pending.idempotencyKey;}
			await this.identityService.storePendingMessage(message.feedbackId, { digest, idempotencyKey });
			await this.client.addMessage(secret, message.feedbackId, body, idempotencyKey);
			await this.identityService.clearPendingMessage(message.feedbackId, digest);
			await this.panel?.webview.postMessage({
				command: 'feedback:mutationResult', operation: 'addMessage', success: true, ...requestIdentity,
			});
			await this.getFeedback(message.feedbackId);
		} catch (error) {
			if (isRecord(error) && error.retryable === false) {
				await this.identityService.clearPendingMessage(message.feedbackId, digest);
			}
			await this.postStableOperationError('addMessage', error, requestIdentity);
		}
	}

	private async deleteOne(message: FeedbackDeleteOneRequest): Promise<void> {
		const requestIdentity = { feedbackId: message.feedbackId, idempotencyKey: message.idempotencyKey };
		if (message.confirmationText !== 'DELETE') {
			await this.postStableOperationError('deleteOne', { code: 'confirmation_required' }, requestIdentity);
			return;
		}
		try {
			const secret = await this.existingSecret();
			if (!secret) {await this.postStableOperationError('deleteOne', { code: 'invalid_reporter' }, requestIdentity); return;}
			const storedKey = await this.identityService.getPendingDeleteOneKey(message.feedbackId);
			const idempotencyKey = storedKey && isUuidString(storedKey) ? storedKey : message.idempotencyKey;
			await this.identityService.storePendingDeleteOneKey(message.feedbackId, idempotencyKey);
			await this.client.deleteFeedback(secret, message.feedbackId, idempotencyKey);
			await this.identityService.clearPendingDeleteOneKey(message.feedbackId);
			await this.panel?.webview.postMessage({
				command: 'feedback:mutationResult', operation: 'deleteOne', success: true, ...requestIdentity,
			});
			await this.listFeedback();
		} catch (error) {
			if (isRecord(error) && error.retryable === false) {
				await this.identityService.clearPendingDeleteOneKey(message.feedbackId);
			}
			await this.postStableOperationError('deleteOne', error, requestIdentity);
		}
	}

	private async deleteAll(message: FeedbackDeleteAllRequest): Promise<void> {
		if (message.confirmationText !== 'DELETE ALL') {await this.postStableOperationError('deleteAll', { code: 'confirmation_required' }); return;}
		try {
			const secret = await this.existingSecret();
			if (secret) {
				const storedKey = await this.identityService.getPendingDeleteAllKey();
				const idempotencyKey = storedKey && isUuidString(storedKey) ? storedKey : message.idempotencyKey;
				await this.identityService.storePendingDeleteAllKey(idempotencyKey);
				await this.client.deleteAllFeedback(secret, idempotencyKey);
			}
			await this.identityService.clearSecret();
			await this.identityService.clearPendingDeleteAllKey();
			await this.panel?.webview.postMessage({ command: 'feedback:mutationResult', operation: 'deleteAll', success: true });
			await this.listFeedback();
		} catch (error) {await this.postStableOperationError('deleteAll', error);}
	}

	private async postStableOperationError(
		operation: string,
		error: unknown,
		requestIdentity: Record<string, string | null> = {},
	): Promise<void> {
		const code = isRecord(error) && typeof error.code === 'string' ? error.code : 'request_failed';
		log('[feedback] operation failed', 'warn', { operation, code });
		await this.panel?.webview.postMessage({
			command: 'feedback:mutationResult', operation, success: false, code, ...requestIdentity,
		});
	}

	private async createPreview(message: FeedbackPreviewRequest): Promise<void> {
		if (!validDraft(message.draft)) {
			await this.postError('invalid_input');
			return;
		}
		if (containsSensitiveDraftText(message.draft)) {
			await this.postError('sensitive_content');
			return;
		}
		const screenshot = message.screenshot === undefined ? undefined : validateSanitizedScreenshot(message.screenshot);
		if (message.screenshot && !screenshot) {
			await this.postError('invalid_attachment');
			return;
		}
		const preview = this.buildPreview(message, undefined, screenshot);
		const digest = this.digest(preview);
		this.boundPreview = {
			preview,
			digest,
			idempotencyKey: this.pendingSubmission?.digest === digest
				? this.pendingSubmission.idempotencyKey
				: randomUUID(),
			expiresAt: Date.now() + 10 * 60 * 1000,
		};
		await this.panel?.webview.postMessage({ command: 'feedback:previewReady', preview });
	}

	private async submit(message: FeedbackSubmitRequest, sourcePanel: vscode.WebviewPanel): Promise<void> {
		if (!validDraft(message.draft)) {
			await this.postError('invalid_input');
			return;
		}
		if (containsSensitiveDraftText(message.draft)) {
			await this.postError('sensitive_content');
			return;
		}
		const screenshot = message.screenshot === undefined ? undefined : validateSanitizedScreenshot(message.screenshot);
		if (message.screenshot && !screenshot) {
			await this.postError('invalid_attachment');
			return;
		}
		const candidate = this.buildPreview(message, message.confirmationId, screenshot);
		const digest = this.digest(candidate);
		const pendingMatches = this.pendingSubmission?.digest === digest
			&& this.pendingSubmission.idempotencyKey === this.boundPreview?.idempotencyKey;
		if (!this.boundPreview
			|| (this.boundPreview.expiresAt < Date.now() && !pendingMatches)
			|| this.boundPreview.preview.confirmationId !== message.confirmationId
			|| this.boundPreview.digest !== digest) {
			await this.postError('preview_changed');
			return;
		}
		const boundPreview = this.boundPreview;
		this.pendingSubmission = { digest, idempotencyKey: boundPreview.idempotencyKey };

		try {
			const secret = await this.identityService.getOrCreateSecret();
			let feedback: FeedbackDetail;
			try {
				feedback = await this.client.createFeedback(
					secret,
					candidate.input,
					candidate.screenshot,
					boundPreview.idempotencyKey,
				);
			} catch (error) {
				if (isRecord(error) && error.code === 'invalid_reporter') {
					// A concurrent delete-all may have revoked this reporter. Never turn
					// that response into a new submission without another explicit click.
					await this.identityService.clearSecret();
				}
				throw error;
			}
			const shouldDeliver = this.panel === sourcePanel && this.boundPreview === boundPreview;
			if (this.boundPreview === boundPreview) {this.boundPreview = undefined;}
			if (this.pendingSubmission?.idempotencyKey === boundPreview.idempotencyKey) {
				this.pendingSubmission = undefined;
			}
			if (shouldDeliver) {
				await sourcePanel.webview.postMessage({
					command: 'feedback:submitted',
					confirmationId: message.confirmationId,
					feedback: { reference: feedback.reference, status: feedback.status },
				});
			}
			log('[feedback] submission accepted', 'info', { reference: feedback.reference });
		} catch (error) {
			const code = isRecord(error) && typeof error.code === 'string' ? error.code : 'request_failed';
			if (isRecord(error) && error.retryable === false
				&& this.pendingSubmission?.idempotencyKey === boundPreview.idempotencyKey) {
				this.pendingSubmission = undefined;
			}
			log('[feedback] submission failed', 'warn', { code });
			if (this.panel === sourcePanel) {
				await sourcePanel.webview.postMessage({
					command: 'feedback:error', code, confirmationId: message.confirmationId,
				});
			}
		}
	}

	private buildPreview(
		message: Omit<FeedbackPreviewRequest, 'command'>,
		confirmationId = randomBytes(24).toString('base64url'),
		screenshot?: SanitizedFeedbackScreenshot,
	): FeedbackPreview {
		const input: CreateFeedbackInput = {
			schemaVersion: 1,
			kind: message.draft.kind,
			title: message.draft.title.trim(),
			description: message.draft.description.trim(),
			...(message.draft.steps?.trim() ? { steps: message.draft.steps.trim() } : {}),
			...(message.draft.expected?.trim() ? { expected: message.draft.expected.trim() } : {}),
			diagnostics: buildFeedbackDiagnostics(this.diagnosticsSource(), {
				includeDiagnostics: message.includeDiagnostics,
				includeRecentEvents: message.includeRecentEvents,
			}),
		};
		return {
			input,
			includeDiagnostics: message.includeDiagnostics,
			includeRecentEvents: message.includeRecentEvents,
			screenshot,
			confirmationId,
		};
	}

	private digest(preview: FeedbackPreview): string {
		return createHash('sha256').update(JSON.stringify({
			input: preview.input,
			includeDiagnostics: preview.includeDiagnostics,
			includeRecentEvents: preview.includeRecentEvents,
			screenshot: preview.screenshot,
		})).digest('hex');
	}

	private async copyRecoveryLink(): Promise<void> {
		try {
			const secret = await this.identityService.getOrCreateSecret();
			await vscodeApi.env.clipboard.writeText(this.identityService.createRecoveryUrl(secret, this.diagnosticsSource().locale));
			await this.panel?.webview.postMessage({ command: 'feedback:recoveryCopied' });
		} catch {
			await this.postError('recovery_unavailable');
		}
	}

	private async postInitialState(): Promise<void> {
		await this.panel?.webview.postMessage({
			command: 'feedback:initialState',
			mode: this.mode,
			prefill: this.prefill,
			limits: FEEDBACK_LIMITS,
			strings: await this.localizedStrings(),
		});
	}

	private postError(code: string): Thenable<boolean> | undefined {
		return this.panel?.webview.postMessage({ command: 'feedback:error', code });
	}

	private async localizedStrings(): Promise<Record<string, string>> {
		const entries: Array<[string, string, string]> = [
			['title', 'FEEDBACK_PANEL_TITLE', 'Provide Feedback'],
			['intro', 'FEEDBACK_INTRO', 'Tell us what happened or what would make Singular Blockly better. No GitHub account is needed.'],
			['personalDataWarning', 'FEEDBACK_PERSONAL_DATA_WARNING', 'Do not include names, email addresses, student information, credentials, source code, private paths, or complete logs.'],
			['kind', 'FEEDBACK_KIND_LABEL', 'Feedback type'],
			['bug', 'FEEDBACK_KIND_BUG', 'Problem report'],
			['feature', 'FEEDBACK_KIND_FEATURE', 'Feature suggestion'],
			['question', 'FEEDBACK_KIND_QUESTION', 'Usage question'],
			['other', 'FEEDBACK_KIND_OTHER', 'Other feedback'],
			['feedbackTitle', 'FEEDBACK_TITLE_LABEL', 'Short summary'],
			['description', 'FEEDBACK_DESCRIPTION_LABEL', 'What would you like us to know?'],
			['steps', 'FEEDBACK_STEPS_LABEL', 'Steps to reproduce (optional)'],
			['expected', 'FEEDBACK_EXPECTED_LABEL', 'What did you expect? (optional)'],
			['basicDiagnostics', 'FEEDBACK_BASIC_DIAGNOSTICS_LABEL', 'Include basic environment information'],
			['basicDiagnosticsHelp', 'FEEDBACK_BASIC_DIAGNOSTICS_HELP', 'Includes app versions, OS family, architecture, language, host and workspace type. Never includes source code, paths, device IDs, network details, or raw logs.'],
			['diagnosticsOffWarning', 'FEEDBACK_DIAGNOSTICS_OFF_WARNING', 'Basic environment information is off. You can still send feedback, but diagnosis may be less effective.'],
			['recentEvents', 'FEEDBACK_RECENT_EVENTS_LABEL', 'Include recent structured events'],
			['recentEventsHelp', 'FEEDBACK_RECENT_EVENTS_HELP', 'Off by default. Includes only bounded timestamps, stages, stable event codes, and outcomes.'],
			['dataLegend', 'FEEDBACK_DATA_LEGEND', 'Information sent with your feedback'],
			['screenshot', 'FEEDBACK_SCREENSHOT_LEGEND', 'Optional screenshot'],
			['screenshotChoose', 'FEEDBACK_SCREENSHOT_CHOOSE', 'Choose one screenshot'],
			['screenshotHelp', 'FEEDBACK_SCREENSHOT_HELP', 'The image is re-encoded on this device, limited to 1920 pixels and 3 MiB, and sent only after confirmation.'],
			['screenshotPrivacy', 'FEEDBACK_SCREENSHOT_PRIVACY', 'Before sending, check the image for names, email addresses, paths, program content, and other private information.'],
			['screenshotRemove', 'FEEDBACK_SCREENSHOT_REMOVE', 'Remove screenshot'],
			['screenshotError', 'FEEDBACK_SCREENSHOT_ERROR', 'This screenshot could not be prepared. Choose a PNG or JPEG image under the limits.'],
			['screenshotPreviewAlt', 'FEEDBACK_SCREENSHOT_PREVIEW_ALT', 'Selected screenshot preview'],
			['reviewScreenshotAlt', 'FEEDBACK_REVIEW_SCREENSHOT_ALT', 'Screenshot that will be sent'],
			['review', 'FEEDBACK_REVIEW_ACTION', 'Review what will be sent'],
			['reviewTitle', 'FEEDBACK_REVIEW_TITLE', 'Review before sending'],
			['reviewHelp', 'FEEDBACK_REVIEW_HELP', 'This is the complete payload. Nothing is sent until you confirm below.'],
			['serviceDisclosure', 'FEEDBACK_SERVICE_DISCLOSURE', 'Sending stores feedback in Cloudflare D1/R2 and a private GitHub maintainer workspace until you delete it. Provider backups may persist briefly. An anonymized public development summary is created only with project-owner approval.'],
			['back', 'FEEDBACK_BACK_ACTION', 'Back'],
			['confirm', 'FEEDBACK_CONFIRM_ACTION', 'Confirm and send'],
			['sending', 'FEEDBACK_SENDING', 'Sending feedback…'],
			['success', 'FEEDBACK_SUCCESS', 'Thank you. Your feedback was received.'],
			['reference', 'FEEDBACK_REFERENCE_LABEL', 'Feedback number'],
			['copyRecovery', 'FEEDBACK_COPY_RECOVERY_ACTION', 'Copy backup access link'],
			['recoveryCopied', 'FEEDBACK_RECOVERY_COPIED', 'Backup access link copied. Keep it private.'],
			['error', 'FEEDBACK_ERROR_GENERIC', 'Feedback could not be sent. Review the form and try again.'],
			['errorTimeout', 'FEEDBACK_ERROR_TIMEOUT', 'The request timed out. Your form is still here; try sending it again.'],
			['errorRateLimited', 'FEEDBACK_ERROR_RATE_LIMITED', 'Too many requests were made. Your form is still here; wait a moment and try again.'],
			['errorServiceUnavailable', 'FEEDBACK_ERROR_SERVICE_UNAVAILABLE', 'The feedback service is temporarily unavailable. Your form is still here; try again later.'],
			['errorAttachment', 'FEEDBACK_ERROR_ATTACHMENT', 'The screenshot was rejected. Remove it or choose a newly captured PNG or JPEG, then review again.'],
			['errorValidation', 'FEEDBACK_ERROR_VALIDATION', 'Some feedback fields are invalid. Review the highlighted information and try again.'],
			['errorSensitiveContent', 'FEEDBACK_ERROR_SENSITIVE_CONTENT', 'Sensitive information was detected. Remove credentials, private paths, IP addresses, source code, or terminal output and review again.'],
			['provideFeedback', 'FEEDBACK_PROVIDE_ACTION', 'Provide feedback'],
			['myFeedback', 'FEEDBACK_MY_FEEDBACK_ACTION', 'My feedback'],
			['myFeedbackTitle', 'FEEDBACK_MY_FEEDBACK_TITLE', 'My feedback'],
			['myFeedbackHelp', 'FEEDBACK_MY_FEEDBACK_HELP', 'Only feedback created with this private backup credential appears here.'],
			['detailDescriptionLabel', 'FEEDBACK_DETAIL_DESCRIPTION_LABEL', 'Description'],
			['detailStepsLabel', 'FEEDBACK_DETAIL_STEPS_LABEL', 'Steps to reproduce'],
			['detailExpectedLabel', 'FEEDBACK_DETAIL_EXPECTED_LABEL', 'Expected result'],
			['detailDiagnosticsLabel', 'FEEDBACK_DETAIL_DIAGNOSTICS_LABEL', 'Environment information'],
			['detailAttachmentIncluded', 'FEEDBACK_DETAIL_ATTACHMENT_INCLUDED', 'Screenshot attached.'],
			['detailAttachmentNotIncluded', 'FEEDBACK_DETAIL_ATTACHMENT_NOT_INCLUDED', 'No screenshot attached.'],
			['emptyFeedback', 'FEEDBACK_EMPTY', 'No feedback has been sent from this installation.'],
			['loadMore', 'FEEDBACK_LOAD_MORE', 'Load more'],
			['addMessage', 'FEEDBACK_ADD_MESSAGE_ACTION', 'Add information'],
			['messageLabel', 'FEEDBACK_MESSAGE_LABEL', 'Additional information'],
			['deleteOne', 'FEEDBACK_DELETE_ONE_ACTION', 'Delete this feedback'],
			['deleteAll', 'FEEDBACK_DELETE_ALL_ACTION', 'Delete all feedback and backup access'],
			['deleteOneHelp', 'FEEDBACK_DELETE_ONE_HELP', 'Type DELETE to confirm.'],
			['deleteAllHelp', 'FEEDBACK_DELETE_ALL_HELP', 'Type DELETE ALL to confirm. This also invalidates your backup link.'],
			['deletionBackup', 'FEEDBACK_DELETION_BACKUP_NOTICE', 'Primary content is removed immediately; provider security backups may briefly retain encrypted copies, and an owner-approved anonymized public development record may remain.'],
			['operationSuccess', 'FEEDBACK_OPERATION_SUCCESS', 'The change was saved.'],
			['privacy', 'FEEDBACK_PRIVACY_ACTION', 'Privacy'],
			['support', 'FEEDBACK_SUPPORT_ACTION', 'Support'],
			['terms', 'FEEDBACK_TERMS_ACTION', 'Terms'],
			['navigation', 'FEEDBACK_NAVIGATION_LABEL', 'Feedback sections'],
			['statusLabel', 'FEEDBACK_STATUS_LABEL', 'Status'],
			['createdLabel', 'FEEDBACK_CREATED_LABEL', 'Created'],
			['authorReporter', 'FEEDBACK_AUTHOR_REPORTER', 'You'],
			['authorMaintainer', 'FEEDBACK_AUTHOR_MAINTAINER', 'Maintainer'],
			['statusReceived', 'FEEDBACK_STATUS_RECEIVED', 'Received'],
			['statusTriaging', 'FEEDBACK_STATUS_TRIAGING', 'Under review'],
			['statusNeedsInfo', 'FEEDBACK_STATUS_NEEDS_INFO', 'Needs information'],
			['statusPlanned', 'FEEDBACK_STATUS_PLANNED', 'Planned'],
			['statusInProgress', 'FEEDBACK_STATUS_IN_PROGRESS', 'In progress'],
			['statusResolved', 'FEEDBACK_STATUS_RESOLVED', 'Resolved'],
			['statusClosed', 'FEEDBACK_STATUS_CLOSED', 'Closed'],
		];
		const values = await Promise.all(entries.map(async ([name, key, fallback]) => [
			name,
			await this.localeService.getLocalizedMessage(key, fallback),
		] as const));
		return Object.fromEntries(values);
	}

	private async webviewHtml(webview: vscode.Webview): Promise<string> {
		const template = await this.assets.readFile('media/html/feedback.html');
		if (!template) {throw new Error('Feedback webview template is unavailable');}
		const nonce = randomBytes(24).toString('base64url');
		const cssUri = webview.asWebviewUri(vscodeApi.Uri.file(path.join(this.context.extensionPath, 'media/css/feedback.css'))).toString();
		const jsUri = webview.asWebviewUri(vscodeApi.Uri.file(path.join(this.context.extensionPath, 'media/js/feedback.js'))).toString();
		const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} blob: data:;`;
		return template
			.replaceAll('{lang}', this.webviewLanguage())
			.replaceAll('{csp}', csp)
			.replaceAll('{nonce}', nonce)
			.replaceAll('{cssUri}', cssUri)
			.replaceAll('{jsUri}', jsUri);
	}

	private webviewLanguage(): string {
		const locale = this.diagnosticsSource().locale;
		return /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ? locale : 'en';
	}
}
