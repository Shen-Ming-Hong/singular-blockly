/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { readWorkspaceFile } from './editorThemeSurfaceContractUtils';

// 編輯器變窄時，右上角浮動工具列會蓋住積木清單最上面的積木；清單改用避開工具列的 flyout。
describe('Blockly editor flyout avoids the floating toolbar', () => {
	const source = readWorkspaceFile('media/js/blocklyEdit.js');

	it('registers a vertical flyout that shifts contents below the toolbar', () => {
		assert.match(source, /class SingularVerticalFlyout extends Blockly\.VerticalFlyout/);
		assert.match(
			source,
			/Blockly\.registry\.register\(\s*Blockly\.registry\.Type\.FLYOUTS_VERTICAL_TOOLBOX,\s*'singularVerticalFlyout',\s*SingularVerticalFlyout\s*\)/
		);
		assert.match(source, /document\.querySelector\('\.controls-container'\)/);
		assert.match(source, /item\.getElement\(\)\.moveBy\(0, this\.toolbarInset_\)/);
	});

	it('keeps the shifted list fully scrollable', () => {
		assert.match(source, /metricsManager\.getScrollMetrics = /);
		assert.match(source, /metrics\.height \+= /);
	});

	it('uses the flyout for the main editor workspace', () => {
		assert.match(source, /plugins: \{ flyoutsVerticalToolbox: 'singularVerticalFlyout' \}/);
	});
});
