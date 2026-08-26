import type { ValidatedCreateFeedback } from './schemas';

const PUBLIC_REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUBLIC_REFERENCE_ALPHABET_MASK = 0b11111;

export interface CreatedFeedbackResponse {
	id: string;
	reference: string;
	kind: ValidatedCreateFeedback['kind'];
	title: string;
	status: 'received';
	decision: 'unreviewed';
	resolution: null;
	publicReason: null;
	createdAt: string;
	updatedAt: string;
	description: string;
	steps: string | null;
	expected: string | null;
	diagnostics: Record<string, unknown>;
	hasAttachment: boolean;
	messages: [];
	nextMessageCursor: null;
}

export function publicReference(randomBytes = crypto.getRandomValues(new Uint8Array(8))): string {
	return `SB-${[...randomBytes]
		.map(byte => PUBLIC_REFERENCE_ALPHABET[byte & PUBLIC_REFERENCE_ALPHABET_MASK])
		.join('')}`;
}

export async function sha256Json(value: unknown): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value)));
	let binary = '';
	for (const byte of new Uint8Array(digest)) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function createdFeedbackResponse(
	input: ValidatedCreateFeedback,
	feedbackId: string,
	now: number,
	hasAttachment = false
): CreatedFeedbackResponse {
	const timestamp = new Date(now * 1000).toISOString();
	return {
		id: feedbackId,
		reference: publicReference(),
		kind: input.kind,
		title: input.title,
		status: 'received',
		decision: 'unreviewed',
		resolution: null,
		publicReason: null,
		createdAt: timestamp,
		updatedAt: timestamp,
		description: input.description,
		steps: input.steps ?? null,
		expected: input.expected ?? null,
		diagnostics: input.diagnostics,
		hasAttachment,
		messages: [],
		nextMessageCursor: null,
	};
}
