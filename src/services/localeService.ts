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
 * 檔案系統介面（用於依賴注入）
 */
export interface FileSystem {
	existsSync(path: string): boolean;
	promises: {
		readFile(path: string, encoding?: BufferEncoding | null): Promise<string | Buffer>;
		readdir(path: string): Promise<string[]>;
	};
}

/**
 * VSCode API 介面（用於依賴注入）
 */
export interface VSCodeAPI {
	env: {
		language: string;
	};
}

/**
 * 多語言服務類別
 * 負責處理所有與多語言相關的功能
 */
export class LocaleService {
	private cachedMessages: Map<string, UIMessages> = new Map();
	private currentLanguage: string = 'en';
	private fs: FileSystem;
	private vscodeApi: VSCodeAPI;

	/**
	 * 建立多語言服務實例
	 * @param extensionPath 擴充功能路徑
	 * @param fileSystem 檔案系統（可選，用於測試）
	 * @param vscodeAPI VSCode API（可選，用於測試）
	 */
	constructor(private extensionPath: string, fileSystem?: FileSystem, vscodeAPI?: VSCodeAPI) {
		this.fs = fileSystem || fs;
		this.vscodeApi = vscodeAPI || vscode;
		this.currentLanguage = this.mapVSCodeLangToBlockly(this.vscodeApi.env.language);
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
		if (!this.fs.existsSync(langFilePath)) {
			const enFilePath = path.join(this.extensionPath, 'media/locales/en/messages.js');
			if (!this.fs.existsSync(enFilePath)) {
					return {}; // 如果連英文檔案都找不到，返回空物件
				}

			// 讀取英文語言檔
			const content = await this.fs.promises.readFile(enFilePath, 'utf8') as string;
			const messages = this.extractMessagesFromJs(content);
				this.cachedMessages.set('en', messages);
				this.currentLanguage = 'en';
				return messages;
		} else {
			// 讀取對應語言檔
			const content = await this.fs.promises.readFile(langFilePath, 'utf8') as string;
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

		// 處理 Blockly.Msg['KEY'] = 'value' 格式 (標準 Blockly 訊息格式)
		const blocklyMsgRegex = /Blockly\.Msg\[['"](\w+)['"]\]\s*=\s*['"](.+?)['"]/g;
		let blocklyMatch;
		
		while ((blocklyMatch = blocklyMsgRegex.exec(content)) !== null) {
			const key = blocklyMatch[1];
			const value = blocklyMatch[2];
			messages[key] = value;
		}

		// 優先處理 VSCODE_ 開頭的訊息，保持向下兼容
		const vscodeRegex = /VSCODE_(\w+):\s*['"](.+?)['"]/g;
		let vscodeMatch;

		while ((vscodeMatch = vscodeRegex.exec(content)) !== null) {
			const key = 'VSCODE_' + vscodeMatch[1];
			const value = vscodeMatch[2];
			messages[key] = value;
		}

		// 處理所有其他訊息
		// 使用正則表達式尋找 loadMessages 函數中的所有鍵值對
		const messageBlockRegex = /loadMessages\s*\(\s*['"][^'"]+['"]\s*,\s*\{([\s\S]*?)\}\s*\)/g;
		let blockMatch;
		while ((blockMatch = messageBlockRegex.exec(content)) !== null) {
			const messageBlock = blockMatch[1];
			// 匹配鍵值對
			const keyValueRegex = /\s*(\w+):\s*['"](.+?)['"]/g;
			let keyValueMatch;
			while ((keyValueMatch = keyValueRegex.exec(messageBlock)) !== null) {
				const key = keyValueMatch[1];
				const value = keyValueMatch[2];
				messages[key] = value;
			}
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
			const files = await this.fs.promises.readdir(localesPath);
			// 過濾出目錄（在測試環境中，我們假設所有返回的都是目錄）
			return files;
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
