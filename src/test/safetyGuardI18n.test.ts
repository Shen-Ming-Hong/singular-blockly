/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as fs from 'fs';
import * as path from 'path';
import { describe, it, before } from 'mocha';

/**
 * Safety Guard i18n 訊息品質驗證測試
 *
 * 驗證全部 15 個語系的安全守衛訊息鍵值一致性、占位符正確性、
 * 字元長度限制，以及 TypeScript fallback 與 en 基準版本的一致性。
 */

const LOCALES = ['en', 'bg', 'cs', 'de', 'es', 'fr', 'hu', 'it', 'ja', 'ko', 'pl', 'pt-br', 'ru', 'tr', 'zh-hant'];
const SAFETY_GUARD_KEYS = [
	'SAFETY_WARNING_BODY_NO_TYPE',
	'SAFETY_WARNING_BODY_WITH_TYPE',
	'BUTTON_CONTINUE',
	'BUTTON_CANCEL',
	'BUTTON_SUPPRESS',
	'SAFETY_GUARD_CANCELLED',
	'SAFETY_GUARD_SUPPRESSED',
];

/** 從語系檔中提取指定鍵值的字串值 */
function extractMessageValue(content: string, key: string): string | null {
	// Try double-quoted strings first (handles apostrophes inside)
	const doubleQuoteRegex = new RegExp(key + ':\\s*"((?:[^"\\\\]|\\\\.)*)"');
	let match = content.match(doubleQuoteRegex);
	if (match) {
		return match[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	// Try single-quoted strings
	const singleQuoteRegex = new RegExp(key + ":\\s*'((?:[^'\\\\]|\\\\.)*)'");
	match = content.match(singleQuoteRegex);
	if (match) {
		return match[1].replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
	}

	return null;
}

/** 取得專案根目錄（從 out/test/ 向上回溯） */
function getProjectRoot(): string {
	// Tests run from out/test/, so go up to project root
	let dir = __dirname;
	while (dir && !fs.existsSync(path.join(dir, 'package.json'))) {
		const parent = path.dirname(dir);
		if (parent === dir) { break; }
		dir = parent;
	}
	return dir;
}

/** 讀取語系檔內容 */
function readLocaleFile(locale: string): string {
	const root = getProjectRoot();
	const filePath = path.join(root, 'media', 'locales', locale, 'messages.js');
	return fs.readFileSync(filePath, 'utf8');
}

/** 載入所有語系的安全守衛訊息 */
function loadAllLocaleMessages(): Record<string, Record<string, string | null>> {
	const result: Record<string, Record<string, string | null>> = {};
	for (const locale of LOCALES) {
		const content = readLocaleFile(locale);
		result[locale] = {};
		for (const key of SAFETY_GUARD_KEYS) {
			result[locale][key] = extractMessageValue(content, key);
		}
	}
	return result;
}

// T023: 訊息鍵值一致性測試
describe('Safety Guard i18n - Key Consistency', () => {
	let allMessages: Record<string, Record<string, string | null>>;

	before(() => {
		allMessages = loadAllLocaleMessages();
	});

	it('should have all 7 safety guard keys in every locale', () => {
		for (const locale of LOCALES) {
			for (const key of SAFETY_GUARD_KEYS) {
				const value = allMessages[locale][key];
				assert.ok(value !== null && value !== undefined,
					`${locale}: missing key '${key}'`);
				assert.ok(value!.length > 0,
					`${locale}: empty value for key '${key}'`);
			}
		}
	});

	it('should not have untranslated English residuals in non-en locales', () => {
		const enMessages = allMessages['en'];
		for (const locale of LOCALES) {
			if (locale === 'en') { continue; }
			for (const key of SAFETY_GUARD_KEYS) {
				// BUTTON_CANCEL may legitimately be the same word
				if (key === 'BUTTON_CANCEL') { continue; }
				const value = allMessages[locale][key];
				const enValue = enMessages[key];
				if (value && enValue) {
					assert.notStrictEqual(value, enValue,
						`${locale}/${key}: value is identical to English — likely untranslated`);
				}
			}
		}
	});
});

// T024: 占位符驗證測試
describe('Safety Guard i18n - Placeholder Validation', () => {
	let allMessages: Record<string, Record<string, string | null>>;

	before(() => {
		allMessages = loadAllLocaleMessages();
	});

	it('should have exactly one {0} placeholder in SAFETY_WARNING_BODY_WITH_TYPE for all locales', () => {
		for (const locale of LOCALES) {
			const value = allMessages[locale]['SAFETY_WARNING_BODY_WITH_TYPE'];
			assert.ok(value, `${locale}: SAFETY_WARNING_BODY_WITH_TYPE is missing`);
			const matches = value!.match(/\{0\}/g) || [];
			assert.strictEqual(matches.length, 1,
				`${locale}/SAFETY_WARNING_BODY_WITH_TYPE: expected exactly 1 {0}, found ${matches.length}`);
		}
	});

	it('should NOT have {0} placeholder in SAFETY_WARNING_BODY_NO_TYPE for any locale', () => {
		for (const locale of LOCALES) {
			const value = allMessages[locale]['SAFETY_WARNING_BODY_NO_TYPE'];
			assert.ok(value, `${locale}: SAFETY_WARNING_BODY_NO_TYPE is missing`);
			assert.ok(!value!.includes('{0}'),
				`${locale}/SAFETY_WARNING_BODY_NO_TYPE: should not contain {0} placeholder`);
		}
	});
});

// T025: 字元長度限制測試
describe('Safety Guard i18n - Character Length Limits', () => {
	const BODY_LIMIT = 200;
	const BUTTON_LIMIT = 15;
	const FEEDBACK_LIMIT = 100;

	let allMessages: Record<string, Record<string, string | null>>;

	before(() => {
		allMessages = loadAllLocaleMessages();
	});

	it('should keep warning body text within 200 characters', () => {
		const bodyKeys = ['SAFETY_WARNING_BODY_NO_TYPE', 'SAFETY_WARNING_BODY_WITH_TYPE'];
		for (const locale of LOCALES) {
			for (const key of bodyKeys) {
				const value = allMessages[locale][key];
				if (value) {
					assert.ok(value.length <= BODY_LIMIT,
						`${locale}/${key}: ${value.length} chars exceeds ${BODY_LIMIT} limit`);
				}
			}
		}
	});

	it('should keep button text within 15 characters', () => {
		const buttonKeys = ['BUTTON_CONTINUE', 'BUTTON_CANCEL', 'BUTTON_SUPPRESS'];
		for (const locale of LOCALES) {
			for (const key of buttonKeys) {
				const value = allMessages[locale][key];
				if (value) {
					assert.ok(value.length <= BUTTON_LIMIT,
						`${locale}/${key}: '${value}' is ${value.length} chars, exceeds ${BUTTON_LIMIT} limit`);
				}
			}
		}
	});

	it('should keep feedback messages within 100 characters', () => {
		const feedbackKeys = ['SAFETY_GUARD_CANCELLED', 'SAFETY_GUARD_SUPPRESSED'];
		for (const locale of LOCALES) {
			for (const key of feedbackKeys) {
				const value = allMessages[locale][key];
				if (value) {
					assert.ok(value.length <= FEEDBACK_LIMIT,
						`${locale}/${key}: ${value.length} chars exceeds ${FEEDBACK_LIMIT} limit`);
				}
			}
		}
	});
});

// T026: Fallback 一致性測試
describe('Safety Guard i18n - Fallback Consistency', () => {
	let enMessages: Record<string, string | null>;

	before(() => {
		const content = readLocaleFile('en');
		enMessages = {};
		for (const key of SAFETY_GUARD_KEYS) {
			enMessages[key] = extractMessageValue(content, key);
		}
	});

	it('should have workspaceValidator.ts getFallbackMessage() matching en/messages.js', () => {
		const root = getProjectRoot();
		const tsContent = fs.readFileSync(
			path.join(root, 'src', 'services', 'workspaceValidator.ts'), 'utf8'
		);

		// Check SAFETY_WARNING_BODY_NO_TYPE fallback
		const enNoType = enMessages['SAFETY_WARNING_BODY_NO_TYPE'];
		assert.ok(enNoType, 'en/SAFETY_WARNING_BODY_NO_TYPE should exist');
		assert.ok(tsContent.includes(enNoType!),
			'workspaceValidator.ts getFallbackMessage should contain en SAFETY_WARNING_BODY_NO_TYPE');

		// Check SAFETY_WARNING_BODY_WITH_TYPE fallback (template with ${projectType} instead of {0})
		// The TS file uses template literal with ${projectType} where locale file uses {0}
		const enWithType = enMessages['SAFETY_WARNING_BODY_WITH_TYPE'];
		assert.ok(enWithType, 'en/SAFETY_WARNING_BODY_WITH_TYPE should exist');
		// Replace {0} with a generic pattern to check the rest matches
		const withTypePrefix = enWithType!.split('{0}')[0];
		const withTypeSuffix = enWithType!.split('{0}')[1];
		assert.ok(tsContent.includes(withTypePrefix),
			'workspaceValidator.ts should contain WITH_TYPE prefix matching en');
		assert.ok(tsContent.includes(withTypeSuffix),
			'workspaceValidator.ts should contain WITH_TYPE suffix matching en');

		// Check BUTTON_CONTINUE fallback
		const enContinue = enMessages['BUTTON_CONTINUE'];
		assert.ok(enContinue, 'en/BUTTON_CONTINUE should exist');
		assert.ok(tsContent.includes(enContinue!),
			'workspaceValidator.ts should contain en BUTTON_CONTINUE');

		// Check BUTTON_SUPPRESS fallback
		const enSuppress = enMessages['BUTTON_SUPPRESS'];
		assert.ok(enSuppress, 'en/BUTTON_SUPPRESS should exist');
		assert.ok(tsContent.includes(enSuppress!),
			'workspaceValidator.ts should contain en BUTTON_SUPPRESS');

		// Check BUTTON_CANCEL fallback
		const enCancel = enMessages['BUTTON_CANCEL'];
		assert.ok(enCancel, 'en/BUTTON_CANCEL should exist');
		assert.ok(tsContent.includes(enCancel!),
			'workspaceValidator.ts should contain en BUTTON_CANCEL');
	});

	it('should have workspaceValidator.ts inline fallback parameters matching en/messages.js', () => {
		const root = getProjectRoot();
		const tsContent = fs.readFileSync(
			path.join(root, 'src', 'services', 'workspaceValidator.ts'), 'utf8'
		);

		// Check inline fallback for BUTTON_CONTINUE
		const enContinue = enMessages['BUTTON_CONTINUE']!;
		const continuePattern = `BUTTON_CONTINUE, ${JSON.stringify(enContinue)}`;
		// Allow for both single and double quote variants
		assert.ok(
			tsContent.includes(`BUTTON_CONTINUE, "${enContinue}"`) ||
			tsContent.includes(`BUTTON_CONTINUE, '${enContinue}'`),
			`workspaceValidator.ts inline fallback for BUTTON_CONTINUE should be "${enContinue}"`
		);

		// Check inline fallback for BUTTON_SUPPRESS
		const enSuppress = enMessages['BUTTON_SUPPRESS']!;
		assert.ok(
			tsContent.includes(`BUTTON_SUPPRESS, "${enSuppress}"`) ||
			tsContent.includes(`BUTTON_SUPPRESS, '${enSuppress}'`),
			`workspaceValidator.ts inline fallback for BUTTON_SUPPRESS should be "${enSuppress}"`
		);
	});

	it('should have workspaceValidator.ts catch block using getFallbackMessage for consistency', () => {
		const root = getProjectRoot();
		const tsContent = fs.readFileSync(
			path.join(root, 'src', 'services', 'workspaceValidator.ts'), 'utf8'
		);

		// The catch block should delegate to getFallbackMessage (no hardcoded duplicates)
		assert.ok(tsContent.includes('getFallbackMessage(MESSAGE_KEYS.BUTTON_CONTINUE)'),
			'catch block should use getFallbackMessage for BUTTON_CONTINUE');
		assert.ok(tsContent.includes('getFallbackMessage(MESSAGE_KEYS.BUTTON_SUPPRESS)'),
			'catch block should use getFallbackMessage for BUTTON_SUPPRESS');

		// getFallbackMessage itself should contain the correct en strings
		const enContinue = enMessages['BUTTON_CONTINUE']!;
		const enSuppress = enMessages['BUTTON_SUPPRESS']!;
		assert.ok(tsContent.includes(`"${enContinue}"`),
			`getFallbackMessage should contain "${enContinue}"`);
		assert.ok(tsContent.includes(`"${enSuppress}"`),
			`getFallbackMessage should contain "${enSuppress}"`);
	});

	it('should have webviewManager.ts fallback parameters matching en/messages.js', () => {
		const root = getProjectRoot();
		const tsContent = fs.readFileSync(
			path.join(root, 'src', 'webview', 'webviewManager.ts'), 'utf8'
		);

		// Check SAFETY_GUARD_CANCELLED fallback
		const enCancelled = enMessages['SAFETY_GUARD_CANCELLED']!;
		assert.ok(
			tsContent.includes(`"${enCancelled}"`) ||
			tsContent.includes(`'${enCancelled}'`),
			`webviewManager.ts should have SAFETY_GUARD_CANCELLED fallback matching en: "${enCancelled}"`
		);

		// Check SAFETY_GUARD_SUPPRESSED fallback
		const enSuppressed = enMessages['SAFETY_GUARD_SUPPRESSED']!;
		assert.ok(
			tsContent.includes(`"${enSuppressed}"`) ||
			tsContent.includes(`'${enSuppressed}'`),
			`webviewManager.ts should have SAFETY_GUARD_SUPPRESSED fallback matching en: "${enSuppressed}"`
		);
	});
});
