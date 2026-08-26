import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { createHmac } from '../../src/domain/auth';
import { D1FeedbackRepository } from '../../src/storage/d1';
import fixture from '../fixtures/create-feedback.json';

function reporterSecret(): string {
	return 'A'.repeat(43);
}

function createRequest(payload: unknown, idempotencyKey = crypto.randomUUID()): Request {
	const form = new FormData();
	form.set('payload', JSON.stringify(payload));
	return new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${reporterSecret()}`,
			'idempotency-key': idempotencyKey,
			'cf-connecting-ip': '192.0.2.10',
		},
		body: form,
	});
}

describe('POST /api/v1/feedback', () => {
	it('creates a private D1 record and outbox event without storing the reporter secret', async () => {
		const response = await exports.default.fetch(createRequest(fixture));
		expect(response.status).toBe(201);
		const body = await response.json() as { reference: string; status: string; id: string };
		expect(body.reference).toMatch(/^SB-[A-Z2-9]{8}$/);
		expect(body.status).toBe('received');

		const feedbackCount = await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback').first<{ count: number }>();
		const outboxCount = await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM outbox_events').first<{ count: number }>();
		const reporter = await env.FEEDBACK_DB.prepare('SELECT secret_hmac FROM reporters LIMIT 1').first<{ secret_hmac: string }>();
		expect(feedbackCount?.count).toBe(1);
		expect(outboxCount?.count).toBe(1);
		expect(reporter?.secret_hmac).not.toBe(reporterSecret());
	});

	it('replays the same response and rejects changed content for one idempotency key', async () => {
		const key = crypto.randomUUID();
		const first = await exports.default.fetch(createRequest(fixture, key));
		const second = await exports.default.fetch(createRequest(fixture, key));
		expect(second.status).toBe(201);
		expect(await second.text()).toBe(await first.text());

		const conflict = await exports.default.fetch(createRequest({ ...fixture, title: 'A different valid title' }, key));
		expect(conflict.status).toBe(409);
	});

	it('accepts contract-sized escaped text after bounded multipart parsing', async () => {
		const response = await exports.default.fetch(createRequest({
			...fixture,
			description: '\\'.repeat(8000),
			steps: '"'.repeat(4000),
			expected: '\\'.repeat(2000),
		}));

		expect(response.status).toBe(201);
	});

	it('rejects missing credentials and non-allowlisted fields', async () => {
		const unauthorized = createRequest(fixture);
		unauthorized.headers.delete('authorization');
		expect((await exports.default.fetch(unauthorized)).status).toBe(401);
		expect((await exports.default.fetch(createRequest({ ...fixture, workspacePath: '/private' }))).status).toBe(400);
	});

	it('rejects sensitive reporter text before creating D1 or outbox records', async () => {
		const feedbackBefore = (await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM feedback',
		).first<{ count: number }>())?.count;
		const outboxBefore = (await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM outbox_events',
		).first<{ count: number }>())?.count;
		for (const description of [
			`The copied output contains github_pat_${'A'.repeat(24)}`,
			'Failure at /secret.txt during upload',
			'Host 2001:db8::1 failed during upload',
		]) {
			const response = await exports.default.fetch(createRequest({ ...fixture, description }));

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				error: {
					code: 'sensitive_content',
					message: 'The feedback payload is invalid',
					field: 'description',
				},
			});
		}
		expect((await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM feedback',
		).first<{ count: number }>())?.count).toBe(feedbackBefore);
		expect((await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM outbox_events',
		).first<{ count: number }>())?.count).toBe(outboxBefore);
	});

	it('maps malformed multipart and JSON bodies to fixed allowlisted error codes', async () => {
		const headers = {
			authorization: `Bearer ${reporterSecret()}`,
			'idempotency-key': crypto.randomUUID(),
			'content-type': 'multipart/form-data; boundary=broken-boundary',
		};
		const malformedMultipart = await exports.default.fetch(new Request(
			'https://blockly-support.singular-ai.org/api/v1/feedback',
			{ method: 'POST', headers, body: '--broken-boundary\r\nnot-a-valid-part' },
		));
		expect((await malformedMultipart.json()) as unknown).toEqual({
			error: { code: 'invalid_multipart', message: 'The feedback payload could not be accepted' },
		});

		const form = new FormData();
		form.set('payload', '{not-json');
		const malformedJson = await exports.default.fetch(new Request(
			'https://blockly-support.singular-ai.org/api/v1/feedback',
			{ method: 'POST', headers: { authorization: headers.authorization, 'idempotency-key': crypto.randomUUID() }, body: form },
		));
		expect((await malformedJson.json()) as unknown).toEqual({
			error: { code: 'invalid_payload', message: 'The feedback payload could not be accepted' },
		});
	});

	it('atomically rejects creation after an already-resolved reporter is revoked', async () => {
		const repository = new D1FeedbackRepository(env.FEEDBACK_DB);
		const now = Math.floor(Date.now() / 1000);
		const secretHmac = await createHmac(reporterSecret(), env.REPORTER_HMAC_PEPPER);
		const reporter = await repository.ensureReporter(secretHmac, now);
		await env.FEEDBACK_DB.prepare('UPDATE reporters SET revoked_at = ?1 WHERE id = ?2').bind(now, reporter.id).run();
		const feedbackId = crypto.randomUUID();

		await expect(repository.createFeedback({
			feedbackId,
			publicReference: 'SB-ABCDEFGH',
			reporterId: reporter.id,
			input: fixture as any,
			outboxId: crypto.randomUUID(),
			idempotencyKey: crypto.randomUUID(),
			requestSha256: 'digest',
			responseStatus: 201,
			responseJson: JSON.stringify({ id: feedbackId }),
			now,
		})).rejects.toThrow('reporter_revoked');
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(feedbackId).first()).toBeNull();
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM outbox_events WHERE aggregate_id = ?1').bind(feedbackId).first()).toBeNull();
	});
});
