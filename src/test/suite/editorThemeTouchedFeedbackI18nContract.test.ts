/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { getHtmlElementTag, readWorkspaceFile } from './editorThemeSurfaceContractUtils';

describe('Editor theme touched feedback i18n contract', () => {
	it('keeps touched feedback text locale-backed while preserving base feedback roles/classes', () => {
		const html = readWorkspaceFile('media/html/blocklyEdit.html');
		const source = readWorkspaceFile('media/js/blocklyEdit.js');

		assert.match(getHtmlElementTag(html, 'txtConnectionStatus'), /class=["']txt-connection-status["']/);
		assert.match(source, /getMessage\(\s*'TXT_TESTING'/);
		assert.match(source, /getMessage\(\s*'TXT_SSH_CONFIRM_HINT'/);
		assert.match(source, /getMessage\(\s*'TXT_SSH_SETUP_DONE'/);
		assert.match(source, /getMessage\(\s*'SAMPLE_BROWSER_OFFLINE_NOTICE'/);
		assert.match(source, /getMessage\(\s*'SAMPLE_BROWSER_EMPTY'/);

		assert(!/sshHint\.style\.color\s*=\s*['"]var\(--vscode-/.test(source), 'TXT SSH hint must not use inline host-token color overrides');
		assert(!/statusEl\.className\s*=\s*''/.test(source), 'TXT connection status must not drop the base feedback class while showing progress text');
		assert(!/statusEl\.className\s*=\s*message\.success\s*\?/.test(source), 'TXT connection status must preserve the base feedback class when applying success/error roles');
	});
});
