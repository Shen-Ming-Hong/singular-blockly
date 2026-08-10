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

function readLanguageManagerScript(relativePath: string): string {
	const html = read(relativePath);
	const managerIndex = html.indexOf('window.languageManager =');
	const scriptStart = html.lastIndexOf('<script nonce="{nonce}">', managerIndex);
	const contentStart = html.indexOf('>', scriptStart) + 1;
	const scriptEnd = html.indexOf('</script>', managerIndex);
	assert.ok(scriptStart >= 0 && contentStart > scriptStart && scriptEnd > managerIndex, relativePath);
	return html.slice(contentStart, scriptEnd).replace('{previewFileNameJson}', '"preview.json"');
}

function createLanguageManager(
	relativePath: string,
	applyLocale: (locale: string) => Promise<boolean>
): {
	manager: {
		currentLanguage: string;
		appliedLanguage: string;
		messages: Record<string, Record<string, string>>;
		setLanguage(locale: string): Promise<boolean>;
	};
	changedLanguages: string[];
} {
	const changedLanguages: string[] = [];
	const windowObject: Record<string, any> = {
		blocklyRuntime: { applyLocale },
		rebuildBlocklyForLanguage: async () => undefined,
		dispatchEvent: (event: { type: string; detail?: { language?: string } }) => {
			if (event.type === 'languageChanged' && event.detail?.language) {
				changedLanguages.push(event.detail.language);
			}
		},
	};
	windowObject.window = windowObject;
	vm.runInNewContext(readLanguageManagerScript(relativePath), {
		window: windowObject,
		Blockly: { Msg: {}, setLocale: () => undefined },
		CustomEvent: class {
			public detail: { language?: string };

			constructor(
				public type: string,
				init: { detail?: { language?: string } } = {}
			) {
				this.detail = init.detail || {};
			}
		},
		console: { log: () => undefined, warn: () => undefined },
		Promise,
		setTimeout,
	});
	const manager = windowObject.languageManager;
	manager.currentLanguage = 'en';
	manager.appliedLanguage = 'en';
	manager.messages = { en: { LABEL: 'English' }, de: { LABEL: 'Deutsch' }, fr: { LABEL: 'Français' } };
	return { manager, changedLanguages };
}

suite('Blockly language rebuild contract', () => {
	test('editor saves JSON before recreation and restores board, theme, listeners, and state', () => {
		const source = read('media/js/blocklyEdit.js');
		const rebuildSource = source.slice(
			source.indexOf('async function refreshWorkspaceForLanguage'),
			source.indexOf('window.rebuildBlocklyForLanguage = refreshWorkspaceForLanguage')
		);
		assert.match(source, /serialization\.workspaces\.save\(workspace\)[\s\S]*rebuildEditorWorkspaceForLanguage\(state\)/);
		assert.match(rebuildSource, /shadowBlockManager\?\.isActive\?\.\(\)[\s\S]*clearSuggestion\(false\)/);
		assert.ok(rebuildSource.indexOf('clearSuggestion(false)') < rebuildSource.indexOf('serialization.workspaces.save(workspace)'));
		assert.match(source, /workspace = window\.blocklyRuntime\.recreateWorkspace\(\)/);
		assert.match(source, /attachWorkspaceBaseIntegrations\(workspace\)/);
		assert.match(source, /workspace\.addChangeListener\(handleWorkspaceChange\)/);
		assert.match(source, /updateToolboxForBoard\(workspace, boardId\)/);
		assert.match(source, /blocklyRuntime\.loadWorkspaceState\(state, workspace\)/);
		assert.match(source, /updateTheme\(currentTheme\)/);
	});

	test('preview recreates read-only workspace while preserving state, board state, and theme', () => {
		const source = read('media/js/blocklyPreview.js');
		const rebuildSource = source.slice(source.indexOf('async function refreshWorkspaceForLanguage'), source.indexOf('function showBoardWarning'));
		assert.match(source, /serialization\.workspaces\.save\(workspace\)/);
		assert.match(source, /workspace = window\.blocklyRuntime\.recreateWorkspace\(\)/);
		assert.match(source, /blocklyRuntime\.loadWorkspaceState\(state, workspace\)/);
		assert.match(source, /updateTheme\(currentTheme, false\)/);
		assert.doesNotMatch(rebuildSource, /currentPreviewBoard\s*=/);
	});

	test('both language managers roll back locale and workspace on rebuild failure', () => {
		for (const target of ['media/html/blocklyEdit.html', 'media/html/blocklyPreview.html']) {
			const html = read(target);
			assert.match(html, /catch \(error\)[\s\S]*currentLanguage = previousLanguage/);
			assert.match(html, /applyLocale\(\s*previousLanguage,\s*this\.messages\[previousLanguage\]\s*\)/);
			assert.match(html, /await window\.rebuildBlocklyForLanguage\(\)/);
			assert.match(html, /request !== this\.requestSequence/);
		}
	});

	test('a failed stale locale request cannot roll back the latest selection', async () => {
		for (const target of ['media/html/blocklyEdit.html', 'media/html/blocklyPreview.html']) {
			let rejectGerman: ((error: Error) => void) | undefined;
			let signalGermanStarted: (() => void) | undefined;
			const germanStarted = new Promise<void>(resolve => {
				signalGermanStarted = resolve;
			});
			const appliedLocales: string[] = [];
			const { manager, changedLanguages } = createLanguageManager(target, async locale => {
				appliedLocales.push(locale);
				if (locale === 'de') {
					signalGermanStarted?.();
					await new Promise<never>((_resolve, reject) => {
						rejectGerman = reject;
					});
				}
				return true;
			});

			const germanResult = manager.setLanguage('de');
			await germanStarted;
			const frenchResult = manager.setLanguage('fr');
			rejectGerman?.(new Error('German locale failed'));

			assert.deepStrictEqual(await Promise.all([germanResult, frenchResult]), [false, true], target);
			assert.strictEqual(manager.currentLanguage, 'fr', target);
			assert.deepStrictEqual(appliedLocales, ['de', 'fr'], target);
			assert.deepStrictEqual(changedLanguages, ['fr'], target);
		}
	});

	test('selecting the committed language again restores it after an in-flight stale request', async () => {
		for (const target of ['media/html/blocklyEdit.html', 'media/html/blocklyPreview.html']) {
			let releaseGerman: (() => void) | undefined;
			let signalGermanStarted: (() => void) | undefined;
			const germanStarted = new Promise<void>(resolve => {
				signalGermanStarted = resolve;
			});
			const appliedLocales: string[] = [];
			const { manager, changedLanguages } = createLanguageManager(target, async locale => {
				appliedLocales.push(locale);
				if (locale === 'de') {
					signalGermanStarted?.();
					await new Promise<void>(resolve => {
						releaseGerman = resolve;
					});
				}
				return true;
			});

			const germanResult = manager.setLanguage('de');
			await germanStarted;
			const englishResult = manager.setLanguage('en');
			releaseGerman?.();

			assert.deepStrictEqual(await Promise.all([germanResult, englishResult]), [false, true], target);
			assert.strictEqual(manager.currentLanguage, 'en', target);
			assert.strictEqual(manager.appliedLanguage, 'en', target);
			assert.deepStrictEqual(appliedLocales, ['de', 'en'], target);
			assert.deepStrictEqual(changedLanguages, ['en'], target);
		}
	});

	test('editor does not persist a language preference rejected by the WebView', () => {
		const source = read('media/js/blocklyEdit.js');
		const selectionSource = source.slice(
			source.indexOf('async function handleLanguageSelection'),
			source.indexOf('function openLanguageDropdown')
		);
		assert.doesNotMatch(selectionSource, /languageCode === currentLanguagePreference/);
		const failureGuardIndex = selectionSource.indexOf('if (!switched)');
		const postMessageIndex = selectionSource.indexOf("command: 'updateLanguage'");
		assert.ok(failureGuardIndex >= 0 && failureGuardIndex < postMessageIndex);
		assert.match(selectionSource.slice(failureGuardIndex, postMessageIndex), /closeLanguageDropdown\(\);[\s\S]*return;/);
	});

	test('rebuild is guarded during drag and never writes an intermediate empty state', () => {
		for (const target of ['media/js/blocklyEdit.js', 'media/js/blocklyPreview.js']) {
			const source = read(target);
			assert.match(source, /workspace\.isDragging\(\)[\s\S]*pendingLanguageReloadTimer/);
			assert.doesNotMatch(source, /refreshWorkspaceForLanguage[\s\S]{0,1800}saveWorkspace/);
		}
	});
});
