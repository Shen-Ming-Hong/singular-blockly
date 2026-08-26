import { describe, expect, it } from 'vitest';
import { publicReference } from '../../src/domain/feedback';

describe('feedback domain', () => {
	it('maps each random byte uniformly onto the 32-character public alphabet', () => {
		const bytes = new Uint8Array([0, 31, 32, 63, 64, 95, 128, 255]);

		expect(publicReference(bytes)).toBe('SB-A9A9A9A9');
	});
});
