/**
 * Length Overflow Checker
 *
 * Checks if translations are too long or too short compared to English baseline,
 * which may cause UI rendering issues or indicate missing content.
 */

const { estimateFrequency } = require('../audit-utils');

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
 * @returns {string|null} Issue type if out of range, null if okay
 */
function checkLengthRatio(ratio) {
	if (ratio > 1.5) {
		return 'too-long'; // >150% of English length
	}
	if (ratio < 0.5) {
		return 'too-short'; // <50% of English length
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
	const issueType = checkLengthRatio(ratio);

	if (!issueType) {
		return null; // Length is within acceptable range
	}

	let rationale;
	let suggestedAction;

	if (issueType === 'too-long') {
		rationale = `Translation is ${Math.round(ratio * 100)}% of English length (>${150}% may cause UI overflow)`;
		suggestedAction = 'Consider shortening translation or verify UI rendering';
	} else {
		rationale = `Translation is ${Math.round(ratio * 100)}% of English length (<${50}% may indicate missing content)`;
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
