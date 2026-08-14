#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const { isUtf8 } = require('node:buffer');

const translationReader = require('./lib/translation-reader');
const {
	KNOWN_EMPTY_MESSAGE_KEYS,
	LOCALES,
	PROJECT_ROOT,
	REQUIRED_PROJECT_ARIA_KEYS,
	messageFile,
	packageNlsFile,
} = require('./lib/translation-config');

const REPORT_SCHEMA_VERSION = 1;
const PLACEHOLDER_PATTERNS = [/\{\d+\}/g, /%\d+/g, /\$\{\w+\}/g];

function issue(code, surface, locale, details = {}) {
	return {
		code,
		type: code,
		severity: 'error',
		surface,
		locale,
		key: null,
		expected: null,
		actual: null,
		...details,
	};
}

function checkEncoding(locale, filePath, surface = 'messages') {
	let content;
	try {
		content = fs.readFileSync(filePath);
	} catch (error) {
		return [issue('fileReadError', surface, locale, { message: error.message })];
	}
	if (!isUtf8(content)) {
		return [issue('encodingError', surface, locale, { message: 'File is not valid UTF-8' })];
	}
	const hasBom = content.length >= 3 && content[0] === 0xef && content[1] === 0xbb && content[2] === 0xbf;
	return hasBom ? [issue('bomDetected', surface, locale, { message: 'UTF-8 BOM must be removed' })] : [];
}

function checkSchema(locale, values, surface = 'messages') {
	if (!values || typeof values !== 'object' || Array.isArray(values)) {
		return [issue('schemaError', surface, locale, { message: 'Translations must be a plain object' })];
	}
	return Object.entries(values)
		.filter(([, value]) => typeof value !== 'string')
		.map(([key, value]) =>
			issue('schemaError', surface, locale, {
				key,
				message: 'Translation value must be a string',
				expected: 'string',
				actual: Array.isArray(value) ? 'array' : typeof value,
			})
		);
}

function checkEmpty(key, value, surface = 'messages', locale = 'unknown') {
	if (surface === 'messages' && KNOWN_EMPTY_MESSAGE_KEYS.has(key)) {
		return [];
	}
	return typeof value !== 'string' || value.trim().length === 0
		? [issue('emptyTranslation', surface, locale, { key, message: 'Translation is empty or whitespace-only' })]
		: [];
}

function placeholderCounts(text) {
	const counts = new Map();
	for (const pattern of PLACEHOLDER_PATTERNS) {
		for (const token of text.match(pattern) || []) {
			counts.set(token, (counts.get(token) || 0) + 1);
		}
	}
	return counts;
}

function checkPlaceholders(key, sourceText, translatedText, surface = 'messages', locale = 'unknown') {
	const source = placeholderCounts(sourceText);
	const target = placeholderCounts(translatedText);
	const tokens = [...new Set([...source.keys(), ...target.keys()])].sort();
	return tokens.flatMap(token => {
		const expected = source.get(token) || 0;
		const actual = target.get(token) || 0;
		if (expected === actual) {
			return [];
		}
		const code = actual < expected ? 'missingPlaceholder' : 'extraPlaceholder';
		return [
			issue(code, surface, locale, {
				key,
				message: `Placeholder ${token} must appear ${expected} time(s), received ${actual}`,
				expected: { token, count: expected },
				actual: { token, count: actual },
			}),
		];
	});
}

function checkKeyParity(surface, sourceValues, targetValues, locale) {
	const sourceKeys = new Set(Object.keys(sourceValues));
	const targetKeys = new Set(Object.keys(targetValues));
	const missing = [...sourceKeys]
		.filter(key => !targetKeys.has(key))
		.sort()
		.map(key =>
			issue('missingKey', surface, locale, {
				key,
				message: 'Key is missing from target locale',
				expected: 'present',
				actual: 'missing',
			})
		);
	const extra = [...targetKeys]
		.filter(key => !sourceKeys.has(key))
		.sort()
		.map(key =>
			issue('extraKey', surface, locale, {
				key,
				message: 'Key does not exist in the English baseline',
				expected: 'absent',
				actual: 'present',
			})
		);
	return [...missing, ...extra];
}

function checkValues(surface, sourceValues, targetValues, locale) {
	const issues = [];
	for (const [key, sourceText] of Object.entries(sourceValues)) {
		if (!(key in targetValues) || typeof targetValues[key] !== 'string') {
			continue;
		}
		const translatedText = targetValues[key];
		const emptyIssues = checkEmpty(key, translatedText, surface, locale);
		issues.push(...emptyIssues);
		if (emptyIssues.length === 0 && typeof sourceText === 'string') {
			issues.push(...checkPlaceholders(key, sourceText, translatedText, surface, locale));
		}
	}
	return issues;
}

function loadJsonObject(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateLocaleFiles(locale, root = PROJECT_ROOT) {
	const issues = [];
	const messagesPath = messageFile(locale, root);
	const packagePath = packageNlsFile(locale, root);
	issues.push(...checkEncoding(locale, messagesPath, 'messages'));
	issues.push(...checkEncoding(locale, packagePath, 'package-nls'));

	let messages;
	let packageMessages;
	let messagesLoaded = false;
	let packageMessagesLoaded = false;
	try {
		messages = translationReader.loadMessagesFile(locale, root);
		messagesLoaded = true;
	} catch (error) {
		issues.push(issue('parseError', 'messages', locale, { message: error.message }));
	}
	try {
		packageMessages = loadJsonObject(packagePath);
		packageMessagesLoaded = true;
	} catch (error) {
		issues.push(issue('parseError', 'package-nls', locale, { message: error.message }));
	}
	return { issues, messages, messagesLoaded, packageMessages, packageMessagesLoaded };
}

function appendSchemaIssues(issues, surface, locale, values, loaded) {
	if (!loaded) {
		return false;
	}
	const schemaIssues = checkSchema(locale, values, surface);
	issues.push(...schemaIssues);
	return schemaIssues.length === 0;
}

function validateTranslations(locales, root = PROJECT_ROOT) {
	const loaded = new Map();
	const issues = [];
	const requiredLocales = [...new Set(['en', ...locales])];
	for (const locale of requiredLocales) {
		const result = validateLocaleFiles(locale, root);
		loaded.set(locale, result);
		issues.push(...result.issues);
	}

	const english = loaded.get('en');
	const englishMessagesValid = appendSchemaIssues(issues, 'messages', 'en', english.messages, english.messagesLoaded);
	const englishPackageValid = appendSchemaIssues(
		issues,
		'package-nls',
		'en',
		english.packageMessages,
		english.packageMessagesLoaded
	);
	if (englishMessagesValid) {
		issues.push(...checkValues('messages', english.messages, english.messages, 'en'));
	}
	if (englishPackageValid) {
		issues.push(...checkValues('package-nls', english.packageMessages, english.packageMessages, 'en'));
	}

	for (const locale of locales.filter(candidate => candidate !== 'en')) {
		const target = loaded.get(locale);
		const messagesValid = appendSchemaIssues(issues, 'messages', locale, target.messages, target.messagesLoaded);
		const packageMessagesValid = appendSchemaIssues(
			issues,
			'package-nls',
			locale,
			target.packageMessages,
			target.packageMessagesLoaded
		);
		if (englishMessagesValid && messagesValid) {
			issues.push(...checkKeyParity('messages', english.messages, target.messages, locale));
			issues.push(...checkValues('messages', english.messages, target.messages, locale));
		}
		if (englishPackageValid && packageMessagesValid) {
			issues.push(...checkKeyParity('package-nls', english.packageMessages, target.packageMessages, locale));
			issues.push(...checkValues('package-nls', english.packageMessages, target.packageMessages, locale));
		}
	}

	for (const locale of requiredLocales) {
		const messages = loaded.get(locale)?.messages;
		for (const key of REQUIRED_PROJECT_ARIA_KEYS) {
			if (!messages || typeof messages[key] !== 'string' || messages[key].trim().length === 0) {
				issues.push(issue('missingAriaTranslation', 'messages', locale, { key, message: 'Required ARIA text is missing' }));
			}
		}
		const coreLocalePath = path.join(root, 'node_modules', 'blockly', 'msg', `${locale}.js`);
		if (!fs.existsSync(coreLocalePath)) {
			issues.push(
				issue('missingBlocklyCoreLocale', 'messages', locale, {
					message: `Blockly core locale is missing: ${coreLocalePath}`,
				})
			);
		}
	}

	issues.sort((left, right) => {
		const leftKey = [left.surface, left.locale, left.key || '', left.code].join(':');
		const rightKey = [right.surface, right.locale, right.key || '', right.code].join(':');
		return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
	});
	return createReport(locales, issues);
}

function createReport(locales, issues) {
	const bySurface = {};
	const byLocale = {};
	for (const finding of issues) {
		bySurface[finding.surface] = (bySurface[finding.surface] || 0) + 1;
		byLocale[finding.locale] = (byLocale[finding.locale] || 0) + 1;
	}
	return {
		schemaVersion: REPORT_SCHEMA_VERSION,
		status: issues.length === 0 ? 'PASS' : 'FAIL',
		passed: issues.length === 0,
		locales,
		summary: { errors: issues.length, bySurface, byLocale },
		issues,
	};
}

function parseArguments(argv) {
	const allowedArguments = argument => argument === '--all' || argument.startsWith('--language=') || argument.startsWith('--format=');
	const unexpectedArgument = argv.find(argument => !allowedArguments(argument));
	if (unexpectedArgument) {
		throw new Error(`Unsupported argument: ${unexpectedArgument}`);
	}
	const languageArguments = argv.filter(argument => argument.startsWith('--language='));
	const formatArguments = argv.filter(argument => argument.startsWith('--format='));
	if (languageArguments.length > 1 || formatArguments.length > 1 || argv.filter(argument => argument === '--all').length > 1) {
		throw new Error('Duplicate i18n validator arguments are not allowed');
	}
	if (argv.includes('--all') && languageArguments.length > 0) {
		throw new Error('Use either --all or --language, not both');
	}
	const languageArgument = languageArguments[0];
	const formatArgument = formatArguments[0];
	const format = formatArgument ? formatArgument.slice('--format='.length) : 'human';
	if (!['human', 'json'].includes(format)) {
		throw new Error(`Unsupported format: ${format}`);
	}
	if (argv.includes('--all')) {
		return { format, locales: LOCALES };
	}
	if (!languageArgument) {
		throw new Error('Usage: node validate-translations.js --all | --language=<locale> [--format=json]');
	}
	const locale = languageArgument.slice('--language='.length);
	if (!LOCALES.includes(locale)) {
		throw new Error(`Unsupported locale: ${locale}`);
	}
	return { format, locales: [locale] };
}

function printHumanReport(report) {
	console.log(`i18n validation: ${report.status}`);
	console.log(`Locales: ${report.locales.join(', ')}`);
	console.log(`Errors: ${report.summary.errors}`);
	for (const finding of report.issues) {
		console.log(`- [${finding.code}] ${finding.surface}/${finding.locale}/${finding.key || '-'}: ${finding.message}`);
	}
}

function main(argv = process.argv.slice(2), root = PROJECT_ROOT) {
	let options;
	try {
		options = parseArguments(argv);
	} catch (error) {
		console.error(error.message);
		return 2;
	}

	try {
		const report = validateTranslations(options.locales, root);
		if (options.format === 'json') {
			console.log(JSON.stringify(report, null, 2));
		} else {
			printHumanReport(report);
		}
		return report.passed ? 0 : 1;
	} catch (error) {
		if (options.format === 'json') {
			console.log(
				JSON.stringify({
					schemaVersion: REPORT_SCHEMA_VERSION,
					status: 'ERROR',
					passed: false,
					message: error.message,
				})
			);
		} else {
			console.error(`i18n validation could not run: ${error.message}`);
		}
		return 2;
	}
}

if (require.main === module) {
	process.exitCode = main();
}

module.exports = {
	checkEmpty,
	checkEncoding,
	checkKeyParity,
	checkPlaceholders,
	checkSchema,
	createReport,
	main,
	parseArguments,
	validateTranslations,
};
