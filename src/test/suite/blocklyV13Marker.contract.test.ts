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

suite('Blockly 13 marker contract', () => {
	test('search highlighting uses getSvgRoot and an app-owned class', () => {
		const editor = read('media/js/blocklyEdit.js');
		assert.match(editor, /getSvgRoot\(\)\?\.classList\.add\('singular-search-highlight'\)/);
		assert.match(editor, /getSvgRoot\(\)\?\.classList\.remove\('singular-search-highlight'\)/);
		assert.doesNotMatch(editor, /pathObject|\.svgPath/);
		assert.match(read('media/css/blocklyEdit.css'), /\.singular-search-highlight\s*>\s*\.blocklyPath/);
	});

	test('experimental marker uses public workspace/flyout APIs, events, and MutationObserver', () => {
		const marker = read('media/js/experimentalBlockMarker.js');
		assert.match(marker, /workspace\.getFlyout\(\)/);
		assert.match(marker, /flyout\.getWorkspace\(\)/);
		assert.match(marker, /workspace\.addChangeListener/);
		assert.match(marker, /addEventListener\('blocklyWorkspaceCreated', setupBlocklyChangeListener\)/);
		assert.match(marker, /new MutationObserver/);
		assert.match(marker, /blockSvg\.classList\.add\('singular-experimental-block'\)/);
		assert.doesNotMatch(marker, /Blockly\.[A-Za-z]+\.prototype\./);
		assert.doesNotMatch(marker, /querySelector\(['"]\.blocklyPath/);
		assert.doesNotMatch(marker, /\.(?:toolbox_|flyout_|workspace_|pathObject)\b/);
	});

	test('toolbox refreshes use the public getter', () => {
		for (const target of ['media/js/blocklyEdit.js', 'media/blockly/blocks/functions.js']) {
			const source = read(target);
			assert.doesNotMatch(source, /\.toolbox_\b/, target);
			assert.match(source, /\.getToolbox\(\)/, target);
		}
	});
});
