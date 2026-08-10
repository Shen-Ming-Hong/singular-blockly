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

suite('Blockly 13 UI contract', () => {
	test('editor and preview use Thrasos, Singular themes, and packaged media', () => {
		const editor = read('media/js/blocklyEdit.js');
		const preview = read('media/js/blocklyPreview.js');
		const runtime = read('media/js/blocklyRuntime.js');
		for (const source of [editor, preview]) {
			assert.match(source, /renderer:\s*'thrasos'/);
			assert.match(source, /media:\s*window\.BLOCKLY_MEDIA_URL/);
			assert.match(source, /SingularBlockly(?:Dark)?Theme/);
		}
		assert.match(preview, /readOnly:\s*true/);
		assert.match(runtime, /renderer:\s*'thrasos'/);
		assert.match(runtime, /String\(window\.BLOCKLY_MEDIA_URL/);
	});

	test('Blockly 13 focus, invalid input, flyout, border-box, and forced-colors styles exist', () => {
		const css = read('media/css/blocklyEdit.css');
		assert.match(css, /--blockly-active-node-color:\s*var\(--editor-focus-ring\)/);
		assert.match(css, /\.blocklyActiveFocus\.blocklyField/);
		assert.match(css, /\.blocklyInvalidInput/);
		assert.match(css, /\.blocklyInputWarningInvalid/);
		assert.match(css, /\.blocklyFlyoutButton:focus-visible/);
		assert.match(css, /\.blocklyWidgetDiv[\s\S]*box-sizing:\s*border-box/);
		assert.match(css, /@media \(forced-colors:\s*active\)[\s\S]*--blockly-active-node-color:\s*Highlight/);
	});

	test('runtime resources stay local to the extension package', () => {
		const manager = read('src/webview/webviewManager.ts');
		assert.match(manager, /path\.join\(this\.context\.extensionPath, ['"]node_modules\/blockly\/media['"]\)/);
		assert.match(manager, /webview\.asWebviewUri/);
		assert.doesNotMatch(manager, /https?:\/\/[^'"`]*blockly/i);
	});
});
