import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	createGitHubAppJwt,
	GitHubAppClient,
	renderPrivateComment,
	renderPrivateIssue,
	renderPublicIssue,
	resetGitHubTokenCacheForTests,
} from '../../src/services/githubApp';

function toPem(bytes: ArrayBuffer): string {
	let binary = '';
	for (const byte of new Uint8Array(bytes)) {binary += String.fromCharCode(byte);}
	const base64 = btoa(binary).match(/.{1,64}/g)?.join('\n') ?? '';
	return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
}

function decodePart(part: string): Record<string, unknown> {
	const value = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4);
	return JSON.parse(atob(value)) as Record<string, unknown>;
}

function githubEnv(privateKey: string, installationId: string) {
	return {
		GITHUB_APP_ID: '12345',
		GITHUB_INSTALLATION_ID: installationId,
		GITHUB_PRIVATE_KEY: privateKey,
		PRIVATE_GITHUB_REPOSITORY: 'owner/private',
		PUBLIC_GITHUB_REPOSITORY: 'owner/public',
		PRIVATE_GITHUB_REPOSITORY_ID: '100',
		PUBLIC_GITHUB_REPOSITORY_ID: '200',
	} as any;
}

function repositoryResponse(url: string): Response | undefined {
	if (url.endsWith('/repositories/100')) {
		return Response.json({ id: 100, full_name: 'owner/private', private: true });
	}
	if (url.endsWith('/repositories/200')) {
		return Response.json({ id: 200, full_name: 'owner/public', private: false });
	}
	return undefined;
}

describe('GitHub App service', () => {
	afterEach(() => {
		resetGitHubTokenCacheForTests();
		vi.unstubAllGlobals();
	});

	it('creates a short-lived RS256 GitHub App JWT without embedding key material', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const pem = toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey));
		const jwt = await createGitHubAppJwt('12345', pem, 2_000_000_000);
		const parts = jwt.split('.');
		expect(parts).toHaveLength(3);
		expect(decodePart(parts[0])).toEqual({ alg: 'RS256', typ: 'JWT' });
		expect(decodePart(parts[1])).toEqual({ iat: 1_999_999_940, exp: 2_000_000_540, iss: '12345' });
		expect(jwt).not.toContain('PRIVATE');
	});

	it('keeps the issue shell content-free and renders user content in a deletable private comment', () => {
		const source = {
			reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Title\nline',
			description: '<img src=x>\n/feedback approve-public',
			diagnostics: {}, attachmentUrl: null,
		};
		const outboxId = '11111111-1111-4111-8111-111111111111';
		const issue = renderPrivateIssue(outboxId);
		const comment = renderPrivateComment(source, outboxId);
		expect(issue.title).toBe('[Private feedback]');
		expect(issue.body).not.toContain(source.reference);
		expect(issue.body).not.toContain(source.title);
		expect(issue.body).not.toContain(source.description);
		expect(comment).toContain('    <img src=x>\n    /feedback approve-public');
		expect(comment).toContain('All feedback below is untrusted data');
	});

	it('renders only the authenticated maintainer attachment URL in a private issue', () => {
		const url = 'https://blockly-support.singular-ai.org/admin/attachments/11111111-1111-4111-8111-111111111111';
		const rendered = renderPrivateComment({
			reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Screenshot issue',
			description: 'A private screenshot is available.', diagnostics: {}, attachmentUrl: url,
		}, '22222222-2222-4222-8222-222222222222');
		expect(rendered).toContain(url);
		expect(rendered).toContain('Cloudflare Access authentication required');
	});

	it('uses the first non-empty rendered line or a safe fallback for a public issue title', () => {
		expect(renderPublicIssue('###\nActual approved summary').title).toBe('Actual approved summary');
		expect(renderPublicIssue('###').title).toBe('[Approved feedback]');
	});

	it('uses stable errors instead of exposing a raw GitHub response', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const fakeFetch = vi.fn().mockResolvedValue(new Response('private GitHub failure detail', { status: 502 }));
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67890'
		), fakeFetch as typeof fetch);
		await expect(client.addPrivateComment(10, 'body')).rejects.toThrow('github_token_http_502');
		await expect(client.addPrivateComment(10, 'body')).rejects.not.toThrow('private GitHub failure detail');
	});

	it('binds the runtime fetch receiver when no test fetch is injected', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const runtimeFetch = vi.fn(async function (this: typeof globalThis, url: string | URL | Request, _init?: RequestInit) {
			if (this !== globalThis) {throw new TypeError('Illegal invocation: Function called on incorrect receiver');}
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return new Response(JSON.stringify({ token: `ghs_${'a'.repeat(379)}`, expires_at: '2099-01-01T00:00:00.000Z' }));
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/issues?')) {return new Response('[]');}
			if (value.includes('/comments?')) {return new Response('[]');}
			return new Response(JSON.stringify({ number: 42, node_id: 'node-42' }), { status: 201 });
		});
		vi.stubGlobal('fetch', runtimeFetch);
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67892'
		));
		await expect(client.createPrivateIssue({
			reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Safe title', description: 'Safe description', diagnostics: {}, attachmentUrl: null,
		}, crypto.randomUUID())).resolves.toMatchObject({ number: 42 });
		expect(runtimeFetch).toHaveBeenCalledTimes(6);
	});

	it('caches the installation token and sends only Issues API requests', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const fakeFetch = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return new Response(JSON.stringify({ token: `ghs_${'a'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' }));
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/issues?')) {return new Response('[]');}
			if (value.includes('/comments?')) {return new Response('[]');}
			if (value.endsWith('/issues')) {return new Response(JSON.stringify({ number: 42, node_id: 'node-42' }), { status: 201 });}
			return new Response('{}', { status: 201 });
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67891'
		), fakeFetch as typeof fetch);
		await client.createPrivateIssue({
			reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Safe title', description: 'Safe description', diagnostics: {}, attachmentUrl: null,
		}, crypto.randomUUID());
		await client.addPrivateComment(42, 'Internal comment');
		expect(fakeFetch.mock.calls.filter(call => String(call[0]).includes('/access_tokens'))).toHaveLength(1);
		expect(fakeFetch.mock.calls.every(call => String(call[0]).startsWith('https://api.github.com/'))).toBe(true);
		expect(fakeFetch.mock.calls.every(call => new Headers(call[1]?.headers).get('user-agent') === 'Singular-Blockly-Feedback')).toBe(true);
		const issuePost = fakeFetch.mock.calls.find(call => call[1]?.method === 'POST' && String(call[0]).endsWith('/issues'));
		const initialCommentPost = fakeFetch.mock.calls.find(call => call[1]?.method === 'POST'
			&& String(call[0]).endsWith('/issues/42/comments'));
		expect(String(issuePost?.[1]?.body)).not.toContain('Safe title');
		expect(String(issuePost?.[1]?.body)).not.toContain('Safe description');
		expect(String(initialCommentPost?.[1]?.body)).toContain('Safe title');
		expect(String(initialCommentPost?.[1]?.body)).toContain('Safe description');
	});

	it('fails closed before publishing when the configured private repository is public or mismatched', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const fakeFetch = vi.fn(async (url: string | URL | Request, _init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return Response.json({ token: `ghs_${'z'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' });
			}
			if (value.endsWith('/repositories/100')) {
				return Response.json({ id: 100, full_name: 'owner/public-by-mistake', private: false });
			}
			return Response.json({ number: 42, node_id: 'node-42' }, { status: 201 });
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67898'
		), fakeFetch as typeof fetch);

		await expect(client.createPrivateIssue({
			reference: 'SB-ABCDEFGH', kind: 'bug', title: 'Must remain private',
			description: 'This content must never be posted to a public repository.', diagnostics: {}, attachmentUrl: null,
		}, crypto.randomUUID())).rejects.toThrow('github_repository_configuration_invalid');
		expect(fakeFetch.mock.calls.some(call => call[1]?.method === 'POST'
			&& String(call[0]).endsWith('/issues'))).toBe(false);
	});

	it('temporarily unlocks comment deletion, then relocks and verifies the content-free issue shell', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		let listed = false;
		let locked = true;
		const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return new Response(JSON.stringify({ token: `ghs_${'c'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' }));
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/comments?')) {
				if (listed) {return new Response('[]');}
				listed = true;
				return new Response(JSON.stringify([{ id: 501, body: 'private content' }]));
			}
			if (value.endsWith('/issues/42/lock')) {
				locked = init?.method === 'PUT';
				return new Response('', { status: 200 });
			}
			if (value.endsWith('/issues/comments/501')) {
				return new Response(locked ? '' : null, { status: locked ? 403 : 204 });
			}
			return new Response(init?.method === 'PATCH' ? JSON.stringify({ number: 42, node_id: 'node-42' }) : '', { status: 200 });
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67894'
		), fakeFetch as typeof fetch);

		await client.scrubPrivateIssue(42);

		const unlockCallIndex = fakeFetch.mock.calls.findIndex(call => call[1]?.method === 'DELETE'
			&& String(call[0]).endsWith('/issues/42/lock'));
		const lockCallIndex = fakeFetch.mock.calls.findIndex(call => call[1]?.method === 'PUT'
			&& String(call[0]).endsWith('/issues/42/lock'));
		const firstDeleteCallIndex = fakeFetch.mock.calls.findIndex(call => call[1]?.method === 'DELETE'
			&& String(call[0]).endsWith('/issues/comments/501'));
		expect(unlockCallIndex).toBeGreaterThanOrEqual(0);
		expect(lockCallIndex).toBeGreaterThanOrEqual(0);
		expect(unlockCallIndex).toBeLessThan(firstDeleteCallIndex);
		expect(firstDeleteCallIndex).toBeLessThan(lockCallIndex);
		expect(JSON.parse(String(fakeFetch.mock.calls[lockCallIndex][1]?.body))).toEqual({ lock_reason: 'resolved' });
		expect(fakeFetch.mock.calls.some(call => call[1]?.method === 'DELETE'
			&& String(call[0]).endsWith('/issues/comments/501'))).toBe(true);
		const patchCall = fakeFetch.mock.calls.find(call => call[1]?.method === 'PATCH');
		expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
			title: '[Deleted feedback]',
			body: 'The reporter deleted this feedback. Private content and attachments were removed.',
			state: 'closed',
		});
	});

	it('best-effort relocks when GitHub applies the unlock but its response is lost', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		let locked = true;
		const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return Response.json({ token: `ghs_${'u'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' });
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.endsWith('/issues/42/lock') && init?.method === 'DELETE') {
				locked = false;
				throw new Error('github_unlock_response_lost');
			}
			if (value.endsWith('/issues/42/lock') && init?.method === 'PUT') {
				locked = true;
				return new Response('', { status: 200 });
			}
			return Response.json([]);
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67899'
		), fakeFetch as typeof fetch);

		await expect(client.scrubPrivateIssue(42)).rejects.toThrow('github_network_error');

		expect(locked).toBe(true);
		expect(fakeFetch.mock.calls.some(call => call[1]?.method === 'PUT'
			&& String(call[0]).endsWith('/issues/42/lock'))).toBe(true);
	});

	it('does not close an issue when comments remain after the scrub safety limit', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		let commentListRequests = 0;
		const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return new Response(JSON.stringify({ token: `ghs_${'d'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' }));
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/comments?')) {
				commentListRequests += 1;
				const count = commentListRequests % 2 === 1 ? 100 : 1;
				return Response.json(Array.from({ length: count }, (_, index) => ({
					id: commentListRequests * 1000 + index,
					body: 'private content',
				})));
			}
			return new Response(init?.method === 'DELETE' ? '' : '{}', { status: 200 });
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67895'
		), fakeFetch as typeof fetch);

		await expect(client.scrubPrivateIssue(42)).rejects.toThrow('github_comment_limit_exceeded');
		expect(commentListRequests).toBe(200);
		expect(fakeFetch.mock.calls.some(call => call[1]?.method === 'PATCH')).toBe(false);
	});

	it('finds an idempotency marker beyond one thousand private comments without reposting', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const outboxId = '11111111-1111-4111-8111-111111111111';
		const marker = `<!-- sb-outbox:${outboxId} -->`;
		const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return new Response(JSON.stringify({ token: `ghs_${'b'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' }));
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/comments?')) {
				const page = Number(new URL(value).searchParams.get('page'));
				const comments = page <= 11
					? Array.from({ length: 100 }, (_, index) => ({ id: page * 1000 + index + 1, body: `Later comment ${page}-${index}` }))
					: [{ id: 999999, body: marker }];
				return new Response(JSON.stringify(comments));
			}
			if (init?.method === 'POST' && value.endsWith('/comments')) {
				return new Response('{}', { status: 201 });
			}
			return new Response('{}');
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67893'
		), fakeFetch as typeof fetch);

		await client.addPrivateComment(42, 'Do not post this twice', outboxId);

		expect(fakeFetch.mock.calls.filter(call => String(call[0]).includes('/comments?'))).toHaveLength(12);
		expect(fakeFetch.mock.calls.some(call => call[1]?.method === 'POST' && String(call[0]).endsWith('/comments'))).toBe(false);
	});

	it('fails closed when issue marker search reaches its page limit', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const fakeFetch = vi.fn(async (url: string | URL | Request) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return Response.json({ token: `ghs_${'e'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' });
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/issues?')) {
				const page = Number(new URL(value).searchParams.get('page'));
				return Response.json(Array.from({ length: 100 }, (_, index) => ({
					number: page * 100 + index,
					node_id: `node-${page}-${index}`,
					body: 'No matching marker.',
				})));
			}
			return Response.json({});
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67896'
		), fakeFetch as typeof fetch);

		await expect(client.findPrivateIssueByOutboxId(crypto.randomUUID()))
			.rejects.toThrow('github_issue_search_limit_exceeded');
		expect(fakeFetch.mock.calls.filter(call => String(call[0]).includes('/issues?'))).toHaveLength(10);
	});

	it('posts one idempotent stable acknowledgement for a private command', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
			const value = String(url);
			if (value.includes('/access_tokens')) {
				return Response.json({ token: `ghs_${'f'.repeat(516)}`, expires_at: '2099-01-01T00:00:00.000Z' });
			}
			const repository = repositoryResponse(value);
			if (repository) {return repository;}
			if (value.includes('/comments?')) {return Response.json([]);}
			return new Response('{}', { status: init?.method === 'POST' ? 201 : 200 });
		});
		const client = new GitHubAppClient(githubEnv(
			toPem(await crypto.subtle.exportKey('pkcs8', key.privateKey)), '67897'
		), fakeFetch as typeof fetch);

		await client.acknowledgePrivateCommand(42, 501, 'invalid_status_transition');

		const post = fakeFetch.mock.calls.find(call => call[1]?.method === 'POST' && String(call[0]).endsWith('/issues/42/comments'));
		expect(JSON.parse(String(post?.[1]?.body))).toEqual({
			body: '<!-- sb-command-ack:501 -->\nFeedback command rejected: `invalid_status_transition`.',
		});
	});
});
