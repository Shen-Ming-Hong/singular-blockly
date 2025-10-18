/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-nocheck
/* 暫時禁用 TypeScript 型別檢查，以便測試能夠執行
 * 這是一個臨時措施，在後續重構中應當逐步解決型別問題
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import * as fs from 'fs';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { LocaleService } from '../services/localeService';
import { VSCodeMock, FSMock } from './helpers/mocks';

describe('Locale Service', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let originalVscode: any;
	let localeService: LocaleService;
	const extensionPath = '/mock/extension';
	const enMessagesContent = `
        // English messages for Singular Blockly
        Blockly.Msg['VSCODE_PLEASE_OPEN_PROJECT'] = 'Please open a folder first.';
        Blockly.Msg['VSCODE_OPEN_FOLDER'] = 'Open Folder';
        Blockly.Msg['VSCODE_FAILED_SAVE_FILE'] = 'Failed to save file: {0}';
        Blockly.Msg['VSCODE_OPEN_BLOCKLY_EDITOR'] = 'Open Blockly Editor';
    `;
	const zhMessagesContent = `
        // Chinese (Traditional) messages for Singular Blockly
        Blockly.Msg['VSCODE_PLEASE_OPEN_PROJECT'] = '請先開啟一個資料夾。';
        Blockly.Msg['VSCODE_OPEN_FOLDER'] = '開啟資料夾';
        Blockly.Msg['VSCODE_FAILED_SAVE_FILE'] = '儲存檔案失敗: {0}';
        Blockly.Msg['VSCODE_OPEN_BLOCKLY_EDITOR'] = '開啟 Blockly 編輯器';
    `;

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 備份原始 vscode 模組
		originalVscode = (global as any).vscode;

		// 準備 vscode 模擬物件
		vscodeMock = new VSCodeMock();
		vscodeMock.env.language = 'en';

		// 替換全域的 vscode 為模擬物件
		(global as any).vscode = vscodeMock;

		// 建立檔案系統模擬
		fsMock = new FSMock();
		// 替換原始的 fs 模組
		fsServiceMock = {
			promises: fsMock.promises,
			existsSync: fsMock.existsSync,
			statSync: fsMock.statSync,
			readFileSync: fsMock.readFileSync,
		};

		// 直接將 fs 模組設為模擬物件
		const fsModule = require.cache[require.resolve('fs')];
		if (fsModule) {
			fsModule.exports = fsServiceMock;
		}

		// 添加測試語言檔案
		const enPath = path.join(extensionPath, 'media/locales/en/messages.js');
		const zhPath = path.join(extensionPath, 'media/locales/zh-hant/messages.js');
		fsMock.addFile(enPath, enMessagesContent);
		fsMock.addFile(zhPath, zhMessagesContent);

		// 添加目錄結構
		fsMock.addDirectory(path.join(extensionPath, 'media/locales'));
		fsMock.addDirectory(path.join(extensionPath, 'media/locales/en'));
		fsMock.addDirectory(path.join(extensionPath, 'media/locales/zh-hant'));

		// 初始化多語言服務，注入 fs mock 和 vscode mock
		localeService = new LocaleService(extensionPath, fsServiceMock as any, vscodeMock as any);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		// 還原原始的 vscode 模組
		(global as any).vscode = originalVscode;

		// 清理
		sinon.restore();
		fsMock.reset();
	});

	it('should initialize with correct language', () => {
		// 測試初始化語言（VSCode 預設是 'en'）
		const currentLanguage = localeService.getCurrentLanguage();
		assert.strictEqual(currentLanguage, 'en');

		// 測試設置不同的語言
		vscodeMock.env.language = 'zh-tw';
		const zhLocaleService = new LocaleService(extensionPath, fsServiceMock as any, vscodeMock as any);
		// zh-tw 會被映射到 zh-hant
		assert.strictEqual(zhLocaleService.getCurrentLanguage(), 'zh-hant');
	});

	it('should load UI messages', async () => {
		// 測試載入英文訊息
		const messages = await localeService.loadUIMessages();

		// 驗證訊息是否正確載入
		assert.strictEqual(messages['VSCODE_PLEASE_OPEN_PROJECT'], 'Please open a folder first.');
		assert.strictEqual(messages['VSCODE_OPEN_FOLDER'], 'Open Folder');
	});

	it('should map VSCode language to Blockly language', () => {
		// 測試語言代碼映射
		assert.strictEqual(localeService.mapVSCodeLangToBlockly('en-us'), 'en');
		assert.strictEqual(localeService.mapVSCodeLangToBlockly('zh-tw'), 'zh-hant');
		assert.strictEqual(localeService.mapVSCodeLangToBlockly('fr'), 'fr');

		// 測試未知語言代碼回退到英文
		assert.strictEqual(localeService.mapVSCodeLangToBlockly('unknown-lang'), 'en');
	});

	it('should get localized messages', async () => {
		// 先載入訊息
		await localeService.loadUIMessages();

		// 測試獲取本地化訊息
		const message = await localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
		assert.strictEqual(message, 'Please open a folder first.');

		// 測試帶有參數的訊息
		const errorMessage = await localeService.getLocalizedMessage('VSCODE_FAILED_SAVE_FILE', 'Permission denied');
		assert.strictEqual(errorMessage, 'Failed to save file: Permission denied');
	});

	it('should fallback to key if message not found', async () => {
		// 先載入訊息
		await localeService.loadUIMessages();

		// 測試未找到的訊息回退到鍵名
		const unknownKey = 'UNKNOWN_KEY';
		const message = await localeService.getLocalizedMessage(unknownKey);
		assert.strictEqual(message, unknownKey);
	});

	it('should get supported locales', async () => {
		// 測試獲取支援的語言列表
		const locales = await localeService.getSupportedLocales();

		// 驗證語言列表（mock 中有 en 和 zh-hant 目錄）
		assert.strictEqual(locales.length, 2);
		assert(locales.includes('en'));
		assert(locales.includes('zh-hant'));
	});

	it('should extract messages from JS file content', () => {
		// 使用反射機制訪問私有方法
		const extractMethod = (localeService as any).extractMessagesFromJs;

		// 測試從 JS 檔案提取訊息
		const messages = extractMethod(enMessagesContent);

		// 驗證提取結果
		assert.strictEqual(messages['VSCODE_PLEASE_OPEN_PROJECT'], 'Please open a folder first.');
		assert.strictEqual(messages['VSCODE_OPEN_FOLDER'], 'Open Folder');
		assert.strictEqual(messages['VSCODE_FAILED_SAVE_FILE'], 'Failed to save file: {0}');
	});

	it('should use file cache for repeated loads', async () => {
		// 首次載入
		await localeService.loadUIMessages();

		// 設置監視器
		const readFileSpy = sinon.spy(fsServiceMock.promises, 'readFile');

		// 再次載入
		await localeService.loadUIMessages();

		// 驗證沒有再次讀取檔案
		assert.strictEqual(readFileSpy.callCount, 0);
	});

	it('should fallback to English if language file not found', async () => {
		// 設置一個不存在語言檔案的環境
		vscodeMock.env.language = 'es'; // 設置為西班牙語
		const noFileLocaleService = new LocaleService(extensionPath, fsServiceMock as any, vscodeMock as any);

		// 測試訊息載入（西班牙語檔案不存在，應回退到英文）
		const messages = await noFileLocaleService.loadUIMessages();

		// 驗證回退到英文
		assert.strictEqual(messages['VSCODE_PLEASE_OPEN_PROJECT'], 'Please open a folder first.');
	});
});
