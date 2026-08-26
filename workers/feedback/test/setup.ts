import { env } from 'cloudflare:workers';
import { applyD1Migrations } from 'cloudflare:test';
import { beforeAll } from 'vitest';

beforeAll(async () => {
	await applyD1Migrations(env.FEEDBACK_DB, env.TEST_MIGRATIONS);
});
