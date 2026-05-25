/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { PlatformioRepairService } from '../../services/platformioRepairService';
import { createDiagnosticItem, createDiagnosticSession } from '../helpers/platformioRepairFixtures';
import { EnvironmentFingerprint, RepairHistorySummary } from '../../types/platformioDiagnostic';

function createFingerprint(): EnvironmentFingerprint {
	return {
		fingerprintVersion: 1,
		workspaceHash: 'workspace-hash',
		platform: 'darwin',
		arch: 'arm64',
		settingsHash: 'settings-hash',
		pathHintsHash: 'path-hints-hash',
		toolVersions: {},
		createdAt: '2026-01-02T03:04:05.000Z',
	};
}

suite('PlatformioRepairService Tests', () => {
	test('plans a settings-aware flow for unavailable PlatformIO with primary/fallback/verification fields', () => {
		const service = new PlatformioRepairService();
		const session = createDiagnosticSession({
			overallStatus: 'unavailable',
			items: [
				createDiagnosticItem({ id: 'pio', status: 'error', resolvedPath: null, source: 'unresolved', exists: false, reason: 'pio missing' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', status: 'error', resolvedPath: null, source: 'unresolved', exists: false, reason: 'penv missing', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
				createDiagnosticItem({ id: 'pip', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
			settingsEvidence: {
				customPath: '/official/penv/bin',
				useBuiltinPython: true,
				useBuiltinPIOCore: true,
				customPyPiIndexUrl: null,
				httpProxyConfigured: false,
				candidatePathEntries: ['/official/penv/bin'],
				summary: 'customPATH entries=1',
			},
		});

		const flows = service.planRepairFlows(session);
		const flow = flows[0];

		assert.strictEqual(flow.id, 'align-with-official-platformio-settings');
		assert.ok(flow.primaryFix.length > 0);
		assert.ok(flow.fallbackFix.length > 0);
		assert.ok(flow.verification.length > 0);
		assert.ok(flow.manualAlternative);
		assert.strictEqual(flow.stopPolicy, 'stop-on-success-or-blocking-failure');
		assert.ok(flow.steps.length >= 1 && flow.steps.length <= 3);
		assert.ok(flow.steps.every(step => !step.commandPreview?.includes('sudo')));
	});

	test('plans a user-space mpremote repair flow with not-applicable reasons when Python is missing', () => {
		const service = new PlatformioRepairService();
		const session = createDiagnosticSession({
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
				createDiagnosticItem({ id: 'pip', status: 'ok' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});

		const flow = service.planRepairFlows(session).find(candidate => candidate.id === 'repair-mpremote-in-detected-python');

		assert.ok(flow, 'Expected mpremote repair flow');
		assert.strictEqual(flow?.notApplicableReason, 'PlatformIO Python is not resolved yet. Repair pio/python detection first.');
		assert.ok(flow?.manualAlternative?.includes('mpremote'));
	});

	test('uses repair history to explain repeated failed flows', () => {
		const service = new PlatformioRepairService();
		const history: RepairHistorySummary = {
			status: 'current',
			runs: [
				{
					runId: 'run-1',
					flowId: 'repair-mpremote-in-detected-python',
					startedAt: '2026-01-02T03:04:05.000Z',
					finishedAt: '2026-01-02T03:04:10.000Z',
					status: 'failed',
					environmentFingerprint: createFingerprint(),
					initialSessionId: 'initial',
					finalSessionId: null,
					stepResults: [],
					userFacingSummary: 'failed',
				},
			],
			lastRun: null,
			lastClearedAt: null,
			staleReason: null,
			maxRuns: 20,
		};
		const session = createDiagnosticSession({
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});

		const flow = service.planRepairFlows(session, history).find(candidate => candidate.id === 'repair-mpremote-in-detected-python');

		assert.ok(flow?.recommendationReason.includes('Previous automatic attempt failed'));
	});

	test('redacts session workspace paths in repair command previews by default', () => {
		const service = new PlatformioRepairService();
		const session = createDiagnosticSession({
			workspacePath: '/tmp/secret-workspace',
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python', resolvedPath: '/tmp/secret-workspace/.platformio/penv/bin/python3' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});

		const flow = service.planRepairFlows(session).find(candidate => candidate.id === 'repair-mpremote-in-detected-python');
		const commandPreview = flow?.steps[0].commandPreview ?? '';

		assert.ok(!commandPreview.includes('/tmp/secret-workspace'));
		assert.ok(commandPreview.includes('<workspace>'));
	});

	test('executes allowlisted steps with execFile, timeout, redacted output, stop policy, and retest evidence', async () => {
		const execFile = sinon.stub().resolves({ stdout: 'installed in /Users/alice/secret with token ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD', stderr: '' });
		const service = new PlatformioRepairService({
			execFile,
			now: (() => {
				let offset = 0;
				return () => new Date(Date.parse('2026-01-02T03:04:05.000Z') + offset++ * 1000);
			})(),
			homeDir: '/Users/alice',
			workspacePath: '/Users/alice/Documents/demo',
		});
		const session = createDiagnosticSession({
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python', resolvedPath: '/Users/alice/.platformio/penv/bin/python3' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});
		const flow = service.planRepairFlows(session).find(candidate => candidate.id === 'repair-mpremote-in-detected-python');

		assert.ok(flow, 'Expected mpremote flow');
		const run = await service.executeRepairFlow(flow!, {
			environmentFingerprint: createFingerprint(),
			initialSessionId: 'initial-session',
			retest: async () => createDiagnosticSession({ requestedAt: '2026-01-02T03:05:00.000Z', overallStatus: 'operational' }),
		});

		assert.ok(execFile.calledWith('/Users/alice/.platformio/penv/bin/python3', ['-m', 'pip', 'install', '--user', '--upgrade', 'mpremote'], { timeout: 120000 }));
		assert.strictEqual(run.status, 'succeeded');
		assert.strictEqual(run.finalSessionId, '2026-01-02T03:05:00.000Z');
		assert.ok(!run.stepResults[0].sanitizedOutput.includes('/Users/alice'));
		assert.ok(!run.stepResults[0].sanitizedOutput.includes('ghp_'));
		assert.strictEqual(run.stepResults[0].outputRedacted, true);
	});

	test('stops on timed-out blocking failures with sanitized output', async () => {
		const execFile = sinon.stub().rejects({
			error: { code: 124, killed: true, message: 'Command timed out' },
			stdout: 'downloading into /Users/alice/secret',
			stderr: 'timeout token ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD',
		});
		const service = new PlatformioRepairService({
			execFile,
			now: (() => {
				let offset = 0;
				return () => new Date(Date.parse('2026-01-02T03:04:05.000Z') + offset++ * 1000);
			})(),
			homeDir: '/Users/alice',
		});
		const session = createDiagnosticSession({
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python', resolvedPath: '/Users/alice/.platformio/penv/bin/python3' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});
		const flow = service.planRepairFlows(session).find(candidate => candidate.id === 'repair-mpremote-in-detected-python');

		assert.ok(flow, 'Expected mpremote flow');
		const run = await service.executeRepairFlow(flow!, {
			environmentFingerprint: createFingerprint(),
			initialSessionId: 'initial-session',
		});

		assert.strictEqual(run.status, 'failed');
		assert.strictEqual(run.stepResults[0].status, 'timed-out');
		assert.strictEqual(run.stepResults[0].exitCode, 124);
		assert.ok(!run.stepResults[0].sanitizedOutput.includes('/Users/alice'));
		assert.ok(!run.stepResults[0].sanitizedOutput.includes('ghp_'));
		assert.strictEqual(execFile.callCount, 1);
	});

	test('supports cancellation before executing side-effect steps', async () => {
		const execFile = sinon.stub();
		const service = new PlatformioRepairService({ execFile });
		const flow = service.planRepairFlows(createDiagnosticSession({
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		}))[0];

		const run = await service.executeRepairFlow(flow, {
			environmentFingerprint: createFingerprint(),
			initialSessionId: 'initial-session',
			isCancelled: () => true,
		});

		assert.strictEqual(run.status, 'cancelled');
		assert.strictEqual(execFile.callCount, 0);
	});
});
