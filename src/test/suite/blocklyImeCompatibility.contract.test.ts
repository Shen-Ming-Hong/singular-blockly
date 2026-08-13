/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { normalizeWhitespace, readWorkspaceFile } from './editorThemeSurfaceContractUtils';

describe('Blockly IME keyboard compatibility contract', () => {
	it('uses app-owned IME-safe fields without patching Blockly core prototypes', () => {
		const editorSource = readWorkspaceFile('media/js/blocklyEdit.js');
		const runtimeSource = readWorkspaceFile('media/js/blocklyRuntime.js');
		const functionBlocksSource = readWorkspaceFile('media/blockly/blocks/functions.js');

		assert.ok(
			!editorSource.includes('installBlocklyTextInputImePatch'),
			'WebView must not install a Blockly text-input prototype patch'
		);
		assert.ok(!editorSource.includes('fieldInputPrototype'), 'WebView must not mutate the FieldInput prototype');
		assert.ok(
			runtimeSource.includes('class ImeSafeFieldTextInput extends Blockly.FieldTextInput'),
			'Runtime should own the IME-safe FieldTextInput subclass'
		);
		assert.ok(
			runtimeSource.includes('createImeSafeFieldTextInput,'),
			'Runtime should expose the IME-safe field factory'
		);
		assert.strictEqual(
			(functionBlocksSource.match(/window\.blocklyRuntime\.createImeSafeFieldTextInput\(/g) || []).length,
			2,
			'Function and parameter name fields should both use the IME-safe factory'
		);
		assert.ok(
			!functionBlocksSource.includes('new Blockly.FieldTextInput'),
			'Function name fields should not bypass the IME-safe factory'
		);
		assert.ok(runtimeSource.includes("event.key === 'Process'"), 'IME detection should recognize browser Process key events');
		assert.ok(
			runtimeSource.includes('event.keyCode === 229'),
			'IME detection should recognize legacy composition keyCode 229 events'
		);
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
			source.includes('window.isBlocklyTextInputCompositionActive = () => isBlocklyTextInputComposing;'),
			'ShortcutRegistry preconditions should be able to inspect the current composition state'
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

		assert.ok(source.includes('function shouldIgnoreShortcut(event)'), 'shadow keyboard handler should define an editing-context guard');
		assert.ok(
			source.includes('if (shouldIgnoreShortcut(event)) return false;'),
			'shadow suggestion shortcuts should be disabled while text editing is active'
		);
		assert.ok(
			source.includes('window.shouldBypassBlocklyGlobalShortcut(event)'),
			'shadow suggestion shortcuts should defer to the shared Blockly text-input guard when available'
		);
	});
});
