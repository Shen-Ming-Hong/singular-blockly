import type { Env } from '../env';

interface AccessClaims {
	aud?: unknown;
	exp?: unknown;
	nbf?: unknown;
	iss?: unknown;
	sub?: unknown;
}

interface AccessJwk extends JsonWebKey {
	kid?: string;
}

interface JwkSet {
	keys?: AccessJwk[];
}

const jwksCache = new Map<string, { keys: AccessJwk[]; expiresAt: number }>();

function decodeJson(value: string): Record<string, unknown> | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) {return null;}
	try {
		const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
		const bytes = Uint8Array.from(atob(padded), character => character.charCodeAt(0));
		const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
	} catch {return null;}
}

function decodeSignature(value: string): Uint8Array | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) {return null;}
	try {
		const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
		return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
	} catch {return null;}
}

async function keys(
	env: Env,
	fetchImpl: typeof fetch,
	forceRefresh = false,
): Promise<{ values: AccessJwk[]; fromCache: boolean }> {
	const domain = env.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
	if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)) {throw new Error('access_configuration_invalid');}
	const cached = jwksCache.get(domain);
	if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
		return { values: cached.keys, fromCache: true };
	}
	let response: Response;
	try {response = await fetchImpl(`https://${domain}/cdn-cgi/access/certs`);} catch {throw new Error('access_jwks_unavailable');}
	if (!response.ok) {throw new Error('access_jwks_unavailable');}
	const value = await response.json() as JwkSet;
	if (!Array.isArray(value.keys) || !value.keys.length || value.keys.length > 10) {throw new Error('access_jwks_invalid');}
	jwksCache.set(domain, { keys: value.keys, expiresAt: Date.now() + 60 * 60 * 1000 });
	return { values: value.keys, fromCache: false };
}

export async function verifyCloudflareAccess(
	request: Request,
	env: Env,
	fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<boolean> {
	const jwt = request.headers.get('cf-access-jwt-assertion');
	if (!jwt || jwt.length > 8192) {return false;}
	const parts = jwt.split('.');
	if (parts.length !== 3) {return false;}
	const header = decodeJson(parts[0]);
	const claims = decodeJson(parts[1]) as AccessClaims | null;
	const signature = decodeSignature(parts[2]);
	if (!header || header.alg !== 'RS256' || typeof header.kid !== 'string' || !claims || !signature) {return false;}
	const now = Math.floor(Date.now() / 1000);
	const audiences = typeof claims.aud === 'string' ? [claims.aud] : Array.isArray(claims.aud) ? claims.aud : [];
	if (!audiences.includes(env.CLOUDFLARE_ACCESS_AUD)
		|| typeof claims.exp !== 'number' || claims.exp <= now
		|| (typeof claims.nbf === 'number' && claims.nbf > now + 30)
		|| claims.iss !== `https://${env.CLOUDFLARE_ACCESS_TEAM_DOMAIN}`
		|| typeof claims.sub !== 'string' || !claims.sub) {
		return false;
	}
	const loadedKeys = await keys(env, fetchImpl);
	let jwk = loadedKeys.values.find(item => item.kid === header.kid && item.kty === 'RSA');
	if (!jwk && loadedKeys.fromCache) {
		jwk = (await keys(env, fetchImpl, true)).values.find(item => item.kid === header.kid && item.kty === 'RSA');
	}
	if (!jwk) {return false;}
	try {
		const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
		return crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			key,
			Uint8Array.from(signature).buffer,
			new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
		);
	} catch {return false;}
}

export function resetAccessJwksCacheForTests(): void {
	jwksCache.clear();
}
