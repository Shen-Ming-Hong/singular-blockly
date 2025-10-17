/**
 * Missing Translation Detector
 *
 * Detects translations that are missing, empty, or use English fallback text
 * in non-English language files.
 */

const { estimateFrequency } = require('../audit-utils');

/**
 * Check if translation is empty or whitespace-only
 * @param {string} text - Translation text
 * @returns {boolean} True if empty
 */
function isEmpty(text) {
	return !text || text.trim().length === 0;
}

/**
 * Check if translation appears to be English fallback
 * (English text in non-English file)
 * @param {string} translatedText - Translation text
 * @param {string} sourceText - English source text
 * @param {string} language - Target language code
 * @returns {boolean} True if appears to be English fallback
 */
function isEnglishFallback(translatedText, sourceText, language) {
	// If text is exactly same as English source, it's a fallback
	if (translatedText === sourceText) {
		return true;
	}

	// For non-Latin script languages, check if text contains only Latin characters
	const nonLatinLanguages = ['ja', 'ko', 'zh', 'zh-hant', 'zh-hans', 'ru', 'bg'];

	if (nonLatinLanguages.includes(language)) {
		// Remove spaces, punctuation, and numbers
		const textWithoutCommon = translatedText.replace(/[\s\d.,!?;:()\[\]{}<>'"\/\\-]/g, '');

		// If remaining text is all Latin characters, it's likely English
		const hasOnlyLatin = /^[a-zA-Z]*$/.test(textWithoutCommon);

		if (hasOnlyLatin && textWithoutCommon.length > 3) {
			return true;
		}
	}

	return false;
}

/**
 * Main detector function for missing translation issues
 * @param {string} key - Translation message key
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {object|null} Issue object if detected, null otherwise
 */
function detectMissingTranslation(key, sourceText, translatedText, language) {
	if (!sourceText) {
		return null; // Can't check if no source text
	}

	let issueReason = null;
	let suggestedValue = null;

	// Check for empty translation
	if (isEmpty(translatedText)) {
		issueReason = 'Translation is empty or missing';
		suggestedValue = `[NEEDS TRANSLATION: ${sourceText}]`;
	}
	// Check for English fallback
	else if (isEnglishFallback(translatedText, sourceText, language)) {
		issueReason = 'Translation appears to be English fallback text instead of localized content';
		suggestedValue = null; // Requires proper translation
	}

	if (issueReason) {
		return {
			key,
			language,
			issueType: 'missingTranslation',
			severity: determineSeverity(key),
			currentValue: translatedText || '',
			suggestedValue,
			rationale: issueReason,
			frequency: estimateFrequency(key),
			detectedBy: 'automated',
			detectedAt: new Date().toISOString(),
		};
	}

	return null;
}

/**
 * Determine severity based on message key frequency
 * Missing translations are always important
 * @param {string} key - Translation message key
 * @returns {string} Severity level: high, medium, or low
 */
function determineSeverity(key) {
	const freq = estimateFrequency(key);
	// Missing translations are more severe than other issues
	if (freq >= 70) {
		return 'high';
	}
	if (freq >= 40) {
		return 'high'; // Elevated from medium because it's missing entirely
	}
	return 'medium'; // Elevated from low
}

module.exports = {
	detectMissingTranslation,
	isEmpty,
	isEnglishFallback,
};
