/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import * as path from 'path';
import {
	assertNoWebViewReloadAntipatterns,
	extractSourceBetween,
	REPOSITORY_ROOT,
	readWorkspaceFile,
} from './editorThemeSurfaceContractUtils';

interface ClassListLike {
	contains(className: string): boolean;
}

interface TxtVirtualControlsContrastApi {
	getThemeMode(body?: { classList?: ClassListLike }): 'light' | 'dark' | 'high-contrast';
}

describe('Editor theme TXT virtual controls switch contract', () => {
	it('refreshes TXT virtual controls during runtime theme switches without reload assumptions', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const updateThemeBody = extractSourceBetween(
			source,
			'function updateTheme(theme)',
			'// 監聽語言變更事件',
			'blocklyEdit.js updateTheme(theme) contract slice'
		);

		assert(updateThemeBody.includes('refreshTxtVirtualControlsUI()'));
		assertNoWebViewReloadAntipatterns(updateThemeBody, 'blocklyEdit.js TXT virtual controls updateTheme(theme)');
	});

	it('prefers editor theme classes over host theme classes for TXT virtual controls fallback mode', () => {
		const helperPath = path.join(REPOSITORY_ROOT, 'media/js/txtVirtualControlsContrast.js');
		delete require.cache[require.resolve(helperPath)];
		const contrast = require(helperPath) as TxtVirtualControlsContrastApi;
		const mixedThemeBody = {
			classList: {
				contains: (className: string) => className === 'theme-light' || className === 'vscode-dark',
			},
		};

		assert.strictEqual(contrast.getThemeMode(mixedThemeBody), 'light');
	});
});
