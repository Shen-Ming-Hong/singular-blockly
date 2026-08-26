import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetAccessJwksCacheForTests, verifyCloudflareAccess } from '../../src/domain/cloudflareAccess';

function base64Url(value: string | ArrayBuffer): string {
	let binary = '';
	if (typeof value === 'string') {
		binary = value;
	} else {
		for (const byte of new Uint8Array(value)) {binary += String.fromCharCode(byte);}
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function accessJwt(key: CryptoKeyPair, kid: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	const encodedHeader = base64Url(JSON.stringify({ alg: 'RS256', kid }));
	const encodedClaims = base64Url(JSON.stringify({
		aud: env.CLOUDFLARE_ACCESS_AUD,
		exp: now + 300,
		iss: `https://${env.CLOUDFLARE_ACCESS_TEAM_DOMAIN}`,
		sub: 'maintainer-test',
	}));
	const signingInput = `${encodedHeader}.${encodedClaims}`;
	const signature = await crypto.subtle.sign(
		'RSASSA-PKCS1-v1_5',
		key.privateKey,
		new TextEncoder().encode(signingInput),
	);
	return `${signingInput}.${base64Url(signature)}`;
}

describe('Cloudflare Access verification', () => {
	afterEach(() => {
		resetAccessJwksCacheForTests();
		vi.unstubAllGlobals();
	});

	it('binds the runtime fetch receiver when loading Access signing keys', async () => {
		const key = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['sign', 'verify'],
		);
		const kid = 'access-test-key';
		const publicJwk = await crypto.subtle.exportKey('jwk', key.publicKey);
		const runtimeFetch = vi.fn(async function (this: typeof globalThis) {
			if (this !== globalThis) {throw new TypeError('Illegal invocation: Function called on incorrect receiver');}
			return Response.json({ keys: [{ ...publicJwk, kid }] });
		});
		vi.stubGlobal('fetch', runtimeFetch);

		const request = new Request('https://blockly-support.singular-ai.org/admin/attachments/test', {
			headers: { 'cf-access-jwt-assertion': await accessJwt(key, kid) },
		});
		await expect(verifyCloudflareAccess(request, env)).resolves.toBe(true);
		expect(runtimeFetch).toHaveBeenCalledOnce();
	});

	it('refreshes a cached JWKS once when Access rotates to an unknown kid', async () => {
		const algorithm = {
			name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256',
		} as const;
		const oldKey = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
		const newKey = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
		const oldJwk = await crypto.subtle.exportKey('jwk', oldKey.publicKey);
		const newJwk = await crypto.subtle.exportKey('jwk', newKey.publicKey);
		const fetchImpl = vi.fn()
			.mockResolvedValueOnce(Response.json({ keys: [{ ...oldJwk, kid: 'old-key' }] }))
			.mockResolvedValueOnce(Response.json({ keys: [{ ...newJwk, kid: 'new-key' }] }));
		const request = (jwt: string) => new Request('https://blockly-support.singular-ai.org/admin/attachments/test', {
			headers: { 'cf-access-jwt-assertion': jwt },
		});

		await expect(verifyCloudflareAccess(request(await accessJwt(oldKey, 'old-key')), env, fetchImpl)).resolves.toBe(true);
		await expect(verifyCloudflareAccess(request(await accessJwt(newKey, 'new-key')), env, fetchImpl)).resolves.toBe(true);
		expect(fetchImpl).toHaveBeenCalledTimes(2);
	});
});
