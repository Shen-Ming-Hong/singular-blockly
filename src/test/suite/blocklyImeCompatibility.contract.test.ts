/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as fs from 'fs';
import { describe, it } from 'mocha';
import * as path from 'path';
import { normalizeWhitespace, readWorkspaceFile, REPOSITORY_ROOT } from './editorThemeSurfaceContractUtils';

describe('Blockly IME keyboard compatibility contract', () => {
	it('uses app-owned IME-safe fields without patching Blockly core prototypes', () => {
		const editorSource = readWorkspaceFile('media/js/blocklyEdit.js');
		const runtimeSource = readWorkspaceFile('media/js/blocklyRuntime.js');
		const blockDirectory = path.join(REPOSITORY_ROOT, 'media', 'blockly', 'blocks');
		const customBlockSources = fs.readdirSync(blockDirectory)
			.filter(file => file.endsWith('.js'))
			.map(file => readWorkspaceFile(`media/blockly/blocks/${file}`));

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
		assert.ok(
			runtimeSource.includes("Blockly.fieldRegistry.unregister('field_input')"),
			'Runtime should replace the public field_input registry entry before registering the IME-safe class'
		);
		assert.ok(
			runtimeSource.includes("Blockly.fieldRegistry.register('field_input', ImeSafeFieldTextInput)"),
			'Built-in JSON field_input definitions should resolve to the IME-safe class'
		);
		assert.strictEqual(
			customBlockSources.reduce(
				(count, source) => count + (source.match(/window\.blocklyRuntime\.createImeSafeFieldTextInput\(/g) || []).length,
				0
			),
			13,
			'All thirteen custom text fields should use the IME-safe factory'
		);
		for (const source of customBlockSources) {
			assert.ok(!source.includes('new Blockly.FieldTextInput'), 'Custom text fields should not bypass the IME-safe factory');
		}
		assert.ok(runtimeSource.includes("event.key === 'Process'"), 'IME detection should recognize browser Process key events');
		assert.ok(
			runtimeSource.includes('event.keyCode === 229'),
			'IME detection should recognize legacy composition keyCode 229 events'
		);
		assert.ok(
			runtimeSource.includes('event.which === 229'),
			'IME detection should recognize legacy composition which 229 events'
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
