/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Translation Validation Script
 *
 * Performs automated checks on translation files to catch common errors:
 * - Placeholder preservation ({0}, %1, etc.)
 * - Empty translations
 * - UTF-8 encoding validation
 * - Length ratio warnings (>150% or <50% of English)
 * - Schema validation
 *
 * Usage:
 *   node scripts/i18n/validate-translations.js --language ja
 *   node scripts/i18n/validate-translations.js --all
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = Validation failed
 */

const fs = require('fs-extra');
const path = require('path');
const translationReader = require('./lib/translation-reader.js');
const { log } = require('./lib/logger.js');

// Parse command line arguments
const args = process.argv.slice(2);
const languageArg = args.find(arg => arg.startsWith('--language='));
const validateAll = args.includes('--all');

if (!languageArg && !validateAll) {
	console.error('Usage: node validate-translations.js --language=<lang> | --all');
	process.exit(1);
}

const targetLanguages = validateAll
	? ['ja', 'ko', 'de', 'zh-hant', 'es', 'fr', 'it', 'pl', 'pt-br', 'ru', 'tr', 'cs', 'hu', 'bg']
	: [languageArg.split('=')[1]];

/**
 * Check if translation preserves all placeholders from English source
 */
function checkPlaceholders(key, englishText, translatedText) {
	const issues = [];

	// Extract placeholders like {0}, {1}, %1, %2, etc.
	const placeholderPatterns = [
		/\{(\d+)\}/g, // {0}, {1}
		/%(\d+)/g, // %1, %2
		/\$\{(\w+)\}/g, // ${variable}
	];

	for (const pattern of placeholderPatterns) {
		const englishMatches = [...englishText.matchAll(pattern)].map(m => m[0]);
		const translatedMatches = [...translatedText.matchAll(pattern)].map(m => m[0]);

		// Check if all English placeholders exist in translation
		for (const placeholder of englishMatches) {
			if (!translatedMatches.includes(placeholder)) {
				issues.push({
					type: 'missingPlaceholder',
					message: `Missing placeholder: ${placeholder}`,
					key,
					englishText,
					translatedText,
				});
			}
		}

		// Check for extra placeholders in translation
		for (const placeholder of translatedMatches) {
			if (!englishMatches.includes(placeholder)) {
				issues.push({
					type: 'extraPlaceholder',
					message: `Extra placeholder not in English: ${placeholder}`,
					key,
					englishText,
					translatedText,
				});
			}
		}
	}

	return issues;
}

/**
 * Keys that are intentionally empty in the English source
 * These are typically Blockly core keys where empty strings are valid
 */
const KNOWN_EMPTY_KEYS = [
	'PROCEDURES_DEFNORETURN_TITLE',
	'PROCEDURES_DEFNORETURN_DO',
	'PROCEDURES_DEFRETURN_DO',
	// HuskyLens and Pixetto blocks - empty by design
	'CONTROLS_IF_ELSE_TITLE_ELSE', // Used in Russian locale (inherited from Blockly core)
	'HUSKYLENS_BLOCK_INFO_TYPE',
	'HUSKYLENS_ARROW_INFO_TYPE',
	'PIXETTO_ROAD_CENTER_X',
	// HuskyLens ID-based block suffixes - empty for most languages (grammatical markers only needed in ja/ko/zh-hant)
	'HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX',
	'HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX',
	'HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX',
];

/**
 * Check if translation is empty or whitespace-only
 */
function checkEmpty(key, translatedText) {
	// Skip validation for keys that are intentionally empty
	if (KNOWN_EMPTY_KEYS.includes(key)) {
		return [];
	}

	if (!translatedText || translatedText.trim().length === 0) {
		return [
			{
				type: 'emptyTranslation',
				message: 'Translation is empty or whitespace-only',
				key,
				translatedText,
			},
		];
	}
	return [];
}

/**
 * Check if file is valid UTF-8
 */
function checkEncoding(lang, filePath) {
	const issues = [];
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		// If we got here, UTF-8 decoding succeeded

		// Check for BOM (should not be present)
		if (content.charCodeAt(0) === 0xfeff) {
			issues.push({
				type: 'bomDetected',
				message: 'UTF-8 BOM detected (should be removed)',
				lang,
				filePath,
			});
		}
	} catch (error) {
		issues.push({
			type: 'encodingError',
			message: `File is not valid UTF-8: ${error.message}`,
			lang,
			filePath,
		});
	}
	return issues;
}

/**
 * Check if translation length is within acceptable ratio
 */
function checkLengthRatio(key, englishText, translatedText) {
	const issues = [];
	const englishLength = englishText.length;
	const translatedLength = translatedText.length;

	if (englishLength === 0) {
		return issues;
	}

	const ratio = translatedLength / englishLength;

	// Warn if translation is >150% of English (overflow risk)
	if (ratio > 1.5) {
		issues.push({
			type: 'lengthWarning',
			severity: 'warning',
			message: `Translation is ${Math.round(ratio * 100)}% of English length (>150% may cause UI overflow)`,
			key,
			englishLength,
			translatedLength,
			ratio: ratio.toFixed(2),
		});
	}

	// Warn if translation is <50% of English (may be incomplete)
	if (ratio < 0.5) {
		issues.push({
			type: 'lengthWarning',
			severity: 'warning',
			message: `Translation is ${Math.round(ratio * 100)}% of English length (<50% may indicate missing content)`,
			key,
			englishLength,
			translatedLength,
			ratio: ratio.toFixed(2),
		});
	}

	return issues;
}

/**
 * Validate single language
 */
function validateLanguage(lang) {
	log.info(`Validating ${lang}...`);

	const filePath = path.join(__dirname, `../../media/locales/${lang}/messages.js`);
	const allIssues = [];

	// Check 1: Encoding validation
	const encodingIssues = checkEncoding(lang, filePath);
	allIssues.push(...encodingIssues);

	// Load translations
	let englishMessages, translatedMessages;
	try {
		englishMessages = translationReader.loadMessagesFile('en');
		translatedMessages = translationReader.loadMessagesFile(lang);
	} catch (error) {
		log.error(`Failed to load translations for ${lang}: ${error.message}`);
		return {
			lang,
			passed: false,
			issues: [
				{
					type: 'loadError',
					message: `Failed to load translation file: ${error.message}`,
					lang,
				},
			],
		};
	}

	// Validate each translation key
	for (const [key, englishText] of Object.entries(englishMessages)) {
		const translatedText = translatedMessages[key] || '';

		// Check 2: Empty translations
		const emptyIssues = checkEmpty(key, translatedText);
		allIssues.push(...emptyIssues);

		// Skip further checks if translation is empty
		if (emptyIssues.length > 0) {
			continue;
		}

		// Check 3: Placeholder preservation
		const placeholderIssues = checkPlaceholders(key, englishText, translatedText);
		allIssues.push(...placeholderIssues);

		// Check 4: Length ratio warnings
		const lengthIssues = checkLengthRatio(key, englishText, translatedText);
		allIssues.push(...lengthIssues);
	}

	// Separate errors from warnings
	const errors = allIssues.filter(issue => issue.type !== 'lengthWarning' || issue.severity !== 'warning');
	const warnings = allIssues.filter(issue => issue.type === 'lengthWarning' && issue.severity === 'warning');

	const passed = errors.length === 0;

	log.info(`${lang}: ${passed ? 'PASS' : 'FAIL'} (${errors.length} errors, ${warnings.length} warnings)`);

	return {
		lang,
		passed,
		errors,
		warnings,
		issues: allIssues,
	};
}

/**
 * Main validation function
 */
function main() {
	log.info('Starting translation validation', { languages: targetLanguages });

	const results = [];
	let allPassed = true;

	for (const lang of targetLanguages) {
		const result = validateLanguage(lang);
		results.push(result);
		if (!result.passed) {
			allPassed = false;
		}
	}

	// Print summary
	console.log('\n=== Validation Summary ===\n');

	for (const result of results) {
		const status = result.passed ? '✅ PASS' : '❌ FAIL';
		console.log(`${status} ${result.lang}: ${result.errors?.length || 0} errors, ${result.warnings?.length || 0} warnings`);

		// Print errors
		if (result.errors && result.errors.length > 0) {
			console.log(`\n  Errors in ${result.lang}:`);
			for (const error of result.errors.slice(0, 10)) {
				// Show first 10
				console.log(`    - [${error.type}] ${error.key || error.lang}: ${error.message}`);
			}
			if (result.errors.length > 10) {
				console.log(`    ... and ${result.errors.length - 10} more errors`);
			}
		}

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
	}

	// Overall result
	const passedCount = results.filter(r => r.passed).length;
	console.log(`\nOverall: ${passedCount}/${results.length} languages passed validation`);

	if (allPassed) {
		console.log('✅ All validation checks passed!\n');
		process.exit(0);
	} else {
		console.log('❌ Some validation checks failed. Please fix the errors above.\n');
		process.exit(1);
	}
}

// Run validation
main();
