/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import {
	findDisallowedHostTokens,
	readWorkspaceFile,
	stripCssComments,
} from './editorThemeSurfaceContractUtils';

const REQUIRED_FORCED_COLORS_SELECTORS = [
	'.preview-info',
	'.preview-controls',
	'.preview-controls #themeToggle',
	'.preview-badge',
	'.board-warning',
	'.txt-connection-modal-content',
	'.txt-connection-input',
	'.sample-card',
	'.sample-offline-notice',
	'.sample-empty-notice',
	'.txt-virtual-controls-panel',
	'.txt-preview-canvas',
	'.txt-virtual-controls-mode-badge',
	'.txt-virtual-control-button',
];

describe('Editor theme high contrast contract', () => {
	it('keeps host theme tokens limited to focus, font, and high-contrast allowlist usage', () => {
		const css = readWorkspaceFile('media/css/blocklyEdit.css');
		const cssWithoutComments = stripCssComments(css);
		const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
		const disallowedUsages: string[] = [];
		let match: RegExpExecArray | null;

		while ((match = rulePattern.exec(cssWithoutComments)) !== null) {
			const block = `${match[1].trim()} {${match[2]}}`;
			const tokens = findDisallowedHostTokens(block, { filePath: 'media/css/blocklyEdit.css', sourceContext: block });
			if (tokens.length > 0) {
				disallowedUsages.push(`${match[1].trim()}: ${tokens.join(', ')}`);
			}
		}

		assert.deepStrictEqual(disallowedUsages, []);
	});

	it('covers P1 editor-owned surfaces in forced-colors overrides', () => {
		const css = stripCssComments(readWorkspaceFile('media/css/blocklyEdit.css'));
		const forcedColorsStart = css.indexOf('@media (forced-colors: active)');
		const forcedColorsEnd = css.indexOf('\n#themeToggle', forcedColorsStart);
		assert(forcedColorsStart >= 0 && forcedColorsEnd > forcedColorsStart, 'forced-colors override block must exist before toolbar styles');
		const forcedColorsBlock = css.slice(forcedColorsStart, forcedColorsEnd);

		for (const selector of REQUIRED_FORCED_COLORS_SELECTORS) {
			assert(
				forcedColorsBlock.includes(selector),
				`forced-colors overrides must include ${selector}`
			);
		}
	});
});
