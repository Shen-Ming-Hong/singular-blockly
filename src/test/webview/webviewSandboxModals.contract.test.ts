/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// VS Code 的 webview iframe 沙箱沒有 allow-modals，alert()／confirm()／prompt() 會被直接忽略，
// 使用者看不到任何訊息。WebView 程式要改用頁面內的訊息、原生 <dialog> 或 Blockly 的 dialog adapter。

const mediaRoot = path.join(__dirname, '..', '..', '..', 'media');

function listJsFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return listJsFiles(fullPath);
		}
		return entry.name.endsWith('.js') ? [fullPath] : [];
	});
}

function stripComments(source: string): string {
	return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

const NATIVE_MODAL_CALL = /(?:(?<![\w.$])|(?<=\bwindow\.))(alert|confirm|prompt)\s*\(/g;

suite('WebView sandbox modal contract', () => {
	test('webview scripts do not call alert(), confirm() or prompt()', () => {
		const offenders: string[] = [];
		for (const file of [...listJsFiles(path.join(mediaRoot, 'js')), ...listJsFiles(path.join(mediaRoot, 'blockly'))]) {
			const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n');
			lines.forEach((line, index) => {
				for (const match of line.matchAll(NATIVE_MODAL_CALL)) {
					offenders.push(`${path.relative(mediaRoot, file)}:${index + 1} ${match[1]}()`);
				}
			});
		}
		assert.deepStrictEqual(offenders, []);
	});

	test('backup name errors render inside the backup dialog', () => {
		const html = fs.readFileSync(path.join(mediaRoot, 'html', 'blocklyEdit.html'), 'utf8');
		assert.match(html, /<input[^>]*id="backupName"[^>]*aria-describedby="backupNameError"/);
		assert.match(html, /<p id="backupNameError"[^>]*role="alert"[^>]*hidden/);

		const script = fs.readFileSync(path.join(mediaRoot, 'js', 'blocklyEdit.js'), 'utf8');
		const createBackup = script.slice(script.indexOf('createBackup: function'), script.indexOf('isValidFilename: function'));
		assert.ok(createBackup.length > 0, 'createBackup not found');
		assert.strictEqual((createBackup.match(/this\.showBackupError\(/g) || []).length, 3);
	});
});
