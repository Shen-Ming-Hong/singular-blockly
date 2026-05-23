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
} from './editorThemeSurfaceContractUtils';

const TXT_VIRTUAL_CONTROL_TOKEN_ASSIGNMENT = /--txt-virtual-controls-[\w-]+\s*:/i;

describe('Editor theme surface contract: TXT virtual controls', () => {
	it('does not assign TXT virtual controls base tokens from host vscode light/dark selectors', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const hostThemeBlocks = collectCssRuleBlocks(css, [/body\.vscode-light/, /body\.vscode-dark/]);

		assertNoPatterns(
			hostThemeBlocks,
			[TXT_VIRTUAL_CONTROL_TOKEN_ASSIGNMENT],
			'TXT virtual controls light/dark token ownership'
		);
	});

	it('uses editor-owned scrollbar tokens for TXT virtual controls in backup preview canvas', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const previewCanvasBlocks = getCssRuleBlocks(css, /body\.preview-mode\s+\.txt-preview-canvas(?:\b|:|::)/).join('\n');

		assert.match(
			previewCanvasBlocks,
			/scrollbar-color\s*:\s*var\(--editor-scrollbar-thumb\)\s+var\(--editor-scrollbar-track\)/,
			'Firefox scrollbar colors must follow the editor theme, not the VS Code host theme'
		);
		assert.match(
			previewCanvasBlocks,
			/::-webkit-scrollbar-track[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-track\)/,
			'WebKit scrollbar track must follow the editor theme'
		);
		assert.match(
			previewCanvasBlocks,
			/::-webkit-scrollbar-thumb[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-thumb\)/,
			'WebKit scrollbar thumb must follow the editor theme'
		);
		assert.match(
			previewCanvasBlocks,
			/::-webkit-scrollbar-thumb:hover[\s\S]*background(?:-color)?\s*:\s*var\(--editor-scrollbar-thumb-hover\)/,
			'WebKit scrollbar hover thumb must follow the editor theme'
		);
	});
});
