/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const LOCALES = ['en', 'zh-hant', 'ja', 'ko', 'de', 'fr', 'es', 'it', 'pt-br', 'ru', 'pl', 'cs', 'hu', 'bg', 'tr'];
const NON_ENGLISH_LOCALES = LOCALES.filter(locale => locale !== 'en');
const REQUIRED_PROJECT_ARIA_KEYS = ['BLOCKLY_ARIA_CONFIGURATION_ICON', 'BLOCKLY_ARIA_LOCKED_ICON'];
const KNOWN_EMPTY_MESSAGE_KEYS = new Set([
	'PROCEDURES_DEFNORETURN_TITLE',
	'PROCEDURES_DEFNORETURN_DO',
	'PROCEDURES_DEFRETURN_DO',
	'CONTROLS_IF_ELSE_TITLE_ELSE',
	'HUSKYLENS_BLOCK_INFO_TYPE',
	'HUSKYLENS_ARROW_INFO_TYPE',
	'PIXETTO_ROAD_CENTER_X',
	'HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX',
	'HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX',
	'HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX',
]);

function messageFile(locale, root = PROJECT_ROOT) {
	return path.join(root, 'media', 'locales', locale, 'messages.js');
}

function packageNlsFile(locale, root = PROJECT_ROOT) {
	return locale === 'en' ? path.join(root, 'package.nls.json') : path.join(root, `package.nls.${locale}.json`);
}

module.exports = {
	KNOWN_EMPTY_MESSAGE_KEYS,
	LOCALES,
	NON_ENGLISH_LOCALES,
	PROJECT_ROOT,
	REQUIRED_PROJECT_ARIA_KEYS,
	messageFile,
	packageNlsFile,
};
