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
import { describe, it, beforeEach, afterEach } from 'mocha';
import { SettingsManager } from '../services/settingsManager';
import { FileService } from '../services/fileService';
import { FSMock } from './helpers/mocks';

describe('Settings Manager', () => {
	let fsServiceMock: any;
	let fsMock: FSMock;
	let settingsManager: SettingsManager;
	let fileServiceStub: sinon.SinonStubbedInstance<FileService>;
	const workspacePath = '/mock/workspace';
	const settingsPath = path.join('.vscode', 'settings.json');

	// 在每個測試之前設置環境
	beforeEach(() => {
		// 建立檔案系統模擬
		fsMock = new FSMock();

		// 替換原始的 fs 模組
		fsServiceMock = {
			promises: fsMock.promises,
			existsSync: fsMock.existsSync,
		};

		// 建立 FileService 的 stub
		fileServiceStub = sinon.createStubInstance(FileService);
		// 使用 sinon 替換 FileService 的建構函數
		const originalFileService = require('../services/fileService').FileService;
		sinon.stub(require('../services/fileService'), 'FileService').callsFake((...args: unknown[]) => {
			const path = args[0] as string;
			if (path === workspacePath) {
				return fileServiceStub;
			}
			return new originalFileService(path);
		});

		// 初始化設定管理器
		settingsManager = new SettingsManager(workspacePath);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		sinon.restore();
		fsMock.reset();
	});

	it('should read settings with default value', async () => {
		// 設定一個空的設定檔
		fileServiceStub.readJsonFile.resolves({});

		// 測試讀取不存在的設定
		const result = await settingsManager.readSetting('test.setting', 'default');

		// 驗證讀取設定及回傳預設值
		assert.strictEqual(result, 'default');
		assert(fileServiceStub.readJsonFile.calledWith(settingsPath, {}));
	});

	it('should read existing settings', async () => {
		// 設定包含測試設定的設定檔
		fileServiceStub.readJsonFile.resolves({
			'test.setting': 'value',
		});

		// 測試讀取存在的設定
		const result = await settingsManager.readSetting('test.setting', 'default');

		// 驗證讀取設定及回傳實際值
		assert.strictEqual(result, 'value');
	});

	it('should update settings', async () => {
		// 設定一個現有的設定檔
		const existingSettings = { 'existing.setting': 'value' };
		fileServiceStub.readJsonFile.resolves(existingSettings);

		// 測試更新設定
		await settingsManager.updateSetting('test.setting', 'new-value');

		// 驗證寫入更新後的設定
		const expectedSettings = {
			'existing.setting': 'value',
			'test.setting': 'new-value',
		};
		assert(fileServiceStub.writeJsonFile.calledWith(settingsPath, expectedSettings));
	});

	it('should configure PlatformIO settings', async () => {
		// 設定一個現有的設定檔
		const existingSettings = { 'existing.setting': 'value' };
		fileServiceStub.readJsonFile.resolves(existingSettings);

		// 測試設定 PlatformIO
		await settingsManager.configurePlatformIOSettings();

		// 驗證寫入正確的設定
		const expectedSettings = {
			'existing.setting': 'value',
			'platformio-ide.autoOpenPlatformIOIniFile': false,
			'platformio-ide.disablePIOHomeStartup': true,
			'singular-blockly.theme': 'light',
		};
		assert(fileServiceStub.writeJsonFile.calledWith(settingsPath, expectedSettings));
	});

	it('should get theme setting', async () => {
		// 設定包含主題設定的設定檔
		fileServiceStub.readJsonFile.resolves({
			'singular-blockly.theme': 'dark',
		});

		// 測試獲取主題
		const theme = await settingsManager.getTheme();

		// 驗證主題設定
		assert.strictEqual(theme, 'dark');
	});

	it('should update theme setting', async () => {
		// 設定一個現有的設定檔
		fileServiceStub.readJsonFile.resolves({});

		// 測試更新主題
		await settingsManager.updateTheme('dark');
		// 驗證更新主題設定
		assert(fileServiceStub.writeJsonFile.calledOnce);
		const writeArgs = fileServiceStub.writeJsonFile.getCall(0).args;
		assert.strictEqual(writeArgs[0], settingsPath);
		// 使用類型斷言處理 unknown 類型
		assert.strictEqual((writeArgs[1] as { 'singular-blockly.theme': string })['singular-blockly.theme'], 'dark');
	});

	it('should toggle theme from light to dark', async () => {
		// 設定主題為 light
		fileServiceStub.readJsonFile.resolves({
			'singular-blockly.theme': 'light',
		});
		// 模擬 updateSetting 方法
		const updateThemeStub = sinon.stub(settingsManager, 'updateTheme').resolves();

		// 測試切換主題
		const newTheme = await settingsManager.toggleTheme();

		// 驗證主題切換
		assert.strictEqual(newTheme, 'dark');
		assert(updateThemeStub.calledWith('dark'));
	});

	it('should toggle theme from dark to light', async () => {
		// 設定主題為 dark
		fileServiceStub.readJsonFile.resolves({
			'singular-blockly.theme': 'dark',
		});
		// 模擬 updateSetting 方法
		const updateThemeStub = sinon.stub(settingsManager, 'updateTheme').resolves();

		// 測試切換主題
		const newTheme = await settingsManager.toggleTheme();

		// 驗證主題切換
		assert.strictEqual(newTheme, 'light');
		assert(updateThemeStub.calledWith('light'));
	});
});
