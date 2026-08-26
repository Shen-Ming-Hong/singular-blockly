import { createHmac, parseBearerSecret } from '../domain/auth';
import { apiError, isUuid, jsonResponse, rateLimitError, readRequestBytes, RequestTooLargeError } from '../domain/http';
import { createdFeedbackResponse, sha256Json } from '../domain/feedback';
import { validateCreateFeedbackInput } from '../domain/schemas';
import type { Env } from '../env';
import { D1FeedbackRepository } from '../storage/d1';
import { R2AttachmentStore } from '../storage/r2';
import { validateScreenshot, type ValidatedScreenshot } from '../services/screenshot';

const ROUTE_KEY = 'create-feedback';

async function parseCreatePayload(request: Request): Promise<{ payload: unknown; screenshot?: File }> {
	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.toLowerCase().startsWith('multipart/form-data;')) {
		throw new Error('unsupported_media_type');
	}
	const bytes = await readRequestBytes(request);
	let form: FormData;
	try {
		form = await new Response(Uint8Array.from(bytes).buffer, { headers: { 'content-type': contentType } }).formData();
	} catch {
		throw new Error('invalid_multipart');
	}
	const keys = [...form.keys()];
	if (keys.some(key => key !== 'payload' && key !== 'screenshot')
		|| form.getAll('payload').length !== 1
		|| form.getAll('screenshot').length > 1) {
		throw new Error('invalid_multipart');
	}
	const rawPayload = form.get('payload');
	if (typeof rawPayload !== 'string') {
		throw new Error('invalid_payload');
	}
	const rawScreenshot = form.get('screenshot');
	if (rawScreenshot !== null && !(rawScreenshot instanceof File)) {
		throw new Error('invalid_attachment');
	}
	let payload: unknown;
	try {payload = JSON.parse(rawPayload) as unknown;} catch {throw new Error('invalid_payload');}
	return {
		payload,
		...(rawScreenshot instanceof File ? { screenshot: rawScreenshot } : {}),
	};
}

export async function createFeedback(request: Request, env: Env): Promise<Response> {
	const secret = parseBearerSecret(request.headers.get('authorization'));
	if (!secret) {
		return apiError(401, 'invalid_reporter', 'A valid reporter credential is required');
	}
	const idempotencyKey = request.headers.get('idempotency-key');
	if (!isUuid(idempotencyKey)) {
		return apiError(400, 'invalid_idempotency_key', 'A UUID idempotency key is required', 'Idempotency-Key');
	}
	const secretHmac = await createHmac(secret, env.REPORTER_HMAC_PEPPER);
	const reporterLimit = await env.REPORTER_RATE_LIMITER.limit({ key: secretHmac });
	const rawIp = request.headers.get('cf-connecting-ip');
	if (!reporterLimit.success) {
		return rateLimitError();
	}
	if (rawIp) {
		const ipHmac = await createHmac(rawIp, env.IP_HMAC_PEPPER);
		const anonymousLimit = await env.ANONYMOUS_RATE_LIMITER.limit({ key: ipHmac });
		if (!anonymousLimit.success) {
			return rateLimitError();
		}
	}

	let parsedPayload: { payload: unknown; screenshot?: File };
	try {
		parsedPayload = await parseCreatePayload(request);
	} catch (error) {
		const candidate = error instanceof Error ? error.message : '';
		const code = error instanceof RequestTooLargeError
			? 'request_too_large'
			: ['unsupported_media_type', 'invalid_multipart', 'invalid_payload', 'invalid_attachment'].includes(candidate)
				? candidate
				: 'invalid_payload';
		const status = error instanceof RequestTooLargeError ? 413 : code === 'unsupported_media_type' ? 415 : 400;
		return apiError(status, code, 'The feedback payload could not be accepted');
	}
	const validation = validateCreateFeedbackInput(parsedPayload.payload);
	if (!validation.ok) {
		return apiError(400, validation.error.code, 'The feedback payload is invalid', validation.error.field);
	}
	let screenshot: ValidatedScreenshot | undefined;
	if (parsedPayload.screenshot) {
		try {
			screenshot = await validateScreenshot(parsedPayload.screenshot);
		} catch (error) {
			const code = error instanceof Error && /^invalid_attachment_/.test(error.message)
				? error.message
				: 'invalid_attachment';
			return apiError(400, code, 'The screenshot could not be accepted', 'screenshot');
		}
	}

	const repository = new D1FeedbackRepository(env.FEEDBACK_DB);
	const now = Math.floor(Date.now() / 1000);
	let reporter;
	try {
		reporter = await repository.ensureReporter(secretHmac, now);
	} catch {
		return apiError(401, 'invalid_reporter', 'The reporter credential is no longer valid');
	}
	const requestSha256 = await sha256Json({ input: validation.value, screenshotSha256: screenshot?.sha256 ?? null });
	const replay = await repository.getIdempotency(reporter.id, ROUTE_KEY, idempotencyKey);
	if (replay) {
		if (replay.requestSha256 !== requestSha256) {
			return apiError(409, 'idempotency_conflict', 'The idempotency key was already used for different content');
		}
		return jsonResponse(JSON.parse(replay.responseJson), replay.responseStatus);
	}

	const feedbackId = crypto.randomUUID();
	const responseBody = createdFeedbackResponse(validation.value, feedbackId, now, screenshot !== undefined);
	const responseJson = JSON.stringify(responseBody);
	const attachmentStore = new R2AttachmentStore(env.FEEDBACK_SCREENSHOTS);
	try {
		if (screenshot) {
			await repository.trackPendingAttachment(screenshot.objectKey, now);
			await attachmentStore.put(screenshot.objectKey, screenshot.bytes, screenshot.mediaType, screenshot.sha256);
		}
		await repository.createFeedback({
			feedbackId,
			publicReference: responseBody.reference,
			reporterId: reporter.id,
			input: validation.value,
			outboxId: crypto.randomUUID(),
			idempotencyKey,
			requestSha256,
			responseStatus: 201,
			responseJson,
			now,
			...(screenshot ? {
				attachment: {
					id: crypto.randomUUID(),
					r2Key: screenshot.objectKey,
					mediaType: screenshot.mediaType,
					sizeBytes: screenshot.bytes.byteLength,
					width: screenshot.width,
					height: screenshot.height,
					sha256: screenshot.sha256,
				},
			} : {}),
		});
	} catch (error) {
		let concurrentReplay;
		try {concurrentReplay = await repository.getIdempotency(reporter.id, ROUTE_KEY, idempotencyKey);} catch { /* retry below */ }
		if (concurrentReplay?.requestSha256 === requestSha256) {
			return jsonResponse(JSON.parse(concurrentReplay.responseJson), concurrentReplay.responseStatus);
		}
		if (error instanceof Error && error.message === 'reporter_revoked') {
			return apiError(401, 'invalid_reporter', 'The reporter credential is no longer valid');
		}
		// A pre-upload D1 marker owns any uncommitted R2 object. The scheduled
		// cleanup retries deletion; a successful transaction removes the marker
		// atomically so an ambiguous response can never delete committed data.
		return apiError(503, 'feedback_unavailable', 'Feedback could not be saved. Please retry safely.');
	}
	try {
		await repository.writeAudit('feedback_created', secretHmac, 'success', now);
	} catch { /* audit failure must not roll back already committed feedback or attachments */ }
	return jsonResponse(responseBody, 201);
}
