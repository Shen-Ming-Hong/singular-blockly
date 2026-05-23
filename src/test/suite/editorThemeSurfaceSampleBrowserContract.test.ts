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
	EDITOR_SURFACE_FORBIDDEN_HOST_BASE_TOKENS,
	readWorkspaceFile,
} from './editorThemeSurfaceContractUtils';

const SAMPLE_BROWSER_SELECTOR_PATTERNS = [
	/\.sample-modal-content/,
	/\.sample-offline-notice/,
	/\.sample-spinner/,
	/\.sample-category-header/,
	/\.sample-card(?:\b|:)/,
	/\.sample-card-description/,
	/\.sample-card-load-btn/,
	/\.sample-empty-notice/,
];

describe('Editor theme surface contract: Sample Browser', () => {
	it('keeps card, category, notice, loading and empty-state selectors off host base tokens', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const sampleBrowserRules = collectCssRuleBlocks(css, SAMPLE_BROWSER_SELECTOR_PATTERNS);

		assert(sampleBrowserRules.includes('.sample-card'), 'Sample Browser card selector should be covered by this contract');
		assert(sampleBrowserRules.includes('.sample-offline-notice'), 'Sample Browser offline notice selector should be covered by this contract');
		assertNoPatterns(
			sampleBrowserRules,
			EDITOR_SURFACE_FORBIDDEN_HOST_BASE_TOKENS,
			'Sample Browser editor-owned selectors'
		);
	});
});
