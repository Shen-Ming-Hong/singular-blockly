/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';

/**
 * UI 訊息介面
 */
export interface UIMessages {
	[key: string]: string;
}

/**
 * 多語言服務類別
 * 負責處理所有與多語言相關的功能
 */
export class LocaleService {
	private cachedMessages: Map<string, UIMessages> = new Map();
	private currentLanguage: string = 'en';

	/**
	 * 建立多語言服務實例
	 * @param extensionPath 擴充功能路徑
	 */
	constructor(private extensionPath: string) {
		this.currentLanguage = this.mapVSCodeLangToBlockly(vscode.env.language);
		log(`初始化多語言服務, 語言: ${this.currentLanguage}`, 'info');
	}

	/**
	 * 獲取本地化訊息
	 * @param key 訊息鍵名
	 * @param args 格式化參數
	 * @returns 翻譯後的訊息
	 */
	async getLocalizedMessage(key: string, ...args: any[]): Promise<string> {
		const messages = await this.loadUIMessages();
		let message = messages[key] || key; // 如果找不到翻譯，則使用 key 本身

		// 替換參數 {0}, {1}, 等
		args.forEach((arg, index) => {
			message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
		});

		return message;
	}

	/**
	 * 載入 UI 訊息
	 * @returns UI 訊息物件
	 */
	async loadUIMessages(): Promise<UIMessages> {
		try {
			const blocklyLanguage = this.currentLanguage;

			// 如果已經載入此語言，則直接返回已快取的訊息
			if (this.cachedMessages.has(blocklyLanguage)) {
				return this.cachedMessages.get(blocklyLanguage) || {};
			}

			// 找到對應的語言檔案
			const langFilePath = path.join(this.extensionPath, 'media/locales', blocklyLanguage, 'messages.js');

			// 如果找不到對應的語言檔，則使用英文
			if (!fs.existsSync(langFilePath)) {
				const enFilePath = path.join(this.extensionPath, 'media/locales/en/messages.js');
				if (!fs.existsSync(enFilePath)) {
					return {}; // 如果連英文檔案都找不到，返回空物件
				}

				// 讀取英文語言檔
				const content = await fs.promises.readFile(enFilePath, 'utf8');
				const messages = this.extractMessagesFromJs(content);
				this.cachedMessages.set('en', messages);
				this.currentLanguage = 'en';
				return messages;
			} else {
				// 讀取對應語言檔
				const content = await fs.promises.readFile(langFilePath, 'utf8');
				const messages = this.extractMessagesFromJs(content);
				this.cachedMessages.set(blocklyLanguage, messages);
				return messages;
			}
		} catch (error) {
			log('Error loading UI messages:', 'error', error);
			return {}; // 發生錯誤時返回空物件
		}
	}

	/**
	 * 從 JS 檔案中提取訊息
	 * @param content JS 檔案內容
	 * @returns UI 訊息物件
	 */
	private extractMessagesFromJs(content: string): UIMessages {
		const messages: UIMessages = {};

		// 使用正則表達式尋找 VSCODE_ 開頭的訊息
		const regex = /VSCODE_(\w+):\s*['"](.+?)['"]/g;
		let match;

		while ((match = regex.exec(content)) !== null) {
			const key = 'VSCODE_' + match[1];
			const value = match[2];
			messages[key] = value;
		}

		return messages;
	}

	/**
	 * 將 VSCode 語言代碼映射到 Blockly 語言代碼
	 * @param vscodeLanguage VSCode 語言代碼
	 * @returns Blockly 語言代碼
	 */
	public mapVSCodeLangToBlockly(vscodeLanguage: string): string {
		// 語言映射表
		const languageMap: { [key: string]: string } = {
			'zh-tw': 'zh-hant',
			en: 'en',
			'en-us': 'en',
			ja: 'ja',
			es: 'es',
			'pt-br': 'pt-br',
			ru: 'ru',
			ko: 'ko',
			fr: 'fr',
			de: 'de',
			it: 'it',
			pl: 'pl',
			hu: 'hu',
			cs: 'cs',
			bg: 'bg',
			tr: 'tr',
			// 可以根據需要添加更多映射
		};

		// 將 VSCode 語言代碼轉為小寫以進行比較
		const normalizedLang = vscodeLanguage.toLowerCase();

		// 檢查是否有直接對應
		if (languageMap[normalizedLang]) {
			return languageMap[normalizedLang];
		}

		// 如果沒有確切匹配，嘗試找到基本語言的對應
		const baseLang = normalizedLang.split('-')[0];
		if (languageMap[baseLang]) {
			return languageMap[baseLang];
		}

		// 如果找不到對應，返回預設語言 'en'
		return 'en';
	}

	/**
	 * 獲取支援的語言列表
	 * @returns 支援的語言代碼列表
	 */
	async getSupportedLocales(): Promise<string[]> {
		const localesPath = path.join(this.extensionPath, 'media/locales');
		try {
			const files = await fs.promises.readdir(localesPath);
			return files.filter(file => {
				const stat = fs.statSync(path.join(localesPath, file));
				return stat.isDirectory();
			});
		} catch (error) {
			log('Unable to read language file directory:', 'error', error);
			return ['en']; // 若發生錯誤，至少返回英文
		}
	}

	/**
	 * 獲取當前語言代碼
	 * @returns 當前語言代碼
	 */
	getCurrentLanguage(): string {
		return this.currentLanguage;
	}
}
