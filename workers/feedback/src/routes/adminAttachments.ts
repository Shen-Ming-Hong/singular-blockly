import { verifyCloudflareAccess } from '../domain/cloudflareAccess';
import { apiError, withSecurityHeaders } from '../domain/http';
import type { Env } from '../env';
import { R2AttachmentStore } from '../storage/r2';

export async function getAdminAttachment(request: Request, env: Env, attachmentId: string): Promise<Response> {
	if (!await verifyCloudflareAccess(request, env)) {
		return apiError(401, 'access_denied', 'Maintainer access is required');
	}
	const row = await env.FEEDBACK_DB.prepare(`SELECT a.r2_key
		FROM attachments a JOIN feedback f ON f.id = a.feedback_id
		WHERE a.id = ?1 AND f.delete_state = 'active' LIMIT 1`
	).bind(attachmentId).first<{ r2_key: string }>();
	if (!row) {return apiError(404, 'attachment_not_found', 'The attachment was not found');}
	const object = await new R2AttachmentStore(env.FEEDBACK_SCREENSHOTS).get(row.r2_key);
	if (!object) {return apiError(404, 'attachment_not_found', 'The attachment was not found');}
	const headers = withSecurityHeaders({
		'Cache-Control': 'private, no-store',
		'Content-Type': object.mediaType,
		'Content-Length': String(object.size),
		'Content-Disposition': 'inline',
	});
	return new Response(object.body, { status: 200, headers });
}
