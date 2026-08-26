import { describe, expect, it } from 'vitest';
import {
	apiError,
	isRequestTooLarge,
	jsonResponse,
	MAX_REQUEST_BYTES,
	readRequestBytes,
	RequestTooLargeError,
} from '../../src/domain/http';

describe('HTTP safety helpers', () => {
	it('adds no-store, nosniff and restrictive CSP to JSON responses', async () => {
		const response = jsonResponse({ ok: true });
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
		expect(await response.json()).toEqual({ ok: true });
	});

	it('returns stable errors without raw exception content', async () => {
		const response = apiError(500, 'internal_error', 'Request failed');
		expect(await response.json()).toEqual({ error: { code: 'internal_error', message: 'Request failed' } });
	});

	it('rejects invalid or oversized declared content lengths', () => {
		expect(isRequestTooLarge(new Request('https://example.test', { headers: { 'content-length': String(MAX_REQUEST_BYTES) } }))).toBe(false);
		expect(isRequestTooLarge(new Request('https://example.test', { headers: { 'content-length': String(MAX_REQUEST_BYTES + 1) } }))).toBe(true);
		expect(isRequestTooLarge(new Request('https://example.test', { headers: { 'content-length': 'not-a-number' } }))).toBe(true);
	});

	it('enforces the body limit when content-length is missing', async () => {
		const request = new Request('https://example.test', { method: 'POST', body: new Uint8Array([1, 2, 3, 4]) });
		request.headers.delete('content-length');
		await expect(readRequestBytes(request, 3)).rejects.toBeInstanceOf(RequestTooLargeError);
	});

	it('returns an exact bounded body without trusting declared length', async () => {
		const request = new Request('https://example.test', { method: 'POST', body: 'safe' });
		request.headers.delete('content-length');
		expect([...await readRequestBytes(request, 4)]).toEqual([...new TextEncoder().encode('safe')]);
	});
});
