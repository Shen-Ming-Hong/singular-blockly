import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
	const migrations = await readD1Migrations('workers/feedback/migrations');
	return {
	plugins: [
		cloudflareTest({
			wrangler: {
				configPath: 'workers/feedback/wrangler.jsonc',
			},
			miniflare: {
				bindings: {
					TEST_MIGRATIONS: migrations,
					SERVICE_ORIGIN: 'https://blockly-support.singular-ai.org',
					CLOUDFLARE_ACCESS_TEAM_DOMAIN: 'singular-ai.cloudflareaccess.com',
					CLOUDFLARE_ACCESS_AUD: 'test-access-audience',
					REPORTER_HMAC_PEPPER: 'test-reporter-pepper-value-32-bytes',
					IP_HMAC_PEPPER: 'test-ip-pepper-value-32-bytes-long',
					GITHUB_APP_ID: '123',
					GITHUB_INSTALLATION_ID: '456',
					GITHUB_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ndGVzdC1vbmx5LWtleS1tYXRlcmlhbC1ub3QtcmVhbA==\n-----END PRIVATE KEY-----',
					GITHUB_WEBHOOK_SECRET: 'test-webhook-secret-value-32-bytes',
					PRIVATE_GITHUB_REPOSITORY_ID: '100',
					PUBLIC_GITHUB_REPOSITORY_ID: '200',
					MAINTAINER_ACTOR_IDS: '300,301',
					OWNER_ACTOR_IDS: '301',
				},
			},
		}),
	],
	test: {
		include: ['workers/feedback/test/**/*.test.ts'],
		setupFiles: ['workers/feedback/test/setup.ts'],
	},
	};
});
