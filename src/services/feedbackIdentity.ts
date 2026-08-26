/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomBytes } from 'crypto';

export const FEEDBACK_REPORTER_SECRET_KEY = 'singular-blockly.feedback.reporterSecret';
export const FEEDBACK_DELETE_ALL_IDEMPOTENCY_KEY = 'singular-blockly.feedback.deleteAllIdempotencyKey';
export const FEEDBACK_DELETE_ONE_IDEMPOTENCY_KEY_PREFIX = 'singular-blockly.feedback.pendingDelete.';
export const FEEDBACK_MESSAGE_IDEMPOTENCY_KEY_PREFIX = 'singular-blockly.feedback.pendingMessage.';
export const FEEDBACK_SERVICE_ORIGIN = 'https://blockly-support.singular-ai.org';

export interface PendingFeedbackMessage {
	digest: string;
	idempotencyKey: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FeedbackSecretStorage {
	get(key: string): Thenable<string | undefined>;
	store(key: string, value: string): Thenable<void>;
	delete(key: string): Thenable<void>;
}

export class FeedbackIdentityService {
	constructor(
		private readonly storage: FeedbackSecretStorage,
		private readonly serviceOriginValue = FEEDBACK_SERVICE_ORIGIN
	) {
		const origin = new URL(serviceOriginValue);
		if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash) {
			throw new Error('Feedback service origin must be a bare HTTPS origin');
		}
	}

	get serviceOrigin(): string {
		return this.serviceOriginValue;
	}

	getSecret(): Promise<string | undefined> {
		return Promise.resolve(this.storage.get(FEEDBACK_REPORTER_SECRET_KEY));
	}

	async getOrCreateSecret(): Promise<string> {
		const existing = await this.getSecret();
		if (existing && /^[A-Za-z0-9_-]{43}$/.test(existing)) {return existing;}
		const created = randomBytes(32).toString('base64url');
		await this.storage.store(FEEDBACK_REPORTER_SECRET_KEY, created);
		return created;
	}

	clearSecret(): Promise<void> {
		return Promise.resolve(this.storage.delete(FEEDBACK_REPORTER_SECRET_KEY));
	}

	getPendingDeleteAllKey(): Promise<string | undefined> {
		return Promise.resolve(this.storage.get(FEEDBACK_DELETE_ALL_IDEMPOTENCY_KEY));
	}

	async storePendingDeleteAllKey(value: string): Promise<void> {
		if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
			throw new Error('Invalid feedback delete-all idempotency key');
		}
		await this.storage.store(FEEDBACK_DELETE_ALL_IDEMPOTENCY_KEY, value);
	}

	clearPendingDeleteAllKey(): Promise<void> {
		return Promise.resolve(this.storage.delete(FEEDBACK_DELETE_ALL_IDEMPOTENCY_KEY));
	}

	async getPendingDeleteOneKey(feedbackId: string): Promise<string | undefined> {
		const value = await this.storage.get(this.feedbackStorageKey(FEEDBACK_DELETE_ONE_IDEMPOTENCY_KEY_PREFIX, feedbackId));
		return value && UUID_PATTERN.test(value) ? value : undefined;
	}

	async storePendingDeleteOneKey(feedbackId: string, value: string): Promise<void> {
		if (!UUID_PATTERN.test(value)) {throw new Error('Invalid feedback delete idempotency key');}
		await this.storage.store(this.feedbackStorageKey(FEEDBACK_DELETE_ONE_IDEMPOTENCY_KEY_PREFIX, feedbackId), value);
	}

	clearPendingDeleteOneKey(feedbackId: string): Promise<void> {
		return Promise.resolve(this.storage.delete(this.feedbackStorageKey(FEEDBACK_DELETE_ONE_IDEMPOTENCY_KEY_PREFIX, feedbackId)));
	}

	async getPendingMessage(feedbackId: string, digest: string): Promise<PendingFeedbackMessage | undefined> {
		const value = await this.storage.get(this.pendingMessageStorageKey(feedbackId, digest));
		if (!value) {return undefined;}
		try {
			const pending = JSON.parse(value) as Partial<PendingFeedbackMessage>;
			return typeof pending.digest === 'string' && /^[0-9a-f]{64}$/i.test(pending.digest)
				&& typeof pending.idempotencyKey === 'string' && UUID_PATTERN.test(pending.idempotencyKey)
				? { digest: pending.digest, idempotencyKey: pending.idempotencyKey }
				: undefined;
		} catch {
			return undefined;
		}
	}

	async storePendingMessage(feedbackId: string, pending: PendingFeedbackMessage): Promise<void> {
		if (!/^[0-9a-f]{64}$/i.test(pending.digest) || !UUID_PATTERN.test(pending.idempotencyKey)) {
			throw new Error('Invalid pending feedback message');
		}
		await this.storage.store(this.pendingMessageStorageKey(feedbackId, pending.digest), JSON.stringify(pending));
	}

	clearPendingMessage(feedbackId: string, digest: string): Promise<void> {
		return Promise.resolve(this.storage.delete(this.pendingMessageStorageKey(feedbackId, digest)));
	}

	private pendingMessageStorageKey(feedbackId: string, digest: string): string {
		if (!/^[0-9a-f]{64}$/i.test(digest)) {throw new Error('Invalid feedback message digest');}
		return `${this.feedbackStorageKey(FEEDBACK_MESSAGE_IDEMPOTENCY_KEY_PREFIX, feedbackId)}.${digest.toLowerCase()}`;
	}

	private feedbackStorageKey(prefix: string, feedbackId: string): string {
		if (!UUID_PATTERN.test(feedbackId)) {throw new Error('Invalid feedback identifier');}
		return `${prefix}${feedbackId}`;
	}

	createRecoveryUrl(secret: string, locale?: string): string {
		if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) {
			throw new Error('Invalid feedback recovery secret');
		}
		const language = locale && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale) ? locale : 'en';
		return `${this.serviceOriginValue}/recover?lang=${encodeURIComponent(language)}#secret=${secret}`;
	}
}
