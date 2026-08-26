import type { AttachmentStore, StoredAttachment } from './types';

function isSafeObjectKey(key: string): boolean {
	return /^[0-9a-f]{32}$/i.test(key);
}

export class R2AttachmentStore implements AttachmentStore {
	constructor(private readonly bucket: R2Bucket) {}

	async put(
		key: string,
		body: ArrayBuffer,
		mediaType: StoredAttachment['mediaType'],
		sha256: string
	): Promise<void> {
		if (!isSafeObjectKey(key)) {
			throw new Error('invalid_attachment_key');
		}
		await this.bucket.put(key, body, {
			httpMetadata: { contentType: mediaType },
			customMetadata: { sha256 },
		});
	}

	async get(key: string): Promise<StoredAttachment | null> {
		if (!isSafeObjectKey(key)) {
			return null;
		}
		const object = await this.bucket.get(key);
		if (!object?.body) {
			return null;
		}
		const mediaType = object.httpMetadata?.contentType;
		if (mediaType !== 'image/png' && mediaType !== 'image/jpeg') {
			return null;
		}
		return { body: object.body, mediaType, size: object.size };
	}

	async delete(key: string): Promise<void> {
		if (!isSafeObjectKey(key)) {
			throw new Error('invalid_attachment_key');
		}
		await this.bucket.delete(key);
	}
}
