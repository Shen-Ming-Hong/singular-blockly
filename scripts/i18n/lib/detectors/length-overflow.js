/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Length Overflow Checker
 *
 * Checks if translations are too long or too short compared to English baseline,
 * which may cause UI rendering issues or indicate missing content.
 */

const { estimateFrequency } = require('../audit-utils');

/**
 * CJK languages that have higher character efficiency
 * These languages typically use fewer characters to convey the same meaning as English
 * @type {string[]}
 */
const CJK_LANGUAGES = ['ja', 'ko', 'zh', 'zh-hant', 'zh-hans'];

/**
 * Calculate character length ratio vs English baseline
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @returns {number} Length ratio (target/source)
 */
function calculateLengthRatio(sourceText, translatedText) {
	const sourceLength = sourceText.length;
	const targetLength = translatedText.length;

	if (sourceLength === 0) {
		return 1.0;
	}

	return targetLength / sourceLength;
}

/**
 * Check if translation length is within acceptable range
 * @param {number} ratio - Length ratio (target/source)
 * @param {string} [language] - Target language code (optional, used for CJK-specific thresholds)
 * @returns {string|null} Issue type if out of range, null if okay
 */
function checkLengthRatio(ratio, language) {
	if (ratio > 1.5) {
		return 'too-long'; // >150% of English length
	}

	// Use relaxed threshold for CJK languages due to higher character efficiency
	// CJK characters convey more meaning per character than alphabetic scripts
	const isCJK = language && CJK_LANGUAGES.includes(language);
	const minRatio = isCJK ? 0.3 : 0.5; // 30% for CJK, 50% for others

	if (ratio < minRatio) {
		return 'too-short';
	}
	return null;
}

/**
 * Determine severity based on length overflow magnitude
 * @param {number} ratio - Length ratio
 * @param {string} key - Translation message key
 * @returns {string} Severity level
 */
function determineSeverityForLength(ratio, key) {
	const freq = estimateFrequency(key);

	// Extreme length issues are high severity for high-frequency strings
	if (ratio > 2.0 || ratio < 0.3) {
		return freq >= 50 ? 'high' : 'medium';
	}

	// Moderate length issues
	if (ratio > 1.5 || ratio < 0.5) {
		return freq >= 70 ? 'medium' : 'low';
	}

	return 'low';
}

/**
 * Main detector function for length overflow issues
 * @param {string} key - Translation message key
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {object|null} Issue object if detected, null otherwise
 */
function detectLengthOverflow(key, sourceText, translatedText, language) {
	if (!translatedText || !sourceText) {
		return null;
	}

	const ratio = calculateLengthRatio(sourceText, translatedText);
	const issueType = checkLengthRatio(ratio, language); // Pass language for CJK-specific thresholds

	if (!issueType) {
		return null; // Length is within acceptable range
	}

	// Determine threshold message based on language
	const isCJK = CJK_LANGUAGES.includes(language);
	const minThreshold = isCJK ? 30 : 50;

	let rationale;
	let suggestedAction;

	if (issueType === 'too-long') {
		rationale = `Translation is ${Math.round(ratio * 100)}% of English length (>${150}% may cause UI overflow)`;
		suggestedAction = 'Consider shortening translation or verify UI rendering';
	} else {
		rationale = `Translation is ${Math.round(ratio * 100)}% of English length (<${minThreshold}% may indicate missing content)`;
		suggestedAction = 'Verify translation is complete and not abbreviated incorrectly';
	}

	return {
		key,
		language,
		issueType: 'lengthOverflow',
		severity: determineSeverityForLength(ratio, key),
		currentValue: translatedText,
		suggestedValue: null,
		rationale: `${rationale}. ${suggestedAction}`,
		frequency: estimateFrequency(key),
		detectedBy: 'automated',
		detectedAt: new Date().toISOString(),
		metadata: {
			lengthRatio: ratio,
			sourceLength: sourceText.length,
			targetLength: translatedText.length,
		},
	};
}

module.exports = {
	detectLengthOverflow,
	calculateLengthRatio,
	checkLengthRatio,
	determineSeverityForLength,
};
