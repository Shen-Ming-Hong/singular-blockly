/**
 * Direct Translation Detector
 *
 * Identifies translations that appear to be word-for-word English translations
 * without cultural adaptation. Detects:
 * - English grammatical structures (articles "the/a/an", English word order)
 * - Transliteration patterns (e.g., Katakana in Japanese matching English phonetics)
 * - Word-for-word matching (±10% word count suggests direct translation)
 */

const { estimateFrequency } = require('../audit-utils');

/**
 * Detect if a translation contains English articles that shouldn't be there
 * @param {string} text - Translation text
 * @param {string} language - Target language code
 * @returns {boolean} True if English articles detected
 */
function hasEnglishArticles(text, language) {
	// English articles should not appear in non-English text
	const englishArticles = /\b(the|a|an)\b/gi;
	return englishArticles.test(text);
}

/**
 * Detect if Japanese text uses excessive Katakana transliteration
 * instead of proper Japanese terms
 * @param {string} text - Japanese translation text
 * @returns {boolean} True if appears to be direct transliteration
 */
function hasExcessiveKatakana(text) {
	// Count Katakana characters vs total characters
	const katakanaChars = (text.match(/[\u30A0-\u30FF]/g) || []).length;
	const totalChars = text.replace(/\s/g, '').length;

	// If >80% is Katakana for multi-word phrases, likely transliteration
	if (totalChars > 5 && katakanaChars / totalChars > 0.8) {
		return true;
	}

	// Check for known transliteration patterns that should be localized
	const problematicPatterns = [
		/ロジック/gi, // "logic" → should be 制御
		/コントロールフロー/gi, // "control flow" → should be 制御構造
		/デジタルピンライト/gi, // "digital pin write" → should be デジタル出力
	];

	return problematicPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if translation word count is within reasonable range
 * Direct translations often have similar word counts to English
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {boolean} True if word count suggests direct translation
 */
function hasDirectWordCount(sourceText, translatedText, language) {
	// For CJK languages, count characters instead of words
	const isCJK = ['ja', 'ko', 'zh', 'zh-hant', 'zh-hans'].includes(language);

	let sourceCount, targetCount;

	if (isCJK) {
		// Count non-whitespace characters for CJK
		sourceCount = sourceText.replace(/\s/g, '').length;
		targetCount = translatedText.replace(/\s/g, '').length;

		// CJK typically uses fewer characters than English words
		// If counts are too similar, might be transliteration
		const ratio = targetCount / sourceCount;
		return ratio > 0.8 && ratio < 1.2;
	} else {
		// Count words for alphabetic languages
		sourceCount = sourceText.trim().split(/\s+/).length;
		targetCount = translatedText.trim().split(/\s+/).length;

		// ±10% word count suggests word-for-word translation
		const ratio = targetCount / sourceCount;
		return ratio > 0.9 && ratio < 1.1;
	}
}

/**
 * Detect English capitalization patterns inappropriate for target language
 * @param {string} text - Translation text
 * @param {string} language - Target language code
 * @returns {boolean} True if inappropriate English capitalization detected
 */
function hasEnglishCapitalization(text, language) {
	// For languages that don't use mid-sentence capitalization
	if (['ja', 'ko', 'zh', 'zh-hant', 'zh-hans'].includes(language)) {
		// Check for uppercase Latin letters mid-text (except acronyms)
		const midSentenceCaps = /\s([A-Z][a-z]+)\s/g;
		return midSentenceCaps.test(text);
	}

	// For German, all nouns should be capitalized
	// For other languages, check for unusual capitalization patterns
	return false;
}

/**
 * Main detector function for direct translation issues
 * @param {string} key - Translation message key
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {object|null} Issue object if detected, null otherwise
 */
function detectDirectTranslation(key, sourceText, translatedText, language) {
	if (!translatedText || !sourceText) {
		return null;
	}

	const issues = [];

	// Check for English articles
	if (hasEnglishArticles(translatedText, language)) {
		issues.push('Contains English articles (the/a/an)');
	}

	// Check for excessive Katakana (Japanese only)
	if (language === 'ja' && hasExcessiveKatakana(translatedText)) {
		issues.push('Uses excessive Katakana transliteration instead of proper Japanese terms');
	}

	// Check word count ratio
	if (hasDirectWordCount(sourceText, translatedText, language)) {
		issues.push('Word/character count too similar to English (suggests word-for-word translation)');
	}

	// Check capitalization patterns
	if (hasEnglishCapitalization(translatedText, language)) {
		issues.push('Contains English-style capitalization inappropriate for target language');
	}

	// If any issues detected, return issue object
	if (issues.length > 0) {
		return {
			key,
			language,
			issueType: 'directTranslation',
			severity: determineSeverity(key),
			currentValue: translatedText,
			suggestedValue: null, // Requires native speaker input
			rationale: `Direct translation detected: ${issues.join('; ')}`,
			frequency: estimateFrequency(key),
			detectedBy: 'automated',
			detectedAt: new Date().toISOString(),
		};
	}

	return null;
}

/**
 * Determine severity based on message key frequency
 * @param {string} key - Translation message key
 * @returns {string} Severity level: high, medium, or low
 */
function determineSeverity(key) {
	const freq = estimateFrequency(key);
	if (freq >= 70) {
		return 'high';
	}
	if (freq >= 40) {
		return 'medium';
	}
	return 'low';
}

module.exports = {
	detectDirectTranslation,
	hasEnglishArticles,
	hasExcessiveKatakana,
	hasDirectWordCount,
	hasEnglishCapitalization,
};
