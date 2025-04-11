/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { FileService } from './fileService';
import { log } from './logging';

/**
 * 設定管理器類別
 * 負責處理專案和擴充功能的設定
 */
export class SettingsManager {
	private readonly VS_CODE_DIR = '.vscode';
	private readonly SETTINGS_FILE = 'settings.json';
	private fileService: FileService;

	/**
	 * 建立設定管理器實例
	 * @param workspacePath 工作區路徑
	 */
	constructor(private workspacePath: string) {
		this.fileService = new FileService(workspacePath);
	}

	/**
	 * 取得 VS Code 設定檔的路徑
	 */
	private get settingsPath(): string {
		return path.join(this.VS_CODE_DIR, this.SETTINGS_FILE);
	}

	/**
	 * 讀取設定值
	 * @param key 設定鍵名
	 * @param defaultValue 預設值
	 * @returns 設定值或預設值
	 */
	async readSetting<T>(key: string, defaultValue: T): Promise<T> {
		try {
			// 確保 .vscode 目錄存在
			await this.fileService.createDirectory(this.VS_CODE_DIR);

			// 讀取設定檔
			const settings = await this.fileService.readJsonFile<Record<string, any>>(this.settingsPath, {});

			return settings[key] !== undefined ? settings[key] : defaultValue;
		} catch (error) {
			log(`Error reading setting ${key}:`, 'error', error);
			return defaultValue;
		}
	}

	/**
	 * 更新設定值
	 * @param key 設定鍵名
	 * @param value 設定值
	 */
	async updateSetting<T>(key: string, value: T): Promise<void> {
		try {
			// 確保 .vscode 目錄存在
			await this.fileService.createDirectory(this.VS_CODE_DIR);

			// 讀取現有設定
			const settings = await this.fileService.readJsonFile<Record<string, any>>(this.settingsPath, {});

			// 更新設定
			settings[key] = value;

			// 寫回設定檔
			await this.fileService.writeJsonFile(this.settingsPath, settings);
			log(`Setting updated: ${key} = ${JSON.stringify(value)}`, 'info');
		} catch (error) {
			log(`Error updating setting ${key}:`, 'error', error);
			throw error;
		}
	}

	/**
	 * 設定 PlatformIO 相關設定
	 */
	async configurePlatformIOSettings(): Promise<void> {
		try {
			// 確保 .vscode 目錄存在
			await this.fileService.createDirectory(this.VS_CODE_DIR);

			// 讀取現有設定
			const settings = await this.fileService.readJsonFile<Record<string, any>>(this.settingsPath, {});

			// 更新 PlatformIO 相關設定
			settings['platformio-ide.autoOpenPlatformIOIniFile'] = false;
			settings['platformio-ide.disablePIOHomeStartup'] = true;

			// 確保 Singular Blockly 主題設定存在
			if (!settings['singular-blockly.theme']) {
				settings['singular-blockly.theme'] = 'light';
			}

			// 寫回設定檔
			await this.fileService.writeJsonFile(this.settingsPath, settings);
			log('PlatformIO settings configured successfully', 'info');
		} catch (error) {
			log('Failed to configure PlatformIO settings:', 'error', error);
		}
	}

	/**
	 * 獲取當前主題設定
	 * @returns 當前主題 ('light' 或 'dark')
	 */
	async getTheme(): Promise<string> {
		return await this.readSetting<string>('singular-blockly.theme', 'light');
	}

	/**
	 * 更新主題設定
	 * @param theme 主題名稱 ('light' 或 'dark')
	 */
	async updateTheme(theme: 'light' | 'dark'): Promise<void> {
		await this.updateSetting('singular-blockly.theme', theme);
		log(`Theme updated to: ${theme}`, 'info');
	}

	/**
	 * 切換主題
	 * @returns 切換後的主題
	 */
	async toggleTheme(): Promise<string> {
		const currentTheme = await this.getTheme();
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		await this.updateTheme(newTheme);
		return newTheme;
	}
}
