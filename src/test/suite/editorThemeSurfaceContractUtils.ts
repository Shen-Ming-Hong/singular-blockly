/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

export const REPOSITORY_ROOT = findRepositoryRoot(__dirname);

export const HOST_TOKEN_ALLOWLIST_PATTERNS: RegExp[] = [
	/^--vscode-focusBorder$/,
	/^--vscode-contrast(?:Active)?Border$/,
	/^--vscode-font-family$/,
	/^--vscode-editor-font-family$/,
	/^--vscode-editor-font-weight$/,
	/^--vscode-editor-font-size$/,
];

export const HIGH_CONTRAST_SELECTOR_PATTERN = /body\.vscode-high-contrast(?:-light)?|forced-colors:\s*active/i;

export const HOST_THEMED_STANDALONE_FILES = new Set(['media/css/platformioDiagnostic.css']);

export const EDITOR_SURFACE_FORBIDDEN_HOST_BASE_TOKENS: RegExp[] = [
	/var\(--vscode-(?:editor|sideBar|panel|input|list|badge)-[^)]+\)/i,
	/var\(--vscode-inputValidation-(?:warning|error)(?:Background|Foreground|Border)[^)]*\)/i,
];

export function readWorkspaceFile(relativePath: string): string {
	return fs.readFileSync(path.join(REPOSITORY_ROOT, relativePath), 'utf8');
}

export function stripCssComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

export function normalizeWhitespace(source: string): string {
	return source.replace(/\s+/g, ' ').trim();
}

export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getHtmlElementTag(source: string, id: string): string {
	const pattern = new RegExp(`<[^>]+\\bid=["']${escapeRegExp(id)}["'][^>]*>`, 'i');
	const match = source.match(pattern);
	if (!match) {
		throw new Error(`找不到 HTML element id: ${id}`);
	}
	return match[0];
}

export function getCssRuleBlocks(source: string, selectorPattern: RegExp): string[] {
	const css = stripCssComments(source);
	const blocks: string[] = [];
	const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
	let match: RegExpExecArray | null;
	while ((match = rulePattern.exec(css)) !== null) {
		const selector = match[1].trim();
		if (selectorPattern.test(selector)) {
			blocks.push(`${selector} {${match[2]}}`);
		}
		selectorPattern.lastIndex = 0;
	}
	return blocks;
}

export function collectCssRuleBlocks(source: string, selectorPatterns: RegExp[]): string {
	return selectorPatterns.flatMap(pattern => getCssRuleBlocks(source, pattern)).join('\n');
}

export function extractBalancedCssBlock(source: string, startPattern: RegExp, context: string): string {
	const css = stripCssComments(source);
	startPattern.lastIndex = 0;
	const match = startPattern.exec(css);
	if (!match) {
		throw new Error(`${context} 找不到 CSS block 起始 pattern: ${startPattern}`);
	}

	const openBraceIndex = css.indexOf('{', match.index);
	if (openBraceIndex < 0) {
		throw new Error(`${context} 找不到 CSS block 起始大括號`);
	}

	let depth = 0;
	for (let index = openBraceIndex; index < css.length; index++) {
		const character = css[index];
		if (character === '{') {
			depth++;
		} else if (character === '}') {
			depth--;
			if (depth === 0) {
				return css.slice(match.index, index + 1);
			}
		}
	}

	throw new Error(`${context} 找不到 CSS block 結束大括號`);
}

export function assertNoPatterns(source: string, forbiddenPatterns: RegExp[], context: string): void {
	for (const pattern of forbiddenPatterns) {
		pattern.lastIndex = 0;
		if (pattern.test(source)) {
			throw new Error(`${context} 含有禁止 pattern: ${pattern}`);
		}
	}
}

export function extractSourceBetween(source: string, startMarker: string, endMarker: string, context: string): string {
	const start = source.indexOf(startMarker);
	if (start < 0) {
		throw new Error(`${context} 找不到起始 marker: ${startMarker}`);
	}

	const end = source.indexOf(endMarker, start + startMarker.length);
	if (end <= start) {
		throw new Error(`${context} 找不到結束 marker: ${endMarker}`);
	}

	return source.slice(start, end);
}

export function assertNoWebViewReloadAntipatterns(source: string, context: string): void {
	assertNoPatterns(source, [/webview\.html|location\.reload|window\.location/], context);
}

export function extractVscodeTokens(source: string): string[] {
	const tokens = new Set<string>();
	const tokenPattern = /--vscode-[a-zA-Z0-9-]+/g;
	let match: RegExpExecArray | null;
	while ((match = tokenPattern.exec(source)) !== null) {
		tokens.add(match[0]);
	}
	return [...tokens].sort();
}

export function isAllowedHostToken(token: string, sourceContext: string, filePath?: string): boolean {
	if (filePath && HOST_THEMED_STANDALONE_FILES.has(filePath)) {
		return true;
	}

	if (HOST_TOKEN_ALLOWLIST_PATTERNS.some(pattern => pattern.test(token))) {
		return true;
	}

	if (HIGH_CONTRAST_SELECTOR_PATTERN.test(sourceContext)) {
		return true;
	}

	return false;
}

export function findDisallowedHostTokens(source: string, options?: { filePath?: string; sourceContext?: string }): string[] {
	const sourceContext = options?.sourceContext ?? source;
	return extractVscodeTokens(source).filter(token => !isAllowedHostToken(token, sourceContext, options?.filePath));
}

export function assertOnlyAllowedHostTokens(source: string, context: string, options?: { filePath?: string; sourceContext?: string }): void {
	const disallowedTokens = findDisallowedHostTokens(source, options);
	if (disallowedTokens.length > 0) {
		throw new Error(`${context} 含有未列入 allowlist 的 host theme token: ${disallowedTokens.join(', ')}`);
	}
}

function findRepositoryRoot(startDirectory: string): string {
	let current = startDirectory;
	while (true) {
		if (fs.existsSync(path.join(current, 'package.json')) && fs.existsSync(path.join(current, 'media'))) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			throw new Error(`無法從 ${startDirectory} 找到 repository root`);
		}
		current = parent;
	}
}
