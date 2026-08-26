const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
	'Cache-Control': 'no-store',
	'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
	'Cross-Origin-Resource-Policy': 'same-origin',
	'Referrer-Policy': 'no-referrer',
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
});

export const MAX_REQUEST_BYTES = 4 * 1024 * 1024;

export class RequestTooLargeError extends Error {
	constructor() {
		super('request_too_large');
		this.name = 'RequestTooLargeError';
	}
}

export function withSecurityHeaders(headers?: HeadersInit): Headers {
	const result = new Headers(headers);
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		result.set(name, value);
	}
	return result;
}

export function jsonResponse(value: unknown, status = 200, headers?: HeadersInit): Response {
	const responseHeaders = withSecurityHeaders(headers);
	responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
	return Response.json(value, { status, headers: responseHeaders });
}

export function apiError(status: number, code: string, message: string, field?: string): Response {
	return jsonResponse({
		error: {
			code,
			message,
			...(field ? { field } : {}),
		},
	}, status);
}

export function rateLimitError(retryAfter = 60): Response {
	return jsonResponse(
		{ error: { code: 'rate_limited', message: 'Too many requests' } },
		429,
		{ 'Retry-After': String(Math.max(1, Math.floor(retryAfter))) },
	);
}

export function isRequestTooLarge(request: Request): boolean {
	const contentLength = request.headers.get('content-length');
	if (!contentLength) {
		return false;
	}
	const parsed = Number(contentLength);
	return !Number.isFinite(parsed) || parsed < 0 || parsed > MAX_REQUEST_BYTES;
}

export async function readRequestBytes(request: Request, maxBytes = MAX_REQUEST_BYTES): Promise<Uint8Array> {
	if (!Number.isInteger(maxBytes) || maxBytes < 0 || isRequestTooLarge(request)) {
		throw new RequestTooLargeError();
	}
	if (!request.body) {return new Uint8Array();}

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {break;}
			total += value.byteLength;
			if (total > maxBytes) {
				await reader.cancel();
				throw new RequestTooLargeError();
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

export async function readRequestText(request: Request, maxBytes = MAX_REQUEST_BYTES): Promise<string> {
	return new TextDecoder('utf-8', { fatal: true }).decode(await readRequestBytes(request, maxBytes));
}

export function isUuid(value: string | null): value is string {
	return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
}

export function methodNotAllowed(allow: string): Response {
	return jsonResponse(
		{ error: { code: 'method_not_allowed', message: 'Method not allowed' } },
		405,
		{ Allow: allow }
	);
}
