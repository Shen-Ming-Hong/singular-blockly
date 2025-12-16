/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Unit tests for whitelist-checker.js
 * Tests pattern matching, rule filtering, and statistics generation
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { loadWhitelist, checkWhitelist, filterIssues, matchesPattern, generateWhitelistStats } = require('./whitelist-checker');

describe('Whitelist Checker - Pattern Matching', () => {
	describe('matchesPattern()', () => {
		it('should match exact patterns without wildcards', () => {
			assert.strictEqual(matchesPattern('CATEGORY_MATH', 'CATEGORY_MATH'), true);
			assert.strictEqual(matchesPattern('CATEGORY_LOGIC', 'CATEGORY_MATH'), false);
		});

		it('should match prefix wildcards', () => {
			assert.strictEqual(matchesPattern('CATEGORY_MATH', 'CATEGORY_*'), true);
			assert.strictEqual(matchesPattern('CATEGORY_LOGIC', 'CATEGORY_*'), true);
			assert.strictEqual(matchesPattern('CATEGORY_LOOPS', 'CATEGORY_*'), true);
			assert.strictEqual(matchesPattern('BLOCK_MATH', 'CATEGORY_*'), false);
		});

		it('should match suffix wildcards', () => {
			assert.strictEqual(matchesPattern('ARDUINO_DIGITAL_READ', '*_READ'), true);
			assert.strictEqual(matchesPattern('ARDUINO_ANALOG_READ', '*_READ'), true);
			assert.strictEqual(matchesPattern('ARDUINO_DIGITAL_WRITE', '*_READ'), false);
		});

		it('should match middle wildcards', () => {
			assert.strictEqual(matchesPattern('ARDUINO_DIGITAL_READ', 'ARDUINO_*_READ'), true);
			assert.strictEqual(matchesPattern('ARDUINO_ANALOG_READ', 'ARDUINO_*_READ'), true);
			assert.strictEqual(matchesPattern('SENSOR_DIGITAL_READ', 'ARDUINO_*_READ'), false);
		});

		it('should match multiple wildcards', () => {
			assert.strictEqual(matchesPattern('CATEGORY_MATH_TOOLTIP', 'CATEGORY_*_TOOLTIP'), true);
			assert.strictEqual(matchesPattern('BLOCK_LOGIC_IF_TOOLTIP', '*_*_TOOLTIP'), true);
			assert.strictEqual(matchesPattern('SIMPLE_TEXT', '*_*_TOOLTIP'), false);
		});

		it('should match catch-all wildcard', () => {
			assert.strictEqual(matchesPattern('ANY_KEY_HERE', '*'), true);
			assert.strictEqual(matchesPattern('', '*'), true);
		});

		it('should handle empty strings', () => {
			assert.strictEqual(matchesPattern('', ''), true);
			assert.strictEqual(matchesPattern('SOMETHING', ''), false);
			assert.strictEqual(matchesPattern('', 'PATTERN'), false);
		});
	});
});

describe('Whitelist Checker - Rule Matching', () => {
	describe('checkWhitelist()', () => {
		it('should return null for non-whitelisted issues', () => {
			const issue = {
				key: 'SOME_RANDOM_KEY_NOT_IN_ANY_RULE',
				language: 'ja',
				issueType: 'lengthOverflow',
			};
			const result = checkWhitelist(issue);
			assert.strictEqual(result, null);
		});

		it('should match issues by pattern', () => {
			const issue = {
				key: 'CATEGORY_MATH',
				language: 'ja',
				issueType: 'lengthOverflow',
			};
			const result = checkWhitelist(issue);
			assert.notStrictEqual(result, null);
			assert.strictEqual(result.ruleId, 'cjk-concise-terms');
		});

		it('should match issues by exact key', () => {
			const issue = {
				key: 'CATEGORY_MATH',
				language: 'de',
				issueType: 'lengthOverflow',
			};
			const result = checkWhitelist(issue);
			assert.notStrictEqual(result, null);
			assert.strictEqual(result.ruleId, 'german-compound-words');
		});

		it('should match issues by multiple patterns', () => {
			const issue1 = {
				key: 'ARDUINO_DIGITAL_READ',
				language: 'de',
				issueType: 'directTranslation',
			};
			const result1 = checkWhitelist(issue1);
			assert.notStrictEqual(result1, null);
			assert.strictEqual(result1.ruleId, 'arduino-api-terms');

			const issue2 = {
				key: 'ARDUINO_ANALOG_WRITE',
				language: 'es',
				issueType: 'directTranslation',
			};
			const result2 = checkWhitelist(issue2);
			assert.notStrictEqual(result2, null);
			assert.strictEqual(result2.ruleId, 'arduino-api-terms');
		});

		it('should not match if language does not match', () => {
			const issue = {
				key: 'CATEGORY_MATH',
				language: 'fr', // French not in rule
				issueType: 'lengthOverflow',
			};
			const result = checkWhitelist(issue);
			assert.strictEqual(result, null);
		});

		it('should not match if issue type does not match', () => {
			const issue = {
				key: 'SOME_UNRELATED_KEY', // Key not in any rule
				language: 'ja',
				issueType: 'directTranslation', // Wrong issue type for CATEGORY_* pattern
			};
			const result = checkWhitelist(issue);
			assert.strictEqual(result, null);
		});

		it('should return rule metadata when matched', () => {
			const issue = {
				key: 'BOARD_UNO',
				language: 'ja',
				issueType: 'missingTranslation',
			};
			const result = checkWhitelist(issue);
			assert.notStrictEqual(result, null);
			assert.strictEqual(result.ruleId, 'brand-and-product-names'); // Actual whitelist rule ID
			assert.ok(result.description);
			assert.ok(result.rationale);
		});

		it('should handle missing exemptions gracefully', () => {
			// Test with a non-existent issue type
			const issue = {
				key: 'SOME_KEY',
				language: 'ja',
				issueType: 'nonExistentIssueType',
			};
			const result = checkWhitelist(issue);
			assert.strictEqual(result, null);
		});
	});
});

describe('Whitelist Checker - Issue Filtering', () => {
	describe('filterIssues()', () => {
		it('should remove whitelisted issues by default', () => {
			const issues = [
				{ key: 'CATEGORY_MATH', language: 'ja', issueType: 'lengthOverflow' },
				{ key: 'SOME_OTHER_KEY_NOT_WHITELISTED', language: 'ja', issueType: 'lengthOverflow' },
			];

			const result = filterIssues(issues);

			assert.strictEqual(result.issues.length, 1);
			assert.strictEqual(result.issues[0].key, 'SOME_OTHER_KEY_NOT_WHITELISTED');
			assert.strictEqual(result.whitelisted.length, 1);
			assert.strictEqual(result.whitelisted[0].key, 'CATEGORY_MATH');
		});

		it('should mark whitelisted issues when removeWhitelisted=false', () => {
			const issues = [{ key: 'CATEGORY_MATH', language: 'ja', issueType: 'lengthOverflow' }];

			const result = filterIssues(issues, { removeWhitelisted: false });

			assert.strictEqual(result.issues.length, 1);
			assert.strictEqual(result.issues[0].whitelisted, true);
			assert.ok(result.issues[0].whitelistRule);
			assert.ok(result.issues[0].whitelistRationale);
		});

		it('should calculate correct statistics', () => {
			const issues = [
				{ key: 'CATEGORY_MATH', language: 'ja', issueType: 'lengthOverflow' },
				{ key: 'CATEGORY_LOGIC', language: 'ja', issueType: 'lengthOverflow' },
				{ key: 'SOME_KEY', language: 'ja', issueType: 'lengthOverflow' },
				{ key: 'ANOTHER_KEY', language: 'ja', issueType: 'lengthOverflow' },
			];

			const result = filterIssues(issues);

			assert.strictEqual(result.statistics.totalInput, 4);
			assert.strictEqual(result.statistics.retained, 2);
			assert.strictEqual(result.statistics.filtered, 2);
			assert.strictEqual(result.statistics.filterRate, 50);
		});

		it('should handle empty issue arrays', () => {
			const result = filterIssues([]);

			assert.strictEqual(result.issues.length, 0);
			assert.strictEqual(result.whitelisted.length, 0);
			assert.strictEqual(result.statistics.totalInput, 0);
			assert.strictEqual(result.statistics.filterRate, 0);
		});

		it('should handle arrays with no whitelisted issues', () => {
			const issues = [
				{ key: 'KEY1', language: 'en', issueType: 'lengthOverflow' },
				{ key: 'KEY2', language: 'en', issueType: 'lengthOverflow' },
			];

			const result = filterIssues(issues);

			assert.strictEqual(result.issues.length, 2);
			assert.strictEqual(result.whitelisted.length, 0);
			assert.strictEqual(result.statistics.filterRate, 0);
		});

		it('should handle arrays with all whitelisted issues', () => {
			const issues = [
				{ key: 'CATEGORY_MATH', language: 'ja', issueType: 'lengthOverflow' },
				{ key: 'CATEGORY_LOGIC', language: 'ja', issueType: 'lengthOverflow' },
			];

			const result = filterIssues(issues);

			assert.strictEqual(result.issues.length, 0);
			assert.strictEqual(result.whitelisted.length, 2);
			assert.strictEqual(result.statistics.filterRate, 100);
		});
	});
});

describe('Whitelist Checker - Statistics Generation', () => {
	describe('generateWhitelistStats()', () => {
		it('should generate statistics by rule', () => {
			const whitelisted = [
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule2', issueType: 'directTranslation', language: 'de' },
			];

			const stats = generateWhitelistStats(whitelisted);

			assert.strictEqual(stats.total, 3);
			assert.strictEqual(stats.byRule['rule1'], 2);
			assert.strictEqual(stats.byRule['rule2'], 1);
		});

		it('should generate statistics by issue type', () => {
			const whitelisted = [
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule2', issueType: 'directTranslation', language: 'de' },
				{ whitelistRule: 'rule3', issueType: 'missingTranslation', language: 'es' },
			];

			const stats = generateWhitelistStats(whitelisted);

			assert.strictEqual(stats.byIssueType['lengthOverflow'], 2);
			assert.strictEqual(stats.byIssueType['directTranslation'], 1);
			assert.strictEqual(stats.byIssueType['missingTranslation'], 1);
		});

		it('should generate statistics by language', () => {
			const whitelisted = [
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule1', issueType: 'lengthOverflow', language: 'ja' },
				{ whitelistRule: 'rule2', issueType: 'directTranslation', language: 'de' },
				{ whitelistRule: 'rule3', issueType: 'missingTranslation', language: 'es' },
			];

			const stats = generateWhitelistStats(whitelisted);

			assert.strictEqual(stats.byLanguage['ja'], 2);
			assert.strictEqual(stats.byLanguage['de'], 1);
			assert.strictEqual(stats.byLanguage['es'], 1);
		});

		it('should handle empty arrays', () => {
			const stats = generateWhitelistStats([]);

			assert.strictEqual(stats.total, 0);
			assert.deepStrictEqual(stats.byRule, {});
			assert.deepStrictEqual(stats.byIssueType, {});
			assert.deepStrictEqual(stats.byLanguage, {});
		});

		it('should handle missing fields gracefully', () => {
			const whitelisted = [
				{ whitelistRule: undefined, issueType: undefined, language: undefined },
				{ whitelistRule: null, issueType: null, language: null },
			];

			const stats = generateWhitelistStats(whitelisted);

			assert.strictEqual(stats.total, 2);
			assert.strictEqual(stats.byRule['unknown'], 2);
			assert.strictEqual(stats.byIssueType['unknown'], 2);
			assert.strictEqual(stats.byLanguage['unknown'], 2);
		});
	});
});

describe('Whitelist Checker - File Loading', () => {
	describe('loadWhitelist()', () => {
		it('should load and parse whitelist.json successfully', () => {
			const whitelist = loadWhitelist();

			// Verify basic structure
			assert.ok(whitelist);
			assert.ok(whitelist.exemptions);
			assert.ok(whitelist.version);
		});

		it('should validate version field exists', () => {
			const whitelist = loadWhitelist();
			assert.ok(whitelist.version);
			assert.match(whitelist.version, /^\d+\.\d+\.\d+$/); // Semantic versioning
		});

		it('should have valid exemption categories', () => {
			const whitelist = loadWhitelist();
			const validCategories = ['lengthOverflow', 'directTranslation', 'missingTranslation'];

			for (const category of validCategories) {
				if (whitelist.exemptions[category]) {
					assert.ok(Array.isArray(whitelist.exemptions[category].rules));
				}
			}
		});

		it('should validate rule structure', () => {
			const whitelist = loadWhitelist();

			// Check each exemption category
			for (const [category, exemption] of Object.entries(whitelist.exemptions)) {
				if (exemption.rules) {
					for (const rule of exemption.rules) {
						// Required fields
						assert.ok(rule.ruleId, `Rule in ${category} missing ruleId`);
						assert.ok(rule.description, `Rule ${rule.ruleId} missing description`);
						assert.ok(Array.isArray(rule.languages), `Rule ${rule.ruleId} missing languages array`);
						assert.ok(rule.rationale, `Rule ${rule.ruleId} missing rationale`);

						// Must have either keys or patterns
						const hasKeys = rule.keys && Array.isArray(rule.keys);
						const hasPatterns = rule.patterns && Array.isArray(rule.patterns);
						assert.ok(hasKeys || hasPatterns, `Rule ${rule.ruleId} must have either keys or patterns`);
					}
				}
			}
		});

		it('should cache whitelist after first load', () => {
			const whitelistChecker = require('./whitelist-checker');

			// Clear cache
			whitelistChecker.whitelistCache = null;

			// First load
			const whitelist1 = loadWhitelist();

			// Second load (should use cache)
			const whitelist2 = loadWhitelist();

			// Both should be identical references (same object)
			assert.strictEqual(whitelist1, whitelist2);
		});
	});
});

describe('Whitelist Checker - Integration Tests', () => {
	it('should filter real-world issue patterns', () => {
		// Simulate realistic audit issues
		const issues = [
			{
				key: 'CATEGORY_MATH',
				language: 'ja',
				issueType: 'lengthOverflow',
				severity: 'high',
				englishValue: 'Mathematics',
				currentValue: '数学',
				rationale: 'Translation is 67% shorter',
			},
			{
				key: 'ARDUINO_DELAY',
				language: 'de',
				issueType: 'directTranslation',
				severity: 'high',
				englishValue: 'delay',
				currentValue: 'Verzögerung',
				rationale: 'Similar to English term',
			},
			{
				key: 'BOARD_UNO',
				language: 'ja',
				issueType: 'missingTranslation',
				severity: 'medium',
				englishValue: 'Arduino Uno',
				currentValue: 'Arduino Uno',
				rationale: 'Translation matches English',
			},
			{
				key: 'SOME_UNRELATED_KEY',
				language: 'ja',
				issueType: 'lengthOverflow',
				severity: 'high',
				englishValue: 'Test',
				currentValue: 'テスト長すぎ',
				rationale: 'Genuinely too long',
			},
		];

		const result = filterIssues(issues);

		// Should filter out 3 whitelisted issues, keep 1 genuine issue
		assert.strictEqual(result.issues.length, 1);
		assert.strictEqual(result.issues[0].key, 'SOME_UNRELATED_KEY');
		assert.strictEqual(result.whitelisted.length, 3);
		assert.strictEqual(result.statistics.filterRate, 75);
	});

	it('should generate comprehensive statistics report', () => {
		const issues = [
			{ key: 'CATEGORY_MATH', language: 'ja', issueType: 'lengthOverflow' },
			{ key: 'CATEGORY_LOGIC', language: 'ko', issueType: 'lengthOverflow' },
			{ key: 'ARDUINO_DELAY', language: 'de', issueType: 'directTranslation' },
			{ key: 'BOARD_UNO', language: 'es', issueType: 'missingTranslation' },
		];

		const result = filterIssues(issues);
		const stats = generateWhitelistStats(result.whitelisted);

		assert.ok(stats.total > 0);
		assert.ok(Object.keys(stats.byRule).length > 0);
		assert.ok(Object.keys(stats.byIssueType).length > 0);
		assert.ok(Object.keys(stats.byLanguage).length > 0);
	});
});
