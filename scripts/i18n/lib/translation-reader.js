/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const ts = require('typescript');

const { PROJECT_ROOT, messageFile } = require('./translation-config');

function isLoadMessagesCall(expression) {
	if (!ts.isCallExpression(expression) || expression.arguments.length !== 2) {
		return false;
	}
	const loadMessages = expression.expression;
	if (!ts.isPropertyAccessExpression(loadMessages) || loadMessages.name.text !== 'loadMessages') {
		return false;
	}
	const languageManager = loadMessages.expression;
	return (
		ts.isPropertyAccessExpression(languageManager) &&
		languageManager.name.text === 'languageManager' &&
		ts.isIdentifier(languageManager.expression) &&
		languageManager.expression.text === 'window'
	);
}

function readPropertyName(name) {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}
	throw new Error('Translation keys must be static identifiers or literals');
}

function readStaticValue(node) {
	if (ts.isParenthesizedExpression(node)) {
		return readStaticValue(node.expression);
	}
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text;
	}
	if (ts.isNumericLiteral(node)) {
		return Number(node.text);
	}
	if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	}
	if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	}
	if (node.kind === ts.SyntaxKind.NullKeyword) {
		return null;
	}
	if (ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(node.operator)) {
		const value = readStaticValue(node.operand);
		if (typeof value !== 'number') {
			throw new Error('Unary translation values must be numeric literals');
		}
		return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
	}
	if (ts.isArrayLiteralExpression(node)) {
		return node.elements.map(readStaticValue);
	}
	if (ts.isObjectLiteralExpression(node)) {
		const value = Object.create(null);
		for (const property of node.properties) {
			if (!ts.isPropertyAssignment(property)) {
				throw new Error('Translation objects may contain only static property assignments');
			}
			const key = readPropertyName(property.name);
			if (Object.hasOwn(value, key)) {
				throw new Error(`Duplicate translation key: ${key}`);
			}
			value[key] = readStaticValue(property.initializer);
		}
		return value;
	}
	throw new Error(`Unsupported executable translation expression: ${ts.SyntaxKind[node.kind]}`);
}

function parseMessages(content, filePath, expectedLocale) {
	const diagnostics =
		ts.transpileModule(content, {
			compilerOptions: { allowJs: true, target: ts.ScriptTarget.ES2023 },
			fileName: filePath,
			reportDiagnostics: true,
		}).diagnostics || [];
	const syntaxError = diagnostics.find(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
	if (syntaxError) {
		throw new Error(`Unable to parse translation file: ${ts.flattenDiagnosticMessageText(syntaxError.messageText, '\n')}`);
	}
	const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.ES2023, false, ts.ScriptKind.JS);
	if (source.statements.length !== 1 || !ts.isExpressionStatement(source.statements[0])) {
		throw new Error('Translation file must contain exactly one loadMessages call');
	}
	const call = source.statements[0].expression;
	if (!isLoadMessagesCall(call)) {
		throw new Error('Translation file must call window.languageManager.loadMessages exactly once');
	}
	const [localeNode, messagesNode] = call.arguments;
	const locale = readStaticValue(localeNode);
	if (typeof locale !== 'string') {
		throw new Error('Locale declaration must be a string literal');
	}
	if (expectedLocale && locale !== expectedLocale) {
		throw new Error(`Locale declaration mismatch: expected ${expectedLocale}, received ${locale}`);
	}
	return readStaticValue(messagesNode);
}

function loadMessagesPath(filePath, expectedLocale) {
	if (!fs.existsSync(filePath)) {
		return null;
	}
	return parseMessages(fs.readFileSync(filePath, 'utf8'), filePath, expectedLocale);
}

function loadMessagesFile(locale, root = PROJECT_ROOT) {
	return loadMessagesPath(messageFile(locale, root), locale);
}

function readAllTranslations(languages) {
	const result = {};
	languages.forEach(lang => {
		const obj = loadMessagesFile(lang);
		result[lang] = obj || {};
	});
	return result;
}

module.exports = { loadMessagesFile, loadMessagesPath, parseMessages, readAllTranslations };
