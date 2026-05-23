/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import {
	assertNoWebViewReloadAntipatterns,
	assertNoPatterns,
	collectCssRuleBlocks,
	extractSourceBetween,
	readWorkspaceFile,
} from './editorThemeSurfaceContractUtils';

const PREVIEW_CHROME_SELECTOR_PATTERNS = [
	/\.preview-info\b/,
	/\.preview-controls\b/,
	/\.preview-badge\b/,
	/\.preview-blockly-area\b/,
	/\.board-warning\b/,
];

const PREVIEW_CHROME_FIXED_THEME_PATTERNS = [
	/background(?:-color)?\s*:\s*rgba\(\s*255\s*,\s*255\s*,\s*255/i,
	/background(?:-color)?\s*:\s*rgba\(\s*50\s*,\s*50\s*,\s*50/i,
	/(?:background(?:-color)?|color|border(?:-color)?)\s*:\s*#(?:333|444444|555555|f0f0f0|e0e0e0|3f51b5|5c6bc0|ffc107|212529|e0a800)\b/i,
];

describe('Editor theme backup preview contract', () => {
	it('initializes backup preview with editor theme ownership classes, not VS Code host theme classes', () => {
		const html = readWorkspaceFile('media/html/blocklyPreview.html');
		const bodyTag = html.match(/<body\b[^>]*>/i)?.[0] || '';
		assert(bodyTag, 'backup preview body tag must exist');
		assert.match(bodyTag, /class=["'][^"']*theme-\{theme\}[^"']*preview-mode[^"']*["']/);
		assertNoPatterns(bodyTag, [/vscode-(?:light|dark|high-contrast)/i], 'backup preview body tag');
	});

	it('keeps backup preview chrome and board warnings on editor-owned tokens', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const previewChromeBlocks = collectCssRuleBlocks(css, PREVIEW_CHROME_SELECTOR_PATTERNS);

		assertNoPatterns(previewChromeBlocks, PREVIEW_CHROME_FIXED_THEME_PATTERNS, 'backup preview chrome styles');
		assert.match(previewChromeBlocks, /\.preview-info\s*\{[\s\S]*background-color\s*:\s*var\(--editor-card-bg\)/);
		assert.match(previewChromeBlocks, /\.preview-info\s*\{[\s\S]*color\s*:\s*var\(--editor-card-fg\)/);
		assert.match(previewChromeBlocks, /\.preview-controls\s*\{[\s\S]*background-color\s*:\s*var\(--editor-card-bg\)/);
		assert.match(previewChromeBlocks, /\.preview-badge\s*\{[\s\S]*background-color\s*:\s*var\(--editor-notice-bg\)/);
		assert.match(previewChromeBlocks, /\.board-warning\s*\{[\s\S]*background-color\s*:\s*var\(--editor-warning-bg\)/);
	});

	it('renders preview board warnings through CSS classes instead of inline fixed colors', () => {
		const source = readWorkspaceFile('media/js/blocklyPreview.js');
		assert(source.includes("warningEl.className = 'board-warning';"));
		assert(!/warningEl\.style\.cssText/.test(source), 'backup preview board warnings must not use inline fixed-color styles');
	});

	it('updates backup preview theme at runtime without reload assumptions', () => {
		const source = readWorkspaceFile('media/js/blocklyPreview.js');
		const updateThemeBody = extractSourceBetween(
			source,
			'function updateTheme(theme',
			'/**\n * 從工作區狀態',
			'blocklyPreview.js updateTheme(theme) contract slice'
		);

		assert(updateThemeBody.includes("document.body.classList.remove('theme-light', 'theme-dark')"));
		assert(updateThemeBody.includes('document.body.classList.add(`theme-${theme}`)'));
		assert(updateThemeBody.includes('workspace.setTheme(blocklyTheme)'));
		assert(updateThemeBody.includes('renderTxtPreviewControls()'));
		assertNoWebViewReloadAntipatterns(updateThemeBody, 'backup preview updateTheme(theme)');
	});
});
