/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import {
	assertNoWebViewReloadAntipatterns,
	extractSourceBetween,
	readWorkspaceFile,
} from './editorThemeSurfaceContractUtils';

describe('Editor theme runtime switch contract', () => {
	it('updates body theme classes and Blockly theme without WebView reload assumptions', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const updateThemeBody = extractSourceBetween(
			source,
			'function updateTheme(theme)',
			'// 監聽語言變更事件',
			'blocklyEdit.js updateTheme(theme) contract slice'
		);

		assert(updateThemeBody.includes("document.body.classList.remove('theme-light', 'theme-dark')"));
		assert(updateThemeBody.includes('document.body.classList.add(`theme-${theme}`)'));
		assert(updateThemeBody.includes('Blockly.getMainWorkspace().setTheme(window.SingularBlocklyDarkTheme)'));
		assert(updateThemeBody.includes('Blockly.getMainWorkspace().setTheme(window.SingularBlocklyTheme)'));
		assert(updateThemeBody.includes('refreshTxtVirtualControlsUI()'));
		assertNoWebViewReloadAntipatterns(updateThemeBody, 'blocklyEdit.js updateTheme(theme)');
	});

	it('persists toolbar theme toggles through postMessage without rebuilding the WebView', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const toggleThemeBody = extractSourceBetween(
			source,
			'function toggleTheme()',
			'// 重新整理程式碼處理函數',
			'blocklyEdit.js toggleTheme() contract slice'
		);

		assert(toggleThemeBody.includes('updateTheme(currentTheme)'));
		assert(toggleThemeBody.includes("command: 'updateTheme'"));
		assertNoWebViewReloadAntipatterns(toggleThemeBody, 'blocklyEdit.js toggleTheme()');
	});
});
