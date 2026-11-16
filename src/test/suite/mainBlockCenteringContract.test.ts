/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { readWorkspaceFile } from './editorThemeSurfaceContractUtils';

// 開啟編輯器（含 Ctrl+R 重新載入）後，主程式積木要在可見區正中間，不能停在左上角。
describe('Blockly editor centers the main block after opening', () => {
	const source = readWorkspaceFile('media/js/blocklyEdit.js');

	function caseBody(command: string): string {
		const start = source.indexOf(`case '${command}':`);
		assert.ok(start >= 0, `missing case '${command}'`);
		const end = source.indexOf('break;', start);
		return source.slice(start, end);
	}

	it('centers after init, once the language (which may rebuild the workspace) is applied', () => {
		const body = caseBody('init');
		const languageIndex = body.indexOf('applyLanguageUpdate(');
		const centerIndex = body.indexOf('scheduleMainBlockCentering(');
		assert.ok(languageIndex >= 0 && centerIndex > languageIndex);
	});

	it('centers after a backup restore but keeps the view for external file reloads', () => {
		const body = caseBody('loadWorkspace');
		assert.match(body, /if \(!message\.source && !message\.requestId\) \{\s*scheduleMainBlockCentering\(\);/);
	});

	it('centers the board main block, keeps tall blocks top-aligned below the toolbar, and respects a saved TXT view', () => {
		assert.match(source, /const centerMainBlockInView = workspace => \{/);
		assert.match(source, /workspace\.getBlocksByType\(getMainBlockType\(boardId\), false\)/);
		assert.match(source, /document\.querySelector\('\.controls-container'\)/);
		assert.match(source, /if \(blockHeight \+ margin \* 2 > view\.height - topInset\) \{\s*viewTop = blockTop - topInset - margin;/);
		assert.match(source, /isTxtBoardId\(boardId\) && txtVirtualControlsState\.document\?\.canvas\?\.lastViewport/);
		assert.match(source, /workspace\.scroll\(-viewLeft, -viewTop\);/);
	});
});
