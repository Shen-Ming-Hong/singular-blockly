import type { Env } from '../env';

const encoder = new TextEncoder();
const POSITIVE_INTEGER = /^[1-9][0-9]{0,19}$/;
const PRIVATE_KEY = /^-----BEGIN PRIVATE KEY-----\s+[A-Za-z0-9+/=\s]{32,}\s+-----END PRIVATE KEY-----$/;
const KNOWN_PLACEHOLDER = /(?:development|example|placeholder|replace|change[-_ ]?locally)/i;

function strongSecret(value: string): boolean {
	return encoder.encode(value).byteLength >= 32 && !KNOWN_PLACEHOLDER.test(value);
}

function actorIds(value: string): Set<string> | null {
	const ids = value.split(',').map(item => item.trim()).filter(Boolean);
	return ids.length > 0 && ids.every(id => POSITIVE_INTEGER.test(id)) && new Set(ids).size === ids.length
		? new Set(ids)
		: null;
}

function bareHttpsOrigin(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash;
	} catch {return false;}
}

export function runtimeConfigIsValid(env: Env): boolean {
	const maintainers = actorIds(env.MAINTAINER_ACTOR_IDS);
	const owners = actorIds(env.OWNER_ACTOR_IDS);
	return bareHttpsOrigin(env.SERVICE_ORIGIN)
		&& /^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(env.CLOUDFLARE_ACCESS_TEAM_DOMAIN)
		&& env.CLOUDFLARE_ACCESS_AUD.length >= 16
		&& !/replace|placeholder/i.test(env.CLOUDFLARE_ACCESS_AUD)
		&& strongSecret(env.REPORTER_HMAC_PEPPER)
		&& strongSecret(env.IP_HMAC_PEPPER)
		&& strongSecret(env.GITHUB_WEBHOOK_SECRET)
		&& new Set([env.REPORTER_HMAC_PEPPER, env.IP_HMAC_PEPPER, env.GITHUB_WEBHOOK_SECRET]).size === 3
		&& POSITIVE_INTEGER.test(env.GITHUB_APP_ID)
		&& POSITIVE_INTEGER.test(env.GITHUB_INSTALLATION_ID)
		&& POSITIVE_INTEGER.test(env.PRIVATE_GITHUB_REPOSITORY_ID)
		&& POSITIVE_INTEGER.test(env.PUBLIC_GITHUB_REPOSITORY_ID)
		&& env.PRIVATE_GITHUB_REPOSITORY_ID !== env.PUBLIC_GITHUB_REPOSITORY_ID
		&& PRIVATE_KEY.test(env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n').trim())
		&& maintainers !== null
		&& owners !== null
		&& [...owners].every(owner => maintainers.has(owner))
		&& Boolean(env.FEEDBACK_DB
			&& env.FEEDBACK_SCREENSHOTS
			&& env.REPORTER_RATE_LIMITER
			&& env.ANONYMOUS_RATE_LIMITER
			&& env.SOURCE_RATE_LIMITER);
}
