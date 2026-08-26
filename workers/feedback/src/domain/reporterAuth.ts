import { createHmac, isAllowedOrigin, parseBearerSecret, verifyHmac } from './auth';
import type { Env } from '../env';

export const SESSION_COOKIE_NAME = 'sb_feedback_session';

export interface ReporterPrincipal {
	reporterId: string;
	authMode: 'bearer' | 'session';
	secretHmac: string;
	csrfHmac?: string;
	revoked: boolean;
}

interface ReporterRow {
	id: string;
	revoked_at: number | null;
}

interface SessionRow {
	reporter_id: string;
	reporter_secret_hmac: string;
	csrf_hmac: string;
	revoked_at: number | null;
	reporter_revoked_at: number | null;
}

function cookieValue(header: string | null, name: string): string | null {
	if (!header) {return null;}
	for (const part of header.split(';')) {
		const separator = part.indexOf('=');
		if (separator < 1 || part.slice(0, separator).trim() !== name) {continue;}
		const value = part.slice(separator + 1).trim();
		return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
	}
	return null;
}

export async function authenticateReporter(request: Request, env: Env, allowRevoked = false): Promise<ReporterPrincipal | null> {
	const bearer = parseBearerSecret(request.headers.get('authorization'));
	if (bearer) {
		const secretHmac = await createHmac(bearer, env.REPORTER_HMAC_PEPPER);
		const row = await env.FEEDBACK_DB.prepare(
			'SELECT id, revoked_at FROM reporters WHERE secret_hmac = ?1 LIMIT 1'
		).bind(secretHmac).first<ReporterRow>();
		if (!row || (row.revoked_at !== null && !allowRevoked)) {return null;}
		return { reporterId: row.id, authMode: 'bearer', secretHmac, revoked: row.revoked_at !== null };
	}

	const sessionToken = cookieValue(request.headers.get('cookie'), SESSION_COOKIE_NAME);
	if (!sessionToken) {return null;}
	const sessionHmac = await createHmac(sessionToken, env.REPORTER_HMAC_PEPPER);
	const now = Math.floor(Date.now() / 1000);
	const row = await env.FEEDBACK_DB.prepare(`
		SELECT s.reporter_id, r.secret_hmac AS reporter_secret_hmac, s.csrf_hmac,
			s.revoked_at, r.revoked_at AS reporter_revoked_at
		FROM sessions s
		JOIN reporters r ON r.id = s.reporter_id
		WHERE s.id_hmac = ?1 AND s.expires_at > ?2
		LIMIT 1
	`).bind(sessionHmac, now).first<SessionRow>();
	if (!row || ((row.revoked_at !== null || row.reporter_revoked_at !== null) && !allowRevoked)) {return null;}
	return {
		reporterId: row.reporter_id,
		authMode: 'session',
		secretHmac: row.reporter_secret_hmac,
		csrfHmac: row.csrf_hmac,
		revoked: row.revoked_at !== null || row.reporter_revoked_at !== null,
	};
}

export async function authorizeMutation(
	request: Request,
	principal: ReporterPrincipal,
	env: Env,
): Promise<boolean> {
	if (principal.authMode === 'bearer') {return true;}
	if (!isAllowedOrigin(request.headers.get('origin'), env.SERVICE_ORIGIN)) {return false;}
	const csrf = request.headers.get('x-csrf-token');
	return Boolean(csrf
		&& /^[A-Za-z0-9_-]{43}$/.test(csrf)
		&& principal.csrfHmac
		&& await verifyHmac(csrf, principal.csrfHmac, env.REPORTER_HMAC_PEPPER));
}

export function sessionCookie(token: string, maxAge = 86400): string {
	return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}
