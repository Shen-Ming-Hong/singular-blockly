import { apiError, jsonResponse, methodNotAllowed, withSecurityHeaders } from './domain/http';
import type { Env } from './env';
import { createFeedback } from './routes/feedback';
import { portalPage } from './routes/portal';
import {
	addReporterMessage,
	deleteReporterAccount,
	deleteReporterFeedback,
	getReporterFeedback,
	listReporterMessages,
	listReporterFeedback,
} from './routes/reporterFeedback';
import { exchangeReporterSession } from './routes/session';
import { processOutbox } from './services/outbox';
import { processGitHubWebhook } from './routes/githubWebhook';
import { getAdminAttachment } from './routes/adminAttachments';
import { runtimeConfigIsValid } from './domain/config';
import { processPendingAttachmentCleanup } from './services/attachmentCleanup';

export async function handleRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	if (request.method === 'GET') {
		const page = portalPage(request);
		if (page) {return page;}
	}
	if (!runtimeConfigIsValid(env)) {
		return apiError(503, 'service_unavailable', 'The feedback service is not ready');
	}
	if (url.pathname === '/health' && request.method === 'GET') {
		try {
			await env.FEEDBACK_DB.prepare('SELECT 1 AS ready').first();
			return jsonResponse({ status: 'ok' });
		} catch {
			return apiError(503, 'service_unavailable', 'The feedback service is not ready');
		}
	}
	if (url.pathname === '/api/v1/feedback') {
		if (request.method === 'POST') {
			return createFeedback(request, env);
		}
		if (request.method === 'GET') {
			return listReporterFeedback(request, env);
		}
		return methodNotAllowed('GET, POST');
	}
	const messagesMatch = url.pathname.match(/^\/api\/v1\/feedback\/([0-9a-f-]{36})\/messages$/i);
	if (messagesMatch) {
		if (request.method === 'GET') {return listReporterMessages(request, env, messagesMatch[1]);}
		if (request.method === 'POST') {return addReporterMessage(request, env, messagesMatch[1]);}
		return methodNotAllowed('GET, POST');
	}
	const feedbackMatch = url.pathname.match(/^\/api\/v1\/feedback\/([0-9a-f-]{36})$/i);
	if (feedbackMatch) {
		if (request.method === 'GET') {return getReporterFeedback(request, env, feedbackMatch[1]);}
		if (request.method === 'DELETE') {return deleteReporterFeedback(request, env, feedbackMatch[1]);}
		return methodNotAllowed('GET, DELETE');
	}
	if (url.pathname === '/api/v1/reporter') {
		return request.method === 'DELETE'
			? deleteReporterAccount(request, env)
			: methodNotAllowed('DELETE');
	}
	if (url.pathname === '/api/v1/session/exchange') {
		return request.method === 'POST'
			? exchangeReporterSession(request, env)
			: methodNotAllowed('POST');
	}
	if (url.pathname === '/api/v1/github/webhooks') {
		return request.method === 'POST'
			? processGitHubWebhook(request, env)
			: methodNotAllowed('POST');
	}
	const attachmentMatch = url.pathname.match(/^\/admin\/attachments\/([0-9a-f-]{36})$/i);
	if (attachmentMatch) {
		return request.method === 'GET'
			? getAdminAttachment(request, env, attachmentMatch[1])
			: methodNotAllowed('GET');
	}
	return apiError(404, 'not_found', 'Not found');
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			return await handleRequest(request, env);
		} catch {
			return apiError(500, 'internal_error', 'The feedback service could not complete the request');
		}
	},

	async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
		if (!runtimeConfigIsValid(env)) {throw new Error('feedback_service_not_ready');}
		await processOutbox(env);
		const now = Math.floor(Date.now() / 1000);
		await processPendingAttachmentCleanup(env, now);
		await env.FEEDBACK_DB.batch([
			env.FEEDBACK_DB.prepare('DELETE FROM idempotency_records WHERE expires_at <= ?1').bind(now),
			env.FEEDBACK_DB.prepare('DELETE FROM sessions WHERE expires_at <= ?1').bind(now),
			env.FEEDBACK_DB.prepare('DELETE FROM webhook_deliveries WHERE processed_at <= ?1').bind(now - 30 * 86400),
			env.FEEDBACK_DB.prepare('DELETE FROM audit_events WHERE expires_at <= ?1').bind(now),
			env.FEEDBACK_DB.prepare("DELETE FROM outbox_events WHERE status = 'completed' AND completed_at <= ?1").bind(now - 7 * 86400),
		]);
	},
};

export { withSecurityHeaders };
