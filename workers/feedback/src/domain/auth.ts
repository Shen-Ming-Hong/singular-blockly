const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array | null {
	if (!/^[A-Za-z0-9_-]+$/.test(value)) {
		return null;
	}
	try {
		const padding = '='.repeat((4 - value.length % 4) % 4);
		const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + padding);
		return Uint8Array.from(binary, character => character.charCodeAt(0));
	} catch {
		return null;
	}
}

async function importHmacKey(keyMaterial: string, usage: KeyUsage[]): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(keyMaterial),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		usage
	);
}

export function createRandomToken(byteLength = 32): string {
	if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 64) {
		throw new Error('invalid_token_size');
	}
	return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function createHmac(value: string, keyMaterial: string): Promise<string> {
	if (encoder.encode(keyMaterial).byteLength < 32) {
		throw new Error('invalid_hmac_key');
	}
	const key = await importHmacKey(keyMaterial, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	return toBase64Url(new Uint8Array(signature));
}

export async function verifyHmac(value: string, signature: string, keyMaterial: string): Promise<boolean> {
	const signatureBytes = fromBase64Url(signature);
	if (!signatureBytes || signatureBytes.byteLength !== 32 || encoder.encode(keyMaterial).byteLength < 32) {
		return false;
	}
	const key = await importHmacKey(keyMaterial, ['verify']);
	return crypto.subtle.verify('HMAC', key, Uint8Array.from(signatureBytes).buffer, encoder.encode(value));
}

export function parseBearerSecret(header: string | null | undefined): string | null {
	if (!header) {
		return null;
	}
	const match = header.match(/^Bearer ([A-Za-z0-9_-]{43})$/);
	return match?.[1] ?? null;
}

export function isAllowedOrigin(origin: string | null, serviceOrigin: string): boolean {
	if (!origin) {
		return false;
	}
	try {
		return new URL(origin).origin === new URL(serviceOrigin).origin;
	} catch {
		return false;
	}
}

export interface SessionCredentials {
	sessionToken: string;
	csrfToken: string;
	expiresAt: number;
}

export function createSessionCredentials(nowSeconds: number, lifetimeSeconds = 86400): SessionCredentials {
	const boundedLifetime = Math.min(Math.max(Math.floor(lifetimeSeconds), 60), 86400);
	return {
		sessionToken: createRandomToken(),
		csrfToken: createRandomToken(),
		expiresAt: Math.floor(nowSeconds) + boundedLifetime,
	};
}
