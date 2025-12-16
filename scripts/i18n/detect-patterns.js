/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pattern-Based Direct Translation Detector
 *
 * Automatically detects common direct translation patterns that indicate
 * word-for-word translations without cultural adaptation.
 *
 * This is a lightweight version of the full audit system, focusing on
 * quick pattern matching for CI/CD integration.
 *
 * Usage:
 *   node scripts/i18n/detect-patterns.js --language ja
 *   node scripts/i18n/detect-patterns.js --all
 *
 * Exit codes:
 *   0 = No patterns detected
 *   1 = Patterns detected (warnings only, does not block CI)
 */

const translationReader = require('./lib/translation-reader.js');
const { log } = require('./lib/logger.js');
const fs = require('fs-extra');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const languageArg = args.find(arg => arg.startsWith('--language='));
const detectAll = args.includes('--all');

if (!languageArg && !detectAll) {
	console.error('Usage: node detect-patterns.js --language=<lang> | --all');
	process.exit(1);
}

const targetLanguages = detectAll
	? ['ja', 'ko', 'de', 'zh-hant', 'es', 'fr', 'it', 'pl', 'pt-br', 'ru', 'tr', 'cs', 'hu', 'bg']
	: [languageArg.split('=')[1]];

/**
 * Pattern 1: English articles in non-English text
 */
function detectEnglishArticles(lang, text) {
	// Skip for English
	if (lang === 'en') {
		return false;
	}

	// Check for English articles: "a", "an", "the" (case insensitive, word boundaries)
	const articlePattern = /\b(a|an|the)\b/i;
	return articlePattern.test(text);
}

/**
 * Pattern 2: English capitalization patterns
 */
function detectEnglishCapitalization(lang, text) {
	// Skip for languages that use capitalization
	if (['en', 'de', 'fr', 'es', 'it', 'pl', 'pt-br', 'cs', 'hu', 'tr', 'ru', 'bg'].includes(lang)) {
		return false;
	}

	// For Asian languages (ja, ko, zh-hant), detect mid-sentence capital letters
	// which often indicate untranslated English words
	const midSentenceCapitalPattern = /[^\.\?!]\s+[A-Z][a-z]+/;
	return midSentenceCapitalPattern.test(text);
}

/**
 * Pattern 3: Excessive use of ellipsis (...)
 */
function detectExcessiveEllipsis(text) {
	// Count ellipsis occurrences
	const ellipsisMatches = text.match(/\.{3,}/g);
	if (!ellipsisMatches) {
		return false;
	}

	// Warn if more than 2 ellipsis in a single string
	return ellipsisMatches.length > 2;
}

/**
 * Pattern 4: Check against glossary for known technical terms
 */
function detectGlossaryViolations(lang, key, text) {
	const glossaryPath = path.join(__dirname, '../../specs/002-i18n-localization-review/localization-glossary.json');

	if (!fs.existsSync(glossaryPath)) {
		return null; // Glossary not found, skip check
	}

	const glossaryData = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));
	const violations = [];

	// The glossary has a 'terms' array
	if (!glossaryData.terms || !Array.isArray(glossaryData.terms)) {
		return null;
	}

	for (const entry of glossaryData.terms) {
		// Check if English term appears in the key
		const keyLower = key.toLowerCase();
		const englishLower = entry.englishTerm.toLowerCase();

		if (keyLower.includes(englishLower.replace(/\s+/g, '_'))) {
			// Key relates to this glossary term
			const translation = entry.translations[lang];

			if (translation && translation.term && !text.includes(translation.term)) {
				// Translation doesn't use approved glossary term
				violations.push({
					term: entry.englishTerm,
					approved: translation.term,
					context: entry.category,
				});
			}
		}
	}

	return violations.length > 0 ? violations : null;
}

/**
 * Detect patterns in a single translation
 */
function detectPatterns(lang, key, englishText, translatedText) {
	const issues = [];

	// Pattern 1: English articles
	if (detectEnglishArticles(lang, translatedText)) {
		issues.push({
			type: 'englishArticle',
			severity: 'warning',
			message: 'English article detected (a/an/the) - may indicate direct translation',
			key,
			translatedText,
		});
	}

	// Pattern 2: English capitalization
	if (detectEnglishCapitalization(lang, translatedText)) {
		issues.push({
			type: 'englishCapitalization',
			severity: 'warning',
			message: 'Mid-sentence capitalization detected - may indicate untranslated English',
			key,
			translatedText,
		});
	}

	// Pattern 3: Excessive ellipsis
	if (detectExcessiveEllipsis(translatedText)) {
		issues.push({
			type: 'excessiveEllipsis',
			severity: 'info',
			message: 'Excessive use of ellipsis (...) - consider more natural punctuation',
			key,
			translatedText,
		});
	}

	// Pattern 4: Glossary violations
	const glossaryViolations = detectGlossaryViolations(lang, key, translatedText);
	if (glossaryViolations) {
		for (const violation of glossaryViolations) {
			issues.push({
				type: 'glossaryViolation',
				severity: 'warning',
				message: `Should use approved term "${violation.approved}" for "${violation.term}"`,
				key,
				translatedText,
				context: violation.context,
			});
		}
	}

	return issues;
}

/**
 * Detect patterns for a single language
 */
function detectLanguagePatterns(lang) {
	log.info(`Detecting patterns in ${lang}...`);

	const allIssues = [];

	// Load translations
	let englishMessages, translatedMessages;
	try {
		englishMessages = translationReader.loadMessagesFile('en');
		translatedMessages = translationReader.loadMessagesFile(lang);
	} catch (error) {
		log.error(`Failed to load translations for ${lang}: ${error.message}`);
		return {
			lang,
			issues: [],
		};
	}

	// Check each translation
	for (const [key, englishText] of Object.entries(englishMessages)) {
		const translatedText = translatedMessages[key] || '';

		// Skip empty translations
		if (!translatedText || translatedText.trim().length === 0) {
			continue;
		}

		const issues = detectPatterns(lang, key, englishText, translatedText);
		allIssues.push(...issues);
	}

	// Categorize by severity
	const warnings = allIssues.filter(i => i.severity === 'warning');
	const info = allIssues.filter(i => i.severity === 'info');

	log.info(`${lang}: ${warnings.length} warnings, ${info.length} info`);

	return {
		lang,
		issues: allIssues,
		warnings,
		info,
	};
}

/**
 * Main detection function
 */
function main() {
	log.info('Starting pattern detection', { languages: targetLanguages });

	const results = [];

	for (const lang of targetLanguages) {
		const result = detectLanguagePatterns(lang);
		results.push(result);
	}

	// Print summary
	console.log('\n=== Pattern Detection Summary ===\n');

	let totalWarnings = 0;
	let totalInfo = 0;

	for (const result of results) {
		const warningCount = result.warnings?.length || 0;
		const infoCount = result.info?.length || 0;

		totalWarnings += warningCount;
		totalInfo += infoCount;

		if (warningCount > 0 || infoCount > 0) {
			console.log(`⚠️  ${result.lang}: ${warningCount} warnings, ${infoCount} info`);

			// Print warnings (first 5)
			if (result.warnings && result.warnings.length > 0) {
				console.log(`\n  Warnings in ${result.lang} (first 5):`);
				for (const warning of result.warnings.slice(0, 5)) {
					console.log(`    - [${warning.type}] ${warning.key}: ${warning.message}`);
				}
				if (result.warnings.length > 5) {
					console.log(`    ... and ${result.warnings.length - 5} more warnings`);
				}
			}
			console.log('');
		} else {
			console.log(`✅ ${result.lang}: No patterns detected`);
		}
	}

	console.log(`\nTotal: ${totalWarnings} warnings, ${totalInfo} info messages across ${results.length} languages`);

	if (totalWarnings > 0) {
		console.log('\n⚠️  Patterns detected. Please review the warnings above.');
		console.log('Note: This is informational only and does not block CI/CD.\n');
	} else {
		console.log('\n✅ No problematic patterns detected!\n');
	}

	// Always exit 0 (warnings only, don't block CI)
	process.exit(0);
}

// Run detection
main();
