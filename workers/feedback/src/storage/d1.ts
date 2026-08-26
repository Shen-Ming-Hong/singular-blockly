import type {
	FeedbackCreateRecord,
	FeedbackRepository,
	IdempotencyRecord,
	ReporterRecord,
} from './types';

interface ReporterRow {
	id: string;
	revoked_at: number | null;
}

interface IdempotencyRow {
	request_sha256: string;
	response_status: number;
	response_json: string;
}

export class D1FeedbackRepository implements FeedbackRepository {
	constructor(private readonly db: D1Database) {}

	async findReporterBySecretHmac(secretHmac: string): Promise<ReporterRecord | null> {
		const row = await this.db.prepare(
			'SELECT id, revoked_at FROM reporters WHERE secret_hmac = ?1 LIMIT 1'
		).bind(secretHmac).first<ReporterRow>();
		return row ? { id: row.id, revokedAt: row.revoked_at } : null;
	}

	async ensureReporter(secretHmac: string, now: number): Promise<ReporterRecord> {
		const existing = await this.findReporterBySecretHmac(secretHmac);
		if (existing) {
			if (existing.revokedAt !== null) {
				throw new Error('reporter_revoked');
			}
			await this.db.prepare('UPDATE reporters SET last_seen_at = ?1 WHERE id = ?2')
				.bind(now, existing.id).run();
			return existing;
		}

		const candidateId = crypto.randomUUID();
		await this.db.prepare(
			'INSERT OR IGNORE INTO reporters (id, secret_hmac, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?3)'
		).bind(candidateId, secretHmac, now).run();
		const created = await this.findReporterBySecretHmac(secretHmac);
		if (!created || created.revokedAt !== null) {
			throw new Error('reporter_create_failed');
		}
		return created;
	}

	async getIdempotency(reporterId: string, route: string, key: string): Promise<IdempotencyRecord | null> {
		const row = await this.db.prepare(
			'SELECT request_sha256, response_status, response_json FROM idempotency_records WHERE reporter_id = ?1 AND route = ?2 AND key = ?3 AND expires_at > ?4'
		).bind(reporterId, route, key, Math.floor(Date.now() / 1000)).first<IdempotencyRow>();
		return row ? {
			requestSha256: row.request_sha256,
			responseStatus: row.response_status,
			responseJson: row.response_json,
		} : null;
	}

	async trackPendingAttachment(r2Key: string, now: number): Promise<void> {
		await this.db.prepare(
			'INSERT INTO pending_attachment_uploads (r2_key, created_at) VALUES (?1, ?2)'
		).bind(r2Key, now).run();
	}

	async createFeedback(record: FeedbackCreateRecord): Promise<void> {
		const { input } = record;
		const statements = [
			this.db.prepare(`
				INSERT INTO feedback (
					id, public_reference, reporter_id, kind, title, description, steps, expected,
					diagnostics_json, public_status, decision, created_at, updated_at
				) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'received', 'unreviewed', ?10, ?10
				FROM reporters WHERE id = ?11 AND revoked_at IS NULL
			`).bind(
				record.feedbackId,
				record.publicReference,
				record.reporterId,
				input.kind,
				input.title,
				input.description,
				input.steps ?? null,
				input.expected ?? null,
				JSON.stringify(input.diagnostics),
				record.now,
				record.reporterId,
			),
			this.db.prepare(`
				INSERT INTO outbox_events (
					id, aggregate_type, aggregate_id, event_type, payload_json,
					status, attempt_count, next_attempt_at, created_at
				) SELECT ?1, 'feedback', ?2, 'create', ?3, 'pending', 0, ?4, ?4
				WHERE EXISTS (SELECT 1 FROM feedback WHERE id = ?2)
			`).bind(record.outboxId, record.feedbackId, JSON.stringify({
				feedbackId: record.feedbackId,
				publicReference: record.publicReference,
				...input,
			}), record.now),
			this.db.prepare(`
				INSERT INTO idempotency_records (
					reporter_id, route, key, request_sha256, response_status, response_json,
					created_at, expires_at
				) SELECT ?1, 'create-feedback', ?2, ?3, ?4, ?5, ?6, ?7
				WHERE EXISTS (SELECT 1 FROM feedback WHERE id = ?8)
			`).bind(
				record.reporterId,
				record.idempotencyKey,
				record.requestSha256,
				record.responseStatus,
				record.responseJson,
				record.now,
				record.now + 7 * 86400,
				record.feedbackId,
			),
		];
		if (record.attachment) {
			statements.splice(1, 0, this.db.prepare(`
				INSERT INTO attachments (
					id, feedback_id, r2_key, media_type, size_bytes, width, height, sha256, created_at
				) SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9
				WHERE EXISTS (SELECT 1 FROM feedback WHERE id = ?2)
			`).bind(
				record.attachment.id,
				record.feedbackId,
				record.attachment.r2Key,
				record.attachment.mediaType,
				record.attachment.sizeBytes,
				record.attachment.width,
				record.attachment.height,
				record.attachment.sha256,
				record.now
			));
			statements.push(this.db.prepare(
				`DELETE FROM pending_attachment_uploads WHERE r2_key = ?1
				AND EXISTS (SELECT 1 FROM attachments WHERE r2_key = ?1)`
			).bind(record.attachment.r2Key));
		}
		const results = await this.db.batch(statements);
		if (!results[0].meta.changes) {throw new Error('reporter_revoked');}
	}

	async writeAudit(
		eventCode: string,
		targetHash: string | null,
		outcome: 'success' | 'denied' | 'error',
		now: number
	): Promise<void> {
		await this.db.prepare(`
			INSERT INTO audit_events (id, event_code, target_hash, outcome, created_at, expires_at)
			VALUES (?1, ?2, ?3, ?4, ?5, ?6)
		`).bind(crypto.randomUUID(), eventCode, targetHash, outcome, now, now + 90 * 86400).run();
	}
}
