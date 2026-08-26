import { env, exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { createHmac } from '../../src/domain/auth';
import { processGitHubWebhook } from '../../src/routes/githubWebhook';
import { deleteReporterFeedback } from '../../src/routes/reporterFeedback';
import { processOutbox } from '../../src/services/outbox';
import fixture from '../fixtures/create-feedback.json';

const ORIGIN = 'https://blockly-support.singular-ai.org';

async function create(secret: string): Promise<{ id: string }> {
	const form = new FormData();
	form.set('payload', JSON.stringify({ ...fixture, title: 'End to end feedback flow' }));
	const response = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback`, {
		method: 'POST', headers: { authorization: `Bearer ${secret}`, 'idempotency-key': crypto.randomUUID() }, body: form,
	}));
	expect(response.status).toBe(201);
	return response.json() as Promise<{ id: string }>;
}

async function webhookSignature(body: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.GITHUB_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
	return `sha256=${[...signature].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

describe('local feedback end-to-end flow', () => {
	it('returns an Allow header for unsupported API methods', async () => {
		const cases = [
			['/api/v1/feedback', 'PUT', 'GET, POST'],
			[`/api/v1/feedback/${crypto.randomUUID()}`, 'POST', 'GET, DELETE'],
			[`/api/v1/feedback/${crypto.randomUUID()}/messages`, 'PUT', 'GET, POST'],
			['/api/v1/reporter', 'GET', 'DELETE'],
			['/api/v1/session/exchange', 'GET', 'POST'],
			['/api/v1/github/webhooks', 'GET', 'POST'],
			[`/admin/attachments/${crypto.randomUUID()}`, 'DELETE', 'GET'],
		] as const;
		for (const [pathname, method, allow] of cases) {
			const response = await exports.default.fetch(new Request(`${ORIGIN}${pathname}`, { method }));
			expect(response.status).toBe(405);
			expect(response.headers.get('allow')).toBe(allow);
		}
	});

	it('moves Extension-shaped input through D1, fake GitHub, public reply, and tombstone scrub', async () => {
		const secret = 'L'.repeat(43);
		const feedback = await create(secret);
		let issueNumber = 95000 + Math.floor(Math.random() * 1000);
		const sync = {
			createPrivateIssue: vi.fn(async () => ({ number: ++issueNumber, node_id: `node-${issueNumber}` })),
			findPrivateIssueByOutboxId: vi.fn(async () => null),
			createPublicIssue: vi.fn(async () => ({ number: ++issueNumber, node_id: `node-${issueNumber}` })),
			findPublicIssueByOutboxId: vi.fn(async () => null),
			addPrivateComment: vi.fn(async () => undefined),
			scrubPrivateIssue: vi.fn(async () => undefined),
		};
		await processOutbox(env, sync, 100);
		const mapping = await env.FEEDBACK_DB.prepare('SELECT issue_number FROM github_mappings WHERE feedback_id = ?1')
			.bind(feedback.id).first<{ issue_number: number }>();
		expect(mapping?.issue_number).toBeGreaterThan(0);

		const webhookBody = JSON.stringify({
			action: 'created', repository: { id: Number(env.PRIVATE_GITHUB_REPOSITORY_ID) }, sender: { id: 300 },
			issue: { number: mapping?.issue_number }, comment: { id: issueNumber * 100, body: '/feedback public-reply\nThank you. We can reproduce this report.' },
		});
		const webhook = await processGitHubWebhook(new Request(`${ORIGIN}/api/v1/github/webhooks`, {
			method: 'POST',
			headers: { 'x-github-delivery': crypto.randomUUID(), 'x-github-event': 'issue_comment', 'x-hub-signature-256': await webhookSignature(webhookBody) },
			body: webhookBody,
		}), env, {
			listPrivateIssueComments: async () => [],
			acknowledgePrivateCommand: async () => undefined,
		});
		expect(webhook.status).toBe(202);
		const detail = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback/${feedback.id}`, { headers: { authorization: `Bearer ${secret}` } }));
		const detailBody = await detail.json() as { messages: Array<{ body: string }> };
		expect(detailBody.messages[0].body).toContain('can reproduce');

		const deleted = await deleteReporterFeedback(new Request(`${ORIGIN}/api/v1/feedback/${feedback.id}`, {
			method: 'DELETE', headers: { authorization: `Bearer ${secret}`, 'idempotency-key': crypto.randomUUID() },
		}), env, feedback.id, sync);
		expect(deleted.status).toBe(204);
		expect(sync.scrubPrivateIssue).toHaveBeenCalledWith(mapping?.issue_number);
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(feedback.id).first()).toBeNull();
	});

	it('paginates all 500 private rows in ten pages within ten seconds', async () => {
		const secret = 'M'.repeat(43);
		const reporterId = crypto.randomUUID();
		const secretHmac = await createHmac(secret, env.REPORTER_HMAC_PEPPER);
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.prepare('INSERT INTO reporters (id, secret_hmac, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?3)')
			.bind(reporterId, secretHmac, now).run();
		for (let offset = 0; offset < 500; offset += 50) {
			const statements = Array.from({ length: 50 }, (_unused, index) => {
				const sequence = offset + index;
				return env.FEEDBACK_DB.prepare(`INSERT INTO feedback
					(id, public_reference, reporter_id, kind, title, description, diagnostics_json, public_status, decision, created_at, updated_at)
					VALUES (?1, ?2, ?3, 'bug', ?4, ?5, '{}', 'received', 'unreviewed', ?6, ?6)`
				).bind(crypto.randomUUID(), `SB-PERF-${sequence}`, reporterId, `Performance feedback ${sequence}`, `Description for performance feedback ${sequence}`, now - sequence);
			});
			await env.FEEDBACK_DB.batch(statements);
		}
		const started = Date.now();
		let cursor: string | null = null;
		const ids = new Set<string>();
		let pages = 0;
		do {
			const url = new URL(`${ORIGIN}/api/v1/feedback`);
			url.searchParams.set('limit', '50');
			if (cursor) {url.searchParams.set('cursor', cursor);}
			const response = await exports.default.fetch(new Request(url, { headers: { authorization: `Bearer ${secret}` } }));
			expect(response.status).toBe(200);
			const value = await response.json() as { items: Array<{ id: string }>; nextCursor: string | null };
			for (const item of value.items) {ids.add(item.id);}
			cursor = value.nextCursor;
			pages += 1;
		} while (cursor);
		expect(pages).toBe(10);
		expect(ids.size).toBe(500);
		expect(Date.now() - started).toBeLessThan(10_000);
	});
});
