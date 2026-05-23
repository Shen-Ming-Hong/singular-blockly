/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'mocha';
import {
	assertNoPatterns,
	getHtmlElementTag,
	readWorkspaceFile,
} from './editorThemeSurfaceContractUtils';

const TXT_CONNECTION_INPUT_IDS = [
	'txtHostInput',
	'txtUsernameInput',
	'txtPasswordInput',
	'txtRemotePathInput',
];

const INLINE_HOST_INPUT_PATTERNS = [
	/style=["'][^"']*--vscode-input-background/i,
	/style=["'][^"']*--vscode-input-foreground/i,
	/style=["'][^"']*--vscode-input-border/i,
];

describe('Editor theme surface contract: TXT connection modal', () => {
	it('does not use inline VS Code input theme tokens on connection fields', () => {
		const html = readWorkspaceFile('media/html/blocklyEdit.html');

		for (const inputId of TXT_CONNECTION_INPUT_IDS) {
			const inputTag = getHtmlElementTag(html, inputId);
			assertNoPatterns(inputTag, INLINE_HOST_INPUT_PATTERNS, `#${inputId}`);
		}
	});
});
