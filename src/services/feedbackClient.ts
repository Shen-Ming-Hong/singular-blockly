/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FEEDBACK_SERVICE_ORIGIN } from './feedbackIdentity';
import type {
	CreateFeedbackInput,
	FeedbackDetail,
	FeedbackListResponse,
	FeedbackMessage,
	FeedbackMessageListResponse,
	SanitizedFeedbackScreenshot,
} from '../types/feedback';
import {
	isFeedbackDetail,
	isFeedbackListResponse,
	isFeedbackMessage,
	isFeedbackMessageListResponse,
} from '../types/feedback';

const RESPONSE_BYTES_MAX = 1024 * 1024;

async function readResponseText(response: Response, signal: AbortSignal, invalidResponseRetryable = false): Promise<string> {
	if (signal.aborted) {throw new DOMException('The operation was aborted', 'AbortError');}
	const contentLength = response.headers.get('content-length');
	if (contentLength) {
		const parsed = Number(contentLength);
		if (!Number.isInteger(parsed) || parsed < 0 || parsed > RESPONSE_BYTES_MAX) {
			throw new FeedbackClientError('invalid_response', response.status, invalidResponseRetryable);
		}
	}
	if (!response.body) {return '';}

	const reader = response.body.getReader();
	const abort = (): void => {void reader.cancel().catch(() => undefined);};
	const chunks: Uint8Array[] = [];
	let total = 0;
	signal.addEventListener('abort', abort, { once: true });
	try {
		while (true) {
			if (signal.aborted) {throw new DOMException('The operation was aborted', 'AbortError');}
			const { done, value } = await reader.read();
			if (done) {break;}
			total += value.byteLength;
			if (total > RESPONSE_BYTES_MAX) {
				await reader.cancel();
				throw new FeedbackClientError('invalid_response', response.status, invalidResponseRetryable);
			}
			chunks.push(value);
		}
		if (signal.aborted) {throw new DOMException('The operation was aborted', 'AbortError');}
	} finally {
		signal.removeEventListener('abort', abort);
		reader.releaseLock();
	}
	return Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8');
}

export class FeedbackClientError extends Error {
	constructor(
		public readonly code: string,
		public readonly status: number | undefined,
		public readonly retryable: boolean
	) {
		super(`Feedback request failed (${code})`);
		this.name = 'FeedbackClientError';
	}
}

export class FeedbackClient {
	constructor(
		private readonly fetchImpl: typeof fetch = globalThis.fetch,
		private readonly serviceOrigin = FEEDBACK_SERVICE_ORIGIN,
		private readonly timeoutMs = 15_000,
		private readonly retryDelayMs = 250
	) {
		const origin = new URL(serviceOrigin);
		if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) {
			throw new Error('Feedback service origin must be a bare HTTPS origin');
		}
	}

	async createFeedback(
		reporterSecret: string,
		input: CreateFeedbackInput,
		screenshot?: SanitizedFeedbackScreenshot,
		idempotencyKey: string = crypto.randomUUID()
	): Promise<FeedbackDetail> {
		for (let attempt = 0; attempt < 2; attempt += 1) {
			try {
				return await this.requestCreate(reporterSecret, input, screenshot, idempotencyKey);
			} catch (error) {
				const shouldRetry = attempt === 0
					&& error instanceof FeedbackClientError
					&& error.retryable
					&& error.status !== 429;
				if (!shouldRetry) {throw error;}
				await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
			}
		}
		throw new FeedbackClientError('request_failed', undefined, false);
	}

	async listFeedback(reporterSecret: string, cursor?: string): Promise<FeedbackListResponse> {
		const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
		return this.requestJson(`/api/v1/feedback${suffix}`, reporterSecret, { method: 'GET' }, isFeedbackListResponse);
	}

	async getFeedback(reporterSecret: string, feedbackId: string): Promise<FeedbackDetail> {
		this.assertFeedbackId(feedbackId);
		return this.requestJson(`/api/v1/feedback/${feedbackId}`, reporterSecret, { method: 'GET' }, isFeedbackDetail);
	}

	async listFeedbackMessages(
		reporterSecret: string,
		feedbackId: string,
		cursor?: string,
	): Promise<FeedbackMessageListResponse> {
		this.assertFeedbackId(feedbackId);
		const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
		return this.requestJson(
			`/api/v1/feedback/${feedbackId}/messages${suffix}`,
			reporterSecret,
			{ method: 'GET' },
			isFeedbackMessageListResponse,
		);
	}

	async addMessage(
		reporterSecret: string,
		feedbackId: string,
		body: string,
		idempotencyKey: string = crypto.randomUUID(),
	): Promise<FeedbackMessage> {
		this.assertFeedbackId(feedbackId);
		return this.requestJson(`/api/v1/feedback/${feedbackId}/messages`, reporterSecret, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
			body: JSON.stringify({ body }),
		}, isFeedbackMessage, true);
	}

	async deleteFeedback(
		reporterSecret: string,
		feedbackId: string,
		idempotencyKey: string = crypto.randomUUID(),
	): Promise<void> {
		this.assertFeedbackId(feedbackId);
		await this.requestEmpty(`/api/v1/feedback/${feedbackId}`, reporterSecret, {
			method: 'DELETE',
			headers: { 'Idempotency-Key': idempotencyKey },
		}, true);
	}

	async deleteAllFeedback(reporterSecret: string, idempotencyKey: string = crypto.randomUUID()): Promise<void> {
		await this.requestEmpty('/api/v1/reporter', reporterSecret, {
			method: 'DELETE',
			headers: { 'Idempotency-Key': idempotencyKey },
		}, true);
	}

	private async requestCreate(
		reporterSecret: string,
		input: CreateFeedbackInput,
		screenshot: SanitizedFeedbackScreenshot | undefined,
		idempotencyKey: string
	): Promise<FeedbackDetail> {
		const form = new FormData();
		form.set('payload', JSON.stringify(input));
		if (screenshot) {
			const bytes = Buffer.from(screenshot.bytesBase64, 'base64');
			form.set('screenshot', new Blob([bytes], { type: screenshot.mediaType }), 'feedback-screenshot');
		}

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);
		try {
			const response = await this.fetchImpl(`${this.serviceOrigin}/api/v1/feedback`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${reporterSecret}`,
					'Idempotency-Key': idempotencyKey,
				},
				body: form,
				signal: controller.signal,
			});
			const uncertainResult = response.ok || response.status === 429 || response.status >= 500;
			const text = await readResponseText(response, controller.signal, uncertainResult);
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				throw new FeedbackClientError('invalid_response', response.status, uncertainResult);
			}
			if (controller.signal.aborted) {throw new DOMException('The operation was aborted', 'AbortError');}

			if (!response.ok) {
				const code = this.errorCode(parsed);
				throw new FeedbackClientError(code, response.status, response.status === 429 || response.status >= 500);
			}
			if (!isFeedbackDetail(parsed)) {
				throw new FeedbackClientError('invalid_response', response.status, uncertainResult);
			}
			return parsed;
		} catch (error) {
			if (error instanceof FeedbackClientError) {throw error;}
			throw new FeedbackClientError(
				error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network_error',
				undefined,
				true
			);
		} finally {
			clearTimeout(timer);
		}
	}

	private errorCode(value: unknown): string {
		if (typeof value !== 'object' || value === null || !('error' in value)) {return 'request_failed';}
		const error = (value as { error?: unknown }).error;
		if (typeof error !== 'object' || error === null || !('code' in error)) {return 'request_failed';}
		const code = (error as { code?: unknown }).code;
		return typeof code === 'string' && /^[a-z][a-z0-9_]{0,63}$/.test(code) ? code : 'request_failed';
	}

	private assertFeedbackId(value: string): void {
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
			throw new FeedbackClientError('invalid_feedback_id', undefined, false);
		}
	}

	private async requestJson<T>(
		path: string,
		reporterSecret: string,
		init: RequestInit,
		validate: (value: unknown) => value is T,
		retryMutation = false,
	): Promise<T> {
		return this.request(path, reporterSecret, init, retryMutation, (response, parsed) => {
			if (!validate(parsed)) {
				throw new FeedbackClientError('invalid_response', response.status, retryMutation && response.ok);
			}
			return parsed;
		});
	}

	private async requestEmpty(
		path: string,
		reporterSecret: string,
		init: RequestInit,
		retryMutation: boolean,
	): Promise<void> {
		await this.request(path, reporterSecret, init, retryMutation, response => {
			if (response.status !== 204) {
				throw new FeedbackClientError('invalid_response', response.status, retryMutation && response.ok);
			}
		});
	}

	private async request<T>(
		path: string,
		reporterSecret: string,
		init: RequestInit,
		retryMutation: boolean,
		read: (response: Response, parsed: unknown) => T,
	): Promise<T> {
		const attempts = retryMutation || init.method === 'GET' ? 2 : 1;
		for (let attempt = 0; attempt < attempts; attempt += 1) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), this.timeoutMs);
			try {
				const headers = new Headers(init.headers);
				headers.set('Authorization', `Bearer ${reporterSecret}`);
				const response = await this.fetchImpl(`${this.serviceOrigin}${path}`, { ...init, headers, signal: controller.signal });
				const uncertainMutation = retryMutation
					&& (response.ok || response.status === 429 || response.status >= 500);
				const text = await readResponseText(response, controller.signal, uncertainMutation);
				let parsed: unknown = undefined;
				if (text) {
					try {parsed = JSON.parse(text);} catch {
						throw new FeedbackClientError('invalid_response', response.status, uncertainMutation);
					}
				}
				if (controller.signal.aborted) {throw new DOMException('The operation was aborted', 'AbortError');}
				if (!response.ok) {
					throw new FeedbackClientError(this.errorCode(parsed), response.status, response.status === 429 || response.status >= 500);
				}
				return read(response, parsed);
			} catch (error) {
				const mapped = error instanceof FeedbackClientError
					? error
					: new FeedbackClientError(error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network_error', undefined, true);
				if (attempt + 1 >= attempts || !mapped.retryable || mapped.status === 429) {throw mapped;}
				await new Promise(resolve => setTimeout(resolve, this.retryDelayMs));
			} finally {clearTimeout(timer);}
		}
		throw new FeedbackClientError('request_failed', undefined, false);
	}
}
