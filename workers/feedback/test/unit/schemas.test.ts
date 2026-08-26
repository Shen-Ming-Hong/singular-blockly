import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/create-feedback.json';
import { validateCreateFeedbackInput, validateReporterMessage } from '../../src/domain/schemas';

describe('feedback schemas', () => {
	it('accepts the versioned allowlist fixture', () => {
		const result = validateCreateFeedbackInput(fixture);
		expect(result.ok).toBe(true);
	});

	it('rejects unknown fields and forbidden diagnostic content', () => {
		expect(validateCreateFeedbackInput({ ...fixture, workspacePath: '/secret/path' }).ok).toBe(false);
		expect(validateCreateFeedbackInput({
			...fixture,
			diagnostics: { ...fixture.diagnostics, rawLog: 'token=secret' },
		}).ok).toBe(false);
	});

	it('rejects invalid lengths and excessive recent events', () => {
		expect(validateCreateFeedbackInput({ ...fixture, title: 'bad' }).ok).toBe(false);
		expect(validateCreateFeedbackInput({
			...fixture,
			diagnostics: {
				...fixture.diagnostics,
				recentEvents: Array.from({ length: 21 }, () => ({
					at: '2026-08-19T00:00:00.000Z', stage: 'upload', code: 'failed', outcome: 'failed',
				})),
			},
		}).ok).toBe(false);
	});

	it('counts Unicode code points consistently with D1 length constraints', () => {
		expect(validateCreateFeedbackInput({ ...fixture, title: '😀'.repeat(3) }).ok).toBe(false);
		expect(validateCreateFeedbackInput({ ...fixture, title: '😀'.repeat(5) }).ok).toBe(true);
		expect(validateCreateFeedbackInput({ ...fixture, title: '😀'.repeat(121) }).ok).toBe(false);
		expect(validateReporterMessage({ body: '😀'.repeat(4000) }).ok).toBe(true);
		expect(validateReporterMessage({ body: '😀'.repeat(4001) }).ok).toBe(false);
	});

	it('rejects path, raw-text, and credential-shaped diagnostic values at the Worker boundary', () => {
		for (const diagnostics of [
			{ ...fixture.diagnostics, board: '/home/alice/project' },
			{ ...fixture.diagnostics, extensionVersion: 'release from local build' },
			{ ...fixture.diagnostics, tools: [{ name: 'platformio', version: 'private/path', readiness: 'ready' }] },
			{ ...fixture.diagnostics, lastError: { stage: 'upload', code: 'raw error with private text' } },
			{ ...fixture.diagnostics, lastError: { stage: 'upload', code: `ghp_${'A'.repeat(24)}` } },
			{ ...fixture.diagnostics, board: '192.168.1.1' },
			{ ...fixture.diagnostics, board: 'A'.repeat(43) },
			{ ...fixture.diagnostics, board: '0198f35b-4e3c-7d28-9aa3-02f0c2a17a72' },
			{ ...fixture.diagnostics, lastError: { stage: 'upload', code: `sk-proj-${'A'.repeat(24)}` } },
			{ ...fixture.diagnostics, tools: [{ name: 'platformio', version: '192.168.1.1', readiness: 'ready' }] },
			{ ...fixture.diagnostics, recentEvents: [{
				at: '2026-08-19T00:00:00.000Z', stage: 'C:\\private', code: 'failed', outcome: 'failed',
			}] },
		]) {
			expect(validateCreateFeedbackInput({ ...fixture, diagnostics }).ok).toBe(false);
		}
	});

	it('accepts only a bounded message body', () => {
		expect(validateReporterMessage({ body: 'More details' }).ok).toBe(true);
		expect(validateReporterMessage({ body: '', attachment: 'no' }).ok).toBe(false);
		expect(validateReporterMessage({ body: 'x'.repeat(4001) }).ok).toBe(false);
	});

	it.each([
		'Arduino/MicroPython blocks do not load.',
		'The upload/download action is confusing.',
		'I prefer the light/dark mode control.',
	])('accepts slash-separated product terminology: %s', body => {
		expect(validateReporterMessage({ body }).ok).toBe(true);
		expect(validateCreateFeedbackInput({ ...fixture, description: body.padEnd(20, ' ') }).ok).toBe(true);
	});

	it('rejects known sensitive text in every reporter-authored text field', () => {
		const samples = [
			`github_pat_${'A'.repeat(24)}`,
			`sk-proj-${'A'.repeat(24)}`,
			'A'.repeat(43),
			`https://blockly-support.singular-ai.org/r#secret=${'B'.repeat(43)}`,
			`Authorization: Bearer ${'A'.repeat(24)}`,
			'GITHUB_TOKEN=do-not-store-this-value',
			'-----BEGIN PRIVATE KEY-----',
			'https://alice:password@example.com/private',
			'Connection failed at 192.168.1.20',
			'C:\\Users\\alice\\secret.txt',
			'/Users/alice/private/project.py',
				'/workspace/student/main.py',
				'/srv/app/config.yaml',
				'/secret.txt',
				'path=/alice',
				'Please inspect /tmp',
				'path=/home/alice/main.py',
				'src/private/main.py',
				'Please inspect ../private/main.py',
				'Host 2001:db8::1 failed',
			'PS C:\\Users\\alice> npm test',
			'Traceback (most recent call last):\n  File "main.py", line 1',
			'```python\nprint("private source")\n```',
			'The selected serial port COM3 stops responding during upload.',
			'Device 550e8400-e29b-41d4-a716-446655440000 stops responding during upload.',
			'Calling digitalWrite(LED_BUILTIN, HIGH); makes the upload fail.',
			'The loop calls machine.Pin(5, machine.Pin.OUT) before upload.',
		];
		for (const field of ['title', 'description', 'steps', 'expected'] as const) {
			for (const sample of samples) {
				const result = validateCreateFeedbackInput({ ...fixture, [field]: `Context ${sample} details` });
				expect(result).toEqual({ ok: false, error: { code: 'sensitive_content', field } });
			}
		}
		for (const sample of samples) {
			expect(validateReporterMessage({ body: `Context ${sample} details` })).toEqual({
				ok: false,
				error: { code: 'sensitive_content', field: 'body' },
			});
		}
	});
});
