#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * HuskyLens i18n Validation Script
 *
 * Validates that all 44 HuskyLens message keys exist across all language files.
 * This script is used for Phase 5 validation (T058-T075) in spec 003.
 *
 * Usage: node scripts/i18n/validate-huskylens.js
 */

const fs = require('fs');
const path = require('path');

// Expected HuskyLens message keys (44 keys total)
const EXPECTED_KEYS = [
	// Toolbox Category Label (1 key)
	'HUSKYLENS_LABEL',

	// Block Labels (32 keys)
	'HUSKYLENS_INIT_I2C',
	'HUSKYLENS_INIT_UART',
	'HUSKYLENS_RX_PIN',
	'HUSKYLENS_TX_PIN',
	'HUSKYLENS_SET_ALGORITHM',
	'HUSKYLENS_ALGORITHM_FACE_RECOGNITION',
	'HUSKYLENS_ALGORITHM_OBJECT_TRACKING',
	'HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION',
	'HUSKYLENS_ALGORITHM_LINE_TRACKING',
	'HUSKYLENS_ALGORITHM_COLOR_RECOGNITION',
	'HUSKYLENS_ALGORITHM_TAG_RECOGNITION',
	'HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION',
	'HUSKYLENS_REQUEST',
	'HUSKYLENS_IS_LEARNED',
	'HUSKYLENS_COUNT_BLOCKS',
	'HUSKYLENS_COUNT_ARROWS',
	'HUSKYLENS_GET_BLOCK_INFO',
	'HUSKYLENS_GET_ARROW_INFO',
	'HUSKYLENS_BLOCK_INFO_TYPE',
	'HUSKYLENS_ARROW_INFO_TYPE',
	'HUSKYLENS_X_CENTER',
	'HUSKYLENS_Y_CENTER',
	'HUSKYLENS_WIDTH',
	'HUSKYLENS_HEIGHT',
	'HUSKYLENS_ID',
	'HUSKYLENS_X_ORIGIN',
	'HUSKYLENS_Y_ORIGIN',
	'HUSKYLENS_X_TARGET',
	'HUSKYLENS_Y_TARGET',
	'HUSKYLENS_LEARN',
	'HUSKYLENS_FORGET',

	// Tooltips (11 keys)
	'HUSKYLENS_INIT_I2C_TOOLTIP',
	'HUSKYLENS_INIT_UART_TOOLTIP',
	'HUSKYLENS_SET_ALGORITHM_TOOLTIP',
	'HUSKYLENS_REQUEST_TOOLTIP',
	'HUSKYLENS_IS_LEARNED_TOOLTIP',
	'HUSKYLENS_COUNT_BLOCKS_TOOLTIP',
	'HUSKYLENS_COUNT_ARROWS_TOOLTIP',
	'HUSKYLENS_GET_BLOCK_INFO_TOOLTIP',
	'HUSKYLENS_GET_ARROW_INFO_TOOLTIP',
	'HUSKYLENS_LEARN_TOOLTIP',
	'HUSKYLENS_FORGET_TOOLTIP',
];

// Languages to validate (15 total in project)
const LANGUAGES = ['en', 'zh-hant', 'ja', 'ko', 'de', 'es', 'fr', 'it', 'pt-br', 'ru', 'pl', 'tr', 'cs', 'hu', 'bg'];

const localesDir = path.join(__dirname, '../../media/locales');

/**
 * Extract HuskyLens keys from a messages.js file
 */
function extractHuskyLensKeys(filePath) {
	const content = fs.readFileSync(filePath, 'utf8');

	// Match all HUSKYLENS_* keys
	// Pattern: HUSKYLENS_ + uppercase/underscore/digits + colon (with word boundary before)
	// Note: I2C and UART contain digits, so we need [A-Z0-9_]
	const keyRegex = /\b(HUSKYLENS_[A-Z0-9_]+):/g;
	const matches = content.matchAll(keyRegex);

	const keys = new Set();
	for (const match of matches) {
		keys.add(match[1]);
	}

	return keys;
}

/**
 * Validate a single language file
 */
function validateLanguage(lang) {
	const filePath = path.join(localesDir, lang, 'messages.js');

	if (!fs.existsSync(filePath)) {
		return {
			lang,
			status: 'ERROR',
			error: 'File not found',
			missing: EXPECTED_KEYS,
			extra: [],
		};
	}

	const foundKeys = extractHuskyLensKeys(filePath);
	const missing = EXPECTED_KEYS.filter(key => !foundKeys.has(key));
	const extra = [...foundKeys].filter(key => !EXPECTED_KEYS.includes(key));

	return {
		lang,
		status: missing.length === 0 ? 'PASS' : 'FAIL',
		missing,
		extra,
		foundCount: foundKeys.size,
		expectedCount: EXPECTED_KEYS.length,
	};
}

/**
 * Main validation logic
 */
function main() {
	console.log('\n🔍 HuskyLens i18n Validation');
	console.log('═'.repeat(80));
	console.log(`Expected Keys: ${EXPECTED_KEYS.length}`);
	console.log(`Languages: ${LANGUAGES.length}`);
	console.log('═'.repeat(80));

	const results = LANGUAGES.map(validateLanguage);

	// Summary table
	console.log('\n📊 Validation Results:\n');
	console.log('Language'.padEnd(12) + 'Status'.padEnd(10) + 'Keys'.padEnd(12) + 'Missing'.padEnd(12) + 'Extra');
	console.log('─'.repeat(80));

	let totalPass = 0;
	let totalFail = 0;

	for (const result of results) {
		const statusIcon = result.status === 'PASS' ? '✅' : '❌';
		const statusText = `${statusIcon} ${result.status}`;
		const keysText = `${result.foundCount}/${result.expectedCount}`;
		const missingText = result.missing.length > 0 ? `${result.missing.length}` : '-';
		const extraText = result.extra.length > 0 ? `${result.extra.length}` : '-';

		console.log(result.lang.padEnd(12) + statusText.padEnd(10) + keysText.padEnd(12) + missingText.padEnd(12) + extraText);

		if (result.status === 'PASS') {
			totalPass++;
		} else {
			totalFail++;
		}
	}

	// Detailed failures
	const failures = results.filter(r => r.status === 'FAIL');
	if (failures.length > 0) {
		console.log('\n\n❌ Validation Failures:\n');

		for (const failure of failures) {
			console.log(`\n${failure.lang} (${failure.foundCount}/${failure.expectedCount} keys):`);

			if (failure.missing.length > 0) {
				console.log(`  Missing ${failure.missing.length} keys:`);
				failure.missing.forEach(key => console.log(`    - ${key}`));
			}

			if (failure.extra.length > 0) {
				console.log(`  Extra ${failure.extra.length} keys (not in spec):`);
				failure.extra.forEach(key => console.log(`    + ${key}`));
			}
		}
	}

	// Summary
	console.log('\n' + '═'.repeat(80));
	console.log(`\n✅ PASS: ${totalPass}/${LANGUAGES.length} languages`);
	console.log(`❌ FAIL: ${totalFail}/${LANGUAGES.length} languages`);

	if (totalFail === 0) {
		console.log('\n🎉 All languages have complete HuskyLens translations!\n');
		process.exit(0);
	} else {
		console.log('\n⚠️  Some languages are missing HuskyLens translations.\n');
		process.exit(1);
	}
}

main();
