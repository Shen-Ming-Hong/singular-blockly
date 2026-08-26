import { createHmac, createSessionCredentials, isAllowedOrigin } from '../domain/auth';
import { apiError, rateLimitError, readRequestText, RequestTooLargeError, withSecurityHeaders } from '../domain/http';
import { sessionCookie } from '../domain/reporterAuth';
import type { Env } from '../env';

function isExchangeBody(value: unknown): value is { secret: string } {
	return value !== null
		&& typeof value === 'object'
		&& !Array.isArray(value)
		&& Object.keys(value).length === 1
		&& 'secret' in value
		&& typeof value.secret === 'string'
		&& /^[A-Za-z0-9_-]{43}$/.test(value.secret);
}

export async function exchangeReporterSession(request: Request, env: Env): Promise<Response> {
	if (!isAllowedOrigin(request.headers.get('origin'), env.SERVICE_ORIGIN)) {
		return apiError(403, 'origin_denied', 'The request origin was rejected');
	}
	const source = request.headers.get('cf-connecting-ip')?.trim() || 'missing-cloudflare-source';
	const ipHmac = await createHmac(source, env.IP_HMAC_PEPPER);
	if (!(await env.ANONYMOUS_RATE_LIMITER.limit({ key: ipHmac })).success) {
		return rateLimitError();
	}
	let body: unknown;
	try {
		const raw = await readRequestText(request, 256);
		body = JSON.parse(raw) as unknown;
	} catch (error) {
		return error instanceof RequestTooLargeError
			? apiError(413, 'request_too_large', 'The request is too large')
			: apiError(400, 'invalid_request', 'The recovery credential is invalid');
	}
	if (!isExchangeBody(body)) {return apiError(400, 'invalid_request', 'The recovery credential is invalid');}
	const secretHmac = await createHmac(body.secret, env.REPORTER_HMAC_PEPPER);
	if (!(await env.REPORTER_RATE_LIMITER.limit({ key: secretHmac })).success) {
		return rateLimitError();
	}
	const reporter = await env.FEEDBACK_DB.prepare(
		'SELECT id FROM reporters WHERE secret_hmac = ?1 AND revoked_at IS NULL LIMIT 1'
	).bind(secretHmac).first<{ id: string }>();
	if (!reporter) {return apiError(401, 'invalid_reporter', 'The recovery credential is invalid');}
	const now = Math.floor(Date.now() / 1000);
	const credentials = createSessionCredentials(now);
	const sessionHmac = await createHmac(credentials.sessionToken, env.REPORTER_HMAC_PEPPER);
	const csrfHmac = await createHmac(credentials.csrfToken, env.REPORTER_HMAC_PEPPER);
	await env.FEEDBACK_DB.prepare(`
		INSERT INTO sessions (id_hmac, reporter_id, csrf_hmac, created_at, expires_at)
		VALUES (?1, ?2, ?3, ?4, ?5)
	`).bind(sessionHmac, reporter.id, csrfHmac, now, credentials.expiresAt).run();
	return new Response(null, {
		status: 204,
		headers: withSecurityHeaders({
			'Set-Cookie': sessionCookie(credentials.sessionToken),
			'X-CSRF-Token': credentials.csrfToken,
		}),
	});
}
