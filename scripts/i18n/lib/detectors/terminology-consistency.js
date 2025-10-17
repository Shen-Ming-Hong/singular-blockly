/**
 * Terminology Consistency Checker
 *
 * Checks if translations use approved glossary terms and
 * flags inconsistent terminology usage across similar UI elements.
 */

const path = require('path');
const fs = require('fs');
const { estimateFrequency } = require('../audit-utils');

let glossaryCache = null;

/**
 * Load the localization glossary
 * @returns {object} Glossary data
 */
function loadGlossary() {
	if (glossaryCache) {
		return glossaryCache;
	}

	const glossaryPath = path.join(__dirname, '..', '..', '..', 'specs', '002-i18n-localization-review', 'localization-glossary.json');

	if (!fs.existsSync(glossaryPath)) {
		// Glossary not yet created, return empty
		return { terms: [] };
	}

	try {
		glossaryCache = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));
		return glossaryCache;
	} catch (e) {
		return { terms: [] };
	}
}

/**
 * Find glossary entry for an English term
 * @param {string} englishTerm - English term to look up
 * @returns {object|null} Glossary entry or null if not found
 */
function findGlossaryEntry(englishTerm) {
	const glossary = loadGlossary();
	const normalized = englishTerm.toLowerCase().trim();

	return glossary.terms.find(entry => {
		if (entry.englishTerm.toLowerCase() === normalized) {
			return true;
		}
		// Check aliases
		if (entry.aliases && entry.aliases.some(alias => alias.toLowerCase() === normalized)) {
			return true;
		}
		return false;
	});
}

/**
 * Check if translation uses approved glossary term
 * @param {string} translatedText - Translation text
 * @param {string} language - Target language code
 * @param {object} glossaryEntry - Glossary entry to check against
 * @returns {boolean} True if uses approved term
 */
function usesApprovedTerm(translatedText, language, glossaryEntry) {
	if (!glossaryEntry || !glossaryEntry.translations || !glossaryEntry.translations[language]) {
		return true; // No glossary entry, can't check
	}

	const approved = glossaryEntry.translations[language];
	const normalizedText = translatedText.toLowerCase().trim();

	// Check if uses the primary approved term
	if (normalizedText.includes(approved.term.toLowerCase())) {
		return true;
	}

	// Check if uses an approved alternative
	if (approved.alternatives && approved.alternatives.some(alt => normalizedText.includes(alt.toLowerCase()))) {
		return true;
	}

	return false;
}

/**
 * Extract technical terms from English source text
 * Common patterns: servo motor, digital pin, analog read, etc.
 * @param {string} sourceText - English source text
 * @returns {string[]} Array of detected technical terms
 */
function extractTechnicalTerms(sourceText) {
	const glossary = loadGlossary();
	const found = [];

	glossary.terms.forEach(entry => {
		const normalized = sourceText.toLowerCase();

		if (normalized.includes(entry.englishTerm.toLowerCase())) {
			found.push(entry.englishTerm);
		}

		// Check aliases
		if (entry.aliases) {
			entry.aliases.forEach(alias => {
				if (normalized.includes(alias.toLowerCase())) {
					found.push(entry.englishTerm);
				}
			});
		}
	});

	return [...new Set(found)]; // Remove duplicates
}

/**
 * Main detector function for terminology consistency issues
 * @param {string} key - Translation message key
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {object|null} Issue object if detected, null otherwise
 */
function detectTerminologyInconsistency(key, sourceText, translatedText, language) {
	if (!translatedText || !sourceText) {
		return null;
	}

	// Extract technical terms from English source
	const technicalTerms = extractTechnicalTerms(sourceText);

	if (technicalTerms.length === 0) {
		return null; // No technical terms to check
	}

	// Check each technical term
	const inconsistentTerms = [];

	technicalTerms.forEach(term => {
		const glossaryEntry = findGlossaryEntry(term);

		if (glossaryEntry && !usesApprovedTerm(translatedText, language, glossaryEntry)) {
			const approved = glossaryEntry.translations[language];
			if (approved) {
				inconsistentTerms.push({
					term,
					expectedTerm: approved.term,
					alternatives: approved.alternatives || [],
				});
			}
		}
	});

	if (inconsistentTerms.length > 0) {
		const suggestions = inconsistentTerms.map(item => `"${item.term}" should use "${item.expectedTerm}"`).join('; ');

		return {
			key,
			language,
			issueType: 'inconsistentTerminology',
			severity: determineSeverity(key),
			currentValue: translatedText,
			suggestedValue: null, // Would require context-aware term substitution
			rationale: `Inconsistent terminology detected: ${suggestions}. Check glossary for approved terms.`,
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
	detectTerminologyInconsistency,
	loadGlossary,
	findGlossaryEntry,
	extractTechnicalTerms,
};
