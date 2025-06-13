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

	// 自動備份設定鍵名
	private readonly AUTO_BACKUP_INTERVAL_KEY = 'singular-blockly.autoBackupInterval';
	private readonly DEFAULT_AUTO_BACKUP_INTERVAL = 30; // 預設 30 分鐘

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

	/**
	 * 同步 platformio.ini 的 lib_deps 與提供的函式庫列表
	 * @param libDeps 當前需要的函式庫依賴列表
	 */
	async syncLibraryDeps(libDeps: string[]): Promise<void> {
		try {
			const iniPath = 'platformio.ini';

			// 檢查檔案是否存在
			if (!this.fileService.fileExists(iniPath)) {
				log(`platformio.ini not found, cannot sync library dependencies`, 'warn');
				return;
			}

			// 讀取現有內容
			const content = await this.fileService.readFile(iniPath);
			const lines = content.split(/\r?\n/);
			let updated = false;
			let inEnvSection = false;

			// 遍歷檔案找到 lib_deps 行並更新
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const trimmed = line.trim();

				// 檢測環境區段開始
				if (/^\s*\[env:/.test(line)) {
					inEnvSection = true;
					continue;
				}

				// 當在環境區段中找到 lib_deps 行時
				if (inEnvSection && trimmed.startsWith('lib_deps')) {
					// 解析現有依賴
					const equalIndex = trimmed.indexOf('=');
					if (equalIndex < 0) {
						continue;
					}

					const depsPrefix = trimmed.substring(0, equalIndex + 1);
					const existingDeps = trimmed
						.substring(equalIndex + 1)
						.split(',')
						.map(d => d.trim())
						.filter(d => d.length > 0);

					// 如果提供的依賴列表為空，且現有依賴不為空，則移除 lib_deps 行
					if (libDeps.length === 0 && existingDeps.length > 0) {
						lines.splice(i, 1);
						updated = true;
						log(`Removed lib_deps from platformio.ini as no libraries are needed`, 'info');
						break;
					}

					// 如果提供的依賴列表不為空，更新現有依賴行
					if (libDeps.length > 0) {
						// 檢查依賴列表是否有變化
						const sortedExisting = [...existingDeps].sort();
						const sortedNew = [...libDeps].sort();

						// 如果依賴列表沒有變化，不需要更新
						if (JSON.stringify(sortedExisting) === JSON.stringify(sortedNew)) {
							log(`Library dependencies are already in sync`, 'info');
							return;
						}

						// 更新依賴行
						lines[i] = `${depsPrefix} ${libDeps.join(', ')}`;
						updated = true;
						log(`Updated lib_deps in platformio.ini: ${libDeps.join(', ')}`, 'info');
						break;
					}
				}

				// 如果遇到新區段開始或檔案結束，且尚未找到 lib_deps 行
				// 但我們有需要添加的依賴，就在適當位置插入新的 lib_deps 行
				if (inEnvSection && (line.trim().startsWith('[') || i === lines.length - 1)) {
					if (libDeps.length > 0) {
						lines.splice(i, 0, `lib_deps = ${libDeps.join(', ')}`);
						updated = true;
						log(`Added lib_deps to platformio.ini: ${libDeps.join(', ')}`, 'info');
					}
					break;
				}
			}

			// 如果檔案內容有更新，寫回檔案
			if (updated) {
				await this.fileService.writeFile(iniPath, lines.join('\n'));
			}
		} catch (error) {
			log(`Failed to sync library dependencies in platformio.ini: ${error}`, 'error', error);
		}
	}

	/**
	 * 同步 platformio.ini 的所有設定（lib_deps、build_flags、lib_ldf_mode）
	 * @param libDeps 當前需要的函式庫依賴列表
	 * @param buildFlags 當前需要的編譯標誌列表
	 * @param libLdfMode 庫連結模式
	 */
	async syncPlatformIOSettings(libDeps: string[], buildFlags: string[], libLdfMode: string | null): Promise<void> {
		try {
			const iniPath = 'platformio.ini';

			// 檢查檔案是否存在
			if (!this.fileService.fileExists(iniPath)) {
				log(`platformio.ini not found, cannot sync platformio settings`, 'warn');
				return;
			}

			// 讀取現有內容
			const content = await this.fileService.readFile(iniPath);
			const lines = content.split(/\r?\n/);
			let updated = false;
			let inEnvSection = false;
			let libDepsFound = false;
			let buildFlagsFound = false;
			let libLdfModeFound = false;

			// 遍歷檔案找到各個設定並更新
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const trimmed = line.trim();

				// 檢測環境區段開始
				if (/^\s*\[env:/.test(line)) {
					inEnvSection = true;
					continue;
				}

				// 檢測新區段開始
				if (inEnvSection && trimmed.startsWith('[') && !trimmed.startsWith('[env:')) {
					// 在離開 env 區段前，檢查是否需要添加缺少的設定
					if (libDeps.length > 0 && !libDepsFound) {
						lines.splice(i, 0, `lib_deps = ${libDeps.join(', ')}`);
						updated = true;
						i++; // 調整索引
						log(`Added lib_deps to platformio.ini: ${libDeps.join(', ')}`, 'info');
					}
					if (buildFlags.length > 0 && !buildFlagsFound) {
						lines.splice(i, 0, `build_flags = `);
						for (const flag of buildFlags) {
							lines.splice(i + 1, 0, `    ${flag}`);
							i++; // 調整索引
						}
						updated = true;
						i++; // 調整索引
						log(`Added build_flags to platformio.ini: ${buildFlags.join(', ')}`, 'info');
					}
					if (libLdfMode && !libLdfModeFound) {
						lines.splice(i, 0, `lib_ldf_mode = ${libLdfMode}`);
						updated = true;
						i++; // 調整索引
						log(`Added lib_ldf_mode to platformio.ini: ${libLdfMode}`, 'info');
					}
					break;
				}

				if (inEnvSection) {
					// 處理 lib_deps
					if (trimmed.startsWith('lib_deps')) {
						libDepsFound = true;
						const equalIndex = trimmed.indexOf('=');
						if (equalIndex >= 0) {
							const depsPrefix = trimmed.substring(0, equalIndex + 1);

							if (libDeps.length === 0) {
								lines.splice(i, 1);
								updated = true;
								i--; // 調整索引
								log(`Removed lib_deps from platformio.ini as no libraries are needed`, 'info');
							} else {
								lines[i] = `${depsPrefix} ${libDeps.join(', ')}`;
								updated = true;
								log(`Updated lib_deps in platformio.ini: ${libDeps.join(', ')}`, 'info');
							}
						}
					}
					// 處理 build_flags
					else if (trimmed.startsWith('build_flags')) {
						buildFlagsFound = true;
						if (buildFlags.length === 0) {
							// 移除 build_flags 行及其延續行
							let j = i;
							lines.splice(j, 1);
							// 移除後續的縮排行
							while (j < lines.length && lines[j].startsWith('    ') && !lines[j].trim().includes('=')) {
								lines.splice(j, 1);
							}
							updated = true;
							i--; // 調整索引
							log(`Removed build_flags from platformio.ini as no flags are needed`, 'info');
						} else {
							// 更新 build_flags
							lines[i] = 'build_flags = ';
							let j = i + 1;
							// 移除現有的縮排行
							while (j < lines.length && lines[j].startsWith('    ') && !lines[j].trim().includes('=')) {
								lines.splice(j, 1);
							}
							// 添加新的標誌
							for (let k = 0; k < buildFlags.length; k++) {
								lines.splice(i + 1 + k, 0, `    ${buildFlags[k]}`);
							}
							updated = true;
							i += buildFlags.length; // 調整索引
							log(`Updated build_flags in platformio.ini: ${buildFlags.join(', ')}`, 'info');
						}
					}
					// 處理 lib_ldf_mode
					else if (trimmed.startsWith('lib_ldf_mode')) {
						libLdfModeFound = true;
						const equalIndex = trimmed.indexOf('=');
						if (equalIndex >= 0) {
							if (!libLdfMode) {
								lines.splice(i, 1);
								updated = true;
								i--; // 調整索引
								log(`Removed lib_ldf_mode from platformio.ini`, 'info');
							} else {
								const prefix = trimmed.substring(0, equalIndex + 1);
								lines[i] = `${prefix} ${libLdfMode}`;
								updated = true;
								log(`Updated lib_ldf_mode in platformio.ini: ${libLdfMode}`, 'info');
							}
						}
					}
				}
			}

			// 如果到了檔案末尾還在 env 區段內，且有需要添加的設定
			if (inEnvSection) {
				if (libDeps.length > 0 && !libDepsFound) {
					lines.push(`lib_deps = ${libDeps.join(', ')}`);
					updated = true;
					log(`Added lib_deps to platformio.ini: ${libDeps.join(', ')}`, 'info');
				}
				if (buildFlags.length > 0 && !buildFlagsFound) {
					lines.push('build_flags = ');
					for (const flag of buildFlags) {
						lines.push(`    ${flag}`);
					}
					updated = true;
					log(`Added build_flags to platformio.ini: ${buildFlags.join(', ')}`, 'info');
				}
				if (libLdfMode && !libLdfModeFound) {
					lines.push(`lib_ldf_mode = ${libLdfMode}`);
					updated = true;
					log(`Added lib_ldf_mode to platformio.ini: ${libLdfMode}`, 'info');
				}
			}

			// 如果檔案內容有更新，寫回檔案
			if (updated) {
				await this.fileService.writeFile(iniPath, lines.join('\n'));
			}
		} catch (error) {
			log(`Error syncing platformio.ini settings: ${error}`, 'error');
			throw error;
		}
	}

	/**
	 * 取得自動備份時間間隔（分鐘）
	 * @returns 自動備份時間間隔，預設為 5 分鐘
	 */
	async getAutoBackupInterval(): Promise<number> {
		return this.readSetting<number>(this.AUTO_BACKUP_INTERVAL_KEY, this.DEFAULT_AUTO_BACKUP_INTERVAL);
	}

	/**
	 * 更新自動備份時間間隔
	 * @param minutes 分鐘數
	 */
	async updateAutoBackupInterval(minutes: number): Promise<void> {
		// 確保輸入值有效（至少 1 分鐘）
		const validMinutes = Math.max(1, minutes);
		await this.updateSetting(this.AUTO_BACKUP_INTERVAL_KEY, validMinutes);
		log(`Auto backup interval updated to ${validMinutes} minutes`, 'info');
	}
}
