import type {
	FeedbackCreateRecord,
	FeedbackRepository,
	IdempotencyRecord,
	ReporterRecord,
} from '../../src/storage/types';

export class FakeFeedbackRepository implements FeedbackRepository {
	reporter: ReporterRecord | null = null;
	createdFeedback: FeedbackCreateRecord[] = [];
	idempotency = new Map<string, IdempotencyRecord>();
	pendingAttachments = new Map<string, number>();
	auditEvents: Array<{ eventCode: string; targetHash: string | null; outcome: string; now: number }> = [];

	async findReporterBySecretHmac(): Promise<ReporterRecord | null> {
		return this.reporter;
	}

	async ensureReporter(): Promise<ReporterRecord> {
		this.reporter ??= { id: crypto.randomUUID(), revokedAt: null };
		return this.reporter;
	}

	async getIdempotency(reporterId: string, route: string, key: string): Promise<IdempotencyRecord | null> {
		return this.idempotency.get(`${reporterId}:${route}:${key}`) ?? null;
	}

	async trackPendingAttachment(r2Key: string, now: number): Promise<void> {
		this.pendingAttachments.set(r2Key, now);
	}

	async createFeedback(record: FeedbackCreateRecord): Promise<void> {
		this.createdFeedback.push(record);
		if (record.attachment) {
			this.pendingAttachments.delete(record.attachment.r2Key);
		}
		this.idempotency.set(`${record.reporterId}:create-feedback:${record.idempotencyKey}`, {
			requestSha256: record.requestSha256,
			responseStatus: record.responseStatus,
			responseJson: record.responseJson,
		});
	}

	async writeAudit(eventCode: string, targetHash: string | null, outcome: 'success' | 'denied' | 'error', now: number): Promise<void> {
		this.auditEvents.push({ eventCode, targetHash, outcome, now });
	}
}
