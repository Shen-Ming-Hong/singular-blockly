import { createHmac, verifyHmac } from '../domain/auth';
import { sha256Json } from '../domain/feedback';
import { apiError, isUuid, jsonResponse, rateLimitError, readRequestText, RequestTooLargeError, withSecurityHeaders } from '../domain/http';
import { authenticateReporter, authorizeMutation, clearSessionCookie } from '../domain/reporterAuth';
import { validateReporterMessage } from '../domain/schemas';
import type { Env } from '../env';
import { GitHubAppClient } from '../services/githubApp';
import { finalizeFeedbackDeletion, type FeedbackSyncClient } from '../services/outbox';

const encoder = new TextEncoder();
const LIST_LIMIT_DEFAULT = 20;
const LIST_LIMIT_MAX = 50;
const MESSAGE_LIMIT_DEFAULT = 20;
const MESSAGE_LIMIT_MAX = 50;

interface FeedbackRow {
	id: string;
	public_reference: string;
	kind: string;
	title: string;
	description: string;
	steps: string | null;
	expected: string | null;
	diagnostics_json: string;
	public_status: string;
	decision: string;
	resolution: string | null;
	public_reason: string | null;
	created_at: number;
	updated_at: number;
	has_attachment: number;
}

interface MessageRow {
	id: string;
	author_type: 'reporter' | 'maintainer';
	body: string;
	created_at: number;
}

interface AttachmentRow {
	r2_key: string;
}

interface IdempotencyRow {
	request_sha256: string;
	response_status: number;
	response_json: string;
}

interface DeleteRow {
	id: string;
	r2_key: string | null;
}

function base64Url(value: string): string {
	let binary = '';
	for (const byte of encoder.encode(value)) {binary += String.fromCharCode(byte);}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): string | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) {return null;}
	try {
		const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
		return new TextDecoder().decode(Uint8Array.from(atob(padded), character => character.charCodeAt(0)));
	} catch {return null;}
}

async function createCursor(
	row: Pick<FeedbackRow, 'created_at' | 'id'>,
	reporterId: string,
	scope: string,
	env: Env,
): Promise<string> {
	const payload = base64Url(JSON.stringify({ t: row.created_at, i: row.id, r: reporterId, s: scope }));
	return `${payload}.${await createHmac(payload, env.REPORTER_HMAC_PEPPER)}`;
}

async function parseCursor(
	value: string | null,
	reporterId: string,
	scope: string,
	env: Env,
): Promise<{ createdAt: number; id: string } | null | undefined> {
	if (value === null) {return undefined;}
	if (value.length > 256) {return null;}
	const [payload, suppliedHmac, extra] = value.split('.');
	if (!payload || !suppliedHmac || extra) {return null;}
	if (!await verifyHmac(payload, suppliedHmac, env.REPORTER_HMAC_PEPPER)) {return null;}
	const decoded = decodeBase64Url(payload);
	if (!decoded) {return null;}
	try {
		const parsed = JSON.parse(decoded) as { t?: unknown; i?: unknown; r?: unknown; s?: unknown };
		if (!Number.isInteger(parsed.t) || typeof parsed.i !== 'string' || !isUuid(parsed.i)
			|| parsed.r !== reporterId || parsed.s !== scope) {
			return null;
		}
		return { createdAt: parsed.t as number, id: parsed.i };
	} catch {return null;}
}

function timestamp(seconds: number): string {
	return new Date(seconds * 1000).toISOString();
}

function safeDiagnostics(value: string): Record<string, unknown> {
	try {
		const parsed = JSON.parse(value) as unknown;
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
	} catch {return {};}
}

function summary(row: FeedbackRow): Record<string, unknown> {
	return {
		id: row.id,
		reference: row.public_reference,
		kind: row.kind,
		title: row.title,
		status: row.public_status,
		decision: row.decision,
		resolution: row.resolution,
		publicReason: row.public_reason,
		createdAt: timestamp(row.created_at),
		updatedAt: timestamp(row.updated_at),
	};
}

function serializeMessages(messages: MessageRow[]): Array<Record<string, unknown>> {
	return messages.map(message => ({
			id: message.id,
			author: message.author_type,
			body: message.body,
			createdAt: timestamp(message.created_at),
		}));
}

function messagesResponse(messages: MessageRow[], nextCursor: string | null): Record<string, unknown> {
	return { items: serializeMessages(messages), nextCursor };
}

function detail(row: FeedbackRow, messages: MessageRow[], nextMessageCursor: string | null): Record<string, unknown> {
	return {
		...summary(row),
		description: row.description,
		steps: row.steps,
		expected: row.expected,
		diagnostics: safeDiagnostics(row.diagnostics_json),
		hasAttachment: row.has_attachment === 1,
		messages: serializeMessages(messages),
		nextMessageCursor,
	};
}

async function messagePage(
	env: Env,
	feedbackId: string,
	reporterId: string,
	cursor: { createdAt: number; id: string } | undefined,
	limit: number,
): Promise<{ messages: MessageRow[]; nextCursor: string | null }> {
	const statement = cursor
		? env.FEEDBACK_DB.prepare(`SELECT id, author_type, body, created_at FROM feedback_messages
			WHERE feedback_id = ?1 AND visibility = 'public'
			AND (created_at > ?2 OR (created_at = ?2 AND id > ?3))
			ORDER BY created_at ASC, id ASC LIMIT ?4`
		).bind(feedbackId, cursor.createdAt, cursor.id, limit + 1)
		: env.FEEDBACK_DB.prepare(`SELECT id, author_type, body, created_at FROM feedback_messages
			WHERE feedback_id = ?1 AND visibility = 'public'
			ORDER BY created_at ASC, id ASC LIMIT ?2`
		).bind(feedbackId, limit + 1);
	const rows = (await statement.all<MessageRow>()).results;
	const messages = rows.slice(0, limit);
	return {
		messages,
		nextCursor: rows.length > limit
			? await createCursor(messages[messages.length - 1], reporterId, `messages:${feedbackId}`, env)
			: null,
	};
}

async function ownedFeedback(env: Env, reporterId: string, feedbackId: string): Promise<FeedbackRow | null> {
	return env.FEEDBACK_DB.prepare(`
		SELECT f.*, EXISTS(SELECT 1 FROM attachments a WHERE a.feedback_id = f.id) AS has_attachment
		FROM feedback f
		WHERE f.id = ?1 AND f.reporter_id = ?2 AND f.delete_state = 'active'
		LIMIT 1
	`).bind(feedbackId, reporterId).first<FeedbackRow>();
}

async function allowReporterRequest(env: Env, key: string): Promise<boolean> {
	return (await env.REPORTER_RATE_LIMITER.limit({ key })).success;
}

async function allowReporterSourceRequest(request: Request, env: Env): Promise<boolean> {
	const source = request.headers.get('cf-connecting-ip')?.trim() || 'missing-cloudflare-source';
	const key = await createHmac(`reporter-api:${source}`, env.IP_HMAC_PEPPER);
	return (await env.SOURCE_RATE_LIMITER.limit({ key })).success;
}

async function readJson(request: Request, maxBytes = 32 * 1024): Promise<unknown> {
	const raw = await readRequestText(request, maxBytes);
	return JSON.parse(raw) as unknown;
}

async function getReplay(env: Env, reporterId: string, route: string, key: string): Promise<IdempotencyRow | null> {
	return env.FEEDBACK_DB.prepare(`
		SELECT request_sha256, response_status, response_json
		FROM idempotency_records
		WHERE reporter_id = ?1 AND route = ?2 AND key = ?3 AND expires_at > ?4
		LIMIT 1
	`).bind(reporterId, route, key, Math.floor(Date.now() / 1000)).first<IdempotencyRow>();
}

function replayResponse(row: IdempotencyRow): Response {
	return row.response_status === 204
		? new Response(null, { status: 204, headers: withSecurityHeaders() })
		: jsonResponse(JSON.parse(row.response_json), row.response_status);
}

export async function listReporterFeedback(request: Request, env: Env): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	const url = new URL(request.url);
	const limitValue = url.searchParams.get('limit');
	const limit = limitValue === null ? LIST_LIMIT_DEFAULT : Number(limitValue);
	if (!Number.isInteger(limit) || limit < 1 || limit > LIST_LIMIT_MAX) {
		return apiError(400, 'invalid_limit', 'The feedback list limit is invalid', 'limit');
	}
	const cursor = await parseCursor(url.searchParams.get('cursor'), principal.reporterId, 'feedback-list', env);
	if (cursor === null) {return apiError(400, 'invalid_cursor', 'The feedback cursor is invalid', 'cursor');}
	const statement = cursor
		? env.FEEDBACK_DB.prepare(`
			SELECT f.*, EXISTS(SELECT 1 FROM attachments a WHERE a.feedback_id = f.id) AS has_attachment
			FROM feedback f
			WHERE f.reporter_id = ?1 AND f.delete_state = 'active'
			AND (f.created_at < ?2 OR (f.created_at = ?2 AND f.id < ?3))
			ORDER BY f.created_at DESC, f.id DESC LIMIT ?4
		`).bind(principal.reporterId, cursor.createdAt, cursor.id, limit + 1)
		: env.FEEDBACK_DB.prepare(`
			SELECT f.*, EXISTS(SELECT 1 FROM attachments a WHERE a.feedback_id = f.id) AS has_attachment
			FROM feedback f
			WHERE f.reporter_id = ?1 AND f.delete_state = 'active'
			ORDER BY f.created_at DESC, f.id DESC LIMIT ?2
		`).bind(principal.reporterId, limit + 1);
	const rows = (await statement.all<FeedbackRow>()).results;
	const hasNext = rows.length > limit;
	const visible = rows.slice(0, limit);
	return jsonResponse({
		items: visible.map(summary),
		nextCursor: hasNext ? await createCursor(visible[visible.length - 1], principal.reporterId, 'feedback-list', env) : null,
	});
}

export async function getReporterFeedback(request: Request, env: Env, feedbackId: string): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	const row = await ownedFeedback(env, principal.reporterId, feedbackId);
	if (!row) {return apiError(404, 'feedback_not_found', 'Feedback was not found');}
	const page = await messagePage(env, feedbackId, principal.reporterId, undefined, MESSAGE_LIMIT_DEFAULT);
	return jsonResponse(detail(row, page.messages, page.nextCursor));
}

export async function listReporterMessages(request: Request, env: Env, feedbackId: string): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	if (!await ownedFeedback(env, principal.reporterId, feedbackId)) {
		return apiError(404, 'feedback_not_found', 'Feedback was not found');
	}
	const url = new URL(request.url);
	const limitValue = url.searchParams.get('limit');
	const limit = limitValue === null ? MESSAGE_LIMIT_DEFAULT : Number(limitValue);
	if (!Number.isInteger(limit) || limit < 1 || limit > MESSAGE_LIMIT_MAX) {
		return apiError(400, 'invalid_limit', 'The feedback message limit is invalid', 'limit');
	}
	const cursor = await parseCursor(
		url.searchParams.get('cursor'),
		principal.reporterId,
		`messages:${feedbackId}`,
		env,
	);
	if (cursor === null) {return apiError(400, 'invalid_cursor', 'The feedback message cursor is invalid', 'cursor');}
	const page = await messagePage(env, feedbackId, principal.reporterId, cursor, limit);
	return jsonResponse(messagesResponse(page.messages, page.nextCursor));
}

export async function addReporterMessage(
	request: Request,
	env: Env,
	feedbackId: string,
): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	if (!await authorizeMutation(request, principal, env)) {
		return apiError(403, 'csrf_denied', 'The request origin or CSRF token was rejected');
	}
	const key = request.headers.get('idempotency-key');
	if (!isUuid(key)) {return apiError(400, 'invalid_idempotency_key', 'A UUID idempotency key is required');}
	let input: unknown;
	try {input = await readJson(request);} catch (error) {
		return apiError(error instanceof RequestTooLargeError ? 413 : 400, 'invalid_message', 'The message is invalid');
	}
	const validation = validateReporterMessage(input);
	if (!validation.ok) {return apiError(400, validation.error.code, 'The message is invalid', validation.error.field);}
	const requestHash = await sha256Json(validation.value);
	const route = `message:${feedbackId}`;
	const replay = await getReplay(env, principal.reporterId, route, key);
	if (replay) {
		if (replay.request_sha256 !== requestHash) {return apiError(409, 'idempotency_conflict', 'The key was used for different content');}
		return replayResponse(replay);
	}
	if (!await ownedFeedback(env, principal.reporterId, feedbackId)) {
		return apiError(404, 'feedback_not_found', 'Feedback was not found');
	}
	const id = crypto.randomUUID();
	const outboxId = crypto.randomUUID();
	const now = Math.floor(Date.now() / 1000);
	const body = { id, author: 'reporter', body: validation.value.body, createdAt: timestamp(now) };
	const responseJson = JSON.stringify(body);
	try {
		const [messageInsert] = await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`INSERT INTO feedback_messages
				(id, feedback_id, author_type, visibility, body, created_at)
				SELECT ?1, ?2, 'reporter', 'public', ?3, ?4
				WHERE EXISTS (SELECT 1 FROM feedback
					WHERE id = ?2 AND reporter_id = ?5 AND delete_state = 'active')`
			).bind(id, feedbackId, validation.value.body, now, principal.reporterId),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				SELECT ?1, 'message', ?2, 'public-message', ?3, 'pending', 0, ?4, ?4
				WHERE EXISTS (SELECT 1 FROM feedback_messages WHERE id = ?2 AND feedback_id = ?5)`
			).bind(outboxId, id, JSON.stringify({ feedbackId, messageId: id, body: validation.value.body }), now, feedbackId),
			env.FEEDBACK_DB.prepare(`INSERT INTO idempotency_records
				(reporter_id, route, key, request_sha256, response_status, response_json, created_at, expires_at)
				SELECT ?1, ?2, ?3, ?4, 201, ?5, ?6, ?7
				WHERE EXISTS (SELECT 1 FROM feedback_messages WHERE id = ?8 AND feedback_id = ?9)`
			).bind(principal.reporterId, route, key, requestHash, responseJson, now, now + 7 * 86400, id, feedbackId),
			env.FEEDBACK_DB.prepare(`UPDATE feedback SET updated_at = ?1
				WHERE id = ?2 AND reporter_id = ?3 AND delete_state = 'active'`
			).bind(now, feedbackId, principal.reporterId),
		]);
		if (!messageInsert.meta.changes) {
			return apiError(404, 'feedback_not_found', 'Feedback was not found');
		}
	} catch {
		const concurrent = await getReplay(env, principal.reporterId, route, key);
		if (concurrent?.request_sha256 === requestHash) {return replayResponse(concurrent);}
		return apiError(503, 'feedback_unavailable', 'The message could not be saved');
	}
	return jsonResponse(body, 201);
}

async function deleteOne(
	env: Env,
	client: FeedbackSyncClient,
	reporterId: string,
	feedbackId: string,
	idempotencyKey: string,
	persistIdempotency = true,
): Promise<Response> {
	const route = `delete:${feedbackId}`;
	const requestHash = await sha256Json({ feedbackId });
	const replay = persistIdempotency ? await getReplay(env, reporterId, route, idempotencyKey) : null;
	if (replay) {
		if (replay.request_sha256 !== requestHash) {return apiError(409, 'idempotency_conflict', 'The key was reused');}
		if (replay.response_status !== 202) {return replayResponse(replay);}
	}
	const row = await env.FEEDBACK_DB.prepare(`
		SELECT f.id, a.r2_key
		FROM feedback f
		LEFT JOIN attachments a ON a.feedback_id = f.id
		WHERE f.id = ?1 AND f.reporter_id = ?2 AND f.delete_state IN ('active', 'delete-pending')
		LIMIT 1
	`).bind(feedbackId, reporterId).first<DeleteRow>();
	if (!row) {return apiError(404, 'feedback_not_found', 'Feedback was not found');}
	const deletedResponse = JSON.stringify({ error: { code: 'feedback_deleted', message: 'The feedback was deleted' } });
	const now = Math.floor(Date.now() / 1000);
	if (!replay) {
		try {
			await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE outbox_events SET status = 'completed', completed_at = ?2, last_error_code = NULL
				WHERE aggregate_type = 'feedback' AND aggregate_id = ?1 AND event_type = 'create' AND status = 'pending'`
			).bind(feedbackId, now),
				env.FEEDBACK_DB.prepare(`DELETE FROM outbox_events WHERE
					((aggregate_type = 'feedback' AND aggregate_id = ?1
						AND event_type NOT IN ('create', 'create-public-issue', 'delete'))
					OR (aggregate_type = 'message' AND aggregate_id IN (SELECT id FROM feedback_messages WHERE feedback_id = ?1)))
				AND status <> 'processing'`
			).bind(feedbackId),
			env.FEEDBACK_DB.prepare(`UPDATE idempotency_records SET response_status = 410, response_json = ?1 WHERE reporter_id = ?2 AND (
				(route = 'create-feedback' AND json_extract(response_json, '$.id') = ?3)
				OR route = ?4)`
			).bind(deletedResponse, reporterId, feedbackId, `message:${feedbackId}`),
			...(persistIdempotency ? [env.FEEDBACK_DB.prepare(`INSERT INTO idempotency_records
					(reporter_id, route, key, request_sha256, response_status, response_json, created_at, expires_at)
					VALUES (?1, ?2, ?3, ?4, 202, '{}', ?5, ?6)`
				).bind(reporterId, route, idempotencyKey, requestHash, now, now + 7 * 86400)] : []),
			env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
				(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
				SELECT ?1, 'feedback', ?2, 'delete', ?3, 'pending', 0, ?4, ?4
				WHERE NOT EXISTS (SELECT 1 FROM outbox_events
					WHERE aggregate_type = 'feedback' AND aggregate_id = ?2 AND event_type = 'delete')`
			).bind(crypto.randomUUID(), feedbackId, JSON.stringify({
				feedbackId,
				r2Key: row.r2_key,
				reporterId,
				route,
				idempotencyKey,
				requestHash,
			}), now),
			env.FEEDBACK_DB.prepare(`UPDATE feedback SET delete_state = 'delete-pending', updated_at = ?1
				WHERE id = ?2 AND reporter_id = ?3 AND delete_state = 'active'`
			).bind(now, feedbackId, reporterId),
			]);
		} catch {
			const concurrent = persistIdempotency ? await getReplay(env, reporterId, route, idempotencyKey) : null;
			if (!concurrent || concurrent.request_sha256 !== requestHash) {
				return apiError(503, 'feedback_unavailable', 'The feedback could not be deleted');
			}
			if (concurrent.response_status !== 202) {return replayResponse(concurrent);}
		}
	}
	try {
		await finalizeFeedbackDeletion(env, client, feedbackId, row.r2_key, persistIdempotency ? {
			reporterId,
			route,
			key: idempotencyKey,
			requestHash,
		} : undefined, now);
	} catch {
		return apiError(503, 'feedback_delete_pending', 'The feedback deletion is still pending');
	}
	return new Response(null, { status: 204, headers: withSecurityHeaders() });
}

export async function deleteReporterFeedback(
	request: Request,
	env: Env,
	feedbackId: string,
	client: FeedbackSyncClient = new GitHubAppClient(env),
): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	if (!await authorizeMutation(request, principal, env)) {return apiError(403, 'csrf_denied', 'The request was rejected');}
	const key = request.headers.get('idempotency-key');
	if (!isUuid(key)) {return apiError(400, 'invalid_idempotency_key', 'A UUID idempotency key is required');}
	return deleteOne(env, client, principal.reporterId, feedbackId, key);
}

export async function deleteReporterAccount(
	request: Request,
	env: Env,
	client: FeedbackSyncClient = new GitHubAppClient(env),
): Promise<Response> {
	if (!await allowReporterSourceRequest(request, env)) {return rateLimitError();}
	const principal = await authenticateReporter(request, env, true);
	if (!principal) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	if (!await allowReporterRequest(env, principal.secretHmac)) {return rateLimitError();}
	if (!await authorizeMutation(request, principal, env)) {return apiError(403, 'csrf_denied', 'The request was rejected');}
	const key = request.headers.get('idempotency-key');
	if (!isUuid(key)) {return apiError(400, 'invalid_idempotency_key', 'A UUID idempotency key is required');}
	const route = 'delete-reporter';
	const requestHash = await sha256Json({ reporterId: principal.reporterId });
	const replay = await getReplay(env, principal.reporterId, route, key);
	if (replay) {
		if (replay.request_sha256 !== requestHash) {return apiError(409, 'idempotency_conflict', 'The key was reused');}
		if (replay.response_status === 204) {
			return new Response(null, { status: 204, headers: withSecurityHeaders({ 'Set-Cookie': clearSessionCookie() }) });
		}
	}
	if (principal.revoked && !replay) {return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');}
	const startedAt = Math.floor(Date.now() / 1000);
	if (!replay) {
		try {
			await env.FEEDBACK_DB.batch([
				env.FEEDBACK_DB.prepare(`INSERT INTO idempotency_records
					(reporter_id, route, key, request_sha256, response_status, response_json, created_at, expires_at)
					VALUES (?1, ?2, ?3, ?4, 202, '{}', ?5, ?6)`
				).bind(principal.reporterId, route, key, requestHash, startedAt, startedAt + 7 * 86400),
				env.FEEDBACK_DB.prepare('UPDATE reporters SET revoked_at = ?1 WHERE id = ?2 AND revoked_at IS NULL')
					.bind(startedAt, principal.reporterId),
				env.FEEDBACK_DB.prepare('UPDATE sessions SET revoked_at = ?1 WHERE reporter_id = ?2 AND revoked_at IS NULL')
					.bind(startedAt, principal.reporterId),
				env.FEEDBACK_DB.prepare(`UPDATE idempotency_records
					SET response_status = 410,
						response_json = '{"error":{"code":"reporter_deleted","message":"The reporter was deleted"}}'
					WHERE reporter_id = ?1 AND route <> 'delete-reporter'`)
					.bind(principal.reporterId),
					env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
					(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
					SELECT 'delete-' || lower(hex(randomblob(16))), 'feedback', f.id, 'delete',
						json_object('feedbackId', f.id, 'r2Key', a.r2_key),
						'pending', 0, ?1, ?1
					FROM feedback f LEFT JOIN attachments a ON a.feedback_id = f.id
					WHERE f.reporter_id = ?2 AND f.delete_state IN ('active', 'delete-pending')
						AND NOT EXISTS (SELECT 1 FROM outbox_events e
							WHERE e.aggregate_type = 'feedback' AND e.aggregate_id = f.id AND e.event_type = 'delete')`
				).bind(startedAt, principal.reporterId),
				env.FEEDBACK_DB.prepare(`UPDATE feedback SET delete_state = 'delete-pending', updated_at = ?1
					WHERE reporter_id = ?2 AND delete_state = 'active'`
				).bind(startedAt, principal.reporterId),
			]);
		} catch {
			const concurrent = await getReplay(env, principal.reporterId, route, key);
			if (!concurrent || concurrent.request_sha256 !== requestHash) {
				return apiError(503, 'feedback_unavailable', 'The reporter deletion could not be started');
			}
			if (concurrent.response_status === 204) {
				return new Response(null, { status: 204, headers: withSecurityHeaders({ 'Set-Cookie': clearSessionCookie() }) });
			}
		}
	}
	const feedbackIds = (await env.FEEDBACK_DB.prepare(
		"SELECT id FROM feedback WHERE reporter_id = ?1 AND delete_state IN ('active', 'delete-pending') ORDER BY id"
	).bind(principal.reporterId).all<{ id: string }>()).results;
	for (const item of feedbackIds) {
		const response = await deleteOne(env, client, principal.reporterId, item.id, crypto.randomUUID(), false);
		if (response.status !== 204 && response.status !== 404) {return response;}
	}
	const now = Math.floor(Date.now() / 1000);
	try {await env.FEEDBACK_DB.batch([
		env.FEEDBACK_DB.prepare(`UPDATE idempotency_records
			SET response_status = 410, response_json = '{"error":{"code":"reporter_deleted","message":"The reporter was deleted"}}'
			WHERE reporter_id = ?1 AND route <> 'delete-reporter'`)
			.bind(principal.reporterId),
		env.FEEDBACK_DB.prepare(`INSERT INTO idempotency_records
			(reporter_id, route, key, request_sha256, response_status, response_json, created_at, expires_at)
			VALUES (?1, ?2, ?3, ?4, 204, '{}', ?5, ?6)
			ON CONFLICT(reporter_id, route, key) DO UPDATE SET
				response_status = 204, response_json = '{}', expires_at = excluded.expires_at`
		).bind(principal.reporterId, route, key, requestHash, now, now + 7 * 86400),
		env.FEEDBACK_DB.prepare('UPDATE reporters SET revoked_at = ?1 WHERE id = ?2').bind(now, principal.reporterId),
		env.FEEDBACK_DB.prepare('UPDATE sessions SET revoked_at = ?1 WHERE reporter_id = ?2 AND revoked_at IS NULL').bind(now, principal.reporterId),
	]);} catch {
		const concurrent = await getReplay(env, principal.reporterId, route, key);
		if (!concurrent || concurrent.request_sha256 !== requestHash) {
			return apiError(503, 'feedback_unavailable', 'The reporter data could not be deleted');
		}
	}
	return new Response(null, {
		status: 204,
		headers: withSecurityHeaders({ 'Set-Cookie': clearSessionCookie() }),
	});
}
