/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PlatformioRepairHistoryStore, WorkspaceStateLike } from '../../services/platformioRepairHistoryStore';
import { createDiagnosticSession } from '../helpers/platformioRepairFixtures';

class WorkspaceStateMock implements WorkspaceStateLike {
	private readonly values = new Map<string, unknown>();

	get<T>(key: string): T | undefined {
		return this.values.get(key) as T | undefined;
	}

	async update(key: string, value: unknown): Promise<void> {
		if (value === undefined) {
			this.values.delete(key);
			return;
		}
		this.values.set(key, value);
	}
}

suite('PlatformioRepairHistoryStore Tests', () => {
	test('creates a stable environment fingerprint without storing raw workspace paths', () => {
		const store = new PlatformioRepairHistoryStore(new WorkspaceStateMock(), {
			now: () => new Date('2026-01-02T03:04:05.000Z'),
			platform: 'darwin',
			arch: 'arm64',
		});
		const session = createDiagnosticSession({ workspacePath: '/Users/alice/Documents/秘密專案' });

		const first = store.createEnvironmentFingerprint(session);
		const second = store.createEnvironmentFingerprint(session);

		assert.strictEqual(first.workspaceHash, second.workspaceHash);
		assert.strictEqual(first.settingsHash, second.settingsHash);
		assert.ok(!JSON.stringify(first).includes('秘密專案'));
		assert.strictEqual(first.platform, 'darwin');
		assert.strictEqual(first.arch, 'arm64');
	});

	test('marks loaded history as stale when the active fingerprint changes', async () => {
		const workspaceState = new WorkspaceStateMock();
		const store = new PlatformioRepairHistoryStore(workspaceState, {
			now: () => new Date('2026-01-02T03:04:05.000Z'),
			platform: 'darwin',
			arch: 'arm64',
		});
		const originalFingerprint = store.createEnvironmentFingerprint(createDiagnosticSession({ workspacePath: '/workspace/one' }));
		const changedFingerprint = store.createEnvironmentFingerprint(createDiagnosticSession({ workspacePath: '/workspace/two' }));

		await store.saveSnapshot(store.createEmptySnapshot(originalFingerprint));
		const loaded = await store.loadSnapshot(changedFingerprint);

		assert.strictEqual(loaded?.staleReason, 'environment-fingerprint-changed');
	});

	test('ignores stored history with an unsupported schema version', async () => {
		const workspaceState = new WorkspaceStateMock();
		await workspaceState.update('platformioGuidedRepair.history.v1', {
			schemaVersion: 999,
			workspaceHash: 'old',
			runs: [],
		});
		const store = new PlatformioRepairHistoryStore(workspaceState);

		const loaded = await store.loadSnapshot();

		assert.strictEqual(loaded, null);
	});

	test('persists runs and caps history to the configured maximum', async () => {
		const workspaceState = new WorkspaceStateMock();
		const store = new PlatformioRepairHistoryStore(workspaceState, {
			maxRuns: 2,
			now: () => new Date('2026-01-02T03:04:05.000Z'),
		});
		const fingerprint = store.createEnvironmentFingerprint(createDiagnosticSession());

		for (const runId of ['run-1', 'run-2', 'run-3']) {
			await store.appendRun(fingerprint, {
				runId,
				flowId: 'repair-mpremote-in-detected-python',
				startedAt: '2026-01-02T03:04:05.000Z',
				finishedAt: '2026-01-02T03:04:06.000Z',
				status: 'failed',
				environmentFingerprint: fingerprint,
				initialSessionId: 'initial',
				finalSessionId: null,
				stepResults: [],
				userFacingSummary: runId,
			});
		}

		const loaded = await store.loadSnapshot(fingerprint);

		assert.deepStrictEqual(loaded?.runs.map(run => run.runId), ['run-2', 'run-3']);
	});

	test('marks stale running runs as interrupted when loading history', async () => {
		const workspaceState = new WorkspaceStateMock();
		const store = new PlatformioRepairHistoryStore(workspaceState, {
			now: () => new Date('2026-01-02T03:04:05.000Z'),
		});
		const fingerprint = store.createEnvironmentFingerprint(createDiagnosticSession());

		await store.saveSnapshot({
			schemaVersion: 1,
			workspaceHash: fingerprint.workspaceHash,
			activeFingerprint: fingerprint,
			runs: [
				{
					runId: 'run-stale',
					flowId: 'repair-mpremote-in-detected-python',
					startedAt: '2026-01-02T03:00:00.000Z',
					finishedAt: null,
					status: 'running',
					environmentFingerprint: fingerprint,
					initialSessionId: 'initial',
					finalSessionId: null,
					stepResults: [],
					userFacingSummary: 'repair was running',
				},
			],
			lastClearedAt: null,
			staleReason: null,
		});

		const loaded = await store.loadSnapshot(fingerprint);

		assert.strictEqual(loaded?.runs[0].status, 'interrupted');
		assert.strictEqual(loaded?.runs[0].finishedAt, '2026-01-02T03:04:05.000Z');
		assert.ok(loaded?.runs[0].userFacingSummary.includes('interrupted'));
	});

	test('clear removes previous runs and records the clear timestamp', async () => {
		const workspaceState = new WorkspaceStateMock();
		const store = new PlatformioRepairHistoryStore(workspaceState, {
			now: () => new Date('2026-01-02T03:04:05.000Z'),
		});
		const fingerprint = store.createEnvironmentFingerprint(createDiagnosticSession());

		await store.appendRun(fingerprint, {
			runId: 'run-1',
			flowId: 'repair-mpremote-in-detected-python',
			startedAt: '2026-01-02T03:04:05.000Z',
			finishedAt: '2026-01-02T03:04:06.000Z',
			status: 'failed',
			environmentFingerprint: fingerprint,
			initialSessionId: 'initial',
			finalSessionId: null,
			stepResults: [],
			userFacingSummary: 'failed',
		});

		const cleared = await store.clear(fingerprint);

		assert.deepStrictEqual(cleared.runs, []);
		assert.strictEqual(cleared.lastClearedAt, '2026-01-02T03:04:05.000Z');
	});
});
