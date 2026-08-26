import { PUBLIC_STATUSES, RESOLUTIONS, validateDecisionUpdate, type PublicStatus, type Resolution } from './stateMachine';

export type GitHubCommand =
	| { type: 'public-reply'; text: string }
	| { type: 'status'; status: PublicStatus; text?: string }
	| { type: 'decision-actionable'; rationale?: string }
	| { type: 'decision-not-actionable'; resolution: Resolution; publicReason: string }
	| { type: 'approve-public'; summary: string }
	| { type: 'reopen'; text: string };

export type GitHubCommandParseResult =
	| { kind: 'none' }
	| { kind: 'invalid'; code: string }
	| { kind: 'command'; value: GitHubCommand };

function bodyAfter(lines: string[], commandIndex: number): string {
	return lines.slice(commandIndex + 1).join('\n').trim();
}

function bounded(value: string, min: number, max: number): boolean {
	const length = Array.from(value).length;
	return length >= min && length <= max;
}

export function parseGitHubCommand(body: string): GitHubCommandParseResult {
	if (typeof body !== 'string' || Array.from(body).length > 10_000) {return { kind: 'invalid', code: 'command_too_large' };}
	const lines = body.replace(/\r\n/g, '\n').split('\n');
	const commandIndex = lines.findIndex(line => line.trim().length > 0);
	if (commandIndex < 0) {return { kind: 'none' };}
	const line = lines[commandIndex];
	if (!line.startsWith('/feedback')) {return { kind: 'none' };}
	const remainder = bodyAfter(lines, commandIndex);
	if (line === '/feedback public-reply') {
		return bounded(remainder, 1, 4000)
			? { kind: 'command', value: { type: 'public-reply', text: remainder } }
			: { kind: 'invalid', code: 'public_reply_required' };
	}
	const statusMatch = line.match(/^\/feedback status (received|triaging|needs-info|planned|in-progress|resolved|closed)$/);
	if (statusMatch) {
		const status = statusMatch[1] as PublicStatus;
		if (!(PUBLIC_STATUSES as readonly string[]).includes(status)) {return { kind: 'invalid', code: 'invalid_status' };}
		if ((status === 'needs-info' && !bounded(remainder, 1, 4000)) || !bounded(remainder, 0, 4000)) {
			return { kind: 'invalid', code: 'public_message_required' };
		}
		return { kind: 'command', value: { type: 'status', status, ...(remainder ? { text: remainder } : {}) } };
	}
	if (line === '/feedback decision actionable') {
		return bounded(remainder, 0, 2000)
			? { kind: 'command', value: { type: 'decision-actionable', ...(remainder ? { rationale: remainder } : {}) } }
			: { kind: 'invalid', code: 'rationale_too_large' };
	}
	const decisionMatch = line.match(/^\/feedback decision not-actionable (duplicate|not-product|unsupported|out-of-scope|cannot-reproduce|insufficient-info|spam)$/);
	if (decisionMatch) {
		const resolution = decisionMatch[1] as Resolution;
		if (!(RESOLUTIONS as readonly string[]).includes(resolution)) {return { kind: 'invalid', code: 'invalid_resolution' };}
		const validation = validateDecisionUpdate({ decision: 'not-actionable', resolution, publicReason: remainder });
		return validation.ok
			? { kind: 'command', value: { type: 'decision-not-actionable', resolution, publicReason: remainder } }
			: { kind: 'invalid', code: validation.code };
	}
	if (line === '/feedback approve-public') {
		return bounded(remainder, 20, 4000)
			? { kind: 'command', value: { type: 'approve-public', summary: remainder } }
			: { kind: 'invalid', code: 'public_summary_required' };
	}
	if (line === '/feedback reopen') {
		return bounded(remainder, 1, 4000)
			? { kind: 'command', value: { type: 'reopen', text: remainder } }
			: { kind: 'invalid', code: 'public_message_required' };
	}
	return { kind: 'invalid', code: 'unknown_command' };
}
