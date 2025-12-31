/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cultural Mismatch Detector
 *
 * Detects translations that may be technically correct but culturally inappropriate:
 * - Tone analysis (formal/informal mismatches)
 * - Educational context checking (professional terminology in educational UI)
 * - Regional variant detection (Taiwan vs mainland China, Spain vs Latin America)
 */

const { estimateFrequency } = require('../audit-utils');

/**
 * Detect formal/informal tone mismatches based on language guidelines
 * @param {string} text - Translation text
 * @param {string} language - Target language code
 * @returns {object|null} Tone issue if detected
 */
function detectToneMismatch(text, language) {
	const issues = [];

	switch (language) {
		case 'ja':
			// Japanese should use polite form (です・ます) for instructions
			// Check for plain form in imperative statements
			if (/する$|だ$|である$/.test(text.trim()) && text.length > 10) {
				issues.push('Uses plain form (だ・である体) instead of polite form (です・ます体) for educational content');
			}
			break;

		case 'ko':
			// Korean should use 해요체 (informal polite) for educational context
			// Check for formal polite (하십시오체)
			if (/하십시오|십시오|습니다/.test(text)) {
				issues.push('Uses formal polite (하십시오체) instead of informal polite (해요체) recommended for students');
			}
			break;

		case 'de':
			// German should avoid formal "Sie" and use direct imperative
			// Check for Sie forms
			if (/\bSie\b/.test(text)) {
				issues.push('Uses formal "Sie" address; educational software should use direct imperative or informal "du"');
			}
			break;

		case 'es':
			// Spanish should use tuteo (tú) not usted for educational context
			if (/\busted\b/i.test(text)) {
				issues.push('Uses formal "usted"; educational content should use informal "tú" (tuteo)');
			}
			break;

		default:
			break;
	}

	return issues.length > 0 ? { type: 'tone', issues } : null;
}

/**
 * Detect professional terminology that's too advanced for educational context
 * @param {string} text - Translation text
 * @param {string} language - Target language code
 * @returns {object|null} Context issue if detected
 */
function detectEducationalContextMismatch(text, language) {
	const professionalTerms = {
		ja: ['実装', '実行環境', 'デプロイ', '最適化', 'リファクタリング'],
		ko: ['구현', '배포', '최적화', '리팩토링'],
		de: ['Implementierung', 'Deployment', 'Refactoring', 'Optimierung'],
		'zh-hant': ['實現', '部署', '重構', '優化'],
		es: ['implementación', 'despliegue', 'refactorización', 'optimización'],
	};

	const terms = professionalTerms[language] || [];
	const foundTerms = terms.filter(term => text.includes(term));

	if (foundTerms.length > 0) {
		return {
			type: 'educational-context',
			issues: [
				`Contains professional software development terms (${foundTerms.join(
					', '
				)}) that may be too advanced for middle/high school students`,
			],
		};
	}

	return null;
}

/**
 * Detect regional variant mismatches
 * @param {string} text - Translation text
 * @param {string} language - Target language code
 * @returns {object|null} Regional issue if detected
 */
function detectRegionalVariantMismatch(text, language) {
	const issues = [];

	if (language === 'zh-hant') {
		// Taiwan vs mainland China terminology
		const mainlandTerms = [
			{ term: '程序', taiwanTerm: '程式' },
			{ term: '函數', taiwanTerm: '函式' },
			{ term: '傳感器', taiwanTerm: '感測器' },
			{ term: '伺服電機', taiwanTerm: '伺服馬達' },
		];

		mainlandTerms.forEach(({ term, taiwanTerm }) => {
			if (text.includes(term)) {
				issues.push(`Uses mainland China term "${term}" instead of Taiwan term "${taiwanTerm}"`);
			}
		});
	}

	if (language === 'es') {
		// Check for Spain-specific terms that may not work in Latin America
		const spainTerms = ['ordenador', 'móvil'];
		spainTerms.forEach(term => {
			if (text.includes(term)) {
				issues.push(`Uses Spain-specific term "${term}"; consider Latin America neutral alternatives`);
			}
		});
	}

	return issues.length > 0 ? { type: 'regional-variant', issues } : null;
}

/**
 * Main detector function for cultural mismatch issues
 * @param {string} key - Translation message key
 * @param {string} sourceText - English source text
 * @param {string} translatedText - Translated text
 * @param {string} language - Target language code
 * @returns {object|null} Issue object if detected, null otherwise
 */
function detectCulturalMismatch(key, sourceText, translatedText, language) {
	if (!translatedText || !sourceText) {
		return null;
	}

	const allIssues = [];

	// Check tone
	const toneIssue = detectToneMismatch(translatedText, language);
	if (toneIssue) {
		allIssues.push(...toneIssue.issues);
	}

	// Check educational context
	const contextIssue = detectEducationalContextMismatch(translatedText, language);
	if (contextIssue) {
		allIssues.push(...contextIssue.issues);
	}

	// Check regional variants
	const regionalIssue = detectRegionalVariantMismatch(translatedText, language);
	if (regionalIssue) {
		allIssues.push(...regionalIssue.issues);
	}

	if (allIssues.length > 0) {
		return {
			key,
			language,
			issueType: 'culturalMismatch',
			severity: determineSeverity(key),
			currentValue: translatedText,
			suggestedValue: null, // Requires native speaker cultural adaptation
			rationale: `Cultural mismatch detected: ${allIssues.join('; ')}`,
			frequency: estimateFrequency(key),
			detectedBy: 'automated',
			detectedAt: new Date().toISOString(),
		};
	}

	return null;
}

/**
 * Determine severity based on message key frequency
 * Cultural mismatch issues are always low severity since they require
 * native speaker review and should not block PRs
 * @param {string} key - Translation message key
 * @returns {string} Severity level: always 'low' for cultural issues
 */
function determineSeverity(key) {
	// Cultural mismatch detection requires human judgment from native speakers
	// AI/automated tools cannot definitively determine cultural appropriateness
	// Force all culturalMismatch issues to 'low' severity to avoid blocking PRs
	return 'low';
}

module.exports = {
	detectCulturalMismatch,
	detectToneMismatch,
	detectEducationalContextMismatch,
	detectRegionalVariantMismatch,
};
