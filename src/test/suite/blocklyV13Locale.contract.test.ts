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

function read(relativePath: string): string {
	return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8');
}

suite('Blockly 13 locale contract', () => {
	test('all fifteen project locales have packaged Blockly core scripts', () => {
		const locales = fs
			.readdirSync(path.join(PROJECT_ROOT, 'media', 'locales'))
			.filter(locale => fs.existsSync(path.join(PROJECT_ROOT, 'media', 'locales', locale, 'messages.js')))
			.sort();
		assert.strictEqual(locales.length, 15);
		for (const locale of locales) {
			assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'node_modules', 'blockly', 'msg', `${locale}.js`)), locale);
		}
	});

	test('editor and preview snapshot core messages before project overrides', () => {
		for (const target of ['media/html/blocklyEdit.html', 'media/html/blocklyPreview.html']) {
			const html = read(target);
			const coreIndex = html.indexOf('<script src="{msgJsUri}"></script>');
			const snapshotIndex = html.indexOf('window.BLOCKLY_INITIAL_CORE_MESSAGES');
			const projectIndex = html.indexOf('<script src="{langJsUri}"></script>');
			const runtimeIndex = html.indexOf('<script src="{blocklyRuntimeUri}"></script>');
			assert.ok(coreIndex < snapshotIndex && snapshotIndex < projectIndex && projectIndex < runtimeIndex, target);
			assert.doesNotMatch(html, /Blockly\.getMainWorkspace\(/, target);
		}
	});

	test('runtime applies core before project messages and clears prior core keys for A to B to A', async () => {
		const localeData: Record<string, Record<string, string>> = {
			en: { CORE_ARIA: 'English ARIA', CORE_SHORTCUT: 'English shortcut' },
			de: { CORE_ARIA: 'Deutsche ARIA', CORE_SHORTCUT: 'Deutsche Tastenkombination' },
		};
		const listeners = new Map<string, Function[]>();
		const windowObject: Record<string, unknown> = {
			BLOCKLY_RUNTIME_CONFIG: { mode: 'edit', mediaUri: 'local-media/', localeUris: { en: 'en.js', de: 'de.js' } },
			BLOCKLY_INITIAL_CORE_MESSAGES: { ...localeData.en },
			languageManager: { currentLanguage: 'en' },
			addEventListener: (name: string, callback: Function) => listeners.set(name, [...(listeners.get(name) || []), callback]),
			dispatchEvent: () => true,
		};
		const Blockly = {
			Msg: { ...localeData.en, PROJECT: 'English project' },
			inject: () => ({ dispose() {} }),
			setLocale: (messages: Record<string, string>) => Object.assign(Blockly.Msg, messages),
			serialization: { workspaces: { save: () => ({}), load: () => undefined } },
			dialog: { setPrompt: () => undefined, setConfirm: () => undefined },
		};
		const document = {
			activeElement: null,
			createElement: () => {
				const scriptListeners = new Map<string, Function>();
				return {
					async: false,
					src: '',
					dataset: {} as Record<string, string>,
					addEventListener: (name: string, callback: Function) => scriptListeners.set(name, callback),
					remove: () => undefined,
					fire: (name: string) => scriptListeners.get(name)?.(),
				};
			},
			head: {
				appendChild: (script: { dataset: Record<string, string>; fire: (name: string) => void }) => {
					Object.assign(Blockly.Msg, localeData[script.dataset.blocklyCoreLocale]);
					queueMicrotask(() => script.fire('load'));
				},
			},
		};
		windowObject.window = windowObject;
		vm.runInNewContext(read('media/js/blocklyRuntime.js'), {
			window: windowObject,
			document,
			Blockly,
			CustomEvent: class {
				constructor(public type: string, public init: unknown) {}
			},
			console,
			Map,
			Set,
			Object,
			Promise,
		});
		const runtime = windowObject.blocklyRuntime as {
			applyLocale: (locale: string, project: Record<string, string>) => Promise<boolean>;
		};

		assert.strictEqual(await runtime.applyLocale('de', { PROJECT: 'Deutsches Projekt' }), true);
		assert.deepStrictEqual(JSON.parse(JSON.stringify(Blockly.Msg)), {
			PROJECT: 'Deutsches Projekt',
			CORE_ARIA: 'Deutsche ARIA',
			CORE_SHORTCUT: 'Deutsche Tastenkombination',
		});
		assert.strictEqual(await runtime.applyLocale('en', { PROJECT: 'English project' }), true);
		assert.deepStrictEqual(JSON.parse(JSON.stringify(Blockly.Msg)), {
			PROJECT: 'English project',
			CORE_ARIA: 'English ARIA',
			CORE_SHORTCUT: 'English shortcut',
		});
	});
});
