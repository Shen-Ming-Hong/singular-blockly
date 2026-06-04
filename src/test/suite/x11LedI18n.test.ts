/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const EXPECTED_INDEX_SUFFIXES: Record<string, string> = {
	bg: 'пиксел',
	cs: 'pixel',
	de: 'Pixel',
	en: 'pixel',
	es: 'píxel',
	fr: 'pixel',
	hu: 'pixel',
	it: 'pixel',
	ja: '番目',
	ko: '픽셀',
	pl: 'piksel',
	'pt-br': 'pixel',
	ru: 'пиксель',
	tr: 'piksel',
	'zh-hant': '顆',
};

function extractMessageValue(source: string, key: string): string | null {
	const doubleQuoted = new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
	let match = source.match(doubleQuoted);
	if (match) {
		return match[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	const singleQuoted = new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`);
	match = source.match(singleQuoted);
	if (match) {
		return match[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	return null;
}

suite('X11 LED i18n Tests', () => {
	const localesRoot = path.join(__dirname, '..', '..', '..', 'media', 'locales');
	const locales = fs
		.readdirSync(localesRoot, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort();

	test('所有 locale 應使用核准的 X11 LED index suffix', () => {
		assert.strictEqual(locales.length, 15, 'project should keep 15 supported locales');
		assert.deepStrictEqual(locales, Object.keys(EXPECTED_INDEX_SUFFIXES).sort(), 'supported locales should match the approved suffix map');

		for (const locale of locales) {
			const source = fs.readFileSync(path.join(localesRoot, locale, 'messages.js'), 'utf8');
			const value = extractMessageValue(source, 'X11_LED_SET_COLOR_INDEX_SUFFIX');

			assert.strictEqual(value, EXPECTED_INDEX_SUFFIXES[locale], `${locale} should use the approved X11 LED index suffix`);
			assert.doesNotMatch(value ?? '', /(^|[^A-Za-z])R([^A-Za-z]|$)/, `${locale} suffix should not include an R channel label`);
			assert.ok(!value?.includes('紅'), `${locale} suffix should not include a red channel label`);
		}
	});
});
