import type { ValidatedCreateFeedback } from '../domain/schemas';

export interface ReporterRecord {
	id: string;
	revokedAt: number | null;
}

export interface IdempotencyRecord {
	requestSha256: string;
	responseStatus: number;
	responseJson: string;
}

export interface FeedbackCreateRecord {
	feedbackId: string;
	publicReference: string;
	reporterId: string;
	input: ValidatedCreateFeedback;
	outboxId: string;
	idempotencyKey: string;
	requestSha256: string;
	responseStatus: number;
	responseJson: string;
	now: number;
	attachment?: {
		id: string;
		r2Key: string;
		mediaType: 'image/png' | 'image/jpeg';
		sizeBytes: number;
		width: number;
		height: number;
		sha256: string;
	};
}

export interface FeedbackRepository {
	findReporterBySecretHmac(secretHmac: string): Promise<ReporterRecord | null>;
	ensureReporter(secretHmac: string, now: number): Promise<ReporterRecord>;
	getIdempotency(reporterId: string, route: string, key: string): Promise<IdempotencyRecord | null>;
	trackPendingAttachment(r2Key: string, now: number): Promise<void>;
	createFeedback(record: FeedbackCreateRecord): Promise<void>;
	writeAudit(eventCode: string, targetHash: string | null, outcome: 'success' | 'denied' | 'error', now: number): Promise<void>;
}

export interface StoredAttachment {
	body: ReadableStream;
	mediaType: 'image/png' | 'image/jpeg';
	size: number;
}

export interface AttachmentStore {
	put(key: string, body: ArrayBuffer, mediaType: StoredAttachment['mediaType'], sha256: string): Promise<void>;
	get(key: string): Promise<StoredAttachment | null>;
	delete(key: string): Promise<void>;
}
