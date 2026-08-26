import { createHmac } from '../domain/auth';
import type { Env } from '../env';
import { GitHubAppClient, type PrivateIssueSource } from './githubApp';
import { R2AttachmentStore } from '../storage/r2';

interface OutboxRow {
	id: string;
	aggregate_type: 'feedback' | 'message' | 'tombstone';
	aggregate_id: string;
	event_type: 'create' | 'update' | 'public-message' | 'delete' | 'create-public-issue';
	payload_json: string;
	attempt_count: number;
}

interface FeedbackSyncRow {
	id: string;
	public_reference: string;
	kind: string;
	title: string;
	description: string;
	steps: string | null;
	expected: string | null;
	diagnostics_json: string;
	attachment_id: string | null;
	delete_state: 'active' | 'delete-pending';
}

interface DeletePendingRow {
	id: string;
	public_reference: string;
	reporter_id: string;
	private_issue_number: number | null;
}

const OUTBOX_LEASE_SECONDS = 120;

export interface FeedbackSyncClient {
	createPrivateIssue(source: PrivateIssueSource, outboxId: string): Promise<{ number: number; node_id: string }>;
	findPrivateIssueByOutboxId(outboxId: string): Promise<{ number: number; node_id: string } | null>;
	createPublicIssue(summary: string, outboxId: string): Promise<{ number: number; node_id: string }>;
	findPublicIssueByOutboxId(outboxId: string): Promise<{ number: number; node_id: string } | null>;
	addPrivateComment(issueNumber: number, body: string, outboxId: string): Promise<void>;
	scrubPrivateIssue(issueNumber: number): Promise<void>;
}

function parsePayload(value: string): Record<string, unknown> {
	const parsed = JSON.parse(value) as unknown;
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {throw new Error('outbox_payload_invalid');}
	return parsed as Record<string, unknown>;
}

function stableError(error: unknown): string {
	const value = error instanceof Error ? error.message : 'outbox_failed';
	return /^[a-z][a-z0-9_]{0,63}$/.test(value) ? value : 'outbox_failed';
}

function untrustedComment(body: string, outboxId: string): string {
	const block = body.replace(/\r\n/g, '\n').split('\n').map(line => `    ${line}`).join('\n');
	return `<!-- sb-outbox:${outboxId} -->\nReporter message (untrusted):\n\n${block}`;
}

async function mappingIssue(env: Env, feedbackId: string): Promise<number | null> {
	const row = await env.FEEDBACK_DB.prepare('SELECT issue_number FROM github_mappings WHERE feedback_id = ?1 LIMIT 1')
		.bind(feedbackId).first<{ issue_number: number }>();
	return row?.issue_number ?? null;
}

async function recordAndScrubDeletedPrivateIssue(
	env: Env,
	client: FeedbackSyncClient,
	publicReference: string,
	issueNumber: number,
	now: number,
): Promise<void> {
	const referenceHash = await createHmac(publicReference, env.REPORTER_HMAC_PEPPER);
	await env.FEEDBACK_DB.prepare(`INSERT INTO feedback_tombstones
		(public_reference_hash, private_issue_number, delete_state, deleted_at)
		VALUES (?1, ?2, 'pending', ?3)
		ON CONFLICT(public_reference_hash) DO UPDATE SET
			private_issue_number = excluded.private_issue_number,
			delete_state = 'pending',
			deleted_at = excluded.deleted_at`
	).bind(referenceHash, issueNumber, now).run();
	await client.scrubPrivateIssue(issueNumber);
	await env.FEEDBACK_DB.prepare(`UPDATE feedback_tombstones
		SET delete_state = 'scrubbed', deleted_at = ?1
		WHERE public_reference_hash = ?2 AND private_issue_number = ?3`
	).bind(now, referenceHash, issueNumber).run();
}

async function processCreate(env: Env, client: FeedbackSyncClient, event: OutboxRow, now: number): Promise<void> {
	if (await mappingIssue(env, event.aggregate_id)) {return;}
	const row = await env.FEEDBACK_DB.prepare(`
		SELECT f.id, f.public_reference, f.kind, f.title, f.description, f.steps, f.expected, f.diagnostics_json,
			a.id AS attachment_id, f.delete_state
		FROM feedback f LEFT JOIN attachments a ON a.feedback_id = f.id
		WHERE f.id = ?1 LIMIT 1
	`).bind(event.aggregate_id).first<FeedbackSyncRow>();
	if (!row) {return;}
	if (row.delete_state === 'delete-pending') {
		const referenceHash = await createHmac(row.public_reference, env.REPORTER_HMAC_PEPPER);
		const remembered = await env.FEEDBACK_DB.prepare(`SELECT private_issue_number
			FROM feedback_tombstones WHERE public_reference_hash = ?1 LIMIT 1`
		).bind(referenceHash).first<{ private_issue_number: number | null }>();
		const issueNumber = remembered?.private_issue_number
			?? (await client.findPrivateIssueByOutboxId(event.id))?.number
			?? null;
		if (issueNumber !== null) {
			await recordAndScrubDeletedPrivateIssue(env, client, row.public_reference, issueNumber, now);
		}
		return;
	}
	let diagnostics: Record<string, unknown> = {};
	try {diagnostics = JSON.parse(row.diagnostics_json) as Record<string, unknown>;} catch { /* invalid legacy data is omitted */ }
	const issue = await client.createPrivateIssue({
		reference: row.public_reference,
		kind: row.kind,
		title: row.title,
		description: row.description,
		steps: row.steps,
		expected: row.expected,
		diagnostics,
		attachmentUrl: row.attachment_id
			? new URL(`/admin/attachments/${row.attachment_id}`, env.SERVICE_ORIGIN).toString()
			: null,
		}, event.id);
	const inserted = await env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO github_mappings
		(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
		SELECT ?1, ?2, ?3, ?4, ?5
		FROM feedback WHERE id = ?1 AND delete_state = 'active'`
	).bind(row.id, env.PRIVATE_GITHUB_REPOSITORY_ID, issue.number, issue.node_id, now).run();
	if (!inserted.meta.changes && await mappingIssue(env, row.id) !== issue.number) {
		const current = await env.FEEDBACK_DB.prepare('SELECT delete_state FROM feedback WHERE id = ?1 LIMIT 1')
			.bind(row.id).first<{ delete_state: 'active' | 'delete-pending' }>();
		if (!current || current.delete_state === 'delete-pending') {
			await recordAndScrubDeletedPrivateIssue(env, client, row.public_reference, issue.number, now);
		} else {
			await client.scrubPrivateIssue(issue.number);
		}
	}
}

async function processMessage(env: Env, client: FeedbackSyncClient, event: OutboxRow): Promise<void> {
	const payload = parsePayload(event.payload_json);
	if (typeof payload.feedbackId !== 'string' || typeof payload.body !== 'string') {throw new Error('outbox_payload_invalid');}
	const row = await env.FEEDBACK_DB.prepare(`SELECT gm.issue_number
		FROM github_mappings gm JOIN feedback f ON f.id = gm.feedback_id
		WHERE gm.feedback_id = ?1 AND f.delete_state = 'active' LIMIT 1`
	).bind(payload.feedbackId).first<{ issue_number: number }>();
	if (!row) {throw new Error('github_mapping_pending');}
	await client.addPrivateComment(row.issue_number, untrustedComment(payload.body, event.id), event.id);
}

async function recoverAttemptedPublicIssue(
	env: Env,
	client: FeedbackSyncClient,
	feedbackId: string,
): Promise<void> {
	const approval = await env.FEEDBACK_DB.prepare(`SELECT public_issue_number
		FROM development_approvals WHERE feedback_id = ?1 LIMIT 1`
	).bind(feedbackId).first<{ public_issue_number: number | null }>();
	if (!approval || approval.public_issue_number !== null) {return;}
	const event = await env.FEEDBACK_DB.prepare(`SELECT id, status, attempt_count FROM outbox_events
		WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'create-public-issue'
		ORDER BY created_at ASC LIMIT 1`
	).bind(feedbackId).first<{ id: string; status: string; attempt_count: number }>();
	if (!event) {return;}
	if (event.status === 'processing') {throw new Error('github_sync_in_progress');}
	if (event.attempt_count < 1 && event.status !== 'dead') {return;}
	const issue = await client.findPublicIssueByOutboxId(event.id);
	if (!issue) {return;}
	await env.FEEDBACK_DB.prepare(`UPDATE development_approvals
		SET public_repo_id = ?1, public_issue_number = ?2
		WHERE feedback_id = ?3 AND public_issue_number IS NULL`
	).bind(env.PUBLIC_GITHUB_REPOSITORY_ID, issue.number, feedbackId).run();
}

export async function finalizeFeedbackDeletion(
	env: Env,
	client: FeedbackSyncClient,
	feedbackId: string,
	r2Key: string | null,
	idempotency?: { reporterId: string; route: string; key: string; requestHash: string },
	now = Math.floor(Date.now() / 1000),
): Promise<void> {
	if (!/^[0-9a-f-]{36}$/i.test(feedbackId)
		|| (r2Key !== null && !/^[0-9a-f]{32}$/i.test(r2Key))) {
		throw new Error('outbox_payload_invalid');
	}
	const row = await env.FEEDBACK_DB.prepare(`
		SELECT f.id, f.public_reference, f.reporter_id, gm.issue_number AS private_issue_number
		FROM feedback f LEFT JOIN github_mappings gm ON gm.feedback_id = f.id
		WHERE f.id = ?1 AND f.delete_state = 'delete-pending' LIMIT 1
	`).bind(feedbackId).first<DeletePendingRow>();
	if (!row) {return;}
	if (idempotency && row.reporter_id !== idempotency.reporterId) {throw new Error('feedback_owner_mismatch');}
	// Atomically win against the outbox claim condition for a public issue that
	// has never reached GitHub. If a worker already claimed it, the processing
	// check below waits for its result instead of detaching the approval early.
	await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
		SET status = 'completed', completed_at = ?1, last_error_code = 'public_issue_cancelled_by_delete'
		WHERE aggregate_type = 'feedback' AND aggregate_id = ?2
			AND event_type = 'create-public-issue' AND status = 'pending' AND attempt_count = 0`
	).bind(now, feedbackId).run();
	const syncingMessage = await env.FEEDBACK_DB.prepare(`SELECT e.id
		FROM outbox_events e JOIN feedback_messages m ON m.id = e.aggregate_id
		WHERE m.feedback_id = ?1 AND e.aggregate_type = 'message'
			AND e.event_type = 'public-message' AND e.status = 'processing'
		LIMIT 1`
	).bind(feedbackId).first<{ id: string }>();
	const syncingPublicIssue = await env.FEEDBACK_DB.prepare(`SELECT id FROM outbox_events
		WHERE aggregate_type = 'feedback' AND aggregate_id = ?1
			AND event_type = 'create-public-issue' AND status = 'processing'
		LIMIT 1`
	).bind(feedbackId).first<{ id: string }>();
	if (syncingMessage || syncingPublicIssue) {throw new Error('github_sync_in_progress');}
	await recoverAttemptedPublicIssue(env, client, feedbackId);

	let tombstoneIssueNumber = row.private_issue_number;
	if (row.private_issue_number !== null) {
		await client.scrubPrivateIssue(row.private_issue_number);
	} else {
		await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
			SET status = 'completed', completed_at = ?1, last_error_code = NULL
			WHERE aggregate_type = 'feedback' AND aggregate_id = ?2 AND event_type = 'create' AND status = 'pending'`
		).bind(now, feedbackId).run();
		const createEvent = await env.FEEDBACK_DB.prepare(`SELECT id, status, attempt_count FROM outbox_events
			WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'create'
			ORDER BY created_at ASC LIMIT 1`
		).bind(feedbackId).first<{ id: string; status: string; attempt_count: number }>();
		if (createEvent?.status === 'processing') {throw new Error('github_sync_in_progress');}
		if (createEvent && (createEvent.status === 'dead' || createEvent.attempt_count > 0)) {
			const orphan = await client.findPrivateIssueByOutboxId(createEvent.id);
			if (orphan) {
				await client.scrubPrivateIssue(orphan.number);
				tombstoneIssueNumber = orphan.number;
			}
		}
	}
	if (r2Key) {await new R2AttachmentStore(env.FEEDBACK_SCREENSHOTS).delete(r2Key);}
	const referenceHash = await createHmac(row.public_reference, env.REPORTER_HMAC_PEPPER);
	const deleteEvent = await env.FEEDBACK_DB.prepare(`SELECT payload_json FROM outbox_events
		WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'delete'
		ORDER BY created_at ASC LIMIT 1`
	).bind(feedbackId).first<{ payload_json: string }>();
	const deletePayload = deleteEvent ? parsePayload(deleteEvent.payload_json) : {};
	const jobIdempotency = typeof deletePayload.reporterId === 'string'
		&& deletePayload.route === `delete:${feedbackId}`
		&& typeof deletePayload.idempotencyKey === 'string'
		&& typeof deletePayload.requestHash === 'string'
		? {
			reporterId: deletePayload.reporterId,
			route: deletePayload.route,
			key: deletePayload.idempotencyKey,
			requestHash: deletePayload.requestHash,
		} : undefined;
	if (jobIdempotency && jobIdempotency.reporterId !== row.reporter_id) {throw new Error('feedback_owner_mismatch');}
	const idempotencies = [...new Map(
		[idempotency, jobIdempotency]
			.filter((value): value is NonNullable<typeof idempotency> => value !== undefined)
			.map(value => [`${value.reporterId}:${value.route}:${value.key}`, value]),
	).values()];
	const idempotencyStatements = idempotencies.flatMap(value => [
		env.FEEDBACK_DB.prepare(`UPDATE idempotency_records
			SET response_status = 204, response_json = '{}', expires_at = ?1
			WHERE reporter_id = ?2 AND route = ?3 AND request_sha256 = ?4 AND response_status = 202`
		).bind(now + 7 * 86400, value.reporterId, value.route, value.requestHash),
		env.FEEDBACK_DB.prepare(`INSERT INTO idempotency_records
			(reporter_id, route, key, request_sha256, response_status, response_json, created_at, expires_at)
			VALUES (?1, ?2, ?3, ?4, 204, '{}', ?5, ?6)
			ON CONFLICT(reporter_id, route, key) DO UPDATE SET
				response_status = 204, response_json = '{}', expires_at = excluded.expires_at
			WHERE idempotency_records.request_sha256 = excluded.request_sha256`
		).bind(value.reporterId, value.route, value.key, value.requestHash, now, now + 7 * 86400),
	]);
	await env.FEEDBACK_DB.batch([
		env.FEEDBACK_DB.prepare(`INSERT INTO feedback_tombstones
			(public_reference_hash, private_issue_number, delete_state, deleted_at)
			VALUES (?1, ?2, 'scrubbed', ?3)
			ON CONFLICT(public_reference_hash) DO UPDATE SET
				private_issue_number = COALESCE(excluded.private_issue_number, feedback_tombstones.private_issue_number),
				delete_state = 'scrubbed',
				deleted_at = excluded.deleted_at`
		).bind(referenceHash, tombstoneIssueNumber, now),
		env.FEEDBACK_DB.prepare(`UPDATE development_approvals
			SET feedback_id = NULL, link_severed_at = ?1
			WHERE feedback_id = ?2 AND public_repo_id IS NOT NULL AND public_issue_number IS NOT NULL`
		).bind(now, row.id),
		env.FEEDBACK_DB.prepare(`DELETE FROM development_approvals
			WHERE feedback_id = ?1 AND (public_repo_id IS NULL OR public_issue_number IS NULL)`
		).bind(row.id),
		env.FEEDBACK_DB.prepare(`DELETE FROM outbox_events WHERE
			(aggregate_type = 'feedback' AND aggregate_id = ?1)
			OR (aggregate_type = 'message' AND aggregate_id IN (SELECT id FROM feedback_messages WHERE feedback_id = ?1))`
		).bind(row.id),
		...idempotencyStatements,
		env.FEEDBACK_DB.prepare('DELETE FROM feedback WHERE id = ?1').bind(row.id),
	]);
}

async function finalizePendingDelete(env: Env, client: FeedbackSyncClient, event: OutboxRow, now: number): Promise<void> {
	const payload = parsePayload(event.payload_json);
	if (typeof payload.feedbackId !== 'string'
		|| (payload.r2Key !== null && typeof payload.r2Key !== 'string')) {
		throw new Error('outbox_payload_invalid');
	}
	const idempotency = typeof payload.reporterId === 'string'
		&& typeof payload.route === 'string'
		&& typeof payload.idempotencyKey === 'string'
		&& typeof payload.requestHash === 'string'
		? {
			reporterId: payload.reporterId,
			route: payload.route,
			key: payload.idempotencyKey,
			requestHash: payload.requestHash,
		} : undefined;
	await finalizeFeedbackDeletion(env, client, payload.feedbackId, payload.r2Key, idempotency, now);
}

async function processTombstone(env: Env, client: FeedbackSyncClient, event: OutboxRow): Promise<void> {
	const payload = parsePayload(event.payload_json);
	if (typeof payload.referenceHash !== 'string') {throw new Error('outbox_payload_invalid');}
	if (payload.privateIssueNumber !== null && payload.privateIssueNumber !== undefined) {
		if (!Number.isInteger(payload.privateIssueNumber) || (payload.privateIssueNumber as number) < 1) {throw new Error('outbox_payload_invalid');}
		await client.scrubPrivateIssue(payload.privateIssueNumber as number);
	}
	await env.FEEDBACK_DB.prepare("UPDATE feedback_tombstones SET delete_state = 'scrubbed' WHERE public_reference_hash = ?1")
		.bind(payload.referenceHash).run();
}

async function processPublicIssue(env: Env, client: FeedbackSyncClient, event: OutboxRow): Promise<void> {
	const payload = parsePayload(event.payload_json);
	if (typeof payload.feedbackId !== 'string' || typeof payload.summary !== 'string') {throw new Error('outbox_payload_invalid');}
	const existing = await env.FEEDBACK_DB.prepare(`SELECT public_issue_number FROM development_approvals
		WHERE feedback_id = ?1 LIMIT 1`).bind(payload.feedbackId).first<{ public_issue_number: number | null }>();
	if (!existing || existing.public_issue_number !== null) {return;}
	const issue = await client.createPublicIssue(payload.summary, event.id);
	await env.FEEDBACK_DB.prepare(`UPDATE development_approvals
		SET public_repo_id = ?1, public_issue_number = ?2 WHERE feedback_id = ?3 AND public_issue_number IS NULL`
	).bind(env.PUBLIC_GITHUB_REPOSITORY_ID, issue.number, payload.feedbackId).run();
}

async function processEvent(env: Env, client: FeedbackSyncClient, event: OutboxRow, now: number): Promise<void> {
	if (event.event_type === 'create' && event.aggregate_type === 'feedback') {await processCreate(env, client, event, now); return;}
	if (event.event_type === 'public-message') {await processMessage(env, client, event); return;}
	if (event.event_type === 'delete' && event.aggregate_type === 'feedback') {await finalizePendingDelete(env, client, event, now); return;}
	if (event.event_type === 'delete' && event.aggregate_type === 'tombstone') {await processTombstone(env, client, event); return;}
	if (event.event_type === 'create-public-issue') {await processPublicIssue(env, client, event); return;}
	throw new Error('outbox_event_unsupported');
}

export async function processOutbox(
	env: Env,
	client: FeedbackSyncClient = new GitHubAppClient(env),
	limit = 20,
): Promise<{ completed: number; retried: number; dead: number }> {
	const now = Math.floor(Date.now() / 1000);
	await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
		SET status = 'pending', attempt_count = 0, next_attempt_at = ?1, last_error_code = 'delete_retry_continues'
		WHERE status = 'processing' AND next_attempt_at <= ?1 AND attempt_count >= 10 AND event_type = 'delete'`
	).bind(now).run();
	const expired = await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
		SET status = 'dead', last_error_code = 'outbox_lease_expired'
		WHERE status = 'processing' AND next_attempt_at <= ?1 AND attempt_count >= 10 AND event_type <> 'delete'`
	).bind(now).run();
	const rows = (await env.FEEDBACK_DB.prepare(`SELECT id, aggregate_type, aggregate_id, event_type, payload_json, attempt_count
		FROM outbox_events
		WHERE status IN ('pending', 'processing') AND next_attempt_at <= ?1 AND attempt_count < 10
		ORDER BY created_at ASC LIMIT ?2`
	).bind(now, Math.min(Math.max(limit, 1), 100)).all<OutboxRow>()).results;
	const result = { completed: 0, retried: 0, dead: expired.meta.changes };
	for (const event of rows) {
		const claim = await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
			SET status = 'processing', attempt_count = attempt_count + 1, next_attempt_at = ?1
			WHERE id = ?2 AND status IN ('pending', 'processing') AND next_attempt_at <= ?3 AND attempt_count < 10`
		).bind(now + OUTBOX_LEASE_SECONDS, event.id, now).run();
		if (!claim.meta.changes) {continue;}
		try {
			await processEvent(env, client, event, now);
			await env.FEEDBACK_DB.prepare("UPDATE outbox_events SET status = 'completed', completed_at = ?1, last_error_code = NULL WHERE id = ?2")
				.bind(now, event.id).run();
			result.completed += 1;
		} catch (error) {
			const attempts = event.attempt_count + 1;
			const deletionMustRetry = event.event_type === 'delete';
			const dead = !deletionMustRetry && attempts >= 10;
			const storedAttempts = deletionMustRetry && attempts >= 10 ? 0 : attempts;
			const delay = Math.min(6 * 3600, 60 * (2 ** Math.min(attempts - 1, 8))) + Math.floor(Math.random() * 30);
			await env.FEEDBACK_DB.prepare(`UPDATE outbox_events
				SET status = ?1, attempt_count = ?2, next_attempt_at = ?3, last_error_code = ?4
				WHERE id = ?5`
			).bind(dead ? 'dead' : 'pending', storedAttempts, now + delay, stableError(error), event.id).run();
			if (dead) {result.dead += 1;} else {result.retried += 1;}
		}
	}
	return result;
}
