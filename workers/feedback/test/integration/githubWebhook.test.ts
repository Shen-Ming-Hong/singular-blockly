import { env, exports } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { processGitHubWebhook, publicSummaryIsSafe } from '../../src/routes/githubWebhook';
import { processOutbox } from '../../src/services/outbox';
import fixture from '../fixtures/create-feedback.json';

const ORIGIN = 'https://blockly-support.singular-ai.org';

async function signature(body: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.GITHUB_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const result = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
	return `sha256=${[...result].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

async function createMappedFeedback(issueNumber: number): Promise<string> {
	const form = new FormData();
	form.set('payload', JSON.stringify({ ...fixture, title: `Webhook feedback ${issueNumber}` }));
	const response = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/feedback`, {
		method: 'POST',
		headers: { authorization: `Bearer ${String.fromCharCode(65 + issueNumber % 20).repeat(43)}`, 'idempotency-key': crypto.randomUUID() },
		body: form,
	}));
	const value = await response.json() as { id: string };
	await env.FEEDBACK_DB.prepare(`INSERT INTO github_mappings
		(feedback_id, repository_id, issue_number, issue_node_id, last_synced_at)
		VALUES (?1, ?2, ?3, ?4, ?5)`
	).bind(value.id, env.PRIVATE_GITHUB_REPOSITORY_ID, issueNumber, `node-${issueNumber}`, Math.floor(Date.now() / 1000)).run();
	return value.id;
}

const privateIssueComments = new Map<number, Array<{ id: number; body: string }>>();
const commandAcknowledgements: Array<{ issueNumber: number; commentId: number; resultCode: string }> = [];

async function webhook(
	payload: unknown,
	delivery = crypto.randomUUID(),
	event = 'issue_comment',
	acknowledgePrivateCommand = async (issueNumber: number, commentId: number, resultCode: string): Promise<void> => {
		commandAcknowledgements.push({ issueNumber, commentId, resultCode });
	},
): Promise<Response> {
	const body = JSON.stringify(payload);
	const value = payload as { issue?: { number?: unknown }; comment?: { id?: unknown; body?: unknown } };
	if (typeof value.issue?.number === 'number' && typeof value.comment?.id === 'number' && typeof value.comment.body === 'string') {
		const comments = privateIssueComments.get(value.issue.number) ?? [];
		if (!comments.some(comment => comment.id === value.comment?.id)) {
			comments.push({ id: value.comment.id, body: value.comment.body });
			privateIssueComments.set(value.issue.number, comments);
		}
	}
	return processGitHubWebhook(new Request(`${ORIGIN}/api/v1/github/webhooks`, {
		method: 'POST',
		headers: {
			'x-github-delivery': delivery,
			'x-github-event': event,
			'x-hub-signature-256': await signature(body),
		},
		body,
	}), env, {
		listPrivateIssueComments: async issueNumber => privateIssueComments.get(issueNumber) ?? [],
		acknowledgePrivateCommand,
	});
}

async function webhookThroughWorker(payload: unknown, delivery = crypto.randomUUID(), event = 'issue_comment'): Promise<Response> {
	const body = JSON.stringify(payload);
	return exports.default.fetch(new Request(`${ORIGIN}/api/v1/github/webhooks`, {
		method: 'POST',
		headers: {
			'x-github-delivery': delivery,
			'x-github-event': event,
			'x-hub-signature-256': await signature(body),
		},
		body,
	}));
}

function payload(issueNumber: number, body: string, actor = 300, repository = 100, commentId = issueNumber * 100): unknown {
	return {
		action: 'created', repository: { id: repository }, sender: { id: actor },
		issue: { number: issueNumber }, comment: { id: commentId, body },
	};
}

describe('GitHub webhook commands', () => {
	let blockedPublicIssue = 72000;
	it.each([
		['中文', '學生回報馬達無法正常運作，重新連接後仍然沒有改善。', '公開規劃將改善馬達無法正常運作的錯誤處理。'],
		['日文', '教室ではモーターが正常に動作しないため授業を続けられません。', 'モーターが正常に動作しない問題を改善します。'],
		['韓文', '수업 중에 모터가 정상적으로 작동하지 않아서 진행할 수 없어요.', '모터가 정상적으로 작동하지 않는 문제를 개선합니다.'],
	])('rejects a copied private excerpt in a no-whitespace language: %s', (_locale, privateText, summary) => {
		expect(publicSummaryIsSafe(summary, {
			public_reference: 'SB-ABCDEFGH',
			title: 'Private report',
			description: privateText,
			steps: null,
			expected: null,
			diagnostics_json: '{}',
			privateTexts: [],
		})).toBe(false);
	});
	it('verifies signature, repository, actor, and delivery replay', async () => {
		const issue = 71001;
		const feedbackId = await createMappedFeedback(issue);
		const body = JSON.stringify(payload(issue, '/feedback public-reply\nA public maintainer answer.'));
		const invalidSignature = await exports.default.fetch(new Request(`${ORIGIN}/api/v1/github/webhooks`, {
			method: 'POST', headers: { 'x-github-delivery': crypto.randomUUID(), 'x-github-event': 'issue_comment', 'x-hub-signature-256': `sha256=${'0'.repeat(64)}` }, body,
		}));
		expect(invalidSignature.status).toBe(401);
		const rejectedAudit = await env.FEEDBACK_DB.prepare(`SELECT event_code, target_hash, outcome
			FROM audit_events WHERE event_code = 'webhook_rejected' ORDER BY created_at DESC LIMIT 1`
		).first<{ event_code: string; target_hash: string | null; outcome: string }>();
		expect(rejectedAudit).toEqual({ event_code: 'webhook_rejected', target_hash: null, outcome: 'denied' });
		expect(JSON.stringify(rejectedAudit)).not.toContain(body);
		expect(JSON.stringify(rejectedAudit)).not.toContain(env.GITHUB_WEBHOOK_SECRET);
		expect((await webhook(payload(issue, '/feedback public-reply\nDenied actor.', 999))).status).toBe(403);
		expect((await webhook(payload(issue, '/feedback public-reply\nDenied repository.', 300, 999))).status).toBe(403);

		const delivery = crypto.randomUUID();
		expect((await webhook(payload(issue, '/feedback public-reply\nA public maintainer answer.'), delivery)).status).toBe(202);
		expect((await webhook(payload(issue, '/feedback public-reply\nA public maintainer answer.'), delivery)).status).toBe(202);
		const count = await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM feedback_messages WHERE feedback_id = ?1')
			.bind(feedbackId).first<{ count: number }>();
		expect(count?.count).toBe(1);
		expect(commandAcknowledgements.filter(item => item.issueNumber === issue)).toEqual([
			{ issueNumber: issue, commentId: issue * 100, resultCode: 'accepted' },
		]);
		const receipt = await env.FEEDBACK_DB.prepare(`SELECT command_result_code, command_acknowledged_at
			FROM webhook_deliveries WHERE delivery_id = ?1`).bind(delivery)
			.first<{ command_result_code: string; command_acknowledged_at: number }>();
		expect(receipt?.command_result_code).toBe('accepted');
		expect(receipt?.command_acknowledged_at).toBeTypeOf('number');
	});

	it('persists and acknowledges invalid commands from an authorized maintainer', async () => {
		const issue = 71008;
		await createMappedFeedback(issue);
		const delivery = crypto.randomUUID();
		const invalidCommand = payload(issue, '/feedback public-reply', 300, 100, 7100801);

		expect((await webhook(invalidCommand, delivery)).status).toBe(400);
		expect((await webhook(invalidCommand, delivery)).status).toBe(202);
		expect(commandAcknowledgements.filter(item => item.commentId === 7100801)).toEqual([
			{ issueNumber: issue, commentId: 7100801, resultCode: 'public_reply_required' },
		]);
		const receipt = await env.FEEDBACK_DB.prepare(`SELECT command_result_code, command_acknowledged_at
			FROM webhook_deliveries WHERE delivery_id = ?1`).bind(delivery)
			.first<{ command_result_code: string; command_acknowledged_at: number }>();
		expect(receipt?.command_result_code).toBe('public_reply_required');
		expect(receipt?.command_acknowledged_at).toBeTypeOf('number');
	});

	it('keeps ordinary comments internal and requires the owner for public approval', async () => {
		const issue = 71002;
		const feedbackId = await createMappedFeedback(issue);
		expect((await webhook(payload(issue, 'Ordinary internal discussion.', 999))).status).toBe(202);
		expect((await webhook(payload(issue, '/feedback approve-public\nA safe anonymized product improvement summary.', 300))).status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare('SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1').bind(feedbackId).first()).toBeNull();

		expect((await webhook(payload(issue, '/feedback approve-public\nA safe anonymized product improvement summary.', 301, 100, 7100202))).status).toBe(202);
		const approval = await env.FEEDBACK_DB.prepare('SELECT approved_by, proposed_summary FROM development_approvals WHERE feedback_id = ?1')
			.bind(feedbackId).first<{ approved_by: string; proposed_summary: string }>();
		expect(approval?.approved_by).toBe('301');
		expect(approval?.proposed_summary).not.toContain('SB-');
	});

	it('rejects the actual private issue number even when it is written without a hash', async () => {
		const issue = 71012;
		const feedbackId = await createMappedFeedback(issue);

		const response = await webhook(payload(
			issue,
			`/feedback approve-public\nA safe-looking summary says the private item is issue ${issue}.`,
			301,
			100,
			7101201,
		));

		expect(response.status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1'
		).bind(feedbackId).first()).toBeNull();
	});

	it('durably re-scrubs a deleted private issue when a collaborator adds a late comment', async () => {
		const issue = 71009;
		const referenceHash = 'deleted-feedback-follow-up-routing';
		const now = Math.floor(Date.now() / 1000);
		await env.FEEDBACK_DB.prepare(`INSERT INTO feedback_tombstones
			(public_reference_hash, private_issue_number, delete_state, deleted_at)
			VALUES (?1, ?2, 'scrubbed', ?3)`
		).bind(referenceHash, issue, now).run();
		const delivery = crypto.randomUUID();

		expect((await webhook(payload(issue, 'Late private detail from a collaborator.', 999), delivery)).status).toBe(202);
		expect((await webhook(payload(issue, 'Late private detail from a collaborator.', 999), delivery)).status).toBe(202);

		const queued = await env.FEEDBACK_DB.prepare(`SELECT status, payload_json FROM outbox_events
			WHERE id = ?1 AND aggregate_type = 'tombstone' AND event_type = 'delete'`
		).bind(delivery).first<{ status: string; payload_json: string }>();
		expect(queued?.status).toBe('pending');
		expect(queued?.payload_json).not.toContain('Late private detail');
		expect((await env.FEEDBACK_DB.prepare('SELECT count(*) AS count FROM outbox_events WHERE id = ?1')
			.bind(delivery).first<{ count: number }>())?.count).toBe(1);

		const scrubPrivateIssue = vi.fn(async () => undefined);
		await processOutbox(env, {
			createPrivateIssue: vi.fn(async () => ({ number: 1, node_id: 'unused' })),
			findPrivateIssueByOutboxId: vi.fn(async () => null),
			createPublicIssue: vi.fn(async () => ({ number: 2, node_id: 'unused' })),
			findPublicIssueByOutboxId: vi.fn(async () => null),
			addPrivateComment: vi.fn(async () => undefined),
			scrubPrivateIssue,
		}, 100);

		expect(scrubPrivateIssue).toHaveBeenCalledWith(issue);
		expect(await env.FEEDBACK_DB.prepare(`SELECT private_issue_number, delete_state
			FROM feedback_tombstones WHERE public_reference_hash = ?1`
		).bind(referenceHash).first()).toEqual({ private_issue_number: issue, delete_state: 'scrubbed' });
	});

	it('queues the follow-up scrub even when the late comment races tombstone finalization', async () => {
		const issue = 71010;
		const feedbackId = await createMappedFeedback(issue);
		await env.FEEDBACK_DB.prepare("UPDATE feedback SET delete_state = 'delete-pending' WHERE id = ?1")
			.bind(feedbackId).run();
		const delivery = crypto.randomUUID();

		expect((await webhook(payload(issue, 'Comment created after the empty check.', 999), delivery)).status).toBe(202);

		const tombstone = await env.FEEDBACK_DB.prepare(`SELECT private_issue_number, delete_state
			FROM feedback_tombstones WHERE private_issue_number = ?1`
		).bind(issue).first<{ private_issue_number: number; delete_state: string }>();
		expect(tombstone).toEqual({ private_issue_number: issue, delete_state: 'pending' });
		expect((await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM outbox_events
			WHERE id = ?1 AND aggregate_type = 'tombstone' AND event_type = 'delete' AND status = 'pending'`
		).bind(delivery).first<{ count: number }>())?.count).toBe(1);
	});

	it.each([
		'A student can be contacted at learner@example.test about this problem.',
		'A safe-looking summary that identifies (@alice) in the discussion.',
		'The failure occurs in /Users/alice/private/project/main.json every time.',
		'The failure occurs in (/Users/alice/private/project/main.json) every time.',
		'The private work item is tracked as (#71002).',
		'This affects VS Code v1.109.0 on the reported machine.',
		'The failure affects Linux uploads in classrooms.',
		'Diagnostics and the attachment confirm the private issue.',
	])('rejects a public summary containing private or machine data: %s', async summary => {
		const issue = ++blockedPublicIssue;
		const feedbackId = await createMappedFeedback(issue);
		const response = await webhook(payload(issue, `/feedback approve-public\n${summary}`, 301, 100, issue * 100));
		expect(response.status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare('SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1')
			.bind(feedbackId).first()).toBeNull();
	});

	it('rejects a public summary copied from a later reporter message', async () => {
		const issue = ++blockedPublicIssue;
		const feedbackId = await createMappedFeedback(issue);
		const privatePhrase = 'The violet robotics group meets beside the old observatory.';
		await env.FEEDBACK_DB.prepare(`INSERT INTO feedback_messages
			(id, feedback_id, author_type, visibility, body, created_at)
			VALUES (?1, ?2, 'reporter', 'public', ?3, ?4)`
		).bind(crypto.randomUUID(), feedbackId, privatePhrase, Math.floor(Date.now() / 1000)).run();

		const response = await webhook(payload(
			issue,
			`/feedback approve-public\n${privatePhrase}`,
			301,
			100,
			issue * 100,
		));

		expect(response.status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1'
		).bind(feedbackId).first()).toBeNull();
	});

	it('rejects a public summary copied from ordinary private discussion', async () => {
		const issue = ++blockedPublicIssue;
		const feedbackId = await createMappedFeedback(issue);
		const privatePhrase = 'The amber robotics team meets near the quiet library entrance.';
		expect((await webhook(payload(issue, privatePhrase, 300, 100, issue * 100))).status).toBe(202);

		const response = await webhook(payload(
			issue,
			`/feedback approve-public\n${privatePhrase}`,
			301,
			100,
			issue * 100 + 1,
		));

		expect(response.status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1'
		).bind(feedbackId).first()).toBeNull();
	});

	it('rejects a public summary copied from an earlier private command rationale', async () => {
		const issue = ++blockedPublicIssue;
		const feedbackId = await createMappedFeedback(issue);
		const privatePhrase = 'The silver robotics club meets below the west auditorium stairs.';
		expect((await webhook(payload(
			issue,
			`/feedback decision actionable\n${privatePhrase}`,
			300,
			100,
			issue * 100,
		))).status).toBe(202);

		const response = await webhook(payload(
			issue,
			`/feedback approve-public\n${privatePhrase}`,
			301,
			100,
			issue * 100 + 1,
		));

		expect(response.status).toBe(409);
		expect(await env.FEEDBACK_DB.prepare(
			'SELECT feedback_id FROM development_approvals WHERE feedback_id = ?1'
		).bind(feedbackId).first()).toBeNull();
	});

	it('applies status and decision as separate dimensions with public explanations', async () => {
		const issue = 71003;
		const feedbackId = await createMappedFeedback(issue);
		expect((await webhook(payload(issue, '/feedback status triaging'))).status).toBe(202);
		expect((await webhook(payload(issue, '/feedback decision not-actionable duplicate\nThis matches an existing supported report and will be tracked there.', 300, 100, 7100302))).status).toBe(202);
		const row = await env.FEEDBACK_DB.prepare('SELECT public_status, decision, resolution, public_reason FROM feedback WHERE id = ?1')
			.bind(feedbackId).first<Record<string, string>>();
		expect(row).toMatchObject({ public_status: 'triaging', decision: 'not-actionable', resolution: 'duplicate' });
		expect(row?.public_reason).toContain('existing supported report');
	});

	it('rolls back reopen state when the public message cannot be committed', async () => {
		const issue = 71004;
		const feedbackId = await createMappedFeedback(issue);
		const commentId = 7100401;
		const delivery = crypto.randomUUID();
		await env.FEEDBACK_DB.prepare("UPDATE feedback SET public_status = 'resolved' WHERE id = ?1").bind(feedbackId).run();
		await env.FEEDBACK_DB.prepare(`CREATE TRIGGER reject_atomic_reopen_message
			BEFORE INSERT ON feedback_messages WHEN NEW.github_comment_id = ${commentId}
			BEGIN SELECT RAISE(ABORT, 'test_atomic_reopen'); END`).run();

		const failed = await webhookThroughWorker(payload(issue, '/feedback reopen\nWe need one more confirmation.', 300, 100, commentId), delivery);
		expect(failed.status).toBe(500);
		expect((await env.FEEDBACK_DB.prepare('SELECT public_status FROM feedback WHERE id = ?1').bind(feedbackId)
			.first<{ public_status: string }>())?.public_status).toBe('resolved');
		expect(await env.FEEDBACK_DB.prepare('SELECT delivery_id FROM webhook_deliveries WHERE delivery_id = ?1').bind(delivery).first()).toBeNull();

		await env.FEEDBACK_DB.prepare('DROP TRIGGER reject_atomic_reopen_message').run();
		expect((await webhook(payload(issue, '/feedback reopen\nWe need one more confirmation.', 300, 100, commentId), delivery)).status).toBe(202);
		expect((await env.FEEDBACK_DB.prepare('SELECT public_status FROM feedback WHERE id = ?1').bind(feedbackId)
			.first<{ public_status: string }>())?.public_status).toBe('in-progress');
	});

	it('rejects status shortcuts and requires the dedicated reopen command with a public explanation', async () => {
		const issue = 71011;
		const feedbackId = await createMappedFeedback(issue);
		await env.FEEDBACK_DB.prepare("UPDATE feedback SET public_status = 'resolved' WHERE id = ?1").bind(feedbackId).run();

		expect((await webhook(payload(issue, '/feedback status in-progress', 300, 100, 7101101))).status).toBe(409);
		expect((await env.FEEDBACK_DB.prepare('SELECT public_status FROM feedback WHERE id = ?1').bind(feedbackId)
			.first<{ public_status: string }>())?.public_status).toBe('resolved');
		expect((await webhook(payload(
			issue,
			'/feedback reopen\nThe verified fix needs another iteration.',
			300,
			100,
			7101102,
		))).status).toBe(202);
		expect((await env.FEEDBACK_DB.prepare('SELECT public_status FROM feedback WHERE id = ?1').bind(feedbackId)
			.first<{ public_status: string }>())?.public_status).toBe('in-progress');
	});

	it('keeps closed terminal and permits reopen only from resolved', async () => {
		const issue = 71005;
		const feedbackId = await createMappedFeedback(issue);
		const delivery = crypto.randomUUID();
		await env.FEEDBACK_DB.prepare("UPDATE feedback SET public_status = 'closed' WHERE id = ?1").bind(feedbackId).run();

		expect((await webhook(payload(issue, '/feedback reopen\nThis must remain closed.', 300, 100, 7100501), delivery)).status).toBe(409);
		expect((await env.FEEDBACK_DB.prepare('SELECT public_status FROM feedback WHERE id = ?1').bind(feedbackId)
			.first<{ public_status: string }>())?.public_status).toBe('closed');
		const receipt = await env.FEEDBACK_DB.prepare(`SELECT command_result_code, command_acknowledged_at
			FROM webhook_deliveries WHERE delivery_id = ?1`).bind(delivery)
			.first<{ command_result_code: string; command_acknowledged_at: number }>();
		expect(receipt?.command_result_code).toBe('invalid_status_transition');
		expect(receipt?.command_acknowledged_at).toBeTypeOf('number');
		expect(commandAcknowledgements).toContainEqual({
			issueNumber: issue, commentId: 7100501, resultCode: 'invalid_status_transition',
		});
	});

	it('retries a failed acknowledgement without applying the command twice', async () => {
		const issue = 71007;
		const feedbackId = await createMappedFeedback(issue);
		const delivery = crypto.randomUUID();
		let acknowledgementAttempts = 0;
		const acknowledge = async (): Promise<void> => {
			acknowledgementAttempts += 1;
			if (acknowledgementAttempts === 1) {throw new Error('github_network_error');}
		};
		const commandPayload = payload(issue, '/feedback public-reply\nA durable public answer.', 300, 100, 7100701);

		expect((await webhook(commandPayload, delivery, 'issue_comment', acknowledge)).status).toBe(503);
		expect((await webhook(commandPayload, delivery, 'issue_comment', acknowledge)).status).toBe(202);
		expect(acknowledgementAttempts).toBe(2);
		const messageCount = await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM feedback_messages
			WHERE feedback_id = ?1 AND github_comment_id = ?2`).bind(feedbackId, 7100701).first<{ count: number }>();
		expect(messageCount?.count).toBe(1);
		const receipt = await env.FEEDBACK_DB.prepare(`SELECT command_result_code, command_acknowledged_at
			FROM webhook_deliveries WHERE delivery_id = ?1`).bind(delivery)
			.first<{ command_result_code: string; command_acknowledged_at: number }>();
		expect(receipt?.command_result_code).toBe('accepted');
		expect(receipt?.command_acknowledged_at).toBeTypeOf('number');
	});

	it('atomically allows only one status command from the same stale state', async () => {
		const issue = 71006;
		const feedbackId = await createMappedFeedback(issue);
		await env.FEEDBACK_DB.prepare("UPDATE feedback SET public_status = 'planned' WHERE id = ?1").bind(feedbackId).run();
		const deliveries = [crypto.randomUUID(), crypto.randomUUID()];
		const responses = await Promise.all([
			webhook(payload(issue, '/feedback status closed', 300, 100, 7100601), deliveries[0]),
			webhook(payload(issue, '/feedback status in-progress', 300, 100, 7100602), deliveries[1]),
		]);

		expect(responses.map(response => response.status).sort()).toEqual([202, 409]);
		const row = await env.FEEDBACK_DB.prepare('SELECT public_status, last_status_command_id FROM feedback WHERE id = ?1')
			.bind(feedbackId).first<{ public_status: string; last_status_command_id: number }>();
		expect(['closed', 'in-progress']).toContain(row?.public_status);
		expect([7100601, 7100602]).toContain(row?.last_status_command_id);
		const deliveryCount = await env.FEEDBACK_DB.prepare(`SELECT count(*) AS count FROM webhook_deliveries
			WHERE delivery_id IN (?1, ?2)`).bind(...deliveries).first<{ count: number }>();
		expect(deliveryCount?.count).toBe(2);
	});
});
