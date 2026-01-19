/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 支援的 Blockly 語言代碼
 */
export type SupportedLanguageCode =
	| 'en'
	| 'zh-hant'
	| 'ja'
	| 'ko'
	| 'es'
	| 'fr'
	| 'de'
	| 'it'
	| 'pt-br'
	| 'ru'
	| 'pl'
	| 'hu'
	| 'cs'
	| 'bg'
	| 'tr';

/**
 * 語言選項結構
 */
export interface LanguageOption {
	code: 'auto' | SupportedLanguageCode;
	nativeName: string;
	isAuto?: boolean;
}
