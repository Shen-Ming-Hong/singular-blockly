/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const BLOCK_FILES = [
	'arduino.js',
	'cyberbrick.js',
	'esp32-wifi-mqtt.js',
	'functions.js',
	'huskylens.js',
	'loops.js',
	'motors.js',
	'pixetto.js',
	'rc.js',
	'sensors.js',
	'txt.js',
	'x11.js',
	'x12.js',
];

function read(relativePath: string): string {
	return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), 'utf8');
}

suite('Blockly 13 accessibility contract', () => {
	test('custom blocks rely on native Blockly 13 field/input ARIA instead of internal DOM patches', () => {
		for (const filename of BLOCK_FILES) {
			const source = read(`media/blockly/blocks/${filename}`);
			assert.doesNotMatch(source, /extends\s+Blockly\.Field/, `${filename} should not replace native field accessibility`);
			assert.doesNotMatch(source, /setAttribute\(['"]aria-/, `${filename} should use public Blockly ARIA APIs`);
			assert.doesNotMatch(source, /querySelector\(['"]\.blockly/, `${filename} should not label renderer internals`);
			assert.doesNotMatch(source, /new\s+Blockly\.FieldImage\([^,]+,[^,]+,[^,]+\s*\)/, `${filename} has an image field without alt text`);
		}
	});

	test('symbol-only custom fields have translatable ARIA type names', () => {
		const arduino = read('media/blockly/blocks/arduino.js');
		const functions = read('media/blockly/blocks/functions.js');
		assert.match(arduino, /configurationIcon\.setAriaTypeName\([\s\S]*BLOCKLY_ARIA_CONFIGURATION_ICON/);
		assert.match(functions, /lockIcon\.setAriaTypeName\([\s\S]*BLOCKLY_ARIA_LOCKED_ICON/);
	});

	test('every project locale supplies custom icon announcements', () => {
		const localesRoot = path.join(PROJECT_ROOT, 'media', 'locales');
		const locales = fs.readdirSync(localesRoot).filter(locale => fs.existsSync(path.join(localesRoot, locale, 'messages.js')));
		assert.strictEqual(locales.length, 15);
		for (const locale of locales) {
			const source = read(`media/locales/${locale}/messages.js`);
			assert.match(source, /BLOCKLY_ARIA_CONFIGURATION_ICON:\s*['"][^'"]+['"]/, locale);
			assert.match(source, /BLOCKLY_ARIA_LOCKED_ICON:\s*['"][^'"]+['"]/, locale);
		}
	});

	test('dialogs expose names and restore focus after the public Blockly adapter closes', () => {
		const editorHtml = read('media/html/blocklyEdit.html');
		const previewHtml = read('media/html/blocklyPreview.html');
		const runtime = read('media/js/blocklyRuntime.js');
		assert.match(editorHtml, /aria-labelledby="cyberbrickUploadSettingsTitle"/);
		assert.match(previewHtml, /aria-labelledby="txtVirtualControlsPanelTitle"/);
		assert.match(runtime, /focusTarget:\s*document\.activeElement/);
		assert.match(runtime, /restoreDialogFocus\(pending\.focusTarget\)/);
		assert.match(runtime, /target\.focus\(\)/);
	});
});
