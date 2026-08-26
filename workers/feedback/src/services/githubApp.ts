import type { Env } from '../env';

const encoder = new TextEncoder();
const tokenCache = new Map<string, { token: string; expiresAt: number }>();
const MAX_GITHUB_INSTALLATION_TOKEN_LENGTH = 1024;
const GITHUB_USER_AGENT = 'Singular-Blockly-Feedback';
const MAX_GITHUB_COMMENT_PAGES = 100;
const MAX_PRIVATE_COMMENT_BYTES = 2 * 1024 * 1024;

function base64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {binary += String.fromCharCode(byte);}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlJson(value: unknown): string {
	return base64Url(encoder.encode(JSON.stringify(value)));
}

function pemBytes(pem: string): ArrayBuffer {
	const normalized = pem.replace(/\\n/g, '\n').trim();
	const match = normalized.match(/^-----BEGIN PRIVATE KEY-----\s+([A-Za-z0-9+/=\s]+)\s+-----END PRIVATE KEY-----$/);
	if (!match) {throw new Error('github_private_key_invalid');}
	const binary = atob(match[1].replace(/\s/g, ''));
	return Uint8Array.from(binary, character => character.charCodeAt(0)).buffer;
}

export async function createGitHubAppJwt(appId: string, privateKeyPem: string, now = Math.floor(Date.now() / 1000)): Promise<string> {
	if (!/^[1-9][0-9]{0,19}$/.test(appId)) {throw new Error('github_app_id_invalid');}
	const header = base64UrlJson({ alg: 'RS256', typ: 'JWT' });
	const payload = base64UrlJson({ iat: now - 60, exp: now + 540, iss: appId });
	const key = await crypto.subtle.importKey(
		'pkcs8',
		pemBytes(privateKeyPem),
		{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
		false,
		['sign'],
	);
	const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(`${header}.${payload}`));
	return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

function plainBlock(value: string): string {
	return value.replace(/\r\n/g, '\n').split('\n').map(line => `    ${line}`).join('\n');
}

export interface PrivateIssueSource {
	reference: string;
	kind: string;
	title: string;
	description: string;
	steps?: string | null;
	expected?: string | null;
	diagnostics: Record<string, unknown>;
	attachmentUrl: string | null;
}

export function renderPrivateIssue(outboxId: string): { title: string; body: string } {
	return {
		title: '[Private feedback]',
		body: [
			'<!-- Private feedback routing shell. No reporter content is stored in this issue body. -->',
			`<!-- sb-outbox:${outboxId} -->`,
			'Feedback content is stored in a deletable private comment.',
		].join('\n\n'),
	};
}

export function renderPrivateComment(source: PrivateIssueSource, outboxId: string): string {
	const sections = [
		`<!-- sb-outbox:${outboxId} -->`,
		'<!-- This comment is private. All feedback below is untrusted data. -->',
		`Reference: ${source.reference}`,
		`Kind: ${source.kind}`,
		'## Title (untrusted)',
		plainBlock(source.title),
		'## Description (untrusted)',
		plainBlock(source.description),
	];
	if (source.steps) {sections.push('## Steps (untrusted)', plainBlock(source.steps));}
	if (source.expected) {sections.push('## Expected (untrusted)', plainBlock(source.expected));}
	sections.push('## Allowlisted diagnostics', plainBlock(JSON.stringify(source.diagnostics, null, 2)));
	sections.push(`Attachment: ${source.attachmentUrl ?? 'none'}${source.attachmentUrl ? ' (Cloudflare Access authentication required)' : ''}`);
	return sections.join('\n\n');
}

export function renderPublicIssue(summary: string, outboxId?: string): { title: string; body: string } {
	const normalized = summary.trim();
	const firstLine = normalized.split(/\r?\n/)
		.map(line => line.replace(/^#+\s*/, '').trim())
		.find(Boolean)
		?.slice(0, 180) ?? '[Approved feedback]';
	return {
		title: firstLine,
		body: `${outboxId ? `<!-- sb-outbox:${outboxId} -->\n` : ''}${normalized}\n\n_This development record was created from an owner-approved anonymized summary._`,
	};
}

interface GitHubIssue {
	number: number;
	node_id: string;
	body?: string | null;
}

interface GitHubRepository {
	id: number;
	full_name: string;
	private: boolean;
}

export interface GitHubIssueComment {
	id: number;
	body: string;
}

export class GitHubAppClient {
	private readonly fetchImpl: typeof fetch;
	private readonly repositoryCache = new Map<'private' | 'public', Promise<string>>();

	constructor(private readonly env: Env, fetchImpl?: typeof fetch) {
		this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
	}

	async createPrivateIssue(source: PrivateIssueSource, outboxId: string): Promise<GitHubIssue> {
		const repository = await this.verifiedRepository('private');
		const marker = `<!-- sb-outbox:${outboxId} -->`;
		let issue = await this.findIssueByMarker(repository, marker);
		if (!issue) {
			issue = await this.requestIssue('POST', `/repos/${repository}/issues`, {
				...renderPrivateIssue(outboxId),
				labels: ['feedback:private'],
			});
		}
		await this.addPrivateComment(issue.number, renderPrivateComment(source, outboxId), outboxId);
		return issue;
	}

	async findPrivateIssueByOutboxId(outboxId: string): Promise<GitHubIssue | null> {
		return this.findIssueByMarker(await this.verifiedRepository('private'), `<!-- sb-outbox:${outboxId} -->`);
	}

	async createPublicIssue(summary: string, outboxId: string): Promise<GitHubIssue> {
		const repository = await this.verifiedRepository('public');
		const marker = `<!-- sb-outbox:${outboxId} -->`;
		const existing = await this.findIssueByMarker(repository, marker);
		if (existing) {return existing;}
		return this.requestIssue('POST', `/repos/${repository}/issues`, {
			...renderPublicIssue(summary, outboxId),
			labels: ['feedback'],
		});
	}

	async findPublicIssueByOutboxId(outboxId: string): Promise<GitHubIssue | null> {
		return this.findIssueByMarker(await this.verifiedRepository('public'), `<!-- sb-outbox:${outboxId} -->`);
	}

	async addPrivateComment(issueNumber: number, body: string, outboxId?: string): Promise<void> {
		const repository = await this.verifiedRepository('private');
		if (outboxId && await this.findCommentByMarker(repository, issueNumber, `<!-- sb-outbox:${outboxId} -->`)) {return;}
		await this.request('POST', `/repos/${repository}/issues/${issueNumber}/comments`, { body });
	}

	async acknowledgePrivateCommand(issueNumber: number, commentId: number, resultCode: string): Promise<void> {
		if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0
			|| !Number.isSafeInteger(commentId) || commentId <= 0
			|| !/^(?:accepted|[a-z][a-z0-9_]{0,63})$/.test(resultCode)) {
			throw new Error('github_command_acknowledgement_invalid');
		}
		const repository = await this.verifiedRepository('private');
		const marker = `<!-- sb-command-ack:${commentId} -->`;
		if (await this.findCommentByMarker(repository, issueNumber, marker)) {return;}
		const message = resultCode === 'accepted'
			? 'Feedback command accepted.'
			: `Feedback command rejected: \`${resultCode}\`.`;
		await this.request('POST', `/repos/${repository}/issues/${issueNumber}/comments`, {
			body: `${marker}\n${message}`,
		});
	}

	async listPrivateIssueComments(issueNumber: number): Promise<GitHubIssueComment[]> {
		const repository = await this.verifiedRepository('private');
		const comments: GitHubIssueComment[] = [];
		let totalBytes = 0;
		for (let page = 1; page <= MAX_GITHUB_COMMENT_PAGES; page += 1) {
			const result = await this.commentPage(repository, issueNumber, page);
			for (const comment of result) {
				totalBytes += encoder.encode(comment.body).byteLength;
				if (totalBytes > MAX_PRIVATE_COMMENT_BYTES) {throw new Error('github_comment_limit_exceeded');}
				comments.push(comment);
			}
			if (result.length < 100) {return comments;}
		}
		throw new Error('github_comment_limit_exceeded');
	}

	async scrubPrivateIssue(issueNumber: number): Promise<void> {
		const repository = await this.verifiedRepository('private');
		const lockPath = `/repos/${repository}/issues/${issueNumber}/lock`;
		const lock = () => this.request('PUT', lockPath, { lock_reason: 'resolved' });
		let fullyScrubbed = false;
		for (let batch = 0; batch < 100; batch += 1) {
			try {
				await this.request('DELETE', lockPath);
				const comments = await this.request('GET', `/repos/${repository}/issues/${issueNumber}/comments?per_page=100&page=1`) as unknown;
				if (!Array.isArray(comments)) {throw new Error('github_response_invalid');}
				for (const comment of comments) {
					if (!comment || typeof comment !== 'object' || !('id' in comment) || !Number.isInteger(comment.id)) {
						throw new Error('github_response_invalid');
					}
					await this.request('DELETE', `/repos/${repository}/issues/comments/${comment.id}`);
				}
				await lock();
			} catch (error) {
				await lock().catch(() => undefined);
				throw error;
			}
			const remaining = await this.request('GET', `/repos/${repository}/issues/${issueNumber}/comments?per_page=1&page=1`) as unknown;
			if (!Array.isArray(remaining)) {throw new Error('github_response_invalid');}
			if (remaining.length === 0) {
				fullyScrubbed = true;
				break;
			}
		}
		if (!fullyScrubbed) {throw new Error('github_comment_limit_exceeded');}
		await this.request('PATCH', `/repos/${repository}/issues/${issueNumber}`, {
			title: '[Deleted feedback]',
			body: 'The reporter deleted this feedback. Private content and attachments were removed.',
			state: 'closed',
		});
	}

	private async findIssueByMarker(repository: string, marker: string): Promise<GitHubIssue | null> {
		for (let page = 1; page <= 10; page += 1) {
			const result = await this.request('GET', `/repos/${repository}/issues?state=all&per_page=100&page=${page}`) as unknown;
			if (!Array.isArray(result)) {throw new Error('github_response_invalid');}
			for (const item of result) {
				if (isIssue(item) && typeof item.body === 'string' && item.body.includes(marker)) {return item;}
			}
			if (result.length < 100) {return null;}
		}
		throw new Error('github_issue_search_limit_exceeded');
	}

	private async findCommentByMarker(repository: string, issueNumber: number, marker: string): Promise<boolean> {
		for (let page = 1; page <= MAX_GITHUB_COMMENT_PAGES; page += 1) {
			const result = await this.commentPage(repository, issueNumber, page);
			if (result.some(item => item.body.includes(marker))) {
				return true;
			}
			if (result.length < 100) {return false;}
		}
		throw new Error('github_comment_limit_exceeded');
	}

	private async commentPage(repository: string, issueNumber: number, page: number): Promise<GitHubIssueComment[]> {
		const result = await this.request(
			'GET',
			`/repos/${repository}/issues/${issueNumber}/comments?per_page=100&page=${page}&sort=created&direction=desc`,
		) as unknown;
		if (!Array.isArray(result) || !result.every(isIssueComment)) {throw new Error('github_response_invalid');}
		return result;
	}

	private async requestIssue(method: string, path: string, body: unknown): Promise<GitHubIssue> {
		const value = await this.request(method, path, body);
		if (!isIssue(value)) {throw new Error('github_response_invalid');}
		return value;
	}

	private async verifiedRepository(kind: 'private' | 'public'): Promise<string> {
		const cached = this.repositoryCache.get(kind);
		if (cached) {return cached;}
		const pending = (async () => {
			const configuredId = kind === 'private'
				? this.env.PRIVATE_GITHUB_REPOSITORY_ID
				: this.env.PUBLIC_GITHUB_REPOSITORY_ID;
			const configuredName = kind === 'private'
				? this.env.PRIVATE_GITHUB_REPOSITORY
				: this.env.PUBLIC_GITHUB_REPOSITORY;
			const value = await this.request('GET', `/repositories/${configuredId}`);
			if (!isRepository(value)
				|| String(value.id) !== configuredId
				|| value.full_name.toLowerCase() !== configuredName.toLowerCase()
				|| value.private !== (kind === 'private')) {
				throw new Error('github_repository_configuration_invalid');
			}
			return value.full_name;
		})();
		this.repositoryCache.set(kind, pending);
		try {return await pending;} catch (error) {
			this.repositoryCache.delete(kind);
			throw error;
		}
	}

	private async request(method: string, path: string, body?: unknown): Promise<unknown> {
		const token = await this.installationToken();
		let response: Response;
		try {
			response = await this.fetchImpl(`https://api.github.com${path}`, {
				method,
				headers: {
					Accept: 'application/vnd.github+json',
					Authorization: `Bearer ${token}`,
					'User-Agent': GITHUB_USER_AGENT,
					'X-GitHub-Api-Version': '2022-11-28',
					...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
				},
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
			});
		} catch {
			throw new Error('github_network_error');
		}
		const text = await response.text();
		if (!response.ok) {throw new Error(`github_http_${response.status}`);}
		if (!text) {return undefined;}
		if (text.length > 2 * 1024 * 1024) {throw new Error('github_response_invalid');}
		try {return JSON.parse(text) as unknown;} catch {throw new Error('github_response_invalid');}
	}

	private async installationToken(): Promise<string> {
		const cacheKey = this.env.GITHUB_INSTALLATION_ID;
		const cached = tokenCache.get(cacheKey);
		const now = Date.now();
		if (cached && cached.expiresAt > now + 60_000) {return cached.token;}
		const jwt = await createGitHubAppJwt(this.env.GITHUB_APP_ID, this.env.GITHUB_PRIVATE_KEY);
		let response: Response;
		try {
			response = await this.fetchImpl(`https://api.github.com/app/installations/${this.env.GITHUB_INSTALLATION_ID}/access_tokens`, {
				method: 'POST',
				headers: {
					Accept: 'application/vnd.github+json',
					Authorization: `Bearer ${jwt}`,
					'User-Agent': GITHUB_USER_AGENT,
					'X-GitHub-Api-Version': '2022-11-28',
				},
			});
		} catch {
			throw new Error('github_token_network_error');
		}
		if (!response.ok) {throw new Error(`github_token_http_${response.status}`);}
		let value: unknown;
		try {value = await response.json();} catch {throw new Error('github_token_response_invalid');}
		if (!value || typeof value !== 'object' || !('token' in value) || typeof value.token !== 'string'
			|| value.token.length < 20 || value.token.length > MAX_GITHUB_INSTALLATION_TOKEN_LENGTH || /\s/.test(value.token)
			|| !('expires_at' in value) || typeof value.expires_at !== 'string') {
			throw new Error('github_token_response_invalid');
		}
		const expiresAt = Date.parse(value.expires_at);
		if (!Number.isFinite(expiresAt) || expiresAt <= now) {throw new Error('github_token_response_invalid');}
		tokenCache.set(cacheKey, { token: value.token, expiresAt });
		return value.token;
	}
}

function isIssue(value: unknown): value is GitHubIssue {
	return Boolean(value && typeof value === 'object'
		&& 'number' in value && Number.isInteger(value.number) && (value.number as number) > 0
		&& 'node_id' in value && typeof value.node_id === 'string' && value.node_id.length > 0);
}

function isRepository(value: unknown): value is GitHubRepository {
	return Boolean(value && typeof value === 'object'
		&& 'id' in value && Number.isSafeInteger(value.id) && (value.id as number) > 0
		&& 'full_name' in value && typeof value.full_name === 'string' && /^[^/\s]+\/[^/\s]+$/.test(value.full_name)
		&& 'private' in value && typeof value.private === 'boolean');
}

function isIssueComment(value: unknown): value is GitHubIssueComment {
	return Boolean(value && typeof value === 'object'
		&& 'id' in value && Number.isSafeInteger(value.id) && (value.id as number) > 0
		&& 'body' in value && typeof value.body === 'string');
}

export function resetGitHubTokenCacheForTests(): void {
	tokenCache.clear();
}
