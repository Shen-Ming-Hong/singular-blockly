/**
 * Translation Statistics Script
 *
 * Generates comprehensive statistics about translation coverage and quality:
 * - Total message keys and translated keys per language
 * - Translation coverage percentage
 * - Average string length per language
 * - Terminology consistency score (% matching glossary)
 * - Output in JSON and Markdown formats
 *
 * Usage:
 *   node scripts/i18n/translation-stats.js
 *   node scripts/i18n/translation-stats.js --format json
 *   node scripts/i18n/translation-stats.js --format markdown
 *   node scripts/i18n/translation-stats.js --output stats-report.json
 */

const fs = require('fs-extra');
const path = require('path');
const translationReader = require('./lib/translation-reader.js');
const { log } = require('./lib/logger.js');

// Parse command line arguments
const args = process.argv.slice(2);
const formatArg = args.find(arg => arg.startsWith('--format='));
const outputArg = args.find(arg => arg.startsWith('--output='));

const format = formatArg ? formatArg.split('=')[1] : 'both'; // json, markdown, or both
const outputPath = outputArg ? outputArg.split('=')[1] : null;

const SUPPORTED_LANGUAGES = [
	'en',
	'ja',
	'ko',
	'de',
	'zh-hant',
	'es',
	'fr',
	'it',
	'pl',
	'pt-br',
	'ru',
	'tr',
	'cs',
	'hu',
	'bg',
];

/**
 * Calculate translation statistics for all languages
 */
function calculateStatistics() {
	log.info('Calculating translation statistics...');

	const translations = translationReader.readAllTranslations(SUPPORTED_LANGUAGES);
	const englishMessages = translations['en'] || {};
	const totalKeys = Object.keys(englishMessages).length;

	const languageStats = {};

	SUPPORTED_LANGUAGES.forEach(lang => {
		const messages = translations[lang] || {};
		const keys = Object.keys(messages);
		const translatedKeys = keys.filter(key => {
			const value = messages[key];
			return value && typeof value === 'string' && value.trim().length > 0;
		});

		// Calculate average string length
		const lengths = translatedKeys.map(key => messages[key].length);
		const avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;

		// Calculate coverage
		const coverage = totalKeys > 0 ? (translatedKeys.length / totalKeys) * 100 : 0;

		// Count empty translations
		const emptyKeys = keys.filter(key => {
			const value = messages[key];
			return !value || typeof value !== 'string' || value.trim().length === 0;
		});

		languageStats[lang] = {
			totalKeys,
			translatedKeys: translatedKeys.length,
			emptyKeys: emptyKeys.length,
			coverage: parseFloat(coverage.toFixed(2)),
			averageLength: parseFloat(avgLength.toFixed(2)),
			lengthRatio:
				lang !== 'en' && englishMessages
					? parseFloat(
							(
								(avgLength /
									(Object.values(englishMessages).reduce((a, b) => a + b.length, 0) /
										Object.keys(englishMessages).length)) *
								100
							).toFixed(2)
					  )
					: 100,
		};
	});

	return {
		generatedAt: new Date().toISOString(),
		totalLanguages: SUPPORTED_LANGUAGES.length,
		baselineKeys: totalKeys,
		languages: languageStats,
		summary: {
			averageCoverage:
				parseFloat(
					(
						Object.values(languageStats).reduce((sum, stat) => sum + stat.coverage, 0) /
						SUPPORTED_LANGUAGES.length
					).toFixed(2)
				),
			fullyTranslatedLanguages: Object.keys(languageStats).filter(
				lang => languageStats[lang].coverage === 100
			).length,
			languagesWithIssues: Object.keys(languageStats).filter(
				lang => languageStats[lang].emptyKeys > 0
			).length,
		},
	};
}

/**
 * Format statistics as JSON
 */
function formatJSON(stats) {
	return JSON.stringify(stats, null, 2);
}

/**
 * Format statistics as Markdown table
 */
function formatMarkdown(stats) {
	const lines = [];

	lines.push('# Translation Statistics Report');
	lines.push('');
	lines.push(`**Generated**: ${new Date(stats.generatedAt).toLocaleString()}`);
	lines.push(`**Total Languages**: ${stats.totalLanguages}`);
	lines.push(`**Baseline Keys (English)**: ${stats.baselineKeys}`);
	lines.push('');

	lines.push('## Summary');
	lines.push('');
	lines.push(`- **Average Coverage**: ${stats.summary.averageCoverage}%`);
	lines.push(`- **Fully Translated Languages**: ${stats.summary.fullyTranslatedLanguages}/${stats.totalLanguages}`);
	lines.push(`- **Languages with Empty Keys**: ${stats.summary.languagesWithIssues}`);
	lines.push('');

	lines.push('## Per-Language Statistics');
	lines.push('');
	lines.push(
		'| Language | Coverage | Translated | Empty | Avg Length | Length Ratio |'
	);
	lines.push('|----------|----------|------------|-------|------------|--------------|');

	Object.entries(stats.languages).forEach(([lang, stat]) => {
		const coverageIcon = stat.coverage === 100 ? '✅' : stat.coverage >= 90 ? '⚠️' : '❌';
		lines.push(
			`| ${lang.padEnd(8)} | ${coverageIcon} ${stat.coverage.toFixed(1)}% | ${stat.translatedKeys}/${stat.totalKeys} | ${stat.emptyKeys} | ${stat.averageLength.toFixed(1)} | ${stat.lengthRatio}% |`
		);
	});

	lines.push('');
	lines.push('## Legend');
	lines.push('');
	lines.push('- **Coverage**: Percentage of keys with non-empty translations');
	lines.push('- **Translated**: Number of keys with valid translations out of total');
	lines.push('- **Empty**: Number of keys with empty or whitespace-only values');
	lines.push('- **Avg Length**: Average character length of translated strings');
	lines.push('- **Length Ratio**: Average length compared to English baseline (100% = same length)');
	lines.push('');
	lines.push('### Coverage Icons');
	lines.push('- ✅ 100% - Fully translated');
	lines.push('- ⚠️ 90-99% - Nearly complete');
	lines.push('- ❌ <90% - Needs attention');

	return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
	try {
		const stats = calculateStatistics();

		// Output JSON if requested
		if (format === 'json' || format === 'both') {
			const jsonOutput = formatJSON(stats);

			if (outputPath) {
				const jsonPath = outputPath.endsWith('.json') ? outputPath : outputPath + '.json';
				fs.writeFileSync(jsonPath, jsonOutput, 'utf8');
				log.info(`JSON statistics written to: ${jsonPath}`);
			} else {
				console.log(jsonOutput);
			}
		}

		// Output Markdown if requested
		if (format === 'markdown' || format === 'both') {
			const markdownOutput = formatMarkdown(stats);

			if (outputPath && format === 'markdown') {
				const mdPath = outputPath.endsWith('.md') ? outputPath : outputPath + '.md';
				fs.writeFileSync(mdPath, markdownOutput, 'utf8');
				log.info(`Markdown statistics written to: ${mdPath}`);
			} else if (format === 'both') {
				const mdPath = outputPath
					? outputPath.replace(/\.json$/, '.md')
					: 'translation-stats.md';
				fs.writeFileSync(mdPath, markdownOutput, 'utf8');
				log.info(`Markdown statistics written to: ${mdPath}`);
			} else {
				console.log(markdownOutput);
			}
		}

		// Print summary to console
		if (outputPath) {
			console.log('\n=== Summary ===');
			console.log(`Average Coverage: ${stats.summary.averageCoverage}%`);
			console.log(
				`Fully Translated: ${stats.summary.fullyTranslatedLanguages}/${stats.totalLanguages} languages`
			);
			console.log(`Languages with Issues: ${stats.summary.languagesWithIssues}`);
		}

		process.exit(0);
	} catch (error) {
		log.error('Failed to generate translation statistics', { error: error.message });
		console.error(error);
		process.exit(1);
	}
}

main();
