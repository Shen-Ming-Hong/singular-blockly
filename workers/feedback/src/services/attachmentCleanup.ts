import type { Env } from '../env';
import { R2AttachmentStore } from '../storage/r2';

const CLEANUP_GRACE_SECONDS = 10 * 60;
const CLEANUP_BATCH_SIZE = 100;

interface PendingAttachmentRow {
	r2_key: string;
}

/** Deletes uploads that never became part of a committed feedback transaction. */
export async function processPendingAttachmentCleanup(env: Env, now = Math.floor(Date.now() / 1000)): Promise<void> {
	const pending = (await env.FEEDBACK_DB.prepare(`
		SELECT r2_key FROM pending_attachment_uploads
		WHERE created_at <= ?1
		ORDER BY created_at ASC
		LIMIT ?2
	`).bind(now - CLEANUP_GRACE_SECONDS, CLEANUP_BATCH_SIZE).all<PendingAttachmentRow>()).results;
	const attachments = new R2AttachmentStore(env.FEEDBACK_SCREENSHOTS);
	for (const row of pending) {
		try {
			await attachments.delete(row.r2_key);
			await env.FEEDBACK_DB.prepare(
				'DELETE FROM pending_attachment_uploads WHERE r2_key = ?1'
			).bind(row.r2_key).run();
		} catch {
			// Keep the durable marker so a later cron can retry without logging content.
		}
	}
}
