const assert = require('assert');

const { LOCALES } = require('./lib/translation-config');
const {
	POLICY_VERSION,
	addLocalizedMap,
	collectAuditUnits,
	createManifest,
	evaluateAuditState,
	parseArguments,
} = require('./prepare-semantic-audit');

describe('semantic audit batch contracts', () => {
	const units = Array.from({ length: 201 }, (_, index) => ({
		surface: 'messages',
		locale: 'ja',
		key: String(index),
		sourceText: 'A',
		targetText: 'あ',
	}));
	const counts = { Blocker: 0, Major: 0, Minor: 0, Info: 0 };

	function state(overrides = {}) {
		return {
			schemaVersion: 1,
			policyVersion: POLICY_VERSION,
			lastFullAudit: null,
			inProgress: null,
			findings: [],
			...overrides,
		};
	}

	function completedAudit(completedAt, manifestHash) {
		return { completedAt, manifestHash, result: 'PASS', counts };
	}

	function inProgress(manifestHash, nextBatch) {
		return { manifestHash, nextBatch, counts };
	}

	function finding(overrides = {}) {
		return {
			surface: 'messages',
			locale: 'ja',
			key: 'EXAMPLE',
			ruleId: 'SEM-001',
			severity: 'Major',
			evidence: 'context-backed',
			status: 'open',
			...overrides,
		};
	}

	it('creates a deterministic manifest and batch count', () => {
		const first = createManifest(units);
		const second = createManifest(units);
		assert.strictEqual(first.manifestHash, second.manifestHash);
		assert.strictEqual(first.batchSize, 200);
		assert.strictEqual(first.totalUnits, 201);
		assert.strictEqual(first.totalBatches, 2);
	});

	it('includes the baseline locale in every semantic audit surface', () => {
		const auditUnits = collectAuditUnits();
		for (const surface of ['messages', 'package-nls']) {
			const locales = new Set(auditUnits.filter(unit => unit.surface === surface).map(unit => unit.locale));
			assert.deepStrictEqual([...locales].sort(), [...LOCALES].sort());
		}
		for (const surface of ['sample-index', 'sample-name', 'sample-string']) {
			assert(auditUnits.some(unit => unit.surface === surface && unit.locale === 'zh-hant'));
		}
	});

	it('uses English as the semantic source when an optional Traditional Chinese sample value is absent', () => {
		const mappedUnits = [];
		addLocalizedMap(mappedUnits, 'sample-index', 'samples.demo.title', { en: 'Demo', ja: 'デモ' });
		assert.deepStrictEqual(
			mappedUnits.map(({ locale, sourceText, targetText }) => ({ locale, sourceText, targetText })),
			[
				{ locale: 'en', sourceText: 'Demo', targetText: 'Demo' },
				{ locale: 'ja', sourceText: 'Demo', targetText: 'デモ' },
			]
		);
	});

	it('uses fixed-size one-based batches', () => {
		assert.deepStrictEqual(parseArguments(['--batch=2']), { batch: 2 });
		assert.deepStrictEqual(parseArguments([]), { batch: null });
		assert.throws(() => parseArguments(['--batch=0']), /positive/);
		assert.throws(() => parseArguments(['--batch=1=typo']), /positive/);
		assert.throws(() => parseArguments(['--batch-size=100']), /Unsupported arguments/);
		assert.throws(() => parseArguments(['--batch=1', '--batch=2']), /Unsupported arguments/);
	});

	it('requires a full audit for missing, stale, or changed policy state', () => {
		const manifest = createManifest(units);
		const now = Date.parse('2026-08-14T00:00:00.000Z');
		assert.strictEqual(evaluateAuditState(null, manifest, now).reason, 'never-completed');
		assert.strictEqual(
			evaluateAuditState(
				state({ lastFullAudit: completedAudit('2026-07-14T00:00:00.000Z', manifest.manifestHash) }),
				manifest,
				now
			).reason,
			'stale'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({
					policyVersion: '0.9.0',
					lastFullAudit: completedAudit('2026-08-13T00:00:00.000Z', manifest.manifestHash),
				}),
				manifest,
				now
			).reason,
			'policy-changed'
		);
	});

	it('keeps current state and safely restarts changed manifests', () => {
		const manifest = createManifest(units);
		const now = Date.parse('2026-08-14T00:00:00.000Z');
		const current = evaluateAuditState(
			state({ lastFullAudit: completedAudit('2026-08-01T00:00:00.000Z', manifest.manifestHash) }),
			manifest,
			now
		);
		assert.deepStrictEqual(current, { required: false, reason: 'current', nextBatch: null });
		assert.deepStrictEqual(
			evaluateAuditState(
				state({ lastFullAudit: completedAudit('2026-08-01T00:00:00.000Z', 'old') }),
				manifest,
				now
			),
			{ required: true, reason: 'manifest-changed', nextBatch: 1 }
		);

		const changed = evaluateAuditState(
			state({ inProgress: inProgress('old', 7) }),
			manifest,
			now
		);
		assert.deepStrictEqual(changed, { required: true, reason: 'manifest-changed', nextBatch: 1 });
	});

	it('resumes a matching in-progress manifest from its saved cursor', () => {
		const manifest = createManifest(units);
		const resumed = evaluateAuditState(
			state({ inProgress: inProgress(manifest.manifestHash, 2) }),
			manifest
		);
		assert.deepStrictEqual(resumed, { required: true, reason: 'resume', nextBatch: 2 });
	});

	it('restarts incompatible, future-dated, and out-of-range state', () => {
		const manifest = createManifest(units);
		const now = Date.parse('2026-08-14T00:00:00.000Z');
		assert.strictEqual(
			evaluateAuditState(
				state({
					schemaVersion: 999,
					lastFullAudit: completedAudit('2026-08-13T00:00:00.000Z', manifest.manifestHash),
				}),
				manifest,
				now
			).reason,
			'state-schema-changed'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({ lastFullAudit: completedAudit('2026-08-15T00:00:00.000Z', manifest.manifestHash) }),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({ inProgress: inProgress(manifest.manifestHash, 3) }),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(evaluateAuditState({ schemaVersion: 1 }, manifest, now).reason, 'invalid-state');
		assert.strictEqual(
			evaluateAuditState(
				state({ inProgress: { manifestHash: manifest.manifestHash, nextBatch: 1, counts: {} } }),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({
					lastFullAudit: {
						completedAt: '2026-08-13T00:00:00.000Z',
						manifestHash: 'hash',
						result: 'PASS',
						counts: {},
					},
				}),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({ lastFullAudit: completedAudit('2026-08-13', manifest.manifestHash) }),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({
					lastFullAudit: { ...completedAudit('2026-08-13T00:00:00.000Z', manifest.manifestHash), counts: { ...counts, Major: 1 } },
				}),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({
					lastFullAudit: completedAudit('2026-08-13T00:00:00.000Z', manifest.manifestHash),
					findings: [finding({ status: '' })],
				}),
				manifest,
				now
			).reason,
			'invalid-state'
		);
		assert.strictEqual(
			evaluateAuditState(
				state({
					lastFullAudit: { ...completedAudit('2026-08-13T00:00:00.000Z', manifest.manifestHash), counts: { ...counts, Major: 2 } },
					findings: [finding(), finding()],
				}),
				manifest,
				now
			).reason,
			'invalid-state'
		);
	});
});
