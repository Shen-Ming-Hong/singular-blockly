declare namespace Cloudflare {
	interface Env {
		REPORTER_HMAC_PEPPER: string;
		IP_HMAC_PEPPER: string;
		GITHUB_APP_ID: string;
		GITHUB_INSTALLATION_ID: string;
		GITHUB_PRIVATE_KEY: string;
		GITHUB_WEBHOOK_SECRET: string;
		PRIVATE_GITHUB_REPOSITORY_ID: string;
		PUBLIC_GITHUB_REPOSITORY_ID: string;
		MAINTAINER_ACTOR_IDS: string;
		OWNER_ACTOR_IDS: string;
		TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
	}

	interface GlobalProps {
		mainModule: typeof import('../src/index');
	}
}
