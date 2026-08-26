import { describe, expect, it } from 'vitest';
import {
	createHmac,
	createRandomToken,
	isAllowedOrigin,
	parseBearerSecret,
	verifyHmac,
} from '../../src/domain/auth';

describe('feedback authentication primitives', () => {
	it('creates 256-bit base64url tokens without padding', () => {
		const token = createRandomToken();
		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(createRandomToken()).not.toBe(token);
	});

	it('stores and verifies only keyed HMAC values', async () => {
		const pepper = 'server-pepper-value-at-least-32-bytes';
		const otherPepper = 'different-pepper-value-at-least-32-bytes';
		const digest = await createHmac('reporter-secret', pepper);
		expect(digest).toMatch(/^[A-Za-z0-9_-]{43}$/);
		expect(digest).not.toContain('reporter-secret');
		expect(await verifyHmac('reporter-secret', digest, pepper)).toBe(true);
		expect(await verifyHmac('different-secret', digest, pepper)).toBe(false);
		expect(await verifyHmac('reporter-secret', digest, otherPepper)).toBe(false);
	});

	it('rejects short HMAC key material', async () => {
		await expect(createHmac('reporter-secret', 'short')).rejects.toThrow('invalid_hmac_key');
	});

	it('accepts a single bounded bearer secret', () => {
		const secret = createRandomToken();
			expect(parseBearerSecret(`Bearer ${secret}`)).toBe(secret);
			expect(parseBearerSecret(`Bearer ${secret}A`)).toBeNull();
		expect(parseBearerSecret(undefined)).toBeNull();
		expect(parseBearerSecret('Basic abc')).toBeNull();
		expect(parseBearerSecret('Bearer too-short')).toBeNull();
		expect(parseBearerSecret(`Bearer ${secret} extra`)).toBeNull();
	});

	it('requires exact same-origin matches for browser mutations', () => {
		expect(isAllowedOrigin('https://blockly-support.singular-ai.org', 'https://blockly-support.singular-ai.org')).toBe(true);
		expect(isAllowedOrigin('https://blockly-support.singular-ai.org.evil.test', 'https://blockly-support.singular-ai.org')).toBe(false);
		expect(isAllowedOrigin(null, 'https://blockly-support.singular-ai.org')).toBe(false);
	});
});
