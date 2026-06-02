/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { normalizeWhitespace, readWorkspaceFile } from './editorThemeSurfaceContractUtils';

describe('Blockly IME keyboard compatibility contract', () => {
	it('patches Blockly text input key handling to defer to IME composition', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const normalized = normalizeWhitespace(source);

		assert.ok(source.includes('function installBlocklyTextInputImePatch()'), 'WebView should install a Blockly text-input IME patch');
		assert.ok(source.includes('onHtmlInputKeyDown_'), 'IME patch should wrap Blockly field keydown handling');
		assert.ok(
			normalized.includes('if (isBlocklyTextInputCompositionEvent(event)) { return; }'),
			'Blockly text input keydown handling should yield while IME composition is active'
		);
		assert.ok(source.includes("event.key === 'Process'"), 'IME detection should recognize browser Process key events');
		assert.ok(source.includes('event.keyCode === 229'), 'IME detection should recognize legacy composition keyCode 229 events');
	});

	it('bypasses global WebView shortcuts while text inputs or IME composition are active', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const normalized = normalizeWhitespace(source);

		assert.ok(
			source.includes('function shouldBypassGlobalKeyboardShortcut(event)'),
			'WebView should centralize the keyboard shortcut bypass guard'
		);
		assert.ok(
			source.includes('window.shouldBypassBlocklyGlobalShortcut = shouldBypassGlobalKeyboardShortcut;'),
			'shared keyboard guard should be exposed for other WebView helpers'
		);
		assert.ok(
			normalized.includes("document.addEventListener( 'compositionstart'"),
			'WebView should track the start of Blockly text-field composition sessions'
		);
		assert.ok(
			normalized.includes("document.addEventListener( 'compositionend'"),
			'WebView should track the end of Blockly text-field composition sessions'
		);
		assert.ok(
			normalized.includes('if (shouldBypassGlobalKeyboardShortcut(e)) { return; }'),
			'Ctrl/Cmd shortcuts should skip while the user is editing text'
		);
		assert.ok(
			normalized.includes('if (shouldBypassGlobalKeyboardShortcut(event)) { return; }'),
			'Escape-based global handlers should skip while the user is editing text'
		);
	});

	it('keeps shadow suggestion shortcuts from stealing IME keystrokes', () => {
		const source = readWorkspaceFile('media/js/shadowKeyboardHandler.js');
		const normalized = normalizeWhitespace(source);

		assert.ok(source.includes('function shouldIgnoreShortcut(event)'), 'shadow keyboard handler should define an editing-context guard');
		assert.ok(
			normalized.includes('if (shouldIgnoreShortcut(e)) { return; }'),
			'shadow suggestion shortcuts should be disabled while text editing is active'
		);
		assert.ok(
			normalized.includes('window.shouldBypassBlocklyGlobalShortcut(event)'),
			'shadow suggestion shortcuts should defer to the shared Blockly text-input guard when available'
		);
	});
});
