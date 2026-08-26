import { describe, expect, it } from 'vitest';
import { canTransitionPublicStatus, validateDecisionUpdate } from '../../src/domain/stateMachine';

describe('feedback state machine', () => {
	it('allows documented public status transitions', () => {
		expect(canTransitionPublicStatus('received', 'triaging')).toBe(true);
		expect(canTransitionPublicStatus('triaging', 'needs-info')).toBe(true);
		expect(canTransitionPublicStatus('needs-info', 'triaging')).toBe(true);
		expect(canTransitionPublicStatus('triaging', 'planned')).toBe(true);
		expect(canTransitionPublicStatus('planned', 'in-progress')).toBe(true);
	});

	it('rejects undocumented status jumps', () => {
		expect(canTransitionPublicStatus('received', 'resolved')).toBe(false);
		expect(canTransitionPublicStatus('triaging', 'in-progress')).toBe(false);
		expect(canTransitionPublicStatus('needs-info', 'planned')).toBe(false);
		expect(canTransitionPublicStatus('resolved', 'in-progress')).toBe(false);
		expect(canTransitionPublicStatus('closed', 'received')).toBe(false);
	});

	it('requires a resolution and respectful public reason for not-actionable', () => {
		expect(validateDecisionUpdate({ decision: 'not-actionable' }).ok).toBe(false);
		expect(validateDecisionUpdate({
			decision: 'not-actionable', resolution: 'duplicate', publicReason: 'This is already tracked in another request.',
		}).ok).toBe(true);
		expect(validateDecisionUpdate({
			decision: 'not-actionable', resolution: 'duplicate', publicReason: '沒價值，關閉。這段補長。',
		}).ok).toBe(false);
		expect(validateDecisionUpdate({ decision: 'actionable', resolution: 'duplicate' }).ok).toBe(false);
	});
});
