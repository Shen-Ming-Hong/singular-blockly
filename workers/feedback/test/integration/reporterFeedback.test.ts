import { env, exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import type { Env } from '../../src/env';
import {
	addReporterMessage,
	deleteReporterAccount,
	deleteReporterFeedback,
	listReporterFeedback,
} from '../../src/routes/reporterFeedback';
import fixture from '../fixtures/create-feedback.json';

function secret(character: string): string {
	return character.repeat(43);
}

function bearer(value: string): Record<string, string> {
	return { authorization: `Bearer ${value}` };
}

async function create(value: string, title: string): Promise<{ id: string; reference: string }> {
	const form = new FormData();
	form.set('payload', JSON.stringify({ ...fixture, title }));
	const response = await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
		method: 'POST',
		headers: { ...bearer(value), 'idempotency-key': crypto.randomUUID() },
		body: form,
	}));
	expect(response.status).toBe(201);
	return response.json() as Promise<{ id: string; reference: string }>;
}

describe('reporter feedback ownership API', () => {
	function syncClient() {
		return {
			createPrivateIssue: vi.fn(async () => ({ number: 88001, node_id: 'node-88001' })),
			findPrivateIssueByOutboxId: vi.fn<() => Promise<{ number: number; node_id: string } | null>>(async () => null),
			createPublicIssue: vi.fn(async () => ({ number: 88002, node_id: 'node-88002' })),
			findPublicIssueByOutboxId: vi.fn<() => Promise<{ number: number; node_id: string } | null>>(async () => null),
			addPrivateComment: vi.fn(async () => undefined),
			scrubPrivateIssue: vi.fn(async () => undefined),
		};
	}

	it('applies a source limit before looking up an unverified reporter credential', async () => {
		const limit = vi.fn(async (_input: { key: string }) => ({ success: false }));
		const blockedDatabase = {
			prepare: () => {throw new Error('authentication_must_not_query_d1');},
		} as unknown as D1Database;
		const response = await listReporterFeedback(new Request(
			'https://blockly-support.singular-ai.org/api/v1/feedback',
			{ headers: { ...bearer(secret('Z')), 'cf-connecting-ip': '192.0.2.99' } },
		), {
			...env,
			FEEDBACK_DB: blockedDatabase,
			SOURCE_RATE_LIMITER: { limit } as unknown as RateLimit,
		} as Env);

		expect(response.status).toBe(429);
		expect(limit).toHaveBeenCalledOnce();
		expect(limit.mock.calls[0][0].key).not.toContain('192.0.2.99');
	});

	it('lists with an ownership-bound cursor and hides another reporter feedback', async () => {
		const reporterA = secret('C');
		const reporterB = secret('D');
		const first = await create(reporterA, 'First owned feedback');
		const second = await create(reporterA, 'Second owned feedback');
		const foreign = await create(reporterB, 'Foreign private feedback');

		const pageOne = await exports.default.fetch(new Request(
			'https://blockly-support.singular-ai.org/api/v1/feedback?limit=1', { headers: bearer(reporterA) }
		));
		expect(pageOne.status).toBe(200);
		const pageOneBody = await pageOne.json() as { items: Array<{ id: string }>; nextCursor: string };
		expect(pageOneBody.items).toHaveLength(1);
		expect(pageOneBody.nextCursor).toBeTruthy();

		const pageTwo = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback?limit=1&cursor=${encodeURIComponent(pageOneBody.nextCursor)}`,
			{ headers: bearer(reporterA) }
		));
		const pageTwoBody = await pageTwo.json() as { items: Array<{ id: string }> };
		expect(pageTwoBody.items).toHaveLength(1);
		expect(new Set([pageOneBody.items[0].id, pageTwoBody.items[0].id])).toEqual(new Set([first.id, second.id]));

		const crossOwner = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${foreign.id}`,
			{ headers: bearer(reporterA) }
		));
		expect(crossOwner.status).toBe(404);
	});

	it('adds an idempotent message and returns it in the public timeline', async () => {
		const reporter = secret('E');
		const feedback = await create(reporter, 'Message ownership feedback');
		const key = crypto.randomUUID();
		const request = () => new Request(`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}/messages`, {
			method: 'POST',
			headers: { ...bearer(reporter), 'content-type': 'application/json', 'idempotency-key': key },
			body: JSON.stringify({ body: 'Additional reproduction detail.' }),
		});
		const first = await exports.default.fetch(request());
		const replay = await exports.default.fetch(request());
		expect(first.status).toBe(201);
		expect(await replay.text()).toBe(await first.text());

		const detail = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`,
			{ headers: bearer(reporter) }
		));
		const body = await detail.json() as { messages: Array<{ body: string }> };
		expect(body.messages.map(item => item.body)).toEqual(['Additional reproduction detail.']);
	});

	it('does not persist a message or replay body when deletion wins after the ownership check', async () => {
		const reporter = secret('V');
		const feedback = await create(reporter, 'Message and deletion race feedback');
		const key = crypto.randomUUID();
		let deletionStarted = false;
		const racingDatabase = {
			prepare: env.FEEDBACK_DB.prepare.bind(env.FEEDBACK_DB),
			batch: async (statements: D1PreparedStatement[]) => {
				if (!deletionStarted) {
					deletionStarted = true;
					await env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1")
						.bind(feedback.id).run();
				}
				return env.FEEDBACK_DB.batch(statements);
			},
		} as unknown as D1Database;
		const response = await addReporterMessage(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}/messages`, {
				method: 'POST',
				headers: { ...bearer(reporter), 'content-type': 'application/json', 'idempotency-key': key },
				body: JSON.stringify({ body: 'This text must not survive the deletion race.' }),
			},
		), { ...env, FEEDBACK_DB: racingDatabase } as Env, feedback.id);

		expect(response.status).toBe(404);
		expect(deletionStarted).toBe(true);
		expect((await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM feedback_messages WHERE feedback_id = ?1',
		).bind(feedback.id).first<{ count: number }>())?.count).toBe(0);
		expect((await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM outbox_events
			WHERE aggregate_type = 'message' AND payload_json LIKE ?1`
		).bind(`%${feedback.id}%`).first<{ count: number }>())?.count).toBe(0);
		expect(await env.FEEDBACK_DB.prepare(`SELECT response_json FROM idempotency_records
			WHERE route = ?1 AND key = ?2 LIMIT 1`
		).bind(`message:${feedback.id}`, key).first()).toBeNull();
	});

	it('accepts the contract maximum of 4,000 CJK message characters', async () => {
		const reporter = secret('T');
		const feedback = await create(reporter, 'Maximum CJK message feedback');
		const body = '訊'.repeat(4000);
		const response = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}/messages`, {
				method: 'POST',
				headers: { ...bearer(reporter), 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
				body: JSON.stringify({ body }),
			},
		));

		expect(response.status).toBe(201);
		expect((await response.json()) as { body: string }).toMatchObject({ body });
	});

	it('rejects sensitive supplemental text before storing or enqueueing it', async () => {
		const reporter = secret('U');
		const feedback = await create(reporter, 'Sensitive message boundary feedback');
		const messageOutboxBefore = (await env.FEEDBACK_DB.prepare(
			"SELECT count(*) AS count FROM outbox_events WHERE aggregate_type = 'message'",
		).first<{ count: number }>())?.count;
		const response = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}/messages`, {
				method: 'POST',
				headers: { ...bearer(reporter), 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
				body: JSON.stringify({ body: `Please inspect sk-proj-${'A'.repeat(24)}` }),
			},
		));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: { code: 'sensitive_content', message: 'The message is invalid', field: 'body' },
		});
		expect((await env.FEEDBACK_DB.prepare(
			'SELECT count(*) AS count FROM feedback_messages WHERE feedback_id = ?1',
		).bind(feedback.id).first<{ count: number }>())?.count).toBe(0);
		expect((await env.FEEDBACK_DB.prepare(
			"SELECT count(*) AS count FROM outbox_events WHERE aggregate_type = 'message'",
		).first<{ count: number }>())?.count).toBe(messageOutboxBefore);
	});

	it('paginates long public message timelines without making the detail unreadable', async () => {
		const reporter = secret('Q');
		const feedback = await create(reporter, 'Paginated message timeline');
		const base = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.batch(Array.from({ length: 55 }, (_, index) => env.FEEDBACK_DB.prepare(`
			INSERT INTO feedback_messages
				(id, feedback_id, author_type, visibility, body, created_at)
			VALUES (?1, ?2, 'reporter', 'public', ?3, ?4)
		`).bind(crypto.randomUUID(), feedback.id, `Timeline message ${index}`, base + index)));

		const detail = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`,
			{ headers: bearer(reporter) },
		));
		const first = await detail.json() as { messages: Array<{ body: string }>; nextMessageCursor: string | null };
		expect(first.messages).toHaveLength(20);
		expect(first.nextMessageCursor).toBeTruthy();

		const messages = [...first.messages];
		let cursor = first.nextMessageCursor;
		while (cursor) {
			const response = await exports.default.fetch(new Request(
				`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}/messages?cursor=${encodeURIComponent(cursor)}`,
				{ headers: bearer(reporter) },
			));
			expect(response.status).toBe(200);
			const page = await response.json() as { items: Array<{ body: string }>; nextCursor: string | null };
			messages.push(...page.items);
			cursor = page.nextCursor;
		}
		expect(messages).toHaveLength(55);
		expect(messages.map(message => message.body)).toEqual(
			Array.from({ length: 55 }, (_, index) => `Timeline message ${index}`),
		);
	});

	it('deletes owned content and retains only a content-free tombstone', async () => {
		const reporter = secret('F');
		const feedback = await create(reporter, 'Delete private feedback');
		const response = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`,
			{ method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': crypto.randomUUID() } }
		));
		expect(response.status).toBe(204);
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(feedback.id).first()).toBeNull();
		const tombstone = await env.FEEDBACK_DB.prepare('SELECT * FROM feedback_tombstones ORDER BY deleted_at DESC LIMIT 1').first<Record<string, unknown>>();
		expect(Object.keys(tombstone ?? {}).sort()).toEqual(['delete_state', 'deleted_at', 'private_issue_number', 'public_reference_hash']);
		expect(JSON.stringify(tombstone)).not.toContain('Delete private feedback');
		expect(JSON.stringify(tombstone)).not.toContain(feedback.reference);
		const outboxRows = (await env.FEEDBACK_DB.prepare('SELECT payload_json FROM outbox_events').all<{ payload_json: string }>()).results;
		const idempotencyRows = (await env.FEEDBACK_DB.prepare('SELECT response_json FROM idempotency_records').all<{ response_json: string }>()).results;
		expect(JSON.stringify(outboxRows.filter(item => item.payload_json.includes(feedback.id)))).not.toContain('Delete private feedback');
		expect(JSON.stringify(idempotencyRows)).not.toContain('Delete private feedback');
	});

	it('does not report deletion complete until the mapped private issue is scrubbed', async () => {
		const reporter = secret('N');
		const feedback = await create(reporter, 'Retry private issue scrubbing');
		await env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
			(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
			VALUES (?1, ?2, 88123, 'node-88123', ?3)`
		).bind(feedback.id, env.PRIVATE_GITHUB_REPOSITORY_ID, Math.floor(Date.now() / 1000)).run();
		const key = crypto.randomUUID();
		const request = () => new Request(`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`, {
			method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': key },
		});
		const unavailable = syncClient();
		unavailable.scrubPrivateIssue.mockRejectedValueOnce(new Error('github_network_error'));
		expect((await deleteReporterFeedback(request(), env, feedback.id, unavailable)).status).toBe(503);
		expect((await env.FEEDBACK_DB.prepare('SELECT delete_state FROM feedback WHERE id = ?1').bind(feedback.id)
			.first<{ delete_state: string }>())?.delete_state).toBe('delete-pending');

		const recovered = syncClient();
		expect((await deleteReporterFeedback(request(), env, feedback.id, recovered)).status).toBe(204);
		expect(recovered.scrubPrivateIssue).toHaveBeenCalledWith(88123);
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(feedback.id).first()).toBeNull();
		expect((await env.FEEDBACK_DB.prepare(`SELECT private_issue_number FROM feedback_tombstones
			WHERE private_issue_number = 88123 LIMIT 1`).first<{ private_issue_number: number }>())?.private_issue_number).toBe(88123);
	});

	it('replays every pending delete key after a later retry completes the same deletion', async () => {
		const reporter = secret('Q');
		const feedback = await create(reporter, 'Preserve all pending delete retries');
		await env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
			(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
			VALUES (?1, ?2, 88125, 'node-88125', ?3)`
		).bind(feedback.id, env.PRIVATE_GITHUB_REPOSITORY_ID, Math.floor(Date.now() / 1000)).run();
		const firstKey = crypto.randomUUID();
		const secondKey = crypto.randomUUID();
		const request = (key: string) => new Request(`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`, {
			method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': key },
		});
		const unavailable = syncClient();
		unavailable.scrubPrivateIssue.mockRejectedValueOnce(new Error('github_network_error'));
		expect((await deleteReporterFeedback(request(firstKey), env, feedback.id, unavailable)).status).toBe(503);

		const recovered = syncClient();
		expect((await deleteReporterFeedback(request(secondKey), env, feedback.id, recovered)).status).toBe(204);
		expect((await deleteReporterFeedback(request(firstKey), env, feedback.id, recovered)).status).toBe(204);
		expect((await deleteReporterFeedback(request(secondKey), env, feedback.id, recovered)).status).toBe(204);
		const replays = (await env.FEEDBACK_DB.prepare(`SELECT key, response_status FROM idempotency_records
			WHERE route = ?1 AND key IN (?2, ?3) ORDER BY key`
		).bind(`delete:${feedback.id}`, firstKey, secondKey).all<{ key: string; response_status: number }>()).results;
		expect(replays).toHaveLength(2);
		expect(replays.every(replay => replay.response_status === 204)).toBe(true);
	});

	it('keeps an in-flight private issue marker and returns a retryable deletion response', async () => {
		const reporter = secret('O');
		const feedback = await create(reporter, 'Delete during private issue creation');
		await env.FEEDBACK_DB.prepare(`UPDATE outbox_events SET status = 'processing', next_attempt_at = ?1
			WHERE aggregate_type = 'feedback' AND aggregate_id = ?2 AND event_type = 'create'`
		).bind(Math.floor(Date.now() / 1000) + 120, feedback.id).run();
		const response = await deleteReporterFeedback(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`,
			{ method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': crypto.randomUUID() } },
		), env, feedback.id, syncClient());
		expect(response.status).toBe(503);
		const marker = await env.FEEDBACK_DB.prepare(`SELECT status FROM outbox_events
			WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'create'`
		).bind(feedback.id).first<{ status: string }>();
		expect(marker?.status).toBe('processing');
	});

	it('finds and scrubs a marker left by an earlier uncertain create attempt', async () => {
		const reporter = secret('P');
		const feedback = await create(reporter, 'Delete after uncertain private issue creation');
		await env.FEEDBACK_DB.prepare(`UPDATE outbox_events SET attempt_count = 1
			WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'create'`
		).bind(feedback.id).run();
		const client = syncClient();
		client.findPrivateIssueByOutboxId.mockResolvedValue({ number: 88124, node_id: 'node-88124' });
		const response = await deleteReporterFeedback(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${feedback.id}`,
			{ method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': crypto.randomUUID() } },
		), env, feedback.id, client);
		expect(response.status).toBe(204);
		expect(client.findPrivateIssueByOutboxId).toHaveBeenCalledOnce();
		expect(client.scrubPrivateIssue).toHaveBeenCalledWith(88124);
		expect((await env.FEEDBACK_DB.prepare(`SELECT private_issue_number FROM feedback_tombstones
			WHERE private_issue_number = 88124 LIMIT 1`).first<{ private_issue_number: number }>())?.private_issue_number).toBe(88124);
	});

	it('replays delete-all after revocation without duplicating work', async () => {
		const reporter = secret('G');
		await create(reporter, 'First delete-all feedback');
		await create(reporter, 'Second delete-all feedback');
		const key = crypto.randomUUID();
		const request = () => new Request('https://blockly-support.singular-ai.org/api/v1/reporter', {
			method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': key },
		});
		const first = await exports.default.fetch(request());
		const replay = await exports.default.fetch(request());
		expect(first.status).toBe(204);
		expect(replay.status).toBe(204);
		expect((await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback WHERE reporter_id = (SELECT id FROM reporters WHERE revoked_at IS NOT NULL ORDER BY revoked_at DESC LIMIT 1)')
			.first<{ count: number }>())?.count).toBe(0);
		expect((await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
			headers: bearer(reporter),
		}))).status).toBe(401);
	});

	it('revokes before delete-all enumeration and rejects a concurrent create', async () => {
		const reporter = secret('R');
		const feedback = await create(reporter, 'Delete-all race feedback');
		await env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
			(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
			VALUES (?1, ?2, 88991, 'node-88991', ?3)`
		).bind(feedback.id, env.PRIVATE_GITHUB_REPOSITORY_ID, Math.floor(Date.now() / 1000)).run();
		const key = crypto.randomUUID();
		const request = () => new Request('https://blockly-support.singular-ai.org/api/v1/reporter', {
			method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': key },
		});
		const unavailable = syncClient();
		unavailable.scrubPrivateIssue.mockRejectedValueOnce(new Error('github_network_error'));

		expect((await deleteReporterAccount(request(), env, unavailable)).status).toBe(503);
		expect((await env.FEEDBACK_DB.prepare('SELECT revoked_at FROM reporters WHERE id = (SELECT reporter_id FROM feedback WHERE id = ?1)')
			.bind(feedback.id).first<{ revoked_at: number | null }>())?.revoked_at).not.toBeNull();
		const concurrentForm = new FormData();
		concurrentForm.set('payload', JSON.stringify({ ...fixture, title: 'Must not survive delete-all' }));
		const concurrentCreate = await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
			method: 'POST',
			headers: { ...bearer(reporter), 'idempotency-key': crypto.randomUUID() },
			body: concurrentForm,
		}));
		expect(concurrentCreate.status).toBe(401);
		expect((await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback WHERE reporter_id = (SELECT reporter_id FROM feedback WHERE id = ?1)')
			.bind(feedback.id).first<{ count: number }>())?.count).toBe(1);

		const recovered = syncClient();
		expect((await deleteReporterAccount(request(), env, recovered)).status).toBe(204);
		expect((await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback WHERE id = ?1').bind(feedback.id)
			.first<{ count: number }>())?.count).toBe(0);
	});

	it('durably queues every delete before revocation can strand later feedback', async () => {
		const reporter = secret('S');
		const first = await create(reporter, 'First durable account deletion');
		const second = await create(reporter, 'Second durable account deletion');
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88992, 'node-88992', ?3)`
			).bind(first.id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88993, 'node-88993', ?3)`
			).bind(second.id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
		]);
		const unavailable = syncClient();
		unavailable.scrubPrivateIssue.mockRejectedValueOnce(new Error('github_network_error'));
		const response = await deleteReporterAccount(new Request('https://blockly-support.singular-ai.org/api/v1/reporter', {
			method: 'DELETE', headers: { ...bearer(reporter), 'idempotency-key': crypto.randomUUID() },
		}), env, unavailable);
		expect(response.status).toBe(503);
		expect((await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM feedback
			WHERE id IN (?1, ?2) AND delete_state = 'delete-pending'`
		).bind(first.id, second.id).first<{ count: number }>())?.count).toBe(2);
		expect((await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM outbox_events
			WHERE aggregate_type = 'feedback' AND aggregate_id IN (?1, ?2) AND event_type = 'delete'`
		).bind(first.id, second.id).first<{ count: number }>())?.count).toBe(2);
		const retainedResponses = (await env.FEEDBACK_DB.prepare(`SELECT response_json FROM idempotency_records
			WHERE reporter_id = (SELECT reporter_id FROM feedback WHERE id = ?1) AND route <> 'delete-reporter'`
		).bind(first.id).all<{ response_json: string }>()).results;
		expect(retainedResponses.length).toBeGreaterThan(0);
		expect(retainedResponses.every(record => record.response_json === JSON.stringify({
			error: { code: 'reporter_deleted', message: 'The reporter was deleted' },
		}))).toBe(true);
		expect(JSON.stringify(retainedResponses)).not.toContain('First durable account deletion');
		expect(JSON.stringify(retainedResponses)).not.toContain('Second durable account deletion');

		const recovered = syncClient();
		const { processOutbox } = await import('../../src/services/outbox');
		await processOutbox(env, recovered, 100);
		expect((await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback WHERE id IN (?1, ?2)')
			.bind(first.id, second.id).first<{ count: number }>())?.count).toBe(0);
	});
});
