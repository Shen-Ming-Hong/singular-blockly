import { describe, expect, it } from 'vitest';
import { parseGitHubCommand } from '../../src/domain/githubCommands';

describe('GitHub maintainer command parser', () => {
	it('parses strict public reply and status commands', () => {
		expect(parseGitHubCommand('\n/feedback public-reply\nPlease try the latest version.')).toEqual({
			kind: 'command', value: { type: 'public-reply', text: 'Please try the latest version.' },
		});
		expect(parseGitHubCommand('/feedback status needs-info\nWhich board are you using?').kind).toBe('command');
	});

	it('rejects missing reasons, disrespectful reasons, and unknown syntax', () => {
		expect(parseGitHubCommand('/feedback status needs-info').kind).toBe('invalid');
		expect(parseGitHubCommand('/feedback decision not-actionable spam\nThis is worthless and stupid.')).toEqual({
			kind: 'invalid', code: 'disrespectful_public_reason',
		});
		expect(parseGitHubCommand('/feedback status planned now').kind).toBe('invalid');
	});

	it('never interprets quoted, fenced, or feedback-body commands', () => {
		expect(parseGitHubCommand('> /feedback status planned').kind).toBe('none');
		expect(parseGitHubCommand('```\n/feedback status planned\n```').kind).toBe('none');
		expect(parseGitHubCommand('User wrote: /feedback approve-public').kind).toBe('none');
	});
});
