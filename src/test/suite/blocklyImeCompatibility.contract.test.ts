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
		// 開發板與語言改用原生 select 後，Esc 由瀏覽器處理；剩下的全域 Esc（關閉對話框）在選字中不動作
		assert.ok(
			normalized.includes("if (event.key !== 'Escape' || event.defaultPrevented || isBlocklyTextInputCompositionEvent(event)) { return; }"),
			'Escape-based dialog handler should skip during IME composition'
		);
	});
});
