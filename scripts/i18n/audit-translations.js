#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const fs = require('fs');
const { readAllTranslations } = require('./lib/translation-reader');
const { log } = require('./lib/logger');
const { detectDirectTranslation } = require('./lib/detectors/direct-translation');
const { detectTerminologyInconsistency } = require('./lib/detectors/terminology-consistency');
const { detectCulturalMismatch } = require('./lib/detectors/cultural-mismatch');
const { detectLengthOverflow } = require('./lib/detectors/length-overflow');
const { detectMissingTranslation } = require('./lib/detectors/missing-translation');
const { filterIssues, generateWhitelistStats } = require('./lib/whitelist-checker');

async function main() {
	const args = process.argv.slice(2);
	const languagesArg = args.find(a => a.startsWith('--languages='));
	const outputArgIndex = args.findIndex(a => a === '--output');
	const verboseFlag = args.includes('--verbose');
	const languages = languagesArg ? languagesArg.split('=')[1].split(',') : ['ja', 'ko', 'de', 'zh-hant', 'es'];
	const output =
		outputArgIndex >= 0
			? args[outputArgIndex + 1]
			: path.join(
					__dirname,
					'..',
					'..',
					'specs',
					'002-i18n-localization-review',
					'audit-reports',
					`audit-${new Date().toISOString().slice(0, 10)}-baseline.json`
			  );

	log.info('Starting translation quality audit', { languages, output, verbose: verboseFlag });

	// Ensure output dir exists
	const outDir = path.dirname(output);
	fs.mkdirSync(outDir, { recursive: true });

	// Load English baseline
	const englishTranslations = readAllTranslations(['en']).en || {};

	// Load target language translations
	const translations = readAllTranslations(languages);

	// Initialize report
	const report = {
		reportId: `audit-${new Date().toISOString().slice(0, 10)}-baseline`,
		generatedAt: new Date().toISOString(),
		auditScope: {
			languages,
			messageKeys: 'all',
			auditMethods: [
				'automated-checks',
				'direct-translation-detection',
				'terminology-consistency',
				'cultural-mismatch',
				'length-overflow',
				'missing-translation',
			],
		},
		totalIssues: 0,
		issuesBySeverity: { high: 0, medium: 0, low: 0 },
		issuesPerLanguage: {},
		issues: [],
		highFrequencyIssues: [],
		recommendations: [],
		coverageStats: {
			totalMessageKeys: Object.keys(englishTranslations).length,
			auditedMessageKeys: 0,
			coveragePercentage: 0,
			languagesFullyAudited: [],
			languagesPartiallyAudited: [],
		},
		comparisonToBaseline: null,
	};

	// Initialize issue counts per language
	languages.forEach(lang => {
		report.issuesPerLanguage[lang] = 0;
	});

	// Run detectors for each language
	let totalKeysAudited = 0;

	languages.forEach(lang => {
		log.info(`Auditing ${lang}...`);
		const langTranslations = translations[lang] || {};
		let langIssueCount = 0;

		Object.keys(englishTranslations).forEach(key => {
			const sourceText = englishTranslations[key];
			const translatedText = langTranslations[key];

			// Run all detectors
			const detectors = [
				detectMissingTranslation,
				detectDirectTranslation,
				detectTerminologyInconsistency,
				detectCulturalMismatch,
				detectLengthOverflow,
			];

			detectors.forEach(detector => {
				const issue = detector(key, sourceText, translatedText, lang);
				if (issue) {
					report.issues.push(issue);
					report.issuesBySeverity[issue.severity]++;
					langIssueCount++;

					if (verboseFlag) {
						log.info(`  [${issue.severity.toUpperCase()}] ${key}: ${issue.issueType}`);
					}
				}
			});

			totalKeysAudited++;
		});

		report.issuesPerLanguage[lang] = langIssueCount;
		log.info(`${lang}: ${langIssueCount} issues found`);
	});

	// Apply whitelist filtering
	log.info('Applying whitelist filters...');
	const filterResult = filterIssues(report.issues, {
		removeWhitelisted: true,
		verbose: verboseFlag,
	});

	// Update report with filtered issues
	const whitelistedIssues = filterResult.whitelisted;
	report.issues = filterResult.issues;

	// Recalculate severity counts after filtering
	report.issuesBySeverity = { high: 0, medium: 0, low: 0 };
	report.issues.forEach(issue => {
		report.issuesBySeverity[issue.severity]++;
	});

	// Recalculate language issue counts after filtering
	report.issuesPerLanguage = {};
	languages.forEach(lang => {
		report.issuesPerLanguage[lang] = report.issues.filter(i => i.language === lang).length;
	});

	// Add whitelist statistics to report
	report.whitelistStats = {
		...filterResult.statistics,
		breakdown: generateWhitelistStats(whitelistedIssues),
	};

	log.info(
		`Whitelist filtering: ${filterResult.statistics.filtered} issues filtered (${filterResult.statistics.filterRate.toFixed(1)}%)`
	);

	// Calculate totals
	report.totalIssues = report.issues.length;
	report.coverageStats.auditedMessageKeys = totalKeysAudited / languages.length;
	report.coverageStats.coveragePercentage = (report.coverageStats.auditedMessageKeys / report.coverageStats.totalMessageKeys) * 100;

	// Identify fully audited languages
	report.coverageStats.languagesFullyAudited = languages.filter(lang => {
		const langTranslations = translations[lang] || {};
		return Object.keys(langTranslations).length >= Object.keys(englishTranslations).length * 0.95;
	});

	report.coverageStats.languagesPartiallyAudited = languages.filter(lang => !report.coverageStats.languagesFullyAudited.includes(lang));

	// Sort issues by frequency and get top 20
	report.highFrequencyIssues = report.issues
		.filter(issue => issue.severity === 'high' || issue.frequency >= 70)
		.sort((a, b) => b.frequency - a.frequency)
		.slice(0, 20);

	// Generate recommendations
	report.recommendations = generateRecommendations(report);

	// Write report
	fs.writeFileSync(output, JSON.stringify(report, null, 2), 'utf8');

	// Summary
	log.info('Audit completed', {
		totalIssues: report.totalIssues,
		high: report.issuesBySeverity.high,
		medium: report.issuesBySeverity.medium,
		low: report.issuesBySeverity.low,
		output,
	});

	// Display top issues if verbose
	if (verboseFlag && report.highFrequencyIssues.length > 0) {
		log.info('Top 10 high-frequency issues:');
		report.highFrequencyIssues.slice(0, 10).forEach((issue, idx) => {
			log.info(`  ${idx + 1}. [${issue.language}] ${issue.key} (freq: ${issue.frequency}, severity: ${issue.severity})`);
		});
	}
}

/**
 * Generate actionable recommendations based on audit findings
 * @param {object} report - Audit report
 * @returns {string[]} Array of recommendations
 */
function generateRecommendations(report) {
	const recommendations = [];
	const { issuesBySeverity, issuesPerLanguage, highFrequencyIssues } = report;

	// High severity recommendations
	if (issuesBySeverity.high > 0) {
		recommendations.push(
			`Prioritize ${issuesBySeverity.high} high-severity issues affecting toolbox categories, error messages, and common blocks`
		);
	}

	// Language-specific recommendations
	const languagesByIssueCount = Object.entries(issuesPerLanguage)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3);

	if (languagesByIssueCount.length > 0) {
		const topLangs = languagesByIssueCount.map(([lang, count]) => `${lang} (${count} issues)`).join(', ');
		recommendations.push(`Focus on languages with most issues: ${topLangs}`);
	}

	// High-frequency issue recommendations
	if (highFrequencyIssues.length > 0) {
		const missingCount = highFrequencyIssues.filter(i => i.issueType === 'missingTranslation').length;
		const directCount = highFrequencyIssues.filter(i => i.issueType === 'directTranslation').length;

		if (missingCount > 0) {
			recommendations.push(`${missingCount} high-frequency strings are missing translations - top priority`);
		}
		if (directCount > 0) {
			recommendations.push(`${directCount} high-frequency strings use direct translation - recruit native speakers for review`);
		}
	}

	// Coverage recommendations
	if (report.coverageStats.languagesPartiallyAudited.length > 0) {
		recommendations.push(
			`Complete translations for partially-covered languages: ${report.coverageStats.languagesPartiallyAudited.join(', ')}`
		);
	}

	return recommendations;
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
