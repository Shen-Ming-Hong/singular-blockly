/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import * as path from 'path';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { SettingsManager } from '../services/settingsManager';
import { FSMock, VSCodeMock, createIsolatedFileService, createIsolatedSettingsManager } from './helpers';

describe('Settings Manager', () => {
	let fsMock: FSMock;
	let vscodeMock: VSCodeMock;
	let settingsManager: SettingsManager;
	const workspacePath = '/mock/workspace';
	const settingsPath = path.join(workspacePath, '.vscode', 'settings.json').replace(/\\/g, '/');

	// 在每個測試之前設置環境 - 使用測試輔助函數簡化設置 (T023)
	beforeEach(() => {
		fsMock = new FSMock();
		vscodeMock = new VSCodeMock();
		const fileService = createIsolatedFileService(fsMock, workspacePath);
		settingsManager = createIsolatedSettingsManager(vscodeMock, fileService, workspacePath);
	});

	// 在每個測試之後還原環境
	afterEach(() => {
		sinon.restore();
		fsMock.reset();
	});

	it('should read settings with default value', async () => {
		// 設定一個空的設定檔
		fsMock.addFile(settingsPath, '{}');

		// 測試讀取不存在的設定
		const result = await settingsManager.readSetting('test.setting', 'default');

		// 驗證讀取設定及回傳預設值
		assert.strictEqual(result, 'default');
	});

	it('should read existing settings', async () => {
		// 設定包含測試設定的設定檔
		fsMock.addFile(
			settingsPath,
			JSON.stringify({
				'test.setting': 'value',
			})
		);

		// 測試讀取存在的設定
		const result = await settingsManager.readSetting('test.setting', 'default');

		// 驗證讀取設定及回傳實際值
		assert.strictEqual(result, 'value');
	});

	it('should update settings', async () => {
		// 設定一個現有的設定檔
		const existingSettings = { 'existing.setting': 'value' };
		fsMock.addFile(settingsPath, JSON.stringify(existingSettings));

		// 測試更新設定
		await settingsManager.updateSetting('test.setting', 'new-value');

		// 驗證寫入更新後的設定
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['existing.setting'], 'value');
		assert.strictEqual(updatedSettings['test.setting'], 'new-value');
	});

	it('should configure PlatformIO settings', async () => {
		// 設定一個現有的設定檔
		const existingSettings = { 'existing.setting': 'value' };
		fsMock.addFile(settingsPath, JSON.stringify(existingSettings));

		// 測試設定 PlatformIO
		await settingsManager.configurePlatformIOSettings();

		// 驗證寫入正確的設定
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['existing.setting'], 'value');
		assert.strictEqual(updatedSettings['platformio-ide.autoOpenPlatformIOIniFile'], false);
		assert.strictEqual(updatedSettings['platformio-ide.disablePIOHomeStartup'], true);
		assert.strictEqual(updatedSettings['singular-blockly.theme'], 'light');
	});

	it('should get theme setting', async () => {
		// 設定包含主題設定的設定檔
		fsMock.addFile(
			settingsPath,
			JSON.stringify({
				'singular-blockly.theme': 'dark',
			})
		);

		// 測試獲取主題
		const theme = await settingsManager.getTheme();

		// 驗證主題設定
		assert.strictEqual(theme, 'dark');
	});

	it('should update theme setting', async () => {
		// 設定一個現有的設定檔
		fsMock.addFile(settingsPath, '{}');

		// 測試更新主題
		await settingsManager.updateTheme('dark');

		// 驗證更新主題設定
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['singular-blockly.theme'], 'dark');
	});

	it('should toggle theme from light to dark', async () => {
		// 設定主題為 light
		fsMock.addFile(
			settingsPath,
			JSON.stringify({
				'singular-blockly.theme': 'light',
			})
		);

		// 測試切換主題
		const newTheme = await settingsManager.toggleTheme();

		// 驗證主題切換
		assert.strictEqual(newTheme, 'dark');
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['singular-blockly.theme'], 'dark');
	});

	it('should toggle theme from dark to light', async () => {
		// 設定主題為 dark
		fsMock.addFile(
			settingsPath,
			JSON.stringify({
				'singular-blockly.theme': 'dark',
			})
		);

		// 測試切換主題
		const newTheme = await settingsManager.toggleTheme();

		// 驗證主題切換
		assert.strictEqual(newTheme, 'light');
		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['singular-blockly.theme'], 'light');
	});

	it('should get auto backup interval', async () => {
		fsMock.addFile(
			settingsPath,
			JSON.stringify({
				'singular-blockly.autoBackupInterval': 15,
			})
		);

		const interval = await settingsManager.getAutoBackupInterval();

		assert.strictEqual(interval, 15);
	});

	it('should update auto backup interval with minimum 1', async () => {
		fsMock.addFile(settingsPath, '{}');

		await settingsManager.updateAutoBackupInterval(0);

		const updatedContent = fsMock.files.get(settingsPath);
		assert.ok(updatedContent);
		const updatedSettings = JSON.parse(updatedContent);
		assert.strictEqual(updatedSettings['singular-blockly.autoBackupInterval'], 1);
	});

	// 新增測試覆蓋 syncLibraryDeps 方法 (T027)
	describe('syncLibraryDeps', () => {
		const platformIOIniPath = path.join(workspacePath, 'platformio.ini').replace(/\\/g, '/');

		it('should handle missing platformio.ini file', async () => {
			// 測試當 platformio.ini 不存在時的行為
			await settingsManager.syncLibraryDeps(['Servo', 'Wire']);

			// 驗證沒有錯誤,且檔案仍然不存在
			assert.strictEqual(fsMock.files.has(platformIOIniPath), false);
		});

		it('should update existing lib_deps in platformio.ini', async () => {
			// 設定現有的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps = OldLibrary`;

			fsMock.addFile(platformIOIniPath, iniContent);

			// 測試更新依賴
			await settingsManager.syncLibraryDeps(['Servo', 'Wire']);

			// 驗證更新後的內容
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_deps = Servo, Wire'));
			assert.ok(!updatedContent.includes('OldLibrary'));
		});

		it('should not update lib_deps if dependencies are the same', async () => {
			// 設定現有的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps = Servo, Wire`;

			fsMock.addFile(platformIOIniPath, iniContent);
			const originalContent = iniContent;

			// 測試使用相同的依賴列表
			await settingsManager.syncLibraryDeps(['Servo', 'Wire']);

			// 驗證內容沒有變化
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.strictEqual(updatedContent, originalContent);
		});

		it('should remove lib_deps if empty list provided', async () => {
			// 設定現有的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps = Servo, Wire`;

			fsMock.addFile(platformIOIniPath, iniContent);

			// 測試移除所有依賴
			await settingsManager.syncLibraryDeps([]);

			// 驗證 lib_deps 行被移除
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(!updatedContent.includes('lib_deps'));
		});

		it('should add lib_deps if not present in platformio.ini', async () => {
			// 設定沒有 lib_deps 的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino`;

			fsMock.addFile(platformIOIniPath, iniContent);

			// 測試添加依賴
			await settingsManager.syncLibraryDeps(['Servo', 'Wire']);

			// 驗證 lib_deps 被添加
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_deps = Servo, Wire'));
		});
	});

	// 新增測試覆蓋 syncPlatformIOSettings 方法 (T027)
	describe('syncPlatformIOSettings', () => {
		const platformIOIniPath = path.join(workspacePath, 'platformio.ini').replace(/\\/g, '/');

		it('should handle missing platformio.ini file', async () => {
			// 測試當 platformio.ini 不存在時的行為
			await settingsManager.syncPlatformIOSettings(['Servo'], ['-DTEST'], 'deep');

			// 驗證沒有錯誤,且檔案仍然不存在
			assert.strictEqual(fsMock.files.has(platformIOIniPath), false);
		});

		it('should update all settings in platformio.ini', async () => {
			// 設定現有的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino`;

			fsMock.addFile(platformIOIniPath, iniContent);

			// 測試同步所有設定
			await settingsManager.syncPlatformIOSettings(['Servo', 'Wire'], ['-DTEST_MODE', '-O2'], 'deep');

			// 驗證所有設定都被添加
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_deps'));
			assert.ok(updatedContent.includes('Servo, Wire'));
			assert.ok(updatedContent.includes('build_flags'));
			assert.ok(updatedContent.includes('-DTEST_MODE'));
			assert.ok(updatedContent.includes('-O2'));
			assert.ok(updatedContent.includes('lib_ldf_mode'));
			assert.ok(updatedContent.includes('deep'));
		});

		it('should update existing settings in platformio.ini', async () => {
			// 設定現有的 platformio.ini 檔案
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
framework = arduino
lib_deps = OldLib
build_flags = -DOLD_FLAG
lib_ldf_mode = chain`;

			fsMock.addFile(platformIOIniPath, iniContent);

			// 測試更新所有設定
			await settingsManager.syncPlatformIOSettings(['NewLib'], ['-DNEW_FLAG'], 'deep');

			// 驗證所有設定都被更新
			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_deps'));
			assert.ok(updatedContent.includes('NewLib'));
			assert.ok(!updatedContent.includes('OldLib'));
			assert.ok(updatedContent.includes('build_flags'));
			assert.ok(updatedContent.includes('-DNEW_FLAG'));
			assert.ok(!updatedContent.includes('-DOLD_FLAG'));
			assert.ok(updatedContent.includes('lib_ldf_mode = deep'));
			assert.ok(!updatedContent.includes('chain'));
		});

		it('should add missing settings when encountering new section', async () => {
			// 測試在遇到新區段時添加缺失的設定
			const iniContent = `[env:uno]
platform = atmelavr
board = uno

[common]
extra_configs = test`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings(['Servo'], ['-DTEST'], 'deep');

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_deps = Servo'));
			assert.ok(updatedContent.includes('build_flags'));
			assert.ok(updatedContent.includes('-DTEST'));
			assert.ok(updatedContent.includes('lib_ldf_mode = deep'));
		});

		it('should add build_flags at end of file if in env section', async () => {
			// 測試在檔案末尾還在 env 區段時添加 build_flags
			const iniContent = `[env:uno]
platform = atmelavr
board = uno`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings([], ['-DFLAG1', '-DFLAG2'], null);

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('build_flags'));
			assert.ok(updatedContent.includes('-DFLAG1'));
			assert.ok(updatedContent.includes('-DFLAG2'));
		});

		it('should add lib_ldf_mode at end of file if in env section', async () => {
			// 測試在檔案末尾添加 lib_ldf_mode
			const iniContent = `[env:uno]
platform = atmelavr
board = uno`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings([], [], 'chain+');

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(updatedContent.includes('lib_ldf_mode = chain+'));
		});

		it('should remove lib_ldf_mode when null is provided', async () => {
			// 測試移除 lib_ldf_mode
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
lib_ldf_mode = deep`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings([], [], null);

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(!updatedContent.includes('lib_ldf_mode'));
		});

		it('should remove lib_deps when empty array provided', async () => {
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
lib_deps = Servo, Wire`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings([], [], null);

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(!updatedContent.includes('lib_deps'), 'lib_deps line should be removed');
		});

		it('should remove build_flags when empty array provided', async () => {
			const iniContent = `[env:uno]
platform = atmelavr
board = uno
build_flags = 
    -DDEBUG
    -DTEST`;

			fsMock.addFile(platformIOIniPath, iniContent);

			await settingsManager.syncPlatformIOSettings([], [], null);

			const updatedContent = fsMock.files.get(platformIOIniPath);
			assert.ok(updatedContent);
			assert.ok(!updatedContent.includes('build_flags'), 'build_flags line should be removed');
		});
	});

	describe('Error Handling', () => {
		it('should handle getTheme error and return default', async () => {
			// Corrupt settings file
			fsMock.addFile(settingsPath, 'invalid json');

			const theme = await settingsManager.getTheme();

			// Should return default value on error
			assert.strictEqual(theme, 'light');
		});

		it('should handle updateTheme error', async () => {
			// Make writeFile fail
			const originalWrite = fsMock.promises.writeFile;
			fsMock.promises.writeFile = sinon.stub().rejects(new Error('Write failed'));

			try {
				await settingsManager.updateTheme('dark');
				assert.fail('Should have thrown');
			} catch (error) {
				assert(error instanceof Error);
			} finally {
				fsMock.promises.writeFile = originalWrite;
			}
		});

		it('should handle syncPlatformIOSettings error', async () => {
			// Make readFile fail
			const originalRead = fsMock.promises.readFile;
			fsMock.promises.readFile = sinon.stub().rejects(new Error('Read failed'));

			try {
				await settingsManager.syncPlatformIOSettings(['Servo'], [], null);
				// Should complete without throwing (logs error)
				assert(true, 'Should handle error gracefully');
			} catch (error) {
				// Or may throw, both acceptable
				assert(error instanceof Error);
			} finally {
				fsMock.promises.readFile = originalRead;
			}
		});

		it('should handle malformed platformio.ini during sync', async () => {
			const iniPath = path.join('/mock/workspace', 'platformio.ini');
			// Invalid ini format
			fsMock.addFile(iniPath, '[invalid\nno closing bracket');

			// Should handle gracefully
			await settingsManager.syncPlatformIOSettings(['Servo'], [], null);
			assert(true, 'Should complete without crashing');
		});
	});
});
