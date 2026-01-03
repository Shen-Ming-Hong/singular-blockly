/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { log, handleWebViewLog } from '../services/logging';
import { FileService } from '../services/fileService';
import { SettingsManager } from '../services/settingsManager';
import { LocaleService } from '../services/localeService';
import { MicropythonUploader, UploadProgress, UploadResult, ComPortInfo } from '../services/micropythonUploader';
import { ArduinoUploader } from '../services/arduinoUploader';
import { ArduinoUploadProgress, ArduinoUploadResult, ArduinoUploadRequest, getBoardLanguage } from '../types/arduino';

// Timing constants
const UI_MESSAGE_DELAY_MS = 100;
const UI_REVEAL_DELAY_MS = 200;
const BOARD_CONFIG_REQUEST_TIMEOUT_MS = 10000;

// VSCode API 引用（可在測試中注入）
let vscodeApi: typeof vscode = vscode;

/**
 * 設置 VSCode API 引用（僅用於測試）
 * @param api VSCode API 實例
 */
export function _setVSCodeApi(api: typeof vscode): void {
	vscodeApi = api;
}

/**
 * 重置為生產環境預設值（僅用於測試）
 */
export function _reset(): void {
	vscodeApi = vscode;
}

/**
 * 上傳請求介面（擴展支援 Arduino）
 */
interface UploadRequestMessage {
	code: string;
	board: string;
	port?: string;
	lib_deps?: string[];
	build_flags?: string[];
	lib_ldf_mode?: string;
}

/**
 * WebView 訊息處理器類別
 * 負責處理 WebView 與擴充功能間的訊息傳遞
 */
export class WebViewMessageHandler {
	private fileService: FileService;
	private settingsManager: SettingsManager;

	/**
	 * 建立 WebView 訊息處理器
	 * @param context 擴充功能上下文
	 * @param panel WebView 面板
	 * @param localeService 多語言服務
	 * @param fileService 檔案服務（可選，用於測試）
	 * @param settingsManager 設定管理器（可選，用於測試）
	 */
	constructor(
		private context: vscode.ExtensionContext,
		private panel: vscode.WebviewPanel,
		private localeService: LocaleService,
		fileService?: FileService,
		settingsManager?: SettingsManager
	) {
		if (fileService && settingsManager) {
			// 測試環境：使用注入的 services
			this.fileService = fileService;
			this.settingsManager = settingsManager;
		} else {
			// 生產環境：創建 services
			const workspaceFolders = vscodeApi.workspace.workspaceFolders;
			if (!workspaceFolders) {
				throw new Error('No workspace folder open');
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			this.fileService = new FileService(workspaceRoot);
			this.settingsManager = new SettingsManager(workspaceRoot);
		}
	}

	/**
	 * 處理從 WebView 接收到的訊息
	 * @param message WebView 傳送的訊息
	 */
	async handleMessage(message: any): Promise<void> {
		try {
			switch (message.command) {
				case 'log':
					this.handleLogMessage(message);
					break;
				case 'updateCode':
					await this.handleUpdateCode(message);
					break;
				case 'updateBoard':
					await this.handleUpdateBoard(message);
					break;
				case 'saveWorkspace':
					await this.handleSaveWorkspace(message);
					break;
				case 'requestInitialState':
					await this.handleRequestInitialState();
					break;
				case 'promptNewVariable':
					await this.handlePromptNewVariable(message);
					break;
				case 'confirmDeleteVariable':
					await this.handleConfirmDeleteVariable(message);
					break;
				case 'confirmDialog':
					await this.handleConfirmDialog(message);
					break;
				case 'updateTheme':
					await this.handleUpdateTheme(message);
					break;
				case 'createBackup':
					await this.handleCreateBackup(message);
					break;
				case 'getBackupList':
					await this.handleGetBackupList();
					break;
				case 'deleteBackup':
					await this.handleDeleteBackup(message);
					break;
				case 'restoreBackup':
					await this.handleRestoreBackup(message);
					break;
				case 'previewBackup':
					await this.handlePreviewBackup(message);
					break;
				case 'getAutoBackupSettings':
					await this.handleGetAutoBackupSettings();
					break;
				case 'updateAutoBackupSettings':
					await this.handleUpdateAutoBackupSettings(message);
					break;
				case 'boardConfigResult':
					// 這個訊息是對 getBoardConfig 請求的回應，不需要特殊處理
					break;
				// MCP Server 整合 - T031: 處理工作區重載請求
				case 'requestWorkspaceReload':
					await this.handleRequestWorkspaceReload();
					break;
				// CyberBrick MicroPython 上傳功能
				case 'requestUpload':
					await this.handleRequestUpload(message);
					break;
				case 'requestPortList':
					await this.handleRequestPortList(message);
					break;
				case 'deletePlatformioIni':
					await this.handleDeletePlatformioIni();
					break;
				default:
					log(`Unhandled message command: ${message.command}`, 'warn');
					break;
			}
		} catch (error) {
			log(`Error handling message: ${message.command}`, 'error', error);
			const errorMsg = await this.localeService.getLocalizedMessage(
				'ERROR_PROCESSING_MESSAGE',
				'Error processing message: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}

	/**
	 * 處理日誌訊息
	 * @param message 日誌訊息物件
	 */
	private handleLogMessage(message: any): void {
		handleWebViewLog(message.source || 'blocklyEdit', message.level || 'info', message.message, ...(message.args || []));
	}

	/**
	 * 處理更新程式碼訊息
	 * @param message 更新程式碼訊息物件
	 */
	private async handleUpdateCode(message: any): Promise<void> {
		try {
			const workspaceFolders = vscodeApi.workspace.workspaceFolders;
			if (!workspaceFolders) {
				const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
				const openFolderBtn = await this.localeService.getLocalizedMessage('VSCODE_OPEN_FOLDER');

				vscodeApi.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
					if (selection === openFolderBtn) {
						vscodeApi.commands.executeCommand('workbench.action.files.openFolder');
					}
				});
				return;
			}

			// 確保 src 目錄存在
			await this.fileService.createDirectory('src');

			// 根據語言類型決定檔案名稱
			const isMicroPython = message.language === 'micropython';
			const fileName = isMicroPython ? 'src/rc_main.py' : 'src/main.cpp';

			// 寫入程式碼
			await this.fileService.writeFile(fileName, message.code);
			log(`[blockly] 已寫入程式碼到 ${fileName}`, 'info');

			// MicroPython 模式不需要處理 PlatformIO 設定
			if (isMicroPython) {
				return;
			}

			// Arduino 模式：處理函式庫依賴
			// 使用新的 syncLibraryDeps 方法同步函式庫依賴
			const libDeps = message.lib_deps && Array.isArray(message.lib_deps) ? message.lib_deps : [];
			const buildFlags = message.build_flags && Array.isArray(message.build_flags) ? message.build_flags : [];
			const libLdfMode = message.lib_ldf_mode || null;

			log(`收到函式庫依賴列表: ${libDeps.length > 0 ? libDeps.join(', ') : '(無依賴)'}`, 'info');
			if (buildFlags.length > 0) {
				log(`收到編譯標誌: ${buildFlags.join(', ')}`, 'info');
			}
			if (libLdfMode) {
				log(`收到庫連結模式: ${libLdfMode}`, 'info');
			}

			await this.settingsManager.syncPlatformIOSettings(libDeps, buildFlags, libLdfMode);
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_FAILED_SAVE_FILE', (error as Error).message);

			vscodeApi.window.showErrorMessage(errorMsg);
			log(errorMsg, 'error', error);
		}
	}

	/**
	 * 處理更新板子配置訊息
	 * @param message 更新板子訊息物件
	 */
	private async handleUpdateBoard(message: any): Promise<void> {
		try {
			const workspaceFolders = vscodeApi.workspace.workspaceFolders;
			if (!workspaceFolders) {
				const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
				const openFolderBtn = await this.localeService.getLocalizedMessage('VSCODE_OPEN_FOLDER');

				vscodeApi.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
					if (selection === openFolderBtn) {
						vscodeApi.commands.executeCommand('workbench.action.files.openFolder');
					}
				});
				return;
			}
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const platformioIni = 'platformio.ini';
			const boardConfig = await this.getBoardConfig(message.board);

			// CyberBrick 和 none 都不需要 platformio.ini
			const isMicroPythonBoard = message.board === 'cyberbrick';

			if (message.board === 'none' || isMicroPythonBoard) {
				// 刪除 platformio.ini（如果存在）
				if (this.fileService.fileExists(platformioIni)) {
					await this.fileService.deleteFile(platformioIni);
					log(`[blockly] 已刪除 platformio.ini (board: ${message.board})`, 'info');
				}
			} else {
				// 檢查是否收到了額外的 platformio.ini 設定
				const libDeps = message.lib_deps && Array.isArray(message.lib_deps) ? message.lib_deps : [];
				const buildFlags = message.build_flags && Array.isArray(message.build_flags) ? message.build_flags : [];
				const libLdfMode = message.lib_ldf_mode || null;

				log(`更新開發板時的函式庫依賴列表: ${libDeps.length > 0 ? libDeps.join(', ') : '(無依賴)'}`, 'info');

				const isFirstTime = !this.fileService.fileExists(platformioIni);

				// 檢查 platformio.ini 內容是否需要更新，避免無謂的覆寫觸發 PlatformIO 重新檢查
				let needsUpdate = isFirstTime;
				if (!isFirstTime) {
					try {
						const existingConfig = await this.fileService.readFile(platformioIni);
						// 比較基礎配置是否相同（忽略額外的 lib_deps 等設定，那些由 syncPlatformIOSettings 處理）
						needsUpdate = existingConfig.trim() !== boardConfig.trim();
						if (!needsUpdate) {
							log(`platformio.ini 基礎配置未變更，跳過覆寫`, 'info');
						}
					} catch (readError) {
						// 讀取失敗時仍需更新
						needsUpdate = true;
						log(`讀取現有 platformio.ini 失敗，將重新寫入`, 'warn');
					}
				}

				if (needsUpdate) {
					await this.fileService.writeFile(platformioIni, boardConfig);
					log(`已更新 platformio.ini 基礎配置`, 'info');
				}

				// 如果有額外的 platformio.ini 設定，將它們同步到更新後的檔案
				if (libDeps.length > 0 || buildFlags.length > 0 || libLdfMode) {
					await this.settingsManager.syncPlatformIOSettings(libDeps, buildFlags, libLdfMode);
					log(`更新開發板配置後同步 platformio.ini 設定`, 'info');
				}

				// 只有在首次建立或實際更新時才顯示訊息
				if (needsUpdate) {
					// 使用 setTimeout 延遲訊息顯示，避免干擾面板顯示
					setTimeout(async () => {
						const boardUpdatedMsg = await this.localeService.getLocalizedMessage(
							'VSCODE_BOARD_UPDATED',
							'Board configuration updated to: {0}',
							message.board
						);
						const reloadMsg = isFirstTime ? await this.localeService.getLocalizedMessage('VSCODE_RELOAD_REQUIRED') : '';
						const reloadBtn = await this.localeService.getLocalizedMessage('VSCODE_RELOAD');

						vscodeApi.window
							.showInformationMessage(boardUpdatedMsg + reloadMsg, ...(isFirstTime ? [reloadBtn] : []))
							.then(selection => {
								if (selection === reloadBtn) {
									vscodeApi.commands.executeCommand('workbench.action.reloadWindow');
								}
							});
					}, UI_MESSAGE_DELAY_MS); // 確保 Blockly 編輯器保持在前景
				}
				setTimeout(() => this.panel.reveal(vscode.ViewColumn.One, true), UI_REVEAL_DELAY_MS);
			}
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_FAILED_UPDATE_INI', (error as Error).message);

			vscodeApi.window.showErrorMessage(errorMsg);
			log(errorMsg, 'error', error);
		}
	}

	/**
	 * 處理儲存工作區訊息
	 * @param message 儲存工作區訊息物件
	 */
	private async handleSaveWorkspace(message: any): Promise<void> {
		try {
			// 空狀態驗證 - 防止意外覆寫有效資料
			if (this.isEmptyWorkspaceState(message.state)) {
				log('Rejected empty workspace save request', 'warn');
				return;
			}

			const blocklyDir = 'blockly';
			const mainJsonPath = path.join(blocklyDir, 'main.json');

			// 建立 blockly 目錄
			await this.fileService.createDirectory(blocklyDir);

			// 覆寫前備份
			await this.createBackupBeforeSave(mainJsonPath);

			// 驗證並清理資料
			const cleanState = message.state ? JSON.parse(JSON.stringify(message.state)) : {};
			const saveData = {
				workspace: cleanState,
				board: message.board || 'none',
				theme: message.theme || 'light', // 儲存主題設定
			};

			// 驗證 JSON 是否可序列化
			JSON.parse(JSON.stringify(saveData));

			// 寫入檔案
			await this.fileService.writeJsonFile(mainJsonPath, saveData);
		} catch (error) {
			log('Failed to save workspace state:', 'error', error);
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_UNABLE_SAVE_WORKSPACE', (error as Error).message);

			vscodeApi.window.showErrorMessage(errorMsg);
		}
	}

	/**
	 * 判斷 workspace 狀態是否為空
	 * @param state Blockly 序列化狀態
	 * @returns true 表示狀態為空，應拒絕儲存
	 */
	private isEmptyWorkspaceState(state: any): boolean {
		// 狀態不存在
		if (!state) {
			return true;
		}

		// blocks 屬性不存在
		if (!state.blocks) {
			return true;
		}

		// blocks.blocks 陣列不存在
		if (!state.blocks.blocks) {
			return true;
		}

		// 方塊陣列為空
		if (state.blocks.blocks.length === 0) {
			return true;
		}

		return false;
	}

	/**
	 * 覆寫前備份 main.json 到 main.json.bak
	 * @param mainJsonPath main.json 的路徑
	 */
	private async createBackupBeforeSave(mainJsonPath: string): Promise<void> {
		try {
			// 檔案不存在，跳過備份（新專案首次儲存）
			if (!this.fileService.fileExists(mainJsonPath)) {
				return;
			}

			// 讀取現有檔案內容，檢查是否為空
			const existingData = await this.fileService.readJsonFile<any>(mainJsonPath, null);
			if (!existingData || this.isEmptyWorkspaceState(existingData.workspace)) {
				return; // 現有檔案為空，跳過備份
			}

			// 建立備份
			const bakPath = mainJsonPath + '.bak';
			await this.fileService.copyFile(mainJsonPath, bakPath);
			log('Created backup: main.json.bak', 'debug');
		} catch (error) {
			// 備份失敗不阻止儲存
			log('Failed to create backup', 'warn', error);
		}
	}
	/**
	 * 處理請求初始狀態訊息
	 */
	private async handleRequestInitialState(): Promise<void> {
		try {
			const mainJsonPath = path.join('blockly', 'main.json');

			if (this.fileService.fileExists(mainJsonPath)) {
				try {
					const saveData = await this.fileService.readJsonFile<any>(mainJsonPath, {
						workspace: {},
						board: 'none',
						theme: 'light',
					});

					// 驗證資料結構
					if (saveData && typeof saveData === 'object' && saveData.workspace) {
						// 🔹 在發送 loadWorkspace 之前，先檢查是否為 MicroPython 專案
						// 如果是，提前刪除 platformio.ini 避免 PlatformIO 擴充功能鎖定檔案
						const board = saveData.board || 'none';
						if (board === 'cyberbrick') {
							log('[blockly] 偵測到 CyberBrick 專案，提前刪除 platformio.ini', 'info');
							await this.deletePlatformioIniIfExists();
						}

						// 將主題信息一併傳送
						this.panel.webview.postMessage({
							command: 'loadWorkspace',
							state: saveData.workspace,
							board: board,
							theme: saveData.theme || 'light', // 附加主題設定
						});
					} else {
						throw new Error('Invalid workspace state format');
					}
				} catch (parseError) {
					log('JSON parsing error:', 'error', parseError);
					// 建立新的空白狀態
					const newState = { workspace: {}, board: 'none', theme: 'light' };
					await this.fileService.writeJsonFile(mainJsonPath, newState);
				}
			}

			// 發送自動備份設定
			try {
				const interval = await this.settingsManager.getAutoBackupInterval();
				this.panel.webview.postMessage({
					command: 'autoBackupSettingsResponse',
					interval: interval,
				});
			} catch (error) {
				log('Failed to get auto backup settings:', 'error', error);
			}
		} catch (error) {
			log('Failed to read workspace state:', 'error', error);
		}
	}

	/**
	 * 刪除 platformio.ini（如果存在）
	 * 用於 MicroPython 專案避免與 PlatformIO 衝突
	 */
	private async deletePlatformioIniIfExists(): Promise<void> {
		try {
			if (this.fileService.fileExists('platformio.ini')) {
				await this.fileService.deleteFile('platformio.ini');
				log('[blockly] 已刪除 platformio.ini', 'info');
			} else {
				log('[blockly] platformio.ini 不存在，跳過刪除', 'debug');
			}
		} catch (error) {
			log('[blockly] 刪除 platformio.ini 失敗', 'error', error);
		}
	}

	/**
	 * 處理提示新變數訊息
	 * @param message 提示新變數訊息物件
	 */
	private async handlePromptNewVariable(message: any): Promise<void> {
		try {
			const promptMsg = message.isRename
				? await this.localeService.getLocalizedMessage(
						'VSCODE_ENTER_NEW_VARIABLE_NAME',
						'Enter new variable name (current: {0})',
						message.currentName
				  )
				: await this.localeService.getLocalizedMessage('VSCODE_ENTER_VARIABLE_NAME');

			const emptyErrorMsg = await this.localeService.getLocalizedMessage('VSCODE_VARIABLE_NAME_EMPTY');
			const invalidErrorMsg = await this.localeService.getLocalizedMessage('VSCODE_VARIABLE_NAME_INVALID');

			const result = await vscodeApi.window.showInputBox({
				prompt: promptMsg,
				value: message.currentName || '',
				validateInput: text => {
					if (!text) {
						return emptyErrorMsg;
					}
					if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
						return invalidErrorMsg;
					}
					return null;
				},
			});

			if (result !== undefined) {
				this.panel.webview.postMessage({
					command: 'createVariable',
					name: result,
					isRename: message.isRename,
					oldName: message.currentName,
				});
			}
		} catch (error) {
			log('Error handling promptNewVariable:', 'error', error);
		}
	}

	/**
	 * 處理確認刪除變數訊息
	 * @param message 確認刪除變數訊息物件
	 */
	private async handleConfirmDeleteVariable(message: any): Promise<void> {
		try {
			const confirmMsg = await this.localeService.getLocalizedMessage(
				'VSCODE_CONFIRM_DELETE_VARIABLE',
				'Are you sure you want to delete variable "{0}"?',
				message.variableName
			);
			const okBtn = await this.localeService.getLocalizedMessage('VSCODE_OK');
			const cancelBtn = await this.localeService.getLocalizedMessage('VSCODE_CANCEL');

			const result = await vscodeApi.window.showWarningMessage(confirmMsg, okBtn, cancelBtn);

			this.panel.webview.postMessage({
				command: 'deleteVariable',
				confirmed: result === okBtn,
				name: message.variableName,
			});
		} catch (error) {
			log('Error handling confirmDeleteVariable:', 'error', error);
		}
	}

	/**
	 * 處理確認對話框訊息
	 * @param message 確認對話框訊息物件
	 */
	private async handleConfirmDialog(message: any): Promise<void> {
		try {
			const result = await vscodeApi.window.showWarningMessage(message.message, 'OK', 'Cancel');

			this.panel.webview.postMessage({
				command: 'confirmDialogResult',
				confirmed: result === 'OK',
				originalMessage: message.message,
				confirmId: message.confirmId, // 回傳原始的 confirmId
				purpose: message.purpose, // 回傳用途標記
			});
		} catch (error) {
			log('Error handling confirmDialog:', 'error', error);
		}
	}

	/**
	 * 處理更新主題訊息
	 * @param message 更新主題訊息物件
	 */
	private async handleUpdateTheme(message: any): Promise<void> {
		try {
			// 更新主題設定
			await this.settingsManager.updateTheme(message.theme || 'light');

			// 同時更新 blockly/main.json 中的主題設定
			const mainJsonPath = path.join('blockly', 'main.json');

			if (this.fileService.fileExists(mainJsonPath)) {
				try {
					const saveData = await this.fileService.readJsonFile<any>(mainJsonPath, {});

					if (saveData && typeof saveData === 'object') {
						saveData.theme = message.theme || 'light';
						await this.fileService.writeJsonFile(mainJsonPath, saveData);
					}
				} catch (e) {
					log('Failed to update theme in main.json:', 'error', e);
				}
			}
		} catch (error) {
			log('Failed to save theme preference:', 'error', error);
		}
	}

	/**
	 * 處理建立備份訊息
	 * @param message 建立備份訊息物件
	 */
	private async handleCreateBackup(message: any): Promise<void> {
		try {
			const blocklyDir = 'blockly';
			const mainJsonPath = path.join(blocklyDir, 'main.json');
			const backupDir = path.join(blocklyDir, 'backup');

			// 確保備份目錄存在
			await this.fileService.createDirectory(backupDir);

			// 檢查 main.json 是否存在
			if (!this.fileService.fileExists(mainJsonPath)) {
				const errorMsg = await this.localeService.getLocalizedMessage('BACKUP_ERROR_MAIN_NOT_FOUND', 'Cannot find main.json file');
				throw new Error(errorMsg);
			}

			// 建立備份檔案路徑
			const backupPath = path.join(backupDir, `${message.name}.json`);

			// 複製檔案
			await this.fileService.copyFile(mainJsonPath, backupPath);

			// 通知 WebView 備份已建立
			this.panel.webview.postMessage({
				command: 'backupCreated',
				name: message.name,
				success: true,
			});

			log(`成功建立備份: ${message.name}`, 'info');
		} catch (error) {
			log('建立備份失敗:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupCreated',
				name: message.name,
				success: false,
				error: `${error}`,
			});
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_CREATE_FAILED',
				'Failed to create backup: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}

	/**
	 * 處理獲取備份列表訊息
	 */
	private async handleGetBackupList(): Promise<void> {
		try {
			const backupDir = path.join('blockly', 'backup');

			// 確保備份目錄存在
			await this.fileService.createDirectory(backupDir);

			// 讀取備份目錄中的所有檔案
			const files = await this.fileService.listFiles(backupDir);
			const backupFiles = files.filter(file => file.endsWith('.json'));

			// 收集備份資訊
			const backups = [];
			for (const file of backupFiles) {
				const filePath = path.join(backupDir, file);
				const name = path.basename(file, '.json');

				try {
					// 獲取檔案的時間戳信息
					const stats = await this.fileService.getFileStats(filePath);
					// 優先使用檔案的創建時間（birthtime）
					const fileDate = stats ? stats.birthtime.toISOString() : new Date().toISOString();

					backups.push({
						name: name,
						date: fileDate,
						filePath: filePath, // 添加完整檔案路徑以便預覽功能使用
						size: stats ? stats.size : 0, // 現在可以處理檔案大小了
					});
				} catch (err) {
					// 如果讀取檔案失敗，使用當前時間
					backups.push({
						name: name,
						date: new Date().toISOString(),
						filePath: filePath,
						size: 0,
					});
				}
			}

			// 按日期排序（最新的在前）
			backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			// 回傳備份列表
			this.panel.webview.postMessage({
				command: 'backupListResponse',
				backups: backups,
			});

			log(`成功獲取 ${backups.length} 個備份`, 'info');
		} catch (error) {
			log('獲取備份列表失敗:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupListResponse',
				backups: [],
				error: `${error}`,
			});
		}
	}

	/**
	 * 處理刪除備份訊息
	 * @param message 刪除備份訊息物件
	 */
	private async handleDeleteBackup(message: any): Promise<void> {
		try {
			// 確保備份名稱存在
			if (!message.name) {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NAME_NOT_SPECIFIED',
					'Backup name not specified'
				);
				throw new Error(errorMsg);
			}

			const backupDir = path.join('blockly', 'backup');
			const backupPath = path.join(backupDir, `${message.name}.json`);

			// 檢查檔案是否存在
			if (this.fileService.fileExists(backupPath)) {
				// 顯示確認對話框，詢問用戶是否確定要刪除
				const confirmMessage = await this.localeService.getLocalizedMessage(
					'BACKUP_CONFIRM_DELETE',
					'Are you sure you want to delete backup: {0}.json?',
					message.name
				);
				const deleteBtn = await this.localeService.getLocalizedMessage('BUTTON_DELETE', 'Delete');
				const cancelBtn = await this.localeService.getLocalizedMessage('BUTTON_CANCEL', 'Cancel');

				const selection = await vscodeApi.window.showWarningMessage(confirmMessage, deleteBtn, cancelBtn);

				if (selection === deleteBtn) {
					// 用戶確認刪除
					await this.fileService.deleteFile(backupPath);

					// 通知 WebView 備份已刪除
					this.panel.webview.postMessage({
						command: 'backupDeleted',
						name: message.name,
						success: true,
					});

					log(`成功刪除備份: ${message.name}`, 'info');
				} else {
					// 用戶取消刪除
					this.panel.webview.postMessage({
						command: 'backupDeleted',
						name: message.name,
						success: false,
						cancelled: true,
					});
				}
			} else {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NOT_FOUND',
					'Backup {0} does not exist',
					message.name
				);
				throw new Error(errorMsg);
			}
		} catch (error) {
			log('刪除備份失敗:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: message.name || '未知',
				success: false,
				error: `${error}`,
			});
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_DELETE_FAILED',
				'Failed to delete backup: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}

	/**
	 * 處理還原備份訊息
	 * @param message 還原備份訊息物件
	 */
	private async handleRestoreBackup(message: any): Promise<void> {
		try {
			// 確保備份名稱存在
			if (!message.name) {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NAME_NOT_SPECIFIED',
					'Backup name not specified'
				);
				throw new Error(errorMsg);
			}

			const blocklyDir = 'blockly';
			const backupDir = path.join(blocklyDir, 'backup');
			const mainJsonPath = path.join(blocklyDir, 'main.json');
			const backupPath = path.join(backupDir, `${message.name}.json`);

			// 檢查備份檔案是否存在
			if (!this.fileService.fileExists(backupPath)) {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NOT_FOUND',
					'Backup {0} does not exist',
					message.name
				);
				throw new Error(errorMsg);
			}

			// 顯示確認對話框，詢問用戶是否確定要還原（這是一個破壞性操作）
			const confirmMessage = await this.localeService.getLocalizedMessage(
				'BACKUP_CONFIRM_RESTORE',
				'Are you sure you want to restore backup "{0}"? This will overwrite the current workspace.',
				message.name
			);
			const restoreBtn = await this.localeService.getLocalizedMessage('BUTTON_RESTORE', 'Restore');
			const cancelBtn = await this.localeService.getLocalizedMessage('BUTTON_CANCEL', 'Cancel');

			const selection = await vscodeApi.window.showWarningMessage(confirmMessage, restoreBtn, cancelBtn);

			if (selection === restoreBtn) {
				// 在還原之前，先為當前工作區創建一個臨時備份
				if (this.fileService.fileExists(mainJsonPath)) {
					try {
						// 創建臨時備份名稱，格式：auto_backup_before_restore_YYYYMMDD_HHMMSS
						const now = new Date();
						const year = now.getFullYear();
						const month = String(now.getMonth() + 1).padStart(2, '0');
						const day = String(now.getDate()).padStart(2, '0');
						const hours = String(now.getHours()).padStart(2, '0');
						const minutes = String(now.getMinutes()).padStart(2, '0');
						const seconds = String(now.getSeconds()).padStart(2, '0');
						const autoBackupName = `auto_restore_${year}${month}${day}_${hours}${minutes}${seconds}`;
						const autoBackupPath = path.join(backupDir, `${autoBackupName}.json`);

						// 確保備份目錄存在
						await this.fileService.createDirectory(backupDir);

						// 複製當前的 main.json 到臨時備份
						await this.fileService.copyFile(mainJsonPath, autoBackupPath);

						log(`在還原前建立的自動備份: ${autoBackupName}`, 'info');
					} catch (backupError) {
						// 如果自動備份失敗，記錄錯誤但繼續還原過程
						log('在還原前建立自動備份失敗:', 'error', backupError);
					}
				}

				// 將備份檔案複製回 main.json
				await this.fileService.copyFile(backupPath, mainJsonPath);

				// 讀取還原後的數據
				const restoredData = await this.fileService.readJsonFile<any>(mainJsonPath, {
					workspace: {},
					board: 'none',
					theme: 'light',
				});

				// 通知 WebView 重新載入工作區
				this.panel.webview.postMessage({
					command: 'loadWorkspace',
					state: restoredData.workspace,
					board: restoredData.board || 'none',
					theme: restoredData.theme || 'light',
					isRestored: true,
					restoreName: message.name,
				});

				// 通知 WebView 備份已還原
				this.panel.webview.postMessage({
					command: 'backupRestored',
					name: message.name,
					success: true,
				});

				log(`成功還原備份: ${message.name}`, 'info');
			} else {
				// 用戶取消還原
				this.panel.webview.postMessage({
					command: 'backupRestored',
					name: message.name,
					success: false,
					cancelled: true,
				});
			}
		} catch (error) {
			log('還原備份失敗:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupRestored',
				name: message.name || '未知',
				success: false,
				error: `${error}`,
			});
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_RESTORE_FAILED',
				'Failed to restore backup: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}

	/**
	 * 從 WebView 獲取板子設定
	 * @param board 板子名稱
	 * @returns 板子設定內容
	 */
	private async getBoardConfig(board: string): Promise<string> {
		try {
			log(`向 WebView 請求板子設定：${board}`);

			// 建立唯一的訊息 ID
			const messageId = `get-board-config-${Date.now()}`;

			// 創建一個具有超時功能的 Promise
			return await Promise.race([
				// 主要的通信 Promise
				new Promise<string>(resolve => {
					// 設定訊息監聽器
					const messageListener = this.panel.webview.onDidReceiveMessage(message => {
						if (message.command === 'boardConfigResult' && message.messageId === messageId) {
							messageListener.dispose();
							log(`成功從 WebView 獲取板子設定`);
							resolve(message.config || '');
						}
					});

					// 發送訊息到 webview
					this.panel.webview.postMessage({
						command: 'getBoardConfig',
						board: board,
						messageId: messageId,
					});
				}),

				// 超時 Promise
				new Promise<string>(resolve => {
					setTimeout(() => {
						log(`板子設定請求逾時，無法獲取設定`);
						resolve('');
					}, BOARD_CONFIG_REQUEST_TIMEOUT_MS);
				}),
			]);
		} catch (error) {
			log('從 WebView 獲取板子設定時發生錯誤:', 'error', error);
			return '';
		}
	}

	/**
	 * 顯示錯誤訊息
	 * @param message 錯誤訊息
	 */
	private showErrorMessage(message: string): void {
		vscodeApi.window.showErrorMessage(message);
	}

	/**
	 * 處理預覽備份命令
	 * @param message 消息內容，包含備份名稱
	 */
	private async handlePreviewBackup(message: any): Promise<void> {
		try {
			// 確保備份名稱存在
			if (!message.name) {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NAME_NOT_SPECIFIED',
					'Backup name not specified'
				);
				throw new Error(errorMsg);
			}
			log(`正在處理預覽備份請求: ${message.name}`, 'info');

			const blocklyDir = 'blockly';
			const backupDir = path.join(blocklyDir, 'backup');
			const backupPath = path.join(backupDir, `${message.name}.json`);
			// 修正路徑構建,完整路徑應為 {workspace}/blockly/backup/{filename}.json
			const fullBackupPath = path.join(vscodeApi.workspace.workspaceFolders![0].uri.fsPath, backupPath);

			// 檢查備份檔案是否存在
			if (!this.fileService.fileExists(backupPath)) {
				const errorMsg = await this.localeService.getLocalizedMessage(
					'BACKUP_ERROR_NOT_FOUND',
					'Backup {0} does not exist',
					message.name
				);
				throw new Error(errorMsg);
			}

			// 執行預覽命令，將預覽命令和完整的備份路徑傳遞給 VS Code
			await vscodeApi.commands.executeCommand('singular-blockly.previewBackup', fullBackupPath);
		} catch (error) {
			log(`預覽備份失敗: ${error}`, 'error');
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_PREVIEW_FAILED',
				'Failed to preview backup: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}
	/**
	 * 處理獲取自動備份設定訊息
	 */
	private async handleGetAutoBackupSettings(): Promise<void> {
		try {
			const interval = await this.settingsManager.getAutoBackupInterval();
			this.panel.webview.postMessage({
				command: 'autoBackupSettingsResponse',
				interval: interval,
			});
		} catch (error) {
			log('獲取自動備份設定失敗:', 'error', error);
		}
	}

	/**
	 * 處理更新自動備份設定訊息
	 * @param message 更新自動備份設定訊息物件
	 */
	private async handleUpdateAutoBackupSettings(message: any): Promise<void> {
		try {
			await this.settingsManager.updateAutoBackupInterval(message.interval);
			log(`自動備份間隔已更新為 ${message.interval} 分鐘`, 'info');
		} catch (error) {
			log('更新自動備份設定失敗:', 'error', error);
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_UPDATE_SETTINGS_FAILED',
				'Failed to update auto backup settings'
			);
			this.showErrorMessage(errorMsg);
		}
	}

	// ===== MCP Server 整合 - T031 =====

	/**
	 * 處理工作區重載請求
	 * 當 MCP Server 或 FileWatcher 觸發重載時呼叫
	 */
	private async handleRequestWorkspaceReload(): Promise<void> {
		try {
			log('Processing workspace reload request', 'info');

			// 讀取最新的 main.json
			const blocklyDir = 'blockly';
			const mainJsonPath = path.join(blocklyDir, 'main.json');

			if (!this.fileService.fileExists(mainJsonPath)) {
				log('main.json not found, skipping reload', 'warn');
				return;
			}

			const content = await this.fileService.readFile(mainJsonPath);
			const state = JSON.parse(content);

			// 發送工作區狀態給 WebView
			this.panel.webview.postMessage({
				command: 'loadWorkspace',
				state: state,
				source: 'mcpReload',
			});

			log('Workspace reloaded via MCP integration', 'info');
		} catch (error) {
			log('Failed to reload workspace:', 'error', error);
			const errorMsg = await this.localeService.getLocalizedMessage(
				'ERROR_RELOAD_WORKSPACE_FAILED',
				'Failed to reload workspace: {0}',
				String(error)
			);
			this.showErrorMessage(errorMsg);
		}
	}

	// ===== 統一上傳功能 - CyberBrick MicroPython & Arduino C++ =====

	/**
	 * 處理上傳請求
	 * 根據板子類型路由到對應的上傳服務
	 * @param message 上傳請求訊息
	 */
	private async handleRequestUpload(message: UploadRequestMessage): Promise<void> {
		log('[blockly] 收到上傳請求', 'info', { board: message.board, hasPort: !!message.port });

		const workspaceFolders = vscodeApi.workspace.workspaceFolders;
		if (!workspaceFolders) {
			this.sendUploadResult({
				success: false,
				timestamp: new Date().toISOString(),
				port: message.port || 'unknown',
				duration: 0,
				error: {
					stage: 'preparing',
					message: 'No workspace folder open',
				},
			});
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const boardLanguage = getBoardLanguage(message.board);

		// 根據板子語言類型路由到對應的上傳服務
		if (boardLanguage === 'micropython') {
			// MicroPython 上傳流程（CyberBrick）
			await this.handleMicropythonUpload(workspaceRoot, message);
		} else if (boardLanguage === 'arduino') {
			// Arduino C++ 上傳流程
			await this.handleArduinoUpload(workspaceRoot, message);
		} else {
			// 未知板子類型
			log('[blockly] 未知的板子類型', 'warn', { board: message.board });
			this.sendUploadResult({
				success: false,
				timestamp: new Date().toISOString(),
				port: 'none',
				duration: 0,
				error: {
					stage: 'preparing',
					message: 'Please select a board first',
				},
			});
		}
	}

	/**
	 * 處理 MicroPython 上傳（CyberBrick）
	 * @param workspaceRoot 工作區根目錄
	 * @param message 上傳請求訊息
	 */
	private async handleMicropythonUpload(workspaceRoot: string, message: UploadRequestMessage): Promise<void> {
		const uploader = new MicropythonUploader(workspaceRoot);

		try {
			const result = await uploader.upload(
				{
					code: message.code,
					board: message.board,
					port: message.port,
				},
				(progress: UploadProgress) => {
					this.sendUploadProgress(progress);
				}
			);

			this.sendUploadResult(result);
		} catch (error) {
			log('[blockly] MicroPython 上傳過程發生未預期錯誤', 'error', error);
			this.sendUploadResult({
				success: false,
				timestamp: new Date().toISOString(),
				port: message.port || 'unknown',
				duration: 0,
				error: {
					stage: 'failed',
					message: error instanceof Error ? error.message : String(error),
				},
			});
		}
	}

	/**
	 * 處理 Arduino C++ 上傳
	 * @param workspaceRoot 工作區根目錄
	 * @param message 上傳請求訊息
	 */
	private async handleArduinoUpload(workspaceRoot: string, message: UploadRequestMessage): Promise<void> {
		const uploader = new ArduinoUploader(workspaceRoot);

		try {
			const request: ArduinoUploadRequest = {
				code: message.code,
				board: message.board,
				port: message.port,
				lib_deps: message.lib_deps,
				build_flags: message.build_flags,
				lib_ldf_mode: message.lib_ldf_mode,
			};

			const result = await uploader.upload(request, (progress: ArduinoUploadProgress) => {
				// 轉換 Arduino 進度格式為通用格式
				this.sendUploadProgress({
					stage: progress.stage as any, // Arduino stages are compatible
					progress: progress.progress,
					message: progress.message,
					error: progress.error,
				});
			});

			// 轉換 Arduino 結果格式為通用格式
			this.sendUploadResult({
				success: result.success,
				timestamp: result.timestamp,
				port: result.port,
				duration: result.duration,
				mode: result.mode, // 包含 'compile-only' | 'upload'
				error: result.error
					? {
							stage: result.error.stage as any,
							message: result.error.message,
							details: result.error.details,
					  }
					: undefined,
			});
		} catch (error) {
			log('[blockly] Arduino 上傳過程發生未預期錯誤', 'error', error);
			this.sendUploadResult({
				success: false,
				timestamp: new Date().toISOString(),
				port: message.port || 'unknown',
				duration: 0,
				error: {
					stage: 'failed',
					message: error instanceof Error ? error.message : String(error),
				},
			});
		}
	}

	/**
	 * 發送上傳進度到 WebView
	 * @param progress 上傳進度
	 */
	private sendUploadProgress(progress: UploadProgress): void {
		this.panel.webview.postMessage({
			command: 'uploadProgress',
			...progress,
		});
	}

	/**
	 * 發送上傳結果到 WebView
	 * @param result 上傳結果（支援 Arduino mode 欄位）
	 */
	private sendUploadResult(result: UploadResult & { mode?: 'compile-only' | 'upload' }): void {
		this.panel.webview.postMessage({
			command: 'uploadResult',
			...result,
		});
	}

	/**
	 * 處理連接埠清單請求
	 * @param message 請求訊息
	 */
	private async handleRequestPortList(message: { filter?: 'all' | 'cyberbrick' }): Promise<void> {
		log('[blockly] 收到連接埠清單請求', 'info', { filter: message.filter });

		const workspaceFolders = vscodeApi.workspace.workspaceFolders;
		if (!workspaceFolders) {
			this.panel.webview.postMessage({
				command: 'portListResponse',
				ports: [],
				error: '沒有開啟的工作區',
			});
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const uploader = new MicropythonUploader(workspaceRoot);

		try {
			const { ports, autoDetected } = await uploader.listPorts(message.filter);

			this.panel.webview.postMessage({
				command: 'portListResponse',
				ports,
				autoDetected,
			});
		} catch (error) {
			log('[blockly] 取得連接埠清單失敗', 'error', error);
			this.panel.webview.postMessage({
				command: 'portListResponse',
				ports: [],
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * 處理刪除 platformio.ini 請求
	 * 當切換到 CyberBrick 時觸發
	 */
	private async handleDeletePlatformioIni(): Promise<void> {
		log('[blockly] 收到刪除 platformio.ini 請求', 'info');
		await this.deletePlatformioIniIfExists();
	}
}
