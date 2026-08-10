/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

type Shortcut = {
	name: string;
	preconditionFn: (workspace: unknown) => boolean;
	callback: (workspace: unknown, event: Event) => boolean;
};

function createHarness() {
	const shortcuts = new Map<string, Shortcut>();
	const messages: unknown[] = [];
	const calls: string[] = [];
	const workspace = { isReadOnly: () => false, isDragging: () => false };
	let suggestionActive = false;
	let compositionActive = false;

	class TestElement {}
	class TestHTMLElement extends TestElement {
		isContentEditable = false;
		matches(_selector: string) {
			return false;
		}
	}
	const activeElement = new TestHTMLElement();

	const context = {
		window: {
			shadowBlockManager: {
				isActive: () => suggestionActive,
				acceptSuggestion: () => calls.push('accept'),
				clearSuggestion: () => calls.push('dismiss'),
				nextSuggestion: () => calls.push('next'),
				prevSuggestion: () => calls.push('previous'),
			},
			isBlocklyTextInputCompositionActive: () => compositionActive,
		},
		document: { activeElement },
		Element: TestElement,
		HTMLElement: TestHTMLElement,
		Blockly: {
			ShortcutRegistry: {
				registry: {
					register: (shortcut: Shortcut) => shortcuts.set(shortcut.name, shortcut),
					unregister: (name: string) => shortcuts.delete(name),
					createSerializedKey: (key: number, modifiers: number[]) => `${modifiers.join('+')}+${key}`,
				},
			},
			utils: {
				KeyCodes: {
					TAB: 9,
					ESC: 27,
					SPACE: 32,
					SHIFT: 16,
					ALT: 18,
					OPEN_SQUARE_BRACKET: 219,
					CLOSE_SQUARE_BRACKET: 221,
					CTRL_CMD: 256,
				},
			},
		},
	};
	vm.runInNewContext(fs.readFileSync(path.join(PROJECT_ROOT, 'media/js/shadowKeyboardHandler.js'), 'utf8'), context, {
		filename: 'shadowKeyboardHandler.js',
	});
	const handler = (context.window as typeof context.window & {
		shadowKeyboardHandler: { init: (api: unknown, provider: () => unknown) => void; dispose: () => void };
	}).shadowKeyboardHandler;
	handler.init({ postMessage: (message: unknown) => messages.push(message) }, () => workspace);

	return {
		shortcuts,
		messages,
		calls,
		workspace,
		activeElement,
		handler,
		setSuggestionActive: (active: boolean) => (suggestionActive = active),
		setCompositionActive: (active: boolean) => (compositionActive = active),
	};
}

function keyboardEvent() {
	return {
		preventDefault() {},
		stopPropagation() {},
		target: null,
		isComposing: false,
	} as unknown as Event;
}

suite('Shadow suggestion ShortcutRegistry contract', () => {
	test('registers and unregisters all app-owned shortcuts without a document keydown listener', () => {
		const source = fs.readFileSync(path.join(PROJECT_ROOT, 'media/js/shadowKeyboardHandler.js'), 'utf8');
		const harness = createHarness();
		assert.strictEqual(harness.shortcuts.size, 5);
		assert.doesNotMatch(source, /document\.addEventListener\(['"]keydown/);
		harness.handler.dispose();
		assert.strictEqual(harness.shortcuts.size, 0);
	});

	test('Tab only accepts an active suggestion on the canonical workspace', () => {
		const harness = createHarness();
		const shortcut = harness.shortcuts.get('singular.shadowSuggestion.accept')!;
		assert.strictEqual(shortcut.preconditionFn(harness.workspace), false);
		harness.setSuggestionActive(true);
		assert.strictEqual(shortcut.preconditionFn({}), false);
		assert.strictEqual(shortcut.preconditionFn(harness.workspace), true);
		assert.strictEqual(shortcut.callback(harness.workspace, keyboardEvent()), true);
		assert.deepStrictEqual(harness.calls, ['accept']);
	});

	test('text editing and IME composition disable suggestion shortcuts', () => {
		const harness = createHarness();
		harness.setSuggestionActive(true);
		const shortcut = harness.shortcuts.get('singular.shadowSuggestion.dismiss')!;
		harness.setCompositionActive(true);
		assert.strictEqual(shortcut.preconditionFn(harness.workspace), false);
		harness.setCompositionActive(false);
		harness.activeElement.matches = selector => selector.includes('input');
		assert.strictEqual(shortcut.preconditionFn(harness.workspace), false);
	});

	test('Escape dismissal cancels the in-flight host request', () => {
		const harness = createHarness();
		harness.setSuggestionActive(true);
		const shortcut = harness.shortcuts.get('singular.shadowSuggestion.dismiss')!;
		assert.strictEqual(shortcut.callback(harness.workspace, keyboardEvent()), true);
		assert.deepStrictEqual(harness.calls, ['dismiss']);
		assert.strictEqual(JSON.stringify(harness.messages), JSON.stringify([{ command: 'cancelShadowSuggestion' }]));
	});
});
