export const PUBLIC_STATUSES = [
	'received', 'triaging', 'needs-info', 'planned', 'in-progress', 'resolved', 'closed',
] as const;
export const DECISIONS = ['unreviewed', 'actionable', 'not-actionable'] as const;
export const RESOLUTIONS = [
	'duplicate', 'not-product', 'unsupported', 'out-of-scope', 'cannot-reproduce', 'insufficient-info', 'spam',
] as const;

export type PublicStatus = typeof PUBLIC_STATUSES[number];
export type Decision = typeof DECISIONS[number];
export type Resolution = typeof RESOLUTIONS[number];

const transitions: Record<PublicStatus, readonly PublicStatus[]> = {
	received: ['triaging', 'closed'],
	triaging: ['needs-info', 'planned', 'closed'],
	'needs-info': ['triaging', 'closed'],
	planned: ['in-progress', 'closed'],
	'in-progress': ['resolved', 'closed'],
	resolved: ['closed'],
	closed: [],
};

export function canTransitionPublicStatus(current: PublicStatus, next: PublicStatus): boolean {
	return current === next || transitions[current].includes(next);
}

export interface DecisionUpdate {
	decision: Decision;
	resolution?: Resolution;
	publicReason?: string;
}

export type StateValidation = { ok: true } | { ok: false; code: string };

export function validateDecisionUpdate(update: DecisionUpdate): StateValidation {
	if (update.decision !== 'not-actionable') {
		return update.resolution || update.publicReason
			? { ok: false, code: 'unexpected_resolution' }
			: { ok: true };
	}

	if (!update.resolution || !(RESOLUTIONS as readonly string[]).includes(update.resolution)) {
		return { ok: false, code: 'resolution_required' };
	}
	const reason = update.publicReason?.trim() ?? '';
	const reasonLength = Array.from(reason).length;
	if (reasonLength < 20 || reasonLength > 2000) {
		return { ok: false, code: 'public_reason_required' };
	}
	if (/沒價值|毫無價值|worthless|stupid/i.test(reason)) {
		return { ok: false, code: 'disrespectful_public_reason' };
	}
	return { ok: true };
}
