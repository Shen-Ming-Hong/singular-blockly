/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { FeedbackIdentityService } from '../../services/feedbackIdentity';

class MemorySecretStorage {
	private readonly values = new Map<string, string>();

	get(key: string): Promise<string | undefined> {
		return Promise.resolve(this.values.get(key));
	}

	store(key: string, value: string): Promise<void> {
		this.values.set(key, value);
		return Promise.resolve();
	}

	delete(key: string): Promise<void> {
		this.values.delete(key);
		return Promise.resolve();
	}
}

suite('FeedbackIdentityService Tests', () => {
	test('creates one 256-bit base64url secret and reuses it', async () => {
		const storage = new MemorySecretStorage();
		const service = new FeedbackIdentityService(storage);

		const first = await service.getOrCreateSecret();
		const second = await service.getOrCreateSecret();

		assert.strictEqual(first, second);
		assert.match(first, /^[A-Za-z0-9_-]{43}$/);
	});

	test('puts only locale in the query and recovery material in the URL fragment', async () => {
		const service = new FeedbackIdentityService(new MemorySecretStorage(), 'https://support.example.test');
		const secret = await service.getOrCreateSecret();
		const recoveryUrl = service.createRecoveryUrl(secret, 'zh-Hant');
		const parsed = new URL(recoveryUrl);

		assert.strictEqual(parsed.origin, 'https://support.example.test');
		assert.strictEqual(parsed.pathname, '/recover');
		assert.strictEqual(parsed.search, '?lang=zh-Hant');
		assert.strictEqual(parsed.hash, `#secret=${secret}`);
	});

	test('persists an uncertain delete-all idempotency key separately from the reporter secret', async () => {
		const storage = new MemorySecretStorage();
		const service = new FeedbackIdentityService(storage);
		const key = '11111111-1111-4111-8111-111111111111';
		await service.getOrCreateSecret();
		await service.storePendingDeleteAllKey(key);

		assert.strictEqual(await service.getPendingDeleteAllKey(), key);
		await service.clearPendingDeleteAllKey();
		assert.strictEqual(await service.getPendingDeleteAllKey(), undefined);
		assert.match((await service.getSecret()) ?? '', /^[A-Za-z0-9_-]{43}$/);
	});

	test('persists an uncertain single-feedback deletion key by feedback identifier', async () => {
		const service = new FeedbackIdentityService(new MemorySecretStorage());
		const feedbackId = '11111111-1111-4111-8111-111111111111';
		const key = '22222222-2222-4222-8222-222222222222';

		await service.storePendingDeleteOneKey(feedbackId, key);

		assert.strictEqual(await service.getPendingDeleteOneKey(feedbackId), key);
		await service.clearPendingDeleteOneKey(feedbackId);
		assert.strictEqual(await service.getPendingDeleteOneKey(feedbackId), undefined);
	});

	test('persists independent digest-keyed idempotency records for uncertain message deliveries', async () => {
		const storage = new MemorySecretStorage();
		const service = new FeedbackIdentityService(storage);
		const feedbackId = '11111111-1111-4111-8111-111111111111';
		const first = {
			digest: 'a'.repeat(64),
			idempotencyKey: '22222222-2222-4222-8222-222222222222',
		};
		const second = {
			digest: 'b'.repeat(64),
			idempotencyKey: '33333333-3333-4333-8333-333333333333',
		};

		await service.storePendingMessage(feedbackId, first);
		await service.storePendingMessage(feedbackId, second);

		assert.deepStrictEqual(await service.getPendingMessage(feedbackId, first.digest), first);
		assert.deepStrictEqual(await service.getPendingMessage(feedbackId, second.digest), second);
		await service.clearPendingMessage(feedbackId, first.digest);
		assert.strictEqual(await service.getPendingMessage(feedbackId, first.digest), undefined);
		assert.deepStrictEqual(await service.getPendingMessage(feedbackId, second.digest), second);
	});

	test('clears only the feedback identity secret', async () => {
		const storage = new MemorySecretStorage();
		const service = new FeedbackIdentityService(storage);
		await service.getOrCreateSecret();

		await service.clearSecret();

		assert.strictEqual(await service.getSecret(), undefined);
	});
});
