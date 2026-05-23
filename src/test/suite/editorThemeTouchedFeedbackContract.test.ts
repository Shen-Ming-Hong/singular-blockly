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

const LOW_CONTRAST_LITERAL_PATTERNS = [
	/(?:color|background(?:-color)?|border(?:-color)?)\s*:\s*#888\b/i,
	/(?:color|background(?:-color)?|border(?:-color)?)\s*:\s*#888888\b/i,
];

const TOUCHED_FEEDBACK_SELECTOR_PATTERNS = [
	/\.txt-connection-status\b/,
	/\.txt-connection-hint\b/,
	/\.sample-offline-notice\b/,
	/\.sample-spinner\b/,
	/\.sample-empty-notice\b/,
	/\.txt-virtual-controls-canvas-hint\b/,
	/\.txt-virtual-controls-empty-state\b/,
	/\.txt-virtual-controls-inspector-empty\b/,
	/\.txt-preview-warning-item\b/,
	/#txtVirtualControlsToggle\.has-invalid-references\b/,
];

describe('Editor theme touched feedback contract', () => {
	it('keeps touched feedback readable through editor-owned tokens instead of fixed low-contrast colors', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const touchedFeedbackBlocks = collectCssRuleBlocks(css, TOUCHED_FEEDBACK_SELECTOR_PATTERNS);

		assertNoPatterns(touchedFeedbackBlocks, LOW_CONTRAST_LITERAL_PATTERNS, 'touched feedback styles');

		const txtConnectionStatusBlocks = getCssRuleBlocks(css, /\.txt-connection-status\b/).join('\n');
		assert.match(
			txtConnectionStatusBlocks,
			/color\s*:\s*var\(--editor-description-fg\)/,
			'TXT connection base status must keep a readable editor-owned description color before success/error classes apply'
		);
	});
});
