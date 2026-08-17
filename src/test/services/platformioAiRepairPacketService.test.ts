/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PlatformioAiRepairPacketService } from '../../services/platformioAiRepairPacketService';
import { createDiagnosticItem, createDiagnosticSession } from '../helpers/platformioRepairFixtures';
import { RepairHistorySummary } from '../../types/platformioDiagnostic';

suite('PlatformioAiRepairPacketService Tests', () => {
	test('formats stable sections with diagnostics, history, stale marking, redaction, and response contract', () => {
		const service = new PlatformioAiRepairPacketService({
			now: () => new Date('2026-01-02T03:04:05.000Z'),
			homeDir: '/Users/alice',
			workspacePath: '/Users/alice/Documents/秘密專案',
			platform: 'darwin',
			arch: 'arm64',
		});
		const session = createDiagnosticSession({
			workspacePath: '/Users/alice/Documents/秘密專案',
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio', resolvedPath: '/Users/alice/.platformio/penv/bin/pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false, reason: 'token ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD missing' }),
			],
			settingsEvidence: {
				customPath: '/Users/alice/.platformio/penv/bin',
				useBuiltinPython: true,
				useBuiltinPIOCore: false,
				customPyPiIndexUrl: null,
				httpProxyConfigured: true,
				proxyStrictSsl: false,
				candidatePathEntries: ['/Users/alice/.platformio/penv/bin'],
				summary: 'customPATH entries=1; http.proxy=configured',
			},
			coreDiagnostics: createCoreDiagnostics(),
		});
		const history: RepairHistorySummary = {
			status: 'stale',
			runs: [
				{
					runId: 'run-1',
					flowId: 'repair-mpremote-in-detected-python',
					startedAt: '2026-01-02T03:00:00.000Z',
					finishedAt: '2026-01-02T03:01:00.000Z',
					status: 'failed',
					environmentFingerprint: {
						fingerprintVersion: 1,
						workspaceHash: 'hash',
						platform: 'darwin',
						arch: 'arm64',
						settingsHash: 'settings',
						pathHintsHash: 'path',
						toolVersions: {},
						createdAt: '2026-01-02T03:00:00.000Z',
					},
					initialSessionId: 'initial',
					finalSessionId: null,
					stepResults: [
						{
							stepId: 'install',
							startedAt: '2026-01-02T03:00:00.000Z',
							finishedAt: '2026-01-02T03:01:00.000Z',
							status: 'failed',
							exitCode: 1,
							durationMs: 60000,
							sanitizedOutput: 'proxy failed',
							outputRedacted: true,
							evidence: {},
						},
					],
					userFacingSummary: 'failed',
				},
			],
			lastRun: null,
			lastClearedAt: null,
			staleReason: 'environment-fingerprint-changed',
			maxRuns: 20,
		};

		const packet = service.buildPacket({ session, historySummary: history });

		assert.ok(packet.plainText.includes('# Singular Blockly PlatformIO Repair Packet'));
		assert.ok(packet.plainText.includes('## Problem'));
		assert.ok(packet.plainText.includes('## Environment'));
		assert.ok(packet.plainText.includes('## Diagnostics'));
		assert.ok(packet.plainText.includes('## Repair Attempts'));
		assert.ok(packet.plainText.includes('## Current Blocker'));
		assert.ok(packet.plainText.includes('## Requested Response'));
		assert.ok(packet.plainText.includes('Provider Core: healthy'));
		assert.ok(packet.plainText.includes('Singular managed Core: degraded'));
		assert.ok(packet.plainText.includes('Python route: managed -> provider'));
		assert.ok(packet.plainText.includes('Some repair history may be stale'));
		assert.ok(packet.plainText.includes('Likely root cause'));
		assert.ok(!packet.plainText.includes('/Users/alice'));
		assert.ok(!packet.plainText.includes('秘密專案'));
		assert.ok(!packet.plainText.includes('ghp_'));
		assert.strictEqual(packet.redacted, true);
		assert.strictEqual(packet.staleHistory, true);
	});

	test('redacts session workspace paths with default constructor options', () => {
		const service = new PlatformioAiRepairPacketService({
			now: () => new Date('2026-01-02T03:04:05.000Z'),
		});
		const session = createDiagnosticSession({
			workspacePath: '/tmp/secret-workspace',
			items: [
				createDiagnosticItem({ id: 'pio', resolvedPath: '/tmp/secret-workspace/.platformio/penv/bin/pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote' }),
			],
		});

		const packet = service.buildPacket({ session });

		assert.ok(!packet.plainText.includes('/tmp/secret-workspace'));
		assert.ok(packet.plainText.includes('<workspace>'));
	});

	test('includes managed provisioning evidence as the current blocker with privacy redaction', () => {
		const service = new PlatformioAiRepairPacketService({ homeDir: '/Users/alice' });
		const coreDiagnostics = createCoreDiagnostics();
		coreDiagnostics.environments.managed.provisioning = {
			status: 'failed', attempt: 3, trigger: 'activation', stage: 'installing-platformio', percent: 40,
			startedAt: '2026-01-02T03:00:00.000Z', failedAt: '2026-01-02T03:01:00.000Z',
			failure: {
				failureDomain: 'managed-provisioning', stage: 'installing-platformio', code: '1', started: true,
				message: 'installer failed', stdout: '',
				stderr: '/Users/alice/runtime token=ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD',
			},
		};
		const session = createDiagnosticSession({ overallStatus: 'operational', coreDiagnostics });

		const packet = service.buildPacket({ session });

		assert.ok(packet.currentBlocker.includes('managed-runtime'));
		assert.ok(packet.plainText.includes('Managed installer stderr'));
		assert.ok(packet.plainText.includes('<home>'));
		assert.ok(!packet.plainText.includes('/Users/alice'));
		assert.ok(!packet.plainText.includes('ghp_'));
		assert.ok(!packet.currentBlocker.includes('No current blocker'));
	});
});

function createCoreDiagnostics(): NonNullable<ReturnType<typeof createDiagnosticSession>['coreDiagnostics']> {
	return {
		environments: {
			provider: { id: 'provider', status: 'healthy', version: '6.1.18', storageSummary: null, storageUsageBytes: null, packageStatus: 'ready', failureClass: null, reason: 'ready' },
			managed: { id: 'managed', status: 'degraded', version: null, storageSummary: '<managed-storage:123456789abc>', storageUsageBytes: 1024, packageStatus: 'unknown', failureClass: 'permission', reason: 'permission denied' },
		},
		selection: {
			arduino: { workload: 'arduino', primary: 'provider', fallback: 'managed', selected: 'provider', fallbackUsed: false, stickyReason: null },
			python: { workload: 'python', primary: 'managed', fallback: 'provider', selected: 'provider', fallbackUsed: true, stickyReason: 'permission' },
		},
	};
}
