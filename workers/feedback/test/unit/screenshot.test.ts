import { describe, expect, it } from 'vitest';
import { validateScreenshot } from '../../src/services/screenshot';
import { png } from '../helpers/png';

const VALID_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/AABEIAAEAAQMBEQACEQEDEQH/xAGiAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgsQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+gEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoLEQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AOLr5k/cT//Z';

function bytesFromBase64(value: string): Uint8Array {
	return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

function blobBytes(bytes: Uint8Array): ArrayBuffer {
	return bytes.slice().buffer;
}

describe('validateScreenshot', () => {
	it('accepts a bounded PNG and derives trusted metadata', async () => {
		const result = await validateScreenshot(new File([await png(800, 600)], 'ignored.png', { type: 'image/png' }));
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(result.objectKey).toMatch(/^[0-9a-f]{32}$/);
		expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
	});

	it('rejects MIME mismatches, oversized dimensions, and PNG metadata', async () => {
		await expect(validateScreenshot(new File([await png(800, 600)], 'ignored.jpg', { type: 'image/jpeg' })))
			.rejects.toThrow('invalid_attachment_format');
		await expect(validateScreenshot(new File([await png(1921, 600)], 'ignored.png', { type: 'image/png' })))
			.rejects.toThrow('invalid_attachment_dimensions');
		await expect(validateScreenshot(new File([await png(800, 600, true)], 'ignored.png', { type: 'image/png' })))
			.rejects.toThrow('invalid_attachment_format');
		const truncated = new Uint8Array(await png(8, 8)).subarray(0, 45);
		await expect(validateScreenshot(new File([truncated], 'truncated.png', { type: 'image/png' })))
			.rejects.toThrow('invalid_attachment_format');
	});

	it('accepts a decodable JPEG and rejects marker-only scan data', async () => {
		const valid = await validateScreenshot(new File(
			[blobBytes(bytesFromBase64(VALID_JPEG_BASE64))],
			'valid.jpg',
			{ type: 'image/jpeg' },
		));
		expect(valid).toMatchObject({ width: 1, height: 1, mediaType: 'image/jpeg' });

		const markerOnly = Uint8Array.of(
			0xff, 0xd8,
			0xff, 0xc0, 0x00, 0x08, 0x08, 0x00, 0x01, 0x00, 0x01, 0x00,
			0xff, 0xda, 0x00, 0x02,
			0xff, 0xd9,
		);
		await expect(validateScreenshot(new File([blobBytes(markerOnly)], 'invalid.jpg', { type: 'image/jpeg' })))
			.rejects.toThrow('invalid_attachment_format');
	});
});
