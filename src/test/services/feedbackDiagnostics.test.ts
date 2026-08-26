/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import {
	FeedbackEventRecorder,
	buildFeedbackDiagnostics,
} from '../../services/feedbackDiagnostics';

suite('FeedbackDiagnostics Tests', () => {
	test('collects only the documented low-risk diagnostic fields', () => {
		const diagnostics = buildFeedbackDiagnostics({
			extensionVersion: '0.87.5',
			vscodeVersion: '1.109.0',
			platform: 'darwin',
			release: '25.3.0',
			arch: 'arm64',
			locale: 'zh-tw',
			remoteName: undefined,
			workspaceFoldersCount: 2,
			workspaceTrusted: true,
			board: 'cyberbrick',
			language: 'micropython',
			tools: [
				{ name: 'platformio', version: '6.1.18', readiness: 'ready' },
				{ name: 'mpremote', readiness: 'unavailable' },
			],
			lastError: { stage: 'upload', code: 'device-unavailable' },
		}, { includeDiagnostics: true, includeRecentEvents: false });

		assert.deepStrictEqual(diagnostics, {
			extensionVersion: '0.87.5',
			vscodeVersion: '1.109.0',
			osFamily: 'macos',
			osMajor: '25',
			architecture: 'arm64',
			locale: 'zh-tw',
			hostKind: 'local',
			workspaceKind: 'multi-root',
			workspaceTrusted: true,
			board: 'cyberbrick',
			language: 'micropython',
			tools: [
				{ name: 'platformio', version: '6.1.18', readiness: 'ready' },
				{ name: 'mpremote', readiness: 'unavailable' },
			],
			lastError: { stage: 'upload', code: 'device-unavailable' },
		});
		assert.ok(!('workspacePath' in diagnostics));
		assert.ok(!('hostname' in diagnostics));
		assert.ok(!('ip' in diagnostics));
	});

	test('keeps explicitly selected recent events independent from basic diagnostics', () => {
		const diagnostics = buildFeedbackDiagnostics({
			extensionVersion: '0.87.5',
			vscodeVersion: '1.109.0',
			platform: 'win32',
			release: '10.0.26100',
			arch: 'x64',
			locale: 'en',
			remoteName: 'ssh-remote+private-host',
			workspaceFoldersCount: 1,
			workspaceTrusted: false,
			recentEvents: [{
				at: '2026-08-20T01:00:00.000Z', stage: 'upload', code: 'device-unavailable', outcome: 'failed',
			}],
		}, { includeDiagnostics: false, includeRecentEvents: true });

		assert.deepStrictEqual(diagnostics, {
			recentEvents: [{
				at: '2026-08-20T01:00:00.000Z', stage: 'upload', code: 'device-unavailable', outcome: 'failed',
			}],
		});
	});

	test('keeps a bounded ring of stable events and ignores unsafe event values', () => {
		const recorder = new FeedbackEventRecorder(2);
		recorder.record({ at: '2026-08-20T01:00:00.000Z', stage: 'compile', code: 'started', outcome: 'started' });
		recorder.record({ at: '2026-08-20T01:00:01.000Z', stage: 'compile', code: 'success', outcome: 'succeeded' });
		recorder.record({ at: '2026-08-20T01:00:02.000Z', stage: '/Users/alice/project', code: 'raw output', outcome: 'failed' });

		assert.deepStrictEqual(recorder.snapshot(), [
			{ at: '2026-08-20T01:00:00.000Z', stage: 'compile', code: 'started', outcome: 'started' },
			{ at: '2026-08-20T01:00:01.000Z', stage: 'compile', code: 'success', outcome: 'succeeded' },
		]);
	});

	test('rejects credential, network, and device identifier shapes on the client', () => {
		const diagnostics = buildFeedbackDiagnostics({
			extensionVersion: '1'.repeat(43),
			vscodeVersion: '1.109.0',
			platform: 'linux',
			release: `${'9'.repeat(17)}.0`,
			arch: 'x64',
			locale: 'en',
			remoteName: undefined,
			workspaceFoldersCount: 1,
			workspaceTrusted: true,
			board: '550e8400-e29b-41d4-a716-446655440000',
			lastError: { stage: '192.0.2.1', code: `ghp_${'A'.repeat(24)}` },
			recentEvents: [{
				at: 'August 21, 2026', stage: 'upload', code: 'failed', outcome: 'failed',
			}],
		}, { includeDiagnostics: true, includeRecentEvents: true });

		assert.strictEqual(diagnostics.extensionVersion, undefined);
		assert.strictEqual(diagnostics.osMajor, undefined);
		assert.strictEqual(diagnostics.board, undefined);
		assert.strictEqual(diagnostics.lastError, undefined);
		assert.strictEqual(diagnostics.recentEvents, undefined);
	});

	test('includes recent events only after explicit opt-in', () => {
		const recorder = new FeedbackEventRecorder();
		recorder.record({ at: '2026-08-20T01:00:00.000Z', stage: 'upload', code: 'device-unavailable', outcome: 'failed' });
		const source = {
			extensionVersion: '0.87.5',
			vscodeVersion: '1.109.0',
			platform: 'linux',
			release: '6.8.0',
			arch: 'x64',
			locale: 'en',
			remoteName: undefined,
			workspaceFoldersCount: 0,
			workspaceTrusted: true,
			recentEvents: recorder.snapshot(),
		};

		assert.strictEqual(buildFeedbackDiagnostics(source, {
			includeDiagnostics: true,
			includeRecentEvents: false,
		}).recentEvents, undefined);
		assert.strictEqual(buildFeedbackDiagnostics(source, {
			includeDiagnostics: true,
			includeRecentEvents: true,
		}).recentEvents?.length, 1);
	});
});
