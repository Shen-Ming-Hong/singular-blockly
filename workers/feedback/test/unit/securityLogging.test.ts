import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { rateLimitError } from '../../src/domain/http';
import fixture from '../fixtures/create-feedback.json';

describe('feedback security logging contract', () => {
	it('stores only a stable event and keyed target rather than secret, IP, or body', async () => {
		const secret = 'J'.repeat(43);
		const form = new FormData();
		form.set('payload', JSON.stringify({ ...fixture, title: 'Security audit feedback body' }));
		const response = await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${secret}`,
				'idempotency-key': crypto.randomUUID(),
				'cf-connecting-ip': '198.51.100.44',
			},
			body: form,
		}));
		expect(response.status).toBe(201);
		const audit = await env.FEEDBACK_DB.prepare("SELECT event_code, target_hash, outcome FROM audit_events WHERE event_code = 'feedback_created' ORDER BY created_at DESC LIMIT 1")
			.first<{ event_code: string; target_hash: string; outcome: string }>();
		expect(audit).toMatchObject({ event_code: 'feedback_created', outcome: 'success' });
		expect(audit?.target_hash).not.toBe(secret);
		expect(JSON.stringify(audit)).not.toContain('198.51.100.44');
		expect(JSON.stringify(audit)).not.toContain('Security audit feedback body');
	});

	it('adds Retry-After without returning identifiers', async () => {
		const response = rateLimitError(17);
		expect(response.status).toBe(429);
		expect(response.headers.get('retry-after')).toBe('17');
		expect(await response.json()).toEqual({ error: { code: 'rate_limited', message: 'Too many requests' } });
	});
});
