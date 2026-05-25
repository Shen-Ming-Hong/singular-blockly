/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { PlatformioIssueDraftService } from '../../services/platformioIssueDraftService';
import { createDiagnosticItem, createDiagnosticSession } from '../helpers/platformioRepairFixtures';
import { RepairHistorySummary } from '../../types/platformioDiagnostic';

suite('PlatformioIssueDraftService Tests', () => {
	test('builds a redacted local issue draft with governance fields and duplicate-search hints', () => {
		const service = new PlatformioIssueDraftService({
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
				createDiagnosticItem({ id: 'pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false, reason: 'mpremote token ghp_abcdefghijklmnopqrstuvwxyz1234567890ABCD missing' }),
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
		});
		const history: RepairHistorySummary = {
			status: 'current',
			runs: [],
			lastRun: null,
			lastClearedAt: null,
			staleReason: null,
			maxRuns: 20,
		};

		const draft = service.buildDraft({ session, historySummary: history, source: 'ai-assisted' });

		assert.strictEqual(draft.candidacy, 'recommended');
		assert.ok(draft.title.includes('degraded'));
		assert.ok(draft.body.includes('## Privacy checklist before posting'));
		assert.ok(draft.body.includes('## Suggested duplicate-search keywords'));
		assert.ok(draft.privacyChecklist.length >= 3);
		assert.ok(draft.duplicateSearchHints.includes('mpremote not found CyberBrick'));
		assert.ok(draft.labels.includes('platformio'));
		assert.ok(draft.body.includes('Source: ai-assisted'));
		assert.ok(!draft.body.includes('/Users/alice'));
		assert.ok(!draft.body.includes('秘密專案'));
		assert.ok(!draft.body.includes('ghp_'));
	});

	test('redacts session workspace paths with default constructor options', () => {
		const service = new PlatformioIssueDraftService({ now: () => new Date('2026-01-02T03:04:05.000Z') });
		const session = createDiagnosticSession({
			workspacePath: '/tmp/secret-workspace',
			overallStatus: 'degraded',
			items: [
				createDiagnosticItem({ id: 'pio', resolvedPath: '/tmp/secret-workspace/.platformio/penv/bin/pio' }),
				createDiagnosticItem({ id: 'penvRoot', kind: 'derived-directory', versionProbe: undefined }),
				createDiagnosticItem({ id: 'python' }),
				createDiagnosticItem({ id: 'pip' }),
				createDiagnosticItem({ id: 'mpremote', status: 'error', resolvedPath: null, source: 'unresolved', exists: false }),
			],
		});

		const draft = service.buildDraft({ session, historySummary: null, source: 'human-confirmed' });

		assert.ok(!draft.body.includes('/tmp/secret-workspace'));
		assert.ok(draft.body.includes('<workspace>'));
	});

	test('returns a no-draft reason for operational one-off local noise', () => {
		const service = new PlatformioIssueDraftService({ now: () => new Date('2026-01-02T03:04:05.000Z') });
		const draft = service.buildDraft({ session: createDiagnosticSession({ overallStatus: 'operational' }), historySummary: null, source: 'human-confirmed' });

		assert.strictEqual(draft.candidacy, 'not-recommended');
		assert.ok(draft.noDraftReason?.includes('operational'));
		assert.strictEqual(draft.body, 'No issue draft recommended: diagnostics are operational.');
	});
});
