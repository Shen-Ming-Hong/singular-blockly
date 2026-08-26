import { env, exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { deleteReporterFeedback } from '../../src/routes/reporterFeedback';
import { finalizeFeedbackDeletion, processOutbox } from '../../src/services/outbox';
import fixture from '../fixtures/create-feedback.json';

async function createFeedback(title: string): Promise<string> {
	const form = new FormData();
	form.set('payload', JSON.stringify({ ...fixture, title }));
	const response = await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/api/v1/feedback', {
		method: 'POST',
		headers: { authorization: `Bearer ${'H'.repeat(43)}`, 'idempotency-key': crypto.randomUUID() },
		body: form,
	}));
	return ((await response.json()) as { id: string }).id;
}

function fakeClient() {
	let issue = 80000;
	return {
		createPrivateIssue: vi.fn(async () => ({ number: ++issue, node_id: `node-${issue}` })),
		findPrivateIssueByOutboxId: vi.fn(async () => null),
		createPublicIssue: vi.fn(async () => ({ number: ++issue, node_id: `node-${issue}` })),
		findPublicIssueByOutboxId: vi.fn<() => Promise<{ number: number; node_id: string } | null>>(async () => null),
		addPrivateComment: vi.fn(async () => undefined),
		scrubPrivateIssue: vi.fn(async () => undefined),
	};
}

describe('feedback outbox', () => {
	it('creates one private mapping and remains externally idempotent on replay', async () => {
		const id = await createFeedback('Reliable outbox private sync');
		const client = fakeClient();
		await processOutbox(env, client, 100);
		const mapping = await env.FEEDBACK_DB.prepare('SELECT issue_number FROM github_mappings WHERE feedback_id = ?1').bind(id).first();
		expect(mapping).not.toBeNull();
		const calls = client.createPrivateIssue.mock.calls.length;
		await env.FEEDBACK_DB.prepare("UPDATE outbox_events SET status = 'pending', next_attempt_at = 0 WHERE aggregate_id = ?1 AND event_type = 'create'")
			.bind(id).run();
		await processOutbox(env, client, 100);
		expect(client.createPrivateIssue.mock.calls.length).toBe(calls);
	});

	it('uses exponential retry and dead-letters without storing raw errors', async () => {
		const id = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
			(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
			VALUES (?1, 'feedback', ?2, 'update', '{}', 'pending', 9, 0, ?3)`
		).bind(id, crypto.randomUUID(), now).run();
		await processOutbox(env, fakeClient(), 100);
		const row = await env.FEEDBACK_DB.prepare('SELECT status, attempt_count, last_error_code FROM outbox_events WHERE id = ?1')
			.bind(id).first<{ status: string; attempt_count: number; last_error_code: string }>();
		expect(row).toEqual({ status: 'dead', attempt_count: 10, last_error_code: 'outbox_event_unsupported' });
		expect(JSON.stringify(row)).not.toContain('payload');
	});

	it('keeps privacy deletion events retryable after the normal dead-letter limit', async () => {
		const id = await createFeedback('Deletion retries must remain durable');
		const eventId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1").bind(id),
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 81111, 'node-81111', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				VALUES (?1, 'feedback', ?2, 'delete', ?3, 'pending', 9, 0, ?4)`
			).bind(eventId, id, JSON.stringify({ feedbackId: id, r2Key: null }), now),
		]);
		const unavailable = fakeClient();
		unavailable.scrubPrivateIssue.mockRejectedValue(new Error('github_network_error'));
		const result = await processOutbox(env, unavailable, 100);
		const row = await env.FEEDBACK_DB.prepare('SELECT status, attempt_count FROM outbox_events WHERE id = ?1')
			.bind(eventId).first<{ status: string; attempt_count: number }>();
		expect(result.dead).toBe(0);
		expect(row).toEqual({ status: 'pending', attempt_count: 0 });
	});

	it('reclaims an expired processing lease after a worker interruption', async () => {
		const eventId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
			(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
			VALUES (?1, 'feedback', ?2, 'update', '{}', 'processing', 1, 0, ?3)`
		).bind(eventId, crypto.randomUUID(), now).run();
		const result = await processOutbox(env, fakeClient(), 100);
		const row = await env.FEEDBACK_DB.prepare('SELECT status, attempt_count FROM outbox_events WHERE id = ?1')
			.bind(eventId).first<{ status: string; attempt_count: number }>();
		expect(result.retried).toBe(1);
		expect(row).toEqual({ status: 'pending', attempt_count: 2 });
	});

	it('scrubs an issue created concurrently with reporter deletion', async () => {
		const id = await createFeedback('Delete while private issue is being created');
		const now = Math.floor(Date.now() / 1000);
		const client = fakeClient();
		client.createPrivateIssue.mockImplementation(async () => {
			await env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1").bind(id).run();
			return { number: 89999, node_id: 'node-89999' };
		});
		await processOutbox(env, client, 100);
		expect(client.scrubPrivateIssue).toHaveBeenCalledWith(89999);
		expect(await env.FEEDBACK_DB.prepare('SELECT issue_number FROM github_mappings WHERE feedback_id = ?1').bind(id).first()).toBeNull();
		const tombstoneBeforeFinalize = await env.FEEDBACK_DB.prepare(`SELECT private_issue_number, delete_state
			FROM feedback_tombstones WHERE private_issue_number = 89999 LIMIT 1`
		).first<Record<string, unknown>>();
		expect(tombstoneBeforeFinalize).toEqual({ private_issue_number: 89999, delete_state: 'scrubbed' });

		await finalizeFeedbackDeletion(env, client, id, null, undefined, now);
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(id).first()).toBeNull();
		const tombstoneAfterFinalize = await env.FEEDBACK_DB.prepare(`SELECT private_issue_number, delete_state
			FROM feedback_tombstones WHERE private_issue_number = 89999 LIMIT 1`
		).first<Record<string, unknown>>();
		expect(tombstoneAfterFinalize).toEqual({ private_issue_number: 89999, delete_state: 'scrubbed' });
	});

	it('waits for an in-flight message sync before scrubbing and completing deletion', async () => {
		const id = await createFeedback('Delete while a private message is syncing');
		const client = fakeClient();
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88055, 'node-88055', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, Math.floor(Date.now() / 1000)),
			env.FEEDBACK_DB.prepare(`UPDATE outbox_events SET status = 'completed', completed_at = ?1
				WHERE aggregate_type = 'feedback' AND aggregate_id = ?2 AND event_type = 'create'`
			).bind(Math.floor(Date.now() / 1000), id),
		]);
		const messageResponse = await exports.default.fetch(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${id}/messages`,
			{
				method: 'POST',
				headers: {
					authorization: `Bearer ${'H'.repeat(43)}`,
					'content-type': 'application/json',
					'idempotency-key': crypto.randomUUID(),
				},
				body: JSON.stringify({ body: 'Private detail that must be scrubbed.' }),
			},
		));
		expect(messageResponse.status).toBe(201);

		const messageEvent = await env.FEEDBACK_DB.prepare(`SELECT e.id FROM outbox_events e
			JOIN feedback_messages m ON m.id = e.aggregate_id
			WHERE m.feedback_id = ?1 AND e.aggregate_type = 'message' AND e.event_type = 'public-message' LIMIT 1`
		).bind(id).first<{ id: string }>();
		expect(messageEvent).not.toBeNull();
		await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
			SET status = 'processing', attempt_count = 1, next_attempt_at = ?1 WHERE id = ?2`
		).bind(Math.floor(Date.now() / 1000) + 120, messageEvent?.id).run();
		const deletionKey = crypto.randomUUID();
		const deletionRequest = () => new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${id}`,
			{
				method: 'DELETE',
				headers: { authorization: `Bearer ${'H'.repeat(43)}`, 'idempotency-key': deletionKey },
			},
		);
		const pending = await deleteReporterFeedback(deletionRequest(), env, id, client);
		expect(pending.status).toBe(503);
		expect(client.scrubPrivateIssue).not.toHaveBeenCalled();
		expect((await env.FEEDBACK_DB.prepare('SELECT status FROM outbox_events WHERE id = ?1')
			.bind(messageEvent?.id).first<{ status: string }>())?.status).toBe('processing');

		await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
			SET status = 'completed', completed_at = ?1 WHERE id = ?2`
		).bind(Math.floor(Date.now() / 1000), messageEvent?.id).run();
		const completed = await deleteReporterFeedback(deletionRequest(), env, id, client);
		expect(completed.status).toBe(204);
		expect(client.scrubPrivateIssue).toHaveBeenCalledOnce();
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(id).first()).toBeNull();
	});

	it('waits for an in-flight public issue before detaching its approval evidence', async () => {
		const id = await createFeedback('Delete while a public issue is being created');
		const now = Math.floor(Date.now() / 1000);
		const publicEventId = crypto.randomUUID();
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1").bind(id),
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88056, 'node-88056', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO development_approvals
				(approval_id, feedback_id, proposed_summary, approved_by, approved_at)
				VALUES (?1, ?1, ?2, '301', ?3)`
			).bind(id, 'A safe public summary awaiting its issue mapping.', now - 10),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				VALUES (?1, 'feedback', ?2, 'create-public-issue', ?3, 'processing', 1, ?4, ?5)`
			).bind(publicEventId, id, JSON.stringify({
				feedbackId: id,
				summary: 'A safe public summary awaiting its issue mapping.',
			}), now + 120, now),
		]);
		const client = fakeClient();

		await expect(finalizeFeedbackDeletion(env, client, id, null, undefined, now))
			.rejects.toThrow('github_sync_in_progress');
		expect(client.scrubPrivateIssue).not.toHaveBeenCalled();
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(id).first()).not.toBeNull();
		expect(await env.FEEDBACK_DB.prepare('SELECT feedback_id FROM development_approvals WHERE approval_id = ?1')
			.bind(id).first()).not.toBeNull();

		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE development_approvals
				SET public_repo_id = ?1, public_issue_number = 98056 WHERE approval_id = ?2`
			).bind(env.PUBLIC_GITHUB_REPOSITORY_ID, id),
			env.FEEDBACK_DB.prepare(`UPDATE outbox_events
				SET status = 'completed', completed_at = ?1 WHERE id = ?2`
			).bind(now, publicEventId),
		]);
		await finalizeFeedbackDeletion(env, client, id, null, undefined, now);

		const approval = await env.FEEDBACK_DB.prepare(`SELECT feedback_id, public_repo_id,
			public_issue_number, link_severed_at FROM development_approvals WHERE approval_id = ?1`
		).bind(id).first<Record<string, unknown>>();
		expect(approval).toEqual({
			feedback_id: null,
			public_repo_id: env.PUBLIC_GITHUB_REPOSITORY_ID,
			public_issue_number: 98056,
			link_severed_at: now,
		});
	});

	it('cancels an unattempted public issue before external deletion work can race its claim', async () => {
		const id = await createFeedback('Cancel pending public issue during deletion');
		const now = Math.floor(Date.now() / 1000);
		const publicEventId = crypto.randomUUID();
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1").bind(id),
			env.FEEDBACK_DB.prepare(`UPDATE outbox_events SET status = 'completed', completed_at = ?1
				WHERE aggregate_type = 'feedback' AND aggregate_id = ?2 AND event_type = 'create'`
			).bind(now, id),
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88058, 'node-88058', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO development_approvals
				(approval_id, feedback_id, proposed_summary, approved_by, approved_at)
				VALUES (?1, ?1, ?2, '301', ?3)`
			).bind(id, 'A safe public summary that has not been attempted.', now - 10),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				VALUES (?1, 'feedback', ?2, 'create-public-issue', ?3, 'pending', 0, 0, ?4)`
			).bind(publicEventId, id, JSON.stringify({
				feedbackId: id,
				summary: 'A safe public summary that has not been attempted.',
			}), now),
		]);
		const client = fakeClient();
		let signalCreateStarted!: () => void;
		let releaseCreate!: () => void;
		const createStarted = new Promise<void>(resolve => {signalCreateStarted = resolve;});
		const createReleased = new Promise<void>(resolve => {releaseCreate = resolve;});
		let background: ReturnType<typeof processOutbox> | undefined;
		client.createPublicIssue.mockImplementation(async () => {
			signalCreateStarted();
			await createReleased;
			return { number: 98058, node_id: 'node-98058' };
		});
		client.scrubPrivateIssue.mockImplementationOnce(async () => {
			background = processOutbox(env, client, 100);
			await Promise.race([createStarted, background]);
		});

		await finalizeFeedbackDeletion(env, client, id, null, undefined, now);
		releaseCreate();
		if (background) {await background;}

		expect(client.createPublicIssue).not.toHaveBeenCalled();
		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(id).first()).toBeNull();
		expect(await env.FEEDBACK_DB.prepare('SELECT approval_id FROM development_approvals WHERE approval_id = ?1')
			.bind(id).first()).toBeNull();
	});

	it('recovers an attempted public issue before deleting private feedback', async () => {
		const id = await createFeedback('Delete after an uncertain public issue result');
		const now = Math.floor(Date.now() / 1000);
		const publicEventId = crypto.randomUUID();
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 88057, 'node-88057', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO development_approvals
				(approval_id, feedback_id, proposed_summary, approved_by, approved_at)
				VALUES (?1, ?1, ?2, '301', ?3)`
			).bind(id, 'A safe public summary with an uncertain external result.', now - 10),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				VALUES (?1, 'feedback', ?2, 'create-public-issue', ?3, 'pending', 1, 0, ?4)`
			).bind(publicEventId, id, JSON.stringify({
				feedbackId: id,
				summary: 'A safe public summary with an uncertain external result.',
			}), now),
		]);
		const client = fakeClient();
		client.findPublicIssueByOutboxId.mockResolvedValue({ number: 98057, node_id: 'node-98057' });
		const response = await deleteReporterFeedback(new Request(
			`https://blockly-support.singular-ai.org/api/v1/feedback/${id}`,
			{
				method: 'DELETE',
				headers: { authorization: `Bearer ${'H'.repeat(43)}`, 'idempotency-key': crypto.randomUUID() },
			},
		), env, id, client);

		expect(response.status).toBe(204);
		expect(client.findPublicIssueByOutboxId).toHaveBeenCalledWith(publicEventId);
		expect(await env.FEEDBACK_DB.prepare(`SELECT feedback_id, public_repo_id,
			public_issue_number, link_severed_at FROM development_approvals WHERE approval_id = ?1`
		).bind(id).first<Record<string, unknown>>()).toEqual({
			feedback_id: null,
			public_repo_id: env.PUBLIC_GITHUB_REPOSITORY_ID,
			public_issue_number: 98057,
			link_severed_at: now,
		});
	});

	it('scrubs a private issue and leaves a content-free tombstone', async () => {
		const referenceHash = 'tombstone-hash-for-outbox-test';
		const eventId = crypto.randomUUID();
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`INSERT INTO feedback_tombstones
				(public_reference_hash, private_issue_number, delete_state, deleted_at)
				VALUES (?1, 81234, 'pending', ?2)`).bind(referenceHash, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				VALUES (?1, 'tombstone', ?2, 'delete', ?3, 'pending', 0, 0, ?4)`
			).bind(eventId, referenceHash, JSON.stringify({ referenceHash, privateIssueNumber: 81234 }), now),
		]);
		const client = fakeClient();
		await processOutbox(env, client, 100);
		expect(client.scrubPrivateIssue).toHaveBeenCalledWith(81234);
		const tombstone = await env.FEEDBACK_DB.prepare('SELECT * FROM feedback_tombstones WHERE public_reference_hash = ?1')
			.bind(referenceHash).first<Record<string, unknown>>();
		expect(tombstone?.delete_state).toBe('scrubbed');
		expect(tombstone?.private_issue_number).toBe(81234);
		expect(Object.keys(tombstone ?? {}).sort()).toEqual(['delete_state', 'deleted_at', 'private_issue_number', 'public_reference_hash']);
	});

	it('detaches and preserves public development approval evidence after private deletion', async () => {
		const id = await createFeedback('Public approval evidence survives private deletion');
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1").bind(id),
			env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
				(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
				VALUES (?1, ?2, 81337, 'node-81337', ?3)`
			).bind(id, env.PRIVATE_GITHUB_REPOSITORY_ID, now),
			env.FEEDBACK_DB.prepare(`INSERT INTO development_approvals
				(approval_id, feedback_id, proposed_summary, approved_by, approved_at, public_repo_id, public_issue_number)
				VALUES (?1, ?1, ?2, '301', ?3, ?4, 91337)`
			).bind(id, 'A de-identified public development summary.', now - 10, env.PUBLIC_GITHUB_REPOSITORY_ID),
		]);

		await finalizeFeedbackDeletion(env, fakeClient(), id, null, undefined, now);

		expect(await env.FEEDBACK_DB.prepare('SELECT id FROM feedback WHERE id = ?1').bind(id).first()).toBeNull();
		const approval = await env.FEEDBACK_DB.prepare(`SELECT approval_id, feedback_id, proposed_summary,
			approved_by, approved_at, public_repo_id, public_issue_number, link_severed_at
			FROM development_approvals WHERE approval_id = ?1`
		).bind(id).first<Record<string, unknown>>();
		expect(approval).toEqual({
			approval_id: id,
			feedback_id: null,
			proposed_summary: 'A de-identified public development summary.',
			approved_by: '301',
			approved_at: now - 10,
			public_repo_id: env.PUBLIC_GITHUB_REPOSITORY_ID,
			public_issue_number: 91337,
			link_severed_at: now,
		});
	});
});
