/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Whitelist Checker for Translation Audit
 *
 * Filters out false positive issues based on whitelist rules.
 * Reduces noise from legitimate translations that trigger automated checks.
 */

const path = require('path');
const fs = require('fs');

let whitelistCache = null;

/**
 * Load whitelist configuration
 * @returns {object} Whitelist configuration
 */
function loadWhitelist() {
	if (whitelistCache) {
		return whitelistCache;
	}

	const whitelistPath = path.join(__dirname, '..', 'audit-whitelist.json');
	if (!fs.existsSync(whitelistPath)) {
		console.warn('Whitelist file not found, proceeding without filtering');
		return { exemptions: {} };
	}

	const content = fs.readFileSync(whitelistPath, 'utf8');
	whitelistCache = JSON.parse(content);
	return whitelistCache;
}

/**
 * Check if a key matches a pattern
 * @param {string} key - Message key to check
 * @param {string} pattern - Pattern (supports wildcards with *)
 * @returns {boolean} True if key matches pattern
 */
function matchesPattern(key, pattern) {
	// Convert pattern to regex: * becomes .*
	const regexPattern = '^' + pattern.replace(/\*/g, '.*') + '$';
	const regex = new RegExp(regexPattern);
	return regex.test(key);
}

/**
 * Check if an issue should be whitelisted
 * @param {object} issue - Issue object from detector
 * @returns {object|null} Whitelist match info if should be whitelisted, null otherwise
 */
function checkWhitelist(issue) {
	const whitelist = loadWhitelist();
	const { issueType, key, language } = issue;

	// Get rules for this issue type
	const exemptions = whitelist.exemptions?.[issueType];
	if (!exemptions || !exemptions.rules) {
		return null;
	}

	// Check each rule
	for (const rule of exemptions.rules) {
		// Check if language matches
		if (!rule.languages || !rule.languages.includes(language)) {
			continue;
		}

		// Check if key matches (either exact key or pattern)
		let keyMatches = false;

		if (rule.keys && rule.keys.includes(key)) {
			keyMatches = true;
		}

		if (!keyMatches && rule.patterns) {
			for (const pattern of rule.patterns) {
				if (matchesPattern(key, pattern)) {
					keyMatches = true;
					break;
				}
			}
		}

		// If both language and key match, this issue is whitelisted
		if (keyMatches) {
			return {
				ruleId: rule.ruleId,
				description: rule.description,
				rationale: rule.rationale,
			};
		}
	}

	return null;
}

/**
 * Filter issues through whitelist
 * @param {object[]} issues - Array of detected issues
 * @param {object} options - Filtering options
 * @param {boolean} options.removeWhitelisted - If true, remove whitelisted issues. If false, mark them.
 * @param {boolean} options.verbose - If true, log whitelisted issues
 * @returns {object} Filtered results { issues, whitelisted, statistics }
 */
function filterIssues(issues, options = {}) {
	const { removeWhitelisted = true, verbose = false } = options;

	const filtered = [];
	const whitelisted = [];

	for (const issue of issues) {
		const whitelistMatch = checkWhitelist(issue);

		if (whitelistMatch) {
			// Issue is whitelisted
			const whitelistedIssue = {
				...issue,
				whitelisted: true,
				whitelistRule: whitelistMatch.ruleId,
				whitelistRationale: whitelistMatch.rationale,
			};

			whitelisted.push(whitelistedIssue);

			if (!removeWhitelisted) {
				filtered.push(whitelistedIssue);
			}

			if (verbose) {
				console.log(`  [WHITELISTED] ${issue.language}/${issue.key}: ${issue.issueType} (rule: ${whitelistMatch.ruleId})`);
			}
		} else {
			// Issue is not whitelisted, keep it
			filtered.push(issue);
		}
	}

	return {
		issues: filtered,
		whitelisted,
		statistics: {
			totalInput: issues.length,
			retained: filtered.length,
			filtered: whitelisted.length,
			filterRate: issues.length > 0 ? (whitelisted.length / issues.length) * 100 : 0,
		},
	};
}

/**
 * Generate whitelist statistics for report
 * @param {object[]} whitelisted - Array of whitelisted issues
 * @returns {object} Statistics breakdown
 */
function generateWhitelistStats(whitelisted) {
	const byRule = {};
	const byIssueType = {};
	const byLanguage = {};

	for (const issue of whitelisted) {
		// Count by rule
		const ruleId = issue.whitelistRule || 'unknown';
		byRule[ruleId] = (byRule[ruleId] || 0) + 1;

		// Count by issue type
		const issueType = issue.issueType || 'unknown';
		byIssueType[issueType] = (byIssueType[issueType] || 0) + 1;

		// Count by language
		const lang = issue.language || 'unknown';
		byLanguage[lang] = (byLanguage[lang] || 0) + 1;
	}

	return {
		total: whitelisted.length,
		byRule,
		byIssueType,
		byLanguage,
	};
}

module.exports = {
	loadWhitelist,
	checkWhitelist,
	filterIssues,
	matchesPattern,
	generateWhitelistStats,
};
