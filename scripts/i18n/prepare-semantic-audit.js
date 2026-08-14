#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { LOCALES, PROJECT_ROOT, packageNlsFile } = require('./lib/translation-config');
const { loadMessagesFile } = require('./lib/translation-reader');

const DEFAULT_BATCH_SIZE = 200;
const FULL_AUDIT_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const AUDIT_STATE_SCHEMA_VERSION = 1;
const MANIFEST_SCHEMA_VERSION = 1;
const POLICY_VERSION = '1.0.0';
const STATE_PATH = path.join('docs', 'specifications', '02-internationalization', 'audit-state.json');
const AUDIT_RESULTS = new Set(['PASS', 'PASS_WITH_ADVISORIES', 'NEEDS_USER_DECISION', 'BLOCKED']);
const SEVERITIES = ['Blocker', 'Major', 'Minor', 'Info'];
const STORED_FINDING_SEVERITIES = new Set(['Blocker', 'Major']);
const EVIDENCE_TYPES = new Set(['deterministic', 'policy-backed', 'context-backed', 'ambiguous']);

function addUnit(units, surface, locale, key, sourceText, targetText, details = {}) {
	if (typeof sourceText !== 'string' || typeof targetText !== 'string' || targetText.trim().length === 0) {
		return;
	}
	units.push({ surface, locale, key, sourceText, targetText, ...details });
}

function addKeyedSurface(units, surface, sourceValues, targets) {
	for (const locale of Object.keys(targets).sort()) {
		for (const key of Object.keys(sourceValues).sort()) {
			addUnit(units, surface, locale, key, sourceValues[key], targets[locale][key]);
		}
	}
}

function addLocalizedMap(units, surface, key, values, sourceLocale = 'zh-hant') {
	if (!values || typeof values !== 'object') {
		return;
	}
	const fallbackText = values.en;
	const sourceText = typeof values[sourceLocale] === 'string' ? values[sourceLocale] : fallbackText;
	for (const locale of LOCALES) {
		if (!(locale in values)) {
			continue;
		}
		addUnit(units, surface, locale, key, sourceText, values[locale], { fallbackText });
	}
}

function collectSampleIndexUnits(units, root) {
	const indexPath = path.join(root, 'media', 'samples', 'index.json');
	const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
	for (const category of index.categories || []) {
		addLocalizedMap(units, 'sample-index', `categories.${category.id}.title`, category.title);
	}
	for (const sample of index.samples || []) {
		addLocalizedMap(units, 'sample-index', `samples.${sample.id}.title`, sample.title);
		addLocalizedMap(units, 'sample-index', `samples.${sample.id}.description`, sample.description);
	}
}

function collectSampleTranslationUnits(units, root) {
	const samplesDirectory = path.join(root, 'media', 'samples');
	const filenames = fs.readdirSync(samplesDirectory).filter(filename => filename.endsWith('.json') && filename !== 'index.json');
	for (const filename of filenames.sort()) {
		const sample = JSON.parse(fs.readFileSync(path.join(samplesDirectory, filename), 'utf8'));
		for (const kind of ['variables', 'functions']) {
			for (const [sourceText, translations] of Object.entries(sample.nameTranslations?.[kind] || {})) {
				for (const [locale, targetText] of Object.entries({ 'zh-hant': sourceText, ...translations })) {
					addUnit(units, 'sample-name', locale, `${filename}:${kind}.${sourceText}`, sourceText, targetText, {
						fallbackText: translations.en,
					});
				}
			}
		}
		for (const [sourceText, translations] of Object.entries(sample.stringTranslations || {})) {
			for (const [locale, targetText] of Object.entries({ 'zh-hant': sourceText, ...translations })) {
				addUnit(units, 'sample-string', locale, `${filename}:${sourceText}`, sourceText, targetText, {
					fallbackText: translations.en,
				});
			}
		}
	}
}

function collectAuditUnits(root = PROJECT_ROOT) {
	const units = [];
	const englishMessages = loadMessagesFile('en', root);
	const localizedMessages = Object.fromEntries(
		LOCALES.map(locale => [locale, locale === 'en' ? englishMessages : loadMessagesFile(locale, root)])
	);
	addKeyedSurface(units, 'messages', englishMessages, localizedMessages);

	const englishPackage = JSON.parse(fs.readFileSync(packageNlsFile('en', root), 'utf8'));
	const localizedPackages = Object.fromEntries(
		LOCALES.map(locale => [
			locale,
			locale === 'en' ? englishPackage : JSON.parse(fs.readFileSync(packageNlsFile(locale, root), 'utf8')),
		])
	);
	addKeyedSurface(units, 'package-nls', englishPackage, localizedPackages);
	collectSampleIndexUnits(units, root);
	collectSampleTranslationUnits(units, root);

	return units.sort((left, right) => {
		const leftKey = [left.surface, left.locale, left.key].join(':');
		const rightKey = [right.surface, right.locale, right.key].join(':');
		return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
	});
}

function createManifest(units) {
	const manifestHash = crypto.createHash('sha256').update(JSON.stringify(units)).digest('hex');
	return {
		schemaVersion: MANIFEST_SCHEMA_VERSION,
		manifestHash,
		batchSize: DEFAULT_BATCH_SIZE,
		totalUnits: units.length,
		totalBatches: Math.ceil(units.length / DEFAULT_BATCH_SIZE),
	};
}

function readAuditState(root = PROJECT_ROOT) {
	const statePath = path.join(root, STATE_PATH);
	if (!fs.existsSync(statePath)) {
		return null;
	}
	return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function isRecord(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasSeverityCounts(value) {
	return isRecord(value) && SEVERITIES.every(severity => Number.isInteger(value[severity]) && value[severity] >= 0);
}

function isNonEmptyString(value) {
	return typeof value === 'string' && value.trim().length > 0;
}

function hasValidFindings(findings) {
	if (!Array.isArray(findings)) {
		return false;
	}
	const signatures = new Set();
	for (const finding of findings) {
		if (
			!isRecord(finding) ||
			!['surface', 'locale', 'key', 'ruleId', 'status'].every(field => isNonEmptyString(finding[field])) ||
			!STORED_FINDING_SEVERITIES.has(finding.severity) ||
			!EVIDENCE_TYPES.has(finding.evidence)
		) {
			return false;
		}
		const signature = [finding.surface, finding.locale, finding.key, finding.ruleId].join('|');
		if (signatures.has(signature)) {
			return false;
		}
		signatures.add(signature);
	}
	return true;
}

function findingsMatchCounts(findings, counts) {
	return [...STORED_FINDING_SEVERITIES].every(
		severity => findings.filter(finding => finding.severity === severity).length === counts[severity]
	);
}

function hasAuditStateEnvelope(state) {
	return (
		typeof state.policyVersion === 'string' &&
		Object.hasOwn(state, 'lastFullAudit') &&
		Object.hasOwn(state, 'inProgress') &&
		hasValidFindings(state.findings)
	);
}

function evaluateAuditState(state, manifest, now = Date.now()) {
	if (!state) {
		return { required: true, reason: 'never-completed', nextBatch: 1 };
	}
	if (!isRecord(state) || state.schemaVersion !== AUDIT_STATE_SCHEMA_VERSION) {
		return { required: true, reason: 'state-schema-changed', nextBatch: 1 };
	}
	if (!hasAuditStateEnvelope(state)) {
		return { required: true, reason: 'invalid-state', nextBatch: 1 };
	}
	if (state.policyVersion !== POLICY_VERSION) {
		return { required: true, reason: 'policy-changed', nextBatch: 1 };
	}
	if (state.inProgress !== null && state.inProgress !== undefined) {
		if (
			!isRecord(state.inProgress) ||
			!hasSeverityCounts(state.inProgress.counts) ||
			!findingsMatchCounts(state.findings, state.inProgress.counts)
		) {
			return { required: true, reason: 'invalid-state', nextBatch: 1 };
		}
		if (state.inProgress.manifestHash !== manifest.manifestHash) {
			return { required: true, reason: 'manifest-changed', nextBatch: 1 };
		}
		const nextBatch = state.inProgress.nextBatch;
		if (!Number.isInteger(nextBatch) || nextBatch < 1 || nextBatch > manifest.totalBatches) {
			return { required: true, reason: 'invalid-state', nextBatch: 1 };
		}
		return { required: true, reason: 'resume', nextBatch };
	}
	if (state.lastFullAudit === null) {
		return { required: true, reason: 'never-completed', nextBatch: 1 };
	}
	if (
		!isRecord(state.lastFullAudit) ||
		typeof state.lastFullAudit.completedAt !== 'string' ||
		typeof state.lastFullAudit.manifestHash !== 'string' ||
		!AUDIT_RESULTS.has(state.lastFullAudit.result) ||
		!hasSeverityCounts(state.lastFullAudit.counts) ||
		!findingsMatchCounts(state.findings, state.lastFullAudit.counts)
	) {
		return { required: true, reason: 'invalid-state', nextBatch: 1 };
	}
	const completedAt = Date.parse(state.lastFullAudit.completedAt);
	if (!Number.isFinite(completedAt) || new Date(completedAt).toISOString() !== state.lastFullAudit.completedAt) {
		return { required: true, reason: 'invalid-state', nextBatch: 1 };
	}
	if (completedAt > now) {
		return { required: true, reason: 'invalid-state', nextBatch: 1 };
	}
	if (state.lastFullAudit.manifestHash !== manifest.manifestHash) {
		return { required: true, reason: 'manifest-changed', nextBatch: 1 };
	}
	if (now - completedAt >= FULL_AUDIT_INTERVAL_MS) {
		return { required: true, reason: 'stale', nextBatch: 1 };
	}
	return { required: false, reason: 'current', nextBatch: null };
}

function parseArguments(argv) {
	if (argv.length === 0) {
		return { batch: null };
	}
	const batchPrefix = '--batch=';
	if (argv.length !== 1 || !argv[0].startsWith(batchPrefix)) {
		throw new Error(`Unsupported arguments: ${argv.join(' ')}`);
	}
	const batchText = argv[0].slice(batchPrefix.length);
	const batch = Number(batchText);
	if (!/^[1-9]\d*$/.test(batchText) || !Number.isSafeInteger(batch)) {
		throw new Error('Batch must be a positive, one-based integer');
	}
	return { batch };
}

function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArguments(argv);
		const units = collectAuditUnits();
		const manifest = createManifest(units);
		const audit = evaluateAuditState(readAuditState(), manifest);
		if (options.batch === null) {
			console.log(JSON.stringify({ ...manifest, policyVersion: POLICY_VERSION, audit }, null, 2));
			return 0;
		}
		if (options.batch > manifest.totalBatches) {
			throw new Error(`Batch ${options.batch} exceeds total batch count ${manifest.totalBatches}`);
		}
		const start = (options.batch - 1) * DEFAULT_BATCH_SIZE;
		console.log(
			JSON.stringify(
				{
					...manifest,
					policyVersion: POLICY_VERSION,
					audit,
					batch: options.batch,
					units: units.slice(start, start + DEFAULT_BATCH_SIZE),
				},
				null,
				2
			)
		);
		return 0;
	} catch (error) {
		console.error(`Unable to prepare semantic audit: ${error.message}`);
		return 2;
	}
}

if (require.main === module) {
	process.exitCode = main();
}

module.exports = {
	POLICY_VERSION,
	addLocalizedMap,
	collectAuditUnits,
	createManifest,
	evaluateAuditState,
	main,
	parseArguments,
	readAuditState,
};
