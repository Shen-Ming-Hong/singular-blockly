import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { runtimeConfigIsValid } from '../../src/domain/config';
import type { Env } from '../../src/env';

describe('production runtime configuration', () => {
	it('accepts the complete test binding set', () => {
		expect(runtimeConfigIsValid(env)).toBe(true);
	});

	it('reports healthy only after validating configuration and D1 readiness', async () => {
		const response = await exports.default.fetch(new Request('https://blockly-support.singular-ai.org/health'));
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: 'ok' });
	});

	it.each([
		['CLOUDFLARE_ACCESS_AUD', 'replace-with-production-access-audience'],
		['REPORTER_HMAC_PEPPER', 'too-short'],
		['REPORTER_HMAC_PEPPER', 'development-placeholder-change-locally'],
		['GITHUB_WEBHOOK_SECRET', 'too-short'],
		['GITHUB_WEBHOOK_SECRET', 'development-placeholder-change-locally'],
		['GITHUB_APP_ID', '0'],
		['PRIVATE_GITHUB_REPOSITORY_ID', env.PUBLIC_GITHUB_REPOSITORY_ID],
		['OWNER_ACTOR_IDS', '999'],
	] as const)('rejects an unsafe %s value', (key, value) => {
			expect(runtimeConfigIsValid({ ...env, [key]: value } as Env)).toBe(false);
	});

	it('requires independent reporter, IP, and webhook secrets', () => {
		expect(runtimeConfigIsValid({
			...env,
			IP_HMAC_PEPPER: env.REPORTER_HMAC_PEPPER,
		} as Env)).toBe(false);
	});

	it('fails readiness when the pre-authentication source limiter is not bound', () => {
		expect(runtimeConfigIsValid({
			...env,
			SOURCE_RATE_LIMITER: undefined,
		} as unknown as Env)).toBe(false);
	});
});
