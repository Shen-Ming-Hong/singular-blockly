/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { assertNoWebViewReloadAntipatterns, readWorkspaceFile } from './editorThemeSurfaceContractUtils';

describe('Editor theme main surface switch contract', () => {
	it('handles Extension Host updateTheme messages through the same runtime updateTheme path', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const listenerStart = source.indexOf("window.addEventListener('message'");
		assert(listenerStart >= 0, 'blocklyEdit.js should listen for Extension Host messages');
		const listenerSource = source.slice(listenerStart);

		assert(listenerSource.includes("case 'updateTheme':"), 'Extension Host updateTheme messages should be handled in the WebView');
		assert(listenerSource.includes('updateTheme(currentTheme)'), 'Theme messages should call updateTheme(currentTheme)');
		assertNoWebViewReloadAntipatterns(listenerSource, 'blocklyEdit.js message listener');
	});

	it('keeps loadWorkspace theme updates as a runtime body-class update, not a reload assumption', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const loadWorkspaceStart = source.indexOf('const handleWorkspaceLoadMessage = async message =>');
		const listenerStart = source.indexOf("window.addEventListener('message'", loadWorkspaceStart);
		assert(loadWorkspaceStart >= 0, 'blocklyEdit.js should define handleWorkspaceLoadMessage');
		assert(listenerStart > loadWorkspaceStart, 'message listener should appear after handleWorkspaceLoadMessage');
		const loadWorkspaceSource = source.slice(loadWorkspaceStart, listenerStart);

		assert(loadWorkspaceSource.includes('updateTheme(currentTheme)'));
		assertNoWebViewReloadAntipatterns(loadWorkspaceSource, 'blocklyEdit.js loadWorkspace handler');
	});
});
