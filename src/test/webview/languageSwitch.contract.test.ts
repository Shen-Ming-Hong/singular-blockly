/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');

function read(relativePath: string): string {
	return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8');
}

suite('Blockly language rebuild contract', () => {
	test('editor saves JSON before recreation and restores board, theme, listeners, and state', () => {
		const source = read('media/js/blocklyEdit.js');
		assert.match(source, /serialization\.workspaces\.save\(workspace\)[\s\S]*rebuildEditorWorkspaceForLanguage\(state\)/);
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
			assert.match(html, /applyLocale\(previousLanguage, this\.messages\[previousLanguage\]\)/);
			assert.match(html, /await window\.rebuildBlocklyForLanguage\(\)/);
			assert.match(html, /request !== this\.requestSequence/);
		}
	});

	test('rebuild is guarded during drag and never writes an intermediate empty state', () => {
		for (const target of ['media/js/blocklyEdit.js', 'media/js/blocklyPreview.js']) {
			const source = read(target);
			assert.match(source, /workspace\.isDragging\(\)[\s\S]*pendingLanguageReloadTimer/);
			assert.doesNotMatch(source, /refreshWorkspaceForLanguage[\s\S]{0,1800}saveWorkspace/);
		}
	});
});
