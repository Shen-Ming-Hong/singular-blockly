import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { getAdminAttachment } from '../../src/routes/adminAttachments';

describe('maintainer attachment authorization', () => {
	it('rejects missing or malformed Cloudflare Access assertions before storage lookup', async () => {
		const id = crypto.randomUUID();
		expect((await getAdminAttachment(new Request(`https://example.test/admin/attachments/${id}`), env, id)).status).toBe(401);
		expect((await getAdminAttachment(new Request(`https://example.test/admin/attachments/${id}`, {
			headers: { 'cf-access-jwt-assertion': 'not-a-jwt' },
		}), env, id)).status).toBe(401);
	});
});
