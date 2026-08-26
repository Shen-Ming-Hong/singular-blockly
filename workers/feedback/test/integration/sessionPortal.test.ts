import { env, exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import fixture from '../fixtures/create-feedback.json';
import { createHmac } from '../../src/domain/auth';
import { authenticateReporter } from '../../src/domain/reporterAuth';
import { exchangeReporterSession } from '../../src/routes/session';
import type { Env } from '../../src/env';

const ORIGIN = 'https://blockly-support.singular-ai.org';

async function ensureReporter(secret: string): Promise<{ id: string }> {
	const form = new FormData();
	form.set('payload', JSON.stringify({ ...fixture, title: 'Recovery portal feedback' }));
	const response = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback`, {
		method: 'POST',
		headers: { authorization: `Bearer ${secret}`, 'idempotency-key': crypto.randomUUID() },
		body: form,
	}));
	return response.json() as Promise<{ id: string }>;
}

describe('recovery session portal', () => {
	it('exchanges a fragment secret for strict cookies and requires CSRF on session mutations', async () => {
		const secret = 'G'.repeat(43);
		const feedback = await ensureReporter(secret);
		const exchange = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/session/exchange`, {
			method: 'POST',
			headers: { origin: ORIGIN, 'content-type': 'application/json' },
			body: JSON.stringify({ secret }),
		}));
		expect(exchange.status).toBe(204);
		const setCookie = exchange.headers.get('set-cookie') ?? '';
		expect(setCookie).toContain('HttpOnly');
		expect(setCookie).toContain('Secure');
		expect(setCookie).toContain('SameSite=Strict');
		const cookie = setCookie.split(';')[0];
		const csrf = exchange.headers.get('x-csrf-token') ?? '';
		expect(csrf).toMatch(/^[A-Za-z0-9_-]{43}$/);

		const list = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback`, { headers: { cookie } }));
		expect(list.status).toBe(200);
		const denied = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback/${feedback.id}/messages`, {
			method: 'POST',
			headers: { cookie, origin: ORIGIN, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
			body: JSON.stringify({ body: 'No CSRF token.' }),
		}));
		expect(denied.status).toBe(403);
		const accepted = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback/${feedback.id}/messages`, {
			method: 'POST',
			headers: { cookie, origin: ORIGIN, 'x-csrf-token': csrf, 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
			body: JSON.stringify({ body: 'Valid portal addition.' }),
		}));
		expect(accepted.status).toBe(201);
	});

	it('cleans the URL fragment before exchange and never renders server data with innerHTML', async () => {
		const recovery = await exports.default.fetch(new Request(`${ORIGIN}/recover`));
		const recoveryHtml = await recovery.text();
			expect(recoveryHtml).toContain("history.replaceState(null, '', '/recover?lang='");
		expect(recoveryHtml).not.toContain('location.hash =');
		const portal = await exports.default.fetch(new Request(`${ORIGIN}/r`));
		const portalHtml = await portal.text();
			expect(portalHtml).toContain('textContent');
			expect(portalHtml).not.toContain('innerHTML');
			expect(portalHtml).toContain("'?cursor=' + encodeURIComponent(pending.cursor)");
	});

	it('uses one stable reporter rate-limit key across bearer and repeated recovery sessions', async () => {
		const secret = 'H'.repeat(43);
		await ensureReporter(secret);
		const exchange = async () => exports.default.fetch(new Request(`${ORIGIN}/api/v1/session/exchange`, {
			method: 'POST',
			headers: { origin: ORIGIN, 'content-type': 'application/json' },
			body: JSON.stringify({ secret }),
		}));
		const first = await exchange();
		const second = await exchange();
		const bearer = await authenticateReporter(new Request(`${ORIGIN}/api/v1/feedback`, {
			headers: { authorization: `Bearer ${secret}` },
		}), env);
		const firstSession = await authenticateReporter(new Request(`${ORIGIN}/api/v1/feedback`, {
			headers: { cookie: (first.headers.get('set-cookie') ?? '').split(';')[0] },
		}), env);
		const secondSession = await authenticateReporter(new Request(`${ORIGIN}/api/v1/feedback`, {
			headers: { cookie: (second.headers.get('set-cookie') ?? '').split(';')[0] },
		}), env);

		expect(firstSession?.secretHmac).toBe(bearer?.secretHmac);
		expect(secondSession?.secretHmac).toBe(bearer?.secretHmac);
	});

	it('applies source limiting before parsing and reporter limiting before creating a session', async () => {
		const secret = 'I'.repeat(43);
		await ensureReporter(secret);
		const anonymousLimit = vi.fn(async () => ({ success: true }));
		const reporterLimit = vi.fn(async () => ({ success: false }));
		const response = await exchangeReporterSession(new Request(`${ORIGIN}/api/v1/session/exchange`, {
			method: 'POST',
			headers: { origin: ORIGIN, 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.10' },
			body: JSON.stringify({ secret }),
		}), {
			...env,
			ANONYMOUS_RATE_LIMITER: { limit: anonymousLimit },
			REPORTER_RATE_LIMITER: { limit: reporterLimit },
		} as unknown as Env);

		expect(response.status).toBe(429);
		expect(anonymousLimit).toHaveBeenCalledOnce();
		expect(reporterLimit).toHaveBeenCalledWith({
			key: await createHmac(secret, env.REPORTER_HMAC_PEPPER),
		});
	});
});
