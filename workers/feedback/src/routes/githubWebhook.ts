import { parseGitHubCommand, type GitHubCommand } from '../domain/githubCommands';
import { createHmac } from '../domain/auth';
import { apiError, isUuid, jsonResponse, readRequestText, RequestTooLargeError } from '../domain/http';
import { canTransitionPublicStatus, type PublicStatus } from '../domain/stateMachine';
import type { Env } from '../env';
import { GitHubAppClient, type GitHubIssueComment } from '../services/githubApp';

const encoder = new TextEncoder();

interface WebhookPayload {
	action?: unknown;
	repository?: { id?: unknown };
	sender?: { id?: unknown };
	issue?: { number?: unknown };
	comment?: { id?: unknown; body?: unknown };
}

interface MappingRow {
	feedback_id: string;
	public_status: PublicStatus;
	issue_number: number;
}

interface PrivateCommandClient {
	listPrivateIssueComments(issueNumber: number): Promise<GitHubIssueComment[]>;
	acknowledgePrivateCommand(issueNumber: number, commentId: number, resultCode: string): Promise<void>;
}

interface DeliveryRow {
	command_result_code: string | null;
	command_acknowledged_at: number | null;
}

interface DeletedIssueTombstone {
	public_reference_hash: string;
	private_issue_number: number;
}

interface DeletingIssueMapping {
	public_reference: string;
	issue_number: number;
}

function actorAllowlist(value: string): Set<string> {
	return new Set(value.split(',').map(item => item.trim()).filter(item => /^[1-9][0-9]{0,19}$/.test(item)));
}

function numberString(value: unknown): string | null {
	return (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) || (typeof value === 'string' && /^[1-9][0-9]{0,19}$/.test(value))
		? String(value)
		: null;
}

function hexBytes(value: string): Uint8Array | null {
	if (!/^[0-9a-f]{64}$/.test(value)) {return null;}
	return Uint8Array.from(value.match(/.{2}/g) ?? [], part => Number.parseInt(part, 16));
}

export async function verifyGitHubWebhookSignature(body: string, header: string | null, secret: string): Promise<boolean> {
	if (!header?.startsWith('sha256=') || encoder.encode(secret).byteLength < 32) {return false;}
	const signature = hexBytes(header.slice(7));
	if (!signature) {return false;}
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
	return crypto.subtle.verify('HMAC', key, Uint8Array.from(signature).buffer, encoder.encode(body));
}

async function deliveryStatement(
	env: Env,
	deliveryId: string,
	event: string,
	repositoryId: string,
	body: string,
	statusTransition?: { feedbackId: string; commentId: number },
	commandResultCode: string | null = null,
): Promise<D1PreparedStatement> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(body));
	let binary = '';
	for (const byte of new Uint8Array(digest)) {binary += String.fromCharCode(byte);}
	const sha256 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	const processedAt = Math.floor(Date.now() / 1000);
	if (statusTransition) {
		return env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO webhook_deliveries
			(delivery_id, event_name, repository_id, payload_sha256, processed_at, command_result_code)
			SELECT ?1, ?2, ?3, ?4, ?5, ?6
			WHERE EXISTS (SELECT 1 FROM feedback WHERE id = ?7 AND last_status_command_id = ?8)`
		).bind(deliveryId, event, repositoryId, sha256, processedAt, commandResultCode,
			statusTransition.feedbackId, statusTransition.commentId);
	}
	return env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO webhook_deliveries
		(delivery_id, event_name, repository_id, payload_sha256, processed_at, command_result_code)
		VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
	).bind(deliveryId, event, repositoryId, sha256, processedAt, commandResultCode);
}

async function recordDelivery(env: Env, deliveryId: string, event: string, repositoryId: string, body: string): Promise<void> {
	await (await deliveryStatement(env, deliveryId, event, repositoryId, body)).run();
}

async function recordWebhookRejection(env: Env): Promise<void> {
	const now = Math.floor(Date.now() / 1000);
	try {
		await env.FEEDBACK_DB.prepare(`INSERT INTO audit_events
			(id, event_code, target_hash, outcome, created_at, expires_at)
			VALUES (?1, 'webhook_rejected', NULL, 'denied', ?2, ?3)`
		).bind(crypto.randomUUID(), now, now + 90 * 86400).run();
	} catch {
		// The verified rejection remains authoritative even if audit storage is unavailable.
	}
}

async function queueDeletedIssueScrub(
	env: Env,
	deliveryId: string,
	event: string,
	repositoryId: string,
	body: string,
	issueNumber: number,
): Promise<boolean> {
	const tombstone = await env.FEEDBACK_DB.prepare(`SELECT public_reference_hash, private_issue_number
		FROM feedback_tombstones
		WHERE private_issue_number = ?1 LIMIT 1`
	).bind(issueNumber).first<DeletedIssueTombstone>();
	const deleting = tombstone ? null : await env.FEEDBACK_DB.prepare(`SELECT f.public_reference, gm.issue_number
		FROM github_mappings gm JOIN feedback f ON f.id = gm.feedback_id
		WHERE gm.repository_id = ?1 AND gm.issue_number = ?2 AND f.delete_state = 'delete-pending' LIMIT 1`
	).bind(repositoryId, issueNumber).first<DeletingIssueMapping>();
	if (!tombstone && !deleting) {return false;}
	const referenceHash = tombstone?.public_reference_hash
		?? await createHmac(deleting!.public_reference, env.REPORTER_HMAC_PEPPER);
	const privateIssueNumber = tombstone?.private_issue_number ?? deleting!.issue_number;
	const now = Math.floor(Date.now() / 1000);
	await env.FEEDBACK_DB.batch([
		env.FEEDBACK_DB.prepare(`INSERT INTO feedback_tombstones
			(public_reference_hash, private_issue_number, delete_state, deleted_at)
			VALUES (?1, ?2, 'pending', ?3)
			ON CONFLICT(public_reference_hash) DO UPDATE SET
				private_issue_number = excluded.private_issue_number, delete_state = 'pending'`
		).bind(referenceHash, privateIssueNumber, now),
		env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO outbox_events
			(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
			VALUES (?1, 'tombstone', ?2, 'delete', ?3, 'pending', 0, ?4, ?4)`
		).bind(deliveryId, referenceHash, JSON.stringify({
			referenceHash,
			privateIssueNumber,
		}), now),
		await deliveryStatement(env, deliveryId, event, repositoryId, body),
	]);
	return true;
}

function publicMessageStatements(
	env: Env,
	feedbackId: string,
	body: string,
	commentId: number,
	now: number,
	requiredStatusCommandId?: number,
): D1PreparedStatement[] {
	const id = crypto.randomUUID();
	if (requiredStatusCommandId !== undefined) {
		return [
			env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO feedback_messages
				(id, feedback_id, author_type, visibility, body, github_comment_id, created_at)
				SELECT ?1, ?2, 'maintainer', 'public', ?3, ?4, ?5
				WHERE EXISTS (SELECT 1 FROM feedback WHERE id = ?2 AND last_status_command_id = ?6)`
			).bind(id, feedbackId, body, commentId, now, requiredStatusCommandId),
			env.FEEDBACK_DB.prepare(`UPDATE feedback SET updated_at = ?1
				WHERE id = ?2 AND last_status_command_id = ?3`
			).bind(now, feedbackId, requiredStatusCommandId),
		];
	}
	return [
		env.FEEDBACK_DB.prepare(`INSERT OR IGNORE INTO feedback_messages
			(id, feedback_id, author_type, visibility, body, github_comment_id, created_at)
			VALUES (?1, ?2, 'maintainer', 'public', ?3, ?4, ?5)`
		).bind(id, feedbackId, body, commentId, now),
		env.FEEDBACK_DB.prepare('UPDATE feedback SET updated_at = ?1 WHERE id = ?2').bind(now, feedbackId),
	];
}

interface PublicSummarySource {
	public_reference: string;
	title: string;
	description: string;
	steps: string | null;
	expected: string | null;
	diagnostics_json: string;
	privateTexts: readonly string[];
}

const PUBLIC_SUMMARY_FORBIDDEN = [
	/\bSB-[A-Z2-9]{6,10}\b/i,
	/https?:\/\//i,
	/#\d+\b/,
	/\b(?:private issue|feedback reference|diagnostics?|attachments?|workspace)\b/i,
	/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
	/\b(?:\d{1,3}\.){3}\d{1,3}\b/,
	/\b(?:v)?\d+\.\d+(?:\.\d+){0,2}\b/i,
	/(?:^|[^\p{L}\p{N}_])(?:\/[\p{L}\p{N}._-]+){2,}(?=$|[^\p{L}\p{N}._-])/u,
	/\b[A-Za-z]:\\[^\s]+/,
	/\\\\[^\s]+\\[^\s]+/,
	/(?:^|[^\p{L}\p{N}_])@[A-Za-z0-9-]{1,39}\b/u,
	/\b(?:gh[pousr]_|github_pat_|sk-)[A-Za-z0-9_-]{12,}\b/i,
	/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/i,
];

function normalizedWords(value: string): string[] {
	return value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

const CJK_CHARACTER = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const CJK_EXCERPT_LENGTH = 6;

function containsCjkExcerpt(summary: string, source: string): boolean {
	const summaryCharacters = [...normalizedWords(summary).join('')];
	const sourceCharacters = [...normalizedWords(source).join('')];
	if (summaryCharacters.length < CJK_EXCERPT_LENGTH || sourceCharacters.length < CJK_EXCERPT_LENGTH
		|| !sourceCharacters.some(character => CJK_CHARACTER.test(character))) {
		return false;
	}
	const summaryFragments = new Set<string>();
	for (let index = 0; index <= summaryCharacters.length - CJK_EXCERPT_LENGTH; index += 1) {
		const fragment = summaryCharacters.slice(index, index + CJK_EXCERPT_LENGTH).join('');
		if (CJK_CHARACTER.test(fragment)) {summaryFragments.add(fragment);}
	}
	for (let index = 0; index <= sourceCharacters.length - CJK_EXCERPT_LENGTH; index += 1) {
		const fragment = sourceCharacters.slice(index, index + CJK_EXCERPT_LENGTH).join('');
		if (CJK_CHARACTER.test(fragment) && summaryFragments.has(fragment)) {return true;}
	}
	return false;
}

function containsPrivateExcerpt(summary: string, source: PublicSummarySource): boolean {
	const normalizedSummary = normalizedWords(summary).join(' ');
	const values = [source.public_reference, source.title, source.description, source.steps, source.expected, ...source.privateTexts]
		.filter((value): value is string => typeof value === 'string');
	const diagnosticValues: string[] = [];
	try {
		const diagnostics = JSON.parse(source.diagnostics_json) as Record<string, unknown>;
		const visit = (value: unknown): void => {
			if (typeof value === 'string' || typeof value === 'number') {diagnosticValues.push(String(value)); return;}
			if (Array.isArray(value)) {value.forEach(visit); return;}
			if (value && typeof value === 'object') {Object.values(value).forEach(visit);}
		};
		visit(diagnostics);
	} catch {return true;}

	const copiesPrivateText = values.some(value => {
		if (containsCjkExcerpt(summary, value)) {return true;}
		const words = normalizedWords(value);
		if (words.length === 0) {return false;}
		if (words.length < 5) {
			const exact = words.join(' ');
			return exact.length >= 8 && normalizedSummary.includes(exact);
		}
		for (let index = 0; index <= words.length - 5; index += 1) {
			if (normalizedSummary.includes(words.slice(index, index + 5).join(' '))) {return true;}
		}
		return false;
	});
	return copiesPrivateText || diagnosticValues.some(value => {
		const exact = normalizedWords(value).join(' ');
		return exact.length >= 3 && ` ${normalizedSummary} `.includes(` ${exact} `);
	});
}

export function publicSummaryIsSafe(value: string, source: PublicSummarySource): boolean {
	return !PUBLIC_SUMMARY_FORBIDDEN.some(pattern => pattern.test(value))
		&& !containsPrivateExcerpt(value, source);
}

function containsPrivateIssueNumber(value: string, issueNumber: number): boolean {
	return new RegExp(`(?:^|[^0-9])${issueNumber}(?:$|[^0-9])`).test(value);
}

async function applyCommand(
	env: Env,
	mapping: MappingRow,
	command: GitHubCommand,
	commentId: number,
	actorId: string,
	delivery: D1PreparedStatement,
	client: PrivateCommandClient,
): Promise<string | null> {
	const now = Math.floor(Date.now() / 1000);
	if (command.type === 'public-reply') {
		await env.FEEDBACK_DB.batch([
			...publicMessageStatements(env, mapping.feedback_id, command.text, commentId, now),
			delivery,
		]);
		return null;
	}
	if (command.type === 'status') {
		if (!canTransitionPublicStatus(mapping.public_status, command.status)) {return 'invalid_status_transition';}
		const results = await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE feedback
				SET public_status = ?1, updated_at = ?2, last_status_command_id = ?3
				WHERE id = ?4 AND public_status = ?5`
			).bind(command.status, now, commentId, mapping.feedback_id, mapping.public_status),
			...(command.text ? publicMessageStatements(env, mapping.feedback_id, command.text, commentId, now, commentId) : []),
			delivery,
		]);
		return results[0].meta.changes ? null : 'invalid_status_transition';
	}
	if (command.type === 'decision-actionable') {
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE feedback
				SET decision = 'actionable', resolution = NULL, public_reason = NULL, updated_at = ?1 WHERE id = ?2`
			).bind(now, mapping.feedback_id),
			delivery,
		]);
		return null;
	}
	if (command.type === 'decision-not-actionable') {
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE feedback
				SET decision = 'not-actionable', resolution = ?1, public_reason = ?2, updated_at = ?3 WHERE id = ?4`
			).bind(command.resolution, command.publicReason, now, mapping.feedback_id),
			...publicMessageStatements(env, mapping.feedback_id, command.publicReason, commentId, now),
			delivery,
		]);
		return null;
	}
	if (command.type === 'reopen') {
		if (mapping.public_status !== 'resolved') {return 'invalid_status_transition';}
		const results = await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare(`UPDATE feedback
				SET public_status = 'in-progress', updated_at = ?1, last_status_command_id = ?2
				WHERE id = ?3 AND public_status = 'resolved'`
			).bind(now, commentId, mapping.feedback_id),
			...publicMessageStatements(env, mapping.feedback_id, command.text, commentId, now, commentId),
			delivery,
		]);
		return results[0].meta.changes ? null : 'invalid_status_transition';
	}
	if (!actorAllowlist(env.OWNER_ACTOR_IDS).has(actorId)) {return 'owner_approval_required';}
	const sourceRow = await env.FEEDBACK_DB.prepare(`SELECT public_reference, title, description, steps, expected, diagnostics_json
		FROM feedback WHERE id = ?1 AND delete_state = 'active' LIMIT 1`
	).bind(mapping.feedback_id).first<Omit<PublicSummarySource, 'privateTexts'>>();
	const storedPrivateTexts = sourceRow
		? (await env.FEEDBACK_DB.prepare(`SELECT body FROM feedback_messages
			WHERE feedback_id = ?1 AND visibility = 'public'`
		).bind(mapping.feedback_id).all<{ body: string }>()).results.map(message => message.body)
		: [];
	const privateIssueComments = sourceRow
		? (await client.listPrivateIssueComments(mapping.issue_number))
			.filter(comment => comment.id !== commentId)
			.map(comment => comment.body)
		: [];
	const privateTexts = [...storedPrivateTexts, ...privateIssueComments];
	const source = sourceRow ? { ...sourceRow, privateTexts } : null;
	if (!source
		|| containsPrivateIssueNumber(command.summary, mapping.issue_number)
		|| !publicSummaryIsSafe(command.summary, source)) {
		return 'public_summary_not_anonymized';
	}
	const existing = await env.FEEDBACK_DB.prepare('SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1 LIMIT 1')
		.bind(mapping.feedback_id).first();
	if (existing) {await delivery.run(); return null;}
	await env.FEEDBACK_DB.batch([
		env.FEEDBACK_DB.prepare(`INSERT INTO development_approvals
			(approval_id, feedback_id, proposed_summary, approved_by, approved_at)
			VALUES (?1, ?1, ?2, ?3, ?4)`
		).bind(mapping.feedback_id, command.summary, actorId, now),
		env.FEEDBACK_DB.prepare(`INSERT INTO outbox_events
			(id, aggregate_type, aggregate_id, event_type, payload_json, status, attempt_count, next_attempt_at, created_at)
			VALUES (?1, 'feedback', ?2, 'create-public-issue', ?3, 'pending', 0, ?4, ?4)`
		).bind(crypto.randomUUID(), mapping.feedback_id, JSON.stringify({ feedbackId: mapping.feedback_id, summary: command.summary }), now),
		delivery,
	]);
	return null;
}

export async function processGitHubWebhook(
	request: Request,
	env: Env,
	client: PrivateCommandClient = new GitHubAppClient(env),
): Promise<Response> {
	const delivery = request.headers.get('x-github-delivery');
	const event = request.headers.get('x-github-event');
	if (!isUuid(delivery) || !event || !['issues', 'issue_comment', 'ping'].includes(event)) {
		return apiError(400, 'invalid_webhook_headers', 'The webhook headers are invalid');
	}
	let raw: string;
	try {raw = await readRequestText(request, 1024 * 1024);}
	catch (error) {
		return error instanceof RequestTooLargeError
			? apiError(413, 'request_too_large', 'The webhook is too large')
			: apiError(400, 'invalid_webhook_payload', 'The webhook payload is invalid');
	}
	if (!await verifyGitHubWebhookSignature(raw, request.headers.get('x-hub-signature-256'), env.GITHUB_WEBHOOK_SECRET)) {
		await recordWebhookRejection(env);
		return apiError(401, 'invalid_webhook_signature', 'The webhook signature is invalid');
	}
	let payload: WebhookPayload;
	try {payload = JSON.parse(raw) as WebhookPayload;} catch {return apiError(400, 'invalid_webhook_payload', 'The webhook payload is invalid');}
	const repositoryId = numberString(payload.repository?.id);
	if (!repositoryId || (repositoryId !== env.PRIVATE_GITHUB_REPOSITORY_ID && repositoryId !== env.PUBLIC_GITHUB_REPOSITORY_ID)) {
		return apiError(403, 'repository_denied', 'The webhook repository is not allowed');
	}
	const existingDelivery = await env.FEEDBACK_DB.prepare(`SELECT command_result_code, command_acknowledged_at
		FROM webhook_deliveries WHERE delivery_id = ?1 LIMIT 1`
	).bind(delivery).first<DeliveryRow>();
	if (existingDelivery) {
		if (existingDelivery.command_result_code && existingDelivery.command_acknowledged_at === null) {
			const issueNumber = typeof payload.issue?.number === 'number' && Number.isSafeInteger(payload.issue.number) && payload.issue.number > 0
				? payload.issue.number : null;
			const commentId = typeof payload.comment?.id === 'number' && Number.isSafeInteger(payload.comment.id) && payload.comment.id > 0
				? payload.comment.id : null;
			if (!issueNumber || !commentId) {
				return apiError(500, 'command_acknowledgement_unavailable', 'The command acknowledgement is unavailable');
			}
			try {
				await client.acknowledgePrivateCommand(issueNumber, commentId, existingDelivery.command_result_code);
				await env.FEEDBACK_DB.prepare(`UPDATE webhook_deliveries SET command_acknowledged_at = ?1
					WHERE delivery_id = ?2 AND command_acknowledged_at IS NULL`
				).bind(Math.floor(Date.now() / 1000), delivery).run();
			} catch {
				return apiError(503, 'command_acknowledgement_unavailable', 'The command acknowledgement is unavailable');
			}
		}
		return jsonResponse({ accepted: true }, 202);
	}
	if (event !== 'issue_comment' || payload.action !== 'created') {
		await recordDelivery(env, delivery, event, repositoryId, raw);
		return jsonResponse({ accepted: true }, 202);
	}
	if (repositoryId !== env.PRIVATE_GITHUB_REPOSITORY_ID) {return apiError(403, 'repository_denied', 'Commands require the private repository');}
	const issueNumber = typeof payload.issue?.number === 'number' && Number.isSafeInteger(payload.issue.number) && payload.issue.number > 0
		? payload.issue.number : null;
	const commentId = typeof payload.comment?.id === 'number' && Number.isSafeInteger(payload.comment.id) && payload.comment.id > 0
		? payload.comment.id : null;
	const actorId = numberString(payload.sender?.id);
	if (!issueNumber || !commentId || !actorId || typeof payload.comment?.body !== 'string') {
		return apiError(400, 'invalid_webhook_payload', 'The issue comment payload is invalid');
	}
	if (await queueDeletedIssueScrub(env, delivery, event, repositoryId, raw, issueNumber)) {
		return jsonResponse({ accepted: true }, 202);
	}
	const parsed = parseGitHubCommand(payload.comment.body);
	if (parsed.kind === 'none') {
		await recordDelivery(env, delivery, event, repositoryId, raw);
		return jsonResponse({ accepted: true }, 202);
	}
	if (!actorAllowlist(env.MAINTAINER_ACTOR_IDS).has(actorId)) {return apiError(403, 'actor_denied', 'The command actor is not allowed');}
	const mapping = await env.FEEDBACK_DB.prepare(`SELECT gm.feedback_id, gm.issue_number, f.public_status
		FROM github_mappings gm JOIN feedback f ON f.id = gm.feedback_id
		WHERE gm.repository_id = ?1 AND gm.issue_number = ?2 AND f.delete_state = 'active' LIMIT 1`
	).bind(repositoryId, issueNumber).first<MappingRow>();
	if (!mapping) {return apiError(404, 'feedback_mapping_not_found', 'The private feedback mapping was not found');}
	if (parsed.kind === 'invalid') {
		await (await deliveryStatement(env, delivery, event, repositoryId, raw, undefined, parsed.code)).run();
		try {
			await client.acknowledgePrivateCommand(issueNumber, commentId, parsed.code);
			await env.FEEDBACK_DB.prepare(`UPDATE webhook_deliveries SET command_acknowledged_at = ?1
				WHERE delivery_id = ?2 AND command_acknowledged_at IS NULL`
			).bind(Math.floor(Date.now() / 1000), delivery).run();
		} catch {
			return apiError(503, 'command_acknowledgement_unavailable', 'The command acknowledgement is unavailable');
		}
		return apiError(400, parsed.code, 'The maintainer command is invalid');
	}
	const statusTransition = parsed.value.type === 'status' || parsed.value.type === 'reopen'
		? { feedbackId: mapping.feedback_id, commentId }
		: undefined;
	const commandDelivery = await deliveryStatement(env, delivery, event, repositoryId, raw, statusTransition, 'accepted');
	const error = await applyCommand(env, mapping, parsed.value, commentId, actorId, commandDelivery, client);
	const resultCode = error ?? 'accepted';
	if (error) {await (await deliveryStatement(env, delivery, event, repositoryId, raw, undefined, error)).run();}
	try {
		await client.acknowledgePrivateCommand(issueNumber, commentId, resultCode);
		await env.FEEDBACK_DB.prepare(`UPDATE webhook_deliveries SET command_acknowledged_at = ?1
			WHERE delivery_id = ?2 AND command_acknowledged_at IS NULL`
		).bind(Math.floor(Date.now() / 1000), delivery).run();
	} catch {
		return apiError(503, 'command_acknowledgement_unavailable', 'The command acknowledgement is unavailable');
	}
	if (error) {return apiError(409, error, 'The maintainer command could not be applied');}
	return jsonResponse({ accepted: true }, 202);
}
