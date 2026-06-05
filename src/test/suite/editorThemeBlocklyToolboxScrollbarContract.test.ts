/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import {
	assertNoPatterns,
	collectCssRuleBlocks,
	getCssRuleBlocks,
	readWorkspaceFile,
	stripCssComments,
} from './editorThemeSurfaceContractUtils';

const SCROLLABLE_EDITOR_SURFACES = [
	'.board-dropdown',
	'.language-dropdown',
	'body.preview-mode .txt-preview-canvas',
	'#txtTestPanelDialog .modal-body',
	'.modal',
	'.sample-modal-content .modal-body',
	'#functionSearchModal',
	'.backup-list-container',
	'.modal-content .search-results-container',
	'.search-history-container',
	'.blocklyToolbox',
	'.blocklyToolboxCategoryGroup',
	'.blocklyToolboxDiv',
];

describe('Editor theme contract: scrollbars', () => {
	it('assigns shared scrollbar tokens from editor light/dark themes', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const lightThemeBlocks = collectCssRuleBlocks(css, [/body\.theme-light/]);
		const darkThemeBlocks = collectCssRuleBlocks(css, [/body\.theme-dark/]);

		for (const blocks of [lightThemeBlocks, darkThemeBlocks]) {
			assert.match(blocks, /--editor-scrollbar-track\s*:/);
			assert.match(blocks, /--editor-scrollbar-thumb\s*:/);
			assert.match(blocks, /--editor-scrollbar-thumb-hover\s*:/);
			assert.match(blocks, /--editor-scrollbar-track-shadow\s*:/);
		}
	});

	it('does not assign editor scrollbar tokens from host VS Code light/dark themes', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const hostThemeBlocks = collectCssRuleBlocks(css, [/body\.vscode-light/, /body\.vscode-dark/]);

		assertNoPatterns(
			hostThemeBlocks,
			[/--editor-scrollbar-[\w-]+\s*:/i],
			'editor scrollbar token ownership'
		);
	});

	it('styles all scrollable editor surfaces with shared editor-owned scrollbar rules', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const scrollbarBlocks = collectScrollbarRenderingBlocks(css);
		const overflowSelectors = collectOverflowScrollbarSelectors(css);

		for (const selector of [...SCROLLABLE_EDITOR_SURFACES, ...overflowSelectors]) {
			assert(
				scrollbarBlocks.includes(selector),
				`shared scrollbar rules must include ${selector}`
			);
		}

		assert.match(
			scrollbarBlocks,
			/scrollbar-color\s*:\s*var\(--editor-scrollbar-thumb\)\s+var\(--editor-scrollbar-track\)/,
			'Firefox scrollbar colors must follow the Blockly editor theme'
		);
		assert.match(
			scrollbarBlocks,
			/::-webkit-scrollbar-track[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-track\)/,
			'WebKit scrollbar track must follow the Blockly editor theme'
		);
		assert.match(
			scrollbarBlocks,
			/::-webkit-scrollbar-thumb[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-thumb\)/,
			'WebKit scrollbar thumb must follow the Blockly editor theme'
		);
		assert.match(
			scrollbarBlocks,
			/::-webkit-scrollbar-thumb:hover[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-thumb-hover\)/,
			'WebKit scrollbar hover thumb must follow the Blockly editor theme'
		);
	});

	it('styles Blockly flyout SVG scrollbars with the same shared editor tokens', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const flyoutBlocks = getCssRuleBlocks(css, /\.blocklyFlyout\s+\.blocklyScrollbar/).join('\n');

		assert.match(
			flyoutBlocks,
			/\.blocklyScrollbarHandle[\s\S]*fill\s*:\s*var\(--editor-scrollbar-thumb\)/,
			'Blockly flyout SVG scrollbar handle must follow the Blockly editor theme'
		);
		assert.match(
			flyoutBlocks,
			/\.blocklyScrollbarHandle:hover[\s\S]*fill\s*:\s*var\(--editor-scrollbar-thumb-hover\)/,
			'Blockly flyout SVG scrollbar hover handle must follow the Blockly editor theme'
		);
	});

	it('keeps rendered scrollbar rules free of component-specific tokens and hard-coded colors', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const scrollbarBlocks = collectScrollbarRenderingBlocks(css);

		assertNoPatterns(
			css,
			[/--blockly-toolbox-scrollbar-[\w-]+/i],
			'component-specific scrollbar tokens'
		);
		assertNoPatterns(
			scrollbarBlocks,
			[/#[0-9a-f]{3,8}\b/i, /rgba?\(/i, /--vscode-[\w-]+/i],
			'rendered scrollbar rules'
		);
		assert.strictEqual(
			getCssRuleBlocks(css, /body\.theme-dark[\s\S]*scrollbar/i).length,
			0,
			'individual dark-theme scrollbar overrides should be replaced by shared theme tokens'
		);
	});
});

function collectScrollbarRenderingBlocks(source: string): string {
	const css = stripCssComments(source);
	const blocks: string[] = [];
	const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
	let match: RegExpExecArray | null;

	while ((match = rulePattern.exec(css)) !== null) {
		const selector = match[1].trim();
		const body = match[2];
		const isRenderedScrollbarRule =
			/scrollbar/i.test(selector) ||
			/\bscrollbar-(?:color|width)\s*:/.test(body);

		if (isRenderedScrollbarRule) {
			blocks.push(`${selector} {${body}}`);
		}
	}

	return blocks.join('\n');
}

function collectOverflowScrollbarSelectors(source: string): string[] {
	const css = stripCssComments(source);
	const selectors = new Set<string>();
	const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
	let match: RegExpExecArray | null;

	while ((match = rulePattern.exec(css)) !== null) {
		const selector = match[1].trim();
		const body = match[2];
		if (/\boverflow(?:-[xy])?\s*:\s*(?:auto|scroll)\b/.test(body)) {
			for (const item of selector.split(',')) {
				selectors.add(item.trim());
			}
		}
	}

	return [...selectors].sort();
}
