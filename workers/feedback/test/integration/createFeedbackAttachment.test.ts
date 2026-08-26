import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/create-feedback.json';
import type { Env } from '../../src/env';
import { createFeedback } from '../../src/routes/feedback';
import { processPendingAttachmentCleanup } from '../../src/services/attachmentCleanup';
import { png } from '../helpers/png';

async function request(screenshots: Array<Promise<File> | File>): Promise<Request> {
	const form = new FormData();
	form.set('payload', JSON.stringify(fixture));
	for (const screenshot of screenshots) {form.append('screenshot', await screenshot);}
	return new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${'B'.repeat(43)}`,
			'idempotency-key': crypto.randomUUID(),
			'cf-connecting-ip': '192.0.2.20',
		},
		body: form,
	});
}

describe('POST /api/v1/feedback attachments', () => {
	it('applies header-derived rate limits before parsing an invalid payload', async () => {
		const deniedLimiter = { limit: async () => ({ success: false }) } as RateLimit;
		const response = await createFeedback(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${'R'.repeat(43)}`,
				'content-type': 'application/json',
				'idempotency-key': crypto.randomUUID(),
			},
			body: '{not-valid-json',
		}), { ...env, REPORTER_RATE_LIMITER: deniedLimiter } as Env);

		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: { code: 'rate_limited', message: 'Too many requests' } });
	});

	it('stores one validated screenshot under a random private R2 key', async () => {
		const response = await exports.default.fetch(await request([
			png(800, 600).then(bytes => new File([bytes], 'private-name.png', { type: 'image/png' })),
		]));
		expect(response.status, await response.clone().text()).toBe(201);
		expect((await response.json() as { hasAttachment: boolean }).hasAttachment).toBe(true);

		const row = await env.FEEDBACK_DB.prepare(
			'SELECT r2_key, media_type, width, height FROM attachments ORDER BY created_at DESC LIMIT 1'
		).first<{ r2_key: string; media_type: string; width: number; height: number }>();
		expect(row?.r2_key).toMatch(/^[0-9a-f]{32}$/);
		expect(row?.r2_key).not.toContain('private-name');
		expect(row).toMatchObject({ media_type: 'image/png', width: 800, height: 600 });
		expect(await env.FEEDBACK_SCREENSHOTS.head(row!.r2_key)).not.toBeNull();
	});

	it('rejects multiple attachments before writing D1 or R2', async () => {
		const response = await exports.default.fetch(await request([
			png(10, 10).then(bytes => new File([bytes], 'one.png', { type: 'image/png' })),
			png(10, 10).then(bytes => new File([bytes], 'two.png', { type: 'image/png' })),
		]));
		expect(response.status).toBe(400);
	});

	it('keeps a committed attachment when the non-critical audit write fails', async () => {
		const feedbackDb = new Proxy(env.FEEDBACK_DB, {
			get(target, property) {
				if (property === 'prepare') {
					return (query: string) => query.includes('INSERT INTO audit_events')
						? { bind: () => ({ run: async () => {throw new Error('audit-unavailable');} }) }
						: target.prepare(query);
				}
				const value = Reflect.get(target, property, target) as unknown;
				return typeof value === 'function' ? value.bind(target) : value;
			},
		}) as D1Database;
		const response = await createFeedback(await request([
			png(640, 480).then(bytes => new File([bytes], 'audit-failure.png', { type: 'image/png' })),
		]), { ...env, FEEDBACK_DB: feedbackDb } as Env);

		expect(response.status, await response.clone().text()).toBe(201);
		const row = await env.FEEDBACK_DB.prepare(
			'SELECT r2_key FROM attachments ORDER BY created_at DESC LIMIT 1'
		).first<{ r2_key: string }>();
		expect(row?.r2_key).toMatch(/^[0-9a-f]{32}$/);
		expect(await env.FEEDBACK_SCREENSHOTS.head(row!.r2_key)).not.toBeNull();
	});

	it('persists and retries cleanup when an uploaded attachment cannot be committed', async () => {
		let rejectNextBatch = true;
		const feedbackDb = new Proxy(env.FEEDBACK_DB, {
			get(target, property) {
				if (property === 'batch') {
					return async (statements: D1PreparedStatement[]) => {
						if (rejectNextBatch) {
							rejectNextBatch = false;
							throw new Error('d1-transaction-unavailable');
						}
						return target.batch(statements);
					};
				}
				const value = Reflect.get(target, property, target) as unknown;
				return typeof value === 'function' ? value.bind(target) : value;
			},
		}) as D1Database;
		const now = Math.floor(Date.now() / 1000);
		const response = await createFeedback(await request([
			png(320, 240).then(bytes => new File([bytes], 'orphan.png', { type: 'image/png' })),
		]), { ...env, FEEDBACK_DB: feedbackDb } as Env);

		expect(response.status).toBe(503);
		const pending = await env.FEEDBACK_DB.prepare(
			'SELECT r2_key FROM pending_attachment_uploads ORDER BY created_at DESC LIMIT 1'
		).first<{ r2_key: string }>();
		expect(pending?.r2_key).toMatch(/^[0-9a-f]{32}$/);
		expect(await env.FEEDBACK_SCREENSHOTS.head(pending!.r2_key)).not.toBeNull();

		const unavailableBucket = new Proxy(env.FEEDBACK_SCREENSHOTS, {
			get(target, property) {
				if (property === 'delete') {
					return async () => {throw new Error('r2-delete-unavailable');};
				}
				const value = Reflect.get(target, property, target) as unknown;
				return typeof value === 'function' ? value.bind(target) : value;
			},
		}) as R2Bucket;
		await processPendingAttachmentCleanup({ ...env, FEEDBACK_SCREENSHOTS: unavailableBucket } as Env, now + 601);
		expect(await env.FEEDBACK_SCREENSHOTS.head(pending!.r2_key)).not.toBeNull();
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT r2_key FROM pending_attachment_uploads WHERE r2_key = ?1'
		).bind(pending!.r2_key).first()).not.toBeNull();

		await processPendingAttachmentCleanup(env as Env, now + 601);
		expect(await env.FEEDBACK_SCREENSHOTS.head(pending!.r2_key)).toBeNull();
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT r2_key FROM pending_attachment_uploads WHERE r2_key = ?1'
		).bind(pending!.r2_key).first()).toBeNull();
	});
});
