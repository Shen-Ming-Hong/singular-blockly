#!/usr/bin/env node
/**
 * Audit Summary Script
 *
 * Loads an audit report and displays human-readable summary:
 * - Issues by severity
 * - Issues by language
 * - Top 20 high-frequency issues
 * - Recommendations
 */

const path = require('path');
const fs = require('fs');

function main() {
	const args = process.argv.slice(2);
	const reportPath = args[0];

	if (!reportPath) {
		console.error('Usage: node audit-summary.js <path-to-audit-report.json>');
		process.exit(1);
	}

	if (!fs.existsSync(reportPath)) {
		console.error(`Error: Report file not found: ${reportPath}`);
		process.exit(1);
	}

	const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

	console.log('\n=== Translation Quality Audit Summary ===\n');
	console.log(`Report ID: ${report.reportId}`);
	console.log(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
	console.log(`Languages: ${report.auditScope.languages.join(', ')}`);
	console.log();

	console.log('--- Overall Statistics ---');
	console.log(`Total Issues: ${report.totalIssues}`);
	console.log(`  High Severity:   ${report.issuesBySeverity.high} (${percent(report.issuesBySeverity.high, report.totalIssues)}%)`);
	console.log(`  Medium Severity: ${report.issuesBySeverity.medium} (${percent(report.issuesBySeverity.medium, report.totalIssues)}%)`);
	console.log(`  Low Severity:    ${report.issuesBySeverity.low} (${percent(report.issuesBySeverity.low, report.totalIssues)}%)`);
	console.log();

	console.log('--- Issues by Language ---');
	const sortedLangs = Object.entries(report.issuesPerLanguage).sort((a, b) => b[1] - a[1]);

	sortedLangs.forEach(([lang, count]) => {
		console.log(`  ${lang}: ${count} issues (${percent(count, report.totalIssues)}%)`);
	});
	console.log();

	console.log('--- Coverage Statistics ---');
	console.log(`Total Message Keys: ${report.coverageStats.totalMessageKeys}`);
	console.log(`Keys Audited: ${Math.round(report.coverageStats.auditedMessageKeys)}`);
	console.log(`Coverage: ${report.coverageStats.coveragePercentage.toFixed(1)}%`);
	console.log(`Fully Audited Languages: ${report.coverageStats.languagesFullyAudited.join(', ') || 'None'}`);
	if (report.coverageStats.languagesPartiallyAudited.length > 0) {
		console.log(`Partially Audited: ${report.coverageStats.languagesPartiallyAudited.join(', ')}`);
	}
	console.log();

	console.log('--- Top 20 High-Frequency Issues ---');
	if (report.highFrequencyIssues.length === 0) {
		console.log('  No high-frequency issues found!');
	} else {
		report.highFrequencyIssues.slice(0, 20).forEach((issue, idx) => {
			console.log(`${idx + 1}. [${issue.language}] ${issue.key}`);
			console.log(`   Type: ${issue.issueType}, Severity: ${issue.severity}, Frequency: ${issue.frequency}`);
			console.log(`   Current: "${issue.currentValue}"`);
			if (issue.suggestedValue) {
				console.log(`   Suggested: "${issue.suggestedValue}"`);
			}
			console.log(`   Rationale: ${issue.rationale}`);
			console.log();
		});
	}

	console.log('--- Recommendations ---');
	if (report.recommendations.length === 0) {
		console.log('  No recommendations - excellent translation quality!');
	} else {
		report.recommendations.forEach((rec, idx) => {
			console.log(`${idx + 1}. ${rec}`);
		});
	}
	console.log();

	console.log('--- Issue Type Breakdown ---');
	const issuesByType = {};
	(report.issues || []).forEach(issue => {
		issuesByType[issue.issueType] = (issuesByType[issue.issueType] || 0) + 1;
	});

	Object.entries(issuesByType)
		.sort((a, b) => b[1] - a[1])
		.forEach(([type, count]) => {
			console.log(`  ${type}: ${count} (${percent(count, report.totalIssues)}%)`);
		});
	console.log();
}

function percent(value, total) {
	if (total === 0) {
		return 0;
	}
	return Math.round((value / total) * 100);
}

main();
