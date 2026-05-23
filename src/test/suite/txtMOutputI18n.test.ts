/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_KEYS = [
	'TXT_M_OUTPUT_PREFIX',
	'TXT_COMPONENT_MOTOR',
	'TXT_COMPONENT_LAMP',
	'TXT_LAMP_BRIGHTNESS',
	'TXT_M_OUTPUT_STOP',
	'TXT_M_OUTPUT_TOOLTIP',
	'TXT_M_OUTPUT_STOP_TOOLTIP',
	'TXT_M_OUTPUT_COMPONENT_CONFLICT_WARNING',
	'TXT_M_OUTPUT_SHARED_PIN_CONFLICT_WARNING',
	'TXT_M_OUTPUT_UPLOAD_BLOCKED',
	'TXT_M_OUTPUT_CODE_OUTPUT_BLOCKED',
];

suite('TXT M Output i18n Tests', () => {
	const localesRoot = path.join(__dirname, '..', '..', '..', 'media', 'locales');
	const locales = fs
		.readdirSync(localesRoot, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort();

	test('所有 locale 應包含 M output component、brightness、stop output 與 conflict warning keys', () => {
		assert.strictEqual(locales.length, 15, 'project should keep 15 supported locales');

		for (const locale of locales) {
			const source = fs.readFileSync(path.join(localesRoot, locale, 'messages.js'), 'utf8');
			for (const key of REQUIRED_KEYS) {
				assert.match(source, new RegExp(`\\b${key}\\s*:`), `${locale} should define ${key}`);
			}
		}
	});
});