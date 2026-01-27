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
import { ArduinoUploadProgress, ArduinoUploadRequest, getBoardLanguage } from '../types/arduino';
import { SerialMonitorService } from '../services/serialMonitorService';

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
	private serialMonitorService: SerialMonitorService | null = null;
	private pendingBoardConfigRequests = new Map<
		string,
		{
			resolve: (config: string) => void;
			reject: (error: Error) => void;
			timeout: ReturnType<typeof setTimeout>;
		}
	>();

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

			// 初始化 Serial Monitor 服務
			this.serialMonitorService = new SerialMonitorService(workspaceRoot);
			this.serialMonitorService.onStopped(reason => {
				this.panel.webview.postMessage({
					command: 'monitorStopped',
					reason,
				});
			});
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
				case 'updateLanguage':
					await this.handleUpdateLanguage(message);
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
				case 'showToast':
					this.handleShowToast(message);
					break;
				case 'getAutoBackupSettings':
					await this.handleGetAutoBackupSettings();
					break;
				case 'updateAutoBackupSettings':
					await this.handleUpdateAutoBackupSettings(message);
					break;
				case 'boardConfigResult':
					this.handleBoardConfigResult(message);
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
				// Serial Monitor 功能
				case 'startMonitor':
					await this.handleStartMonitor(message);
					break;
				case 'stopMonitor':
					await this.handleStopMonitor();
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
	 * 顯示 WebView 傳入的提示訊息
	 * @param message Toast 訊息物件
	 */
	private handleShowToast(message: any): void {
		const toastMessage = typeof message?.message === 'string' ? message.message.trim() : '';
		if (!toastMessage) {
			return;
		}

		switch (message?.type) {
			case 'error':
				vscodeApi.window.showErrorMessage(toastMessage);
				break;
			case 'warning':
				vscodeApi.window.showWarningMessage(toastMessage);
				break;
			default:
				vscodeApi.window.showInformationMessage(toastMessage);
				break;
		}
	}

	/**
	 * 從 WebView 取得開發板設定內容
	 * @param board 開發板代號
	 * @returns platformio.ini 內容
	 */
	private async getBoardConfig(board: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const messageId = `boardConfig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
			const timeout = setTimeout(() => {
				this.pendingBoardConfigRequests.delete(messageId);
				reject(new Error('Board config request timeout'));
			}, BOARD_CONFIG_REQUEST_TIMEOUT_MS);

			this.pendingBoardConfigRequests.set(messageId, { resolve, reject, timeout });
			this.panel.webview.postMessage({
				command: 'getBoardConfig',
				board: board,
				messageId: messageId,
			});
		});
	}

	/**
	 * 處理 WebView 回傳的開發板設定
	 * @param message 回傳訊息
	 */
	private handleBoardConfigResult(message: any): void {
		const messageId = message?.messageId;
		if (!messageId) {
			log('Board config response missing messageId', 'warn');
			return;
		}

		const pending = this.pendingBoardConfigRequests.get(messageId);
		if (!pending) {
			log(`No pending board config request for messageId: ${messageId}`, 'warn');
			return;
		}

		clearTimeout(pending.timeout);
		this.pendingBoardConfigRequests.delete(messageId);
		pending.resolve(typeof message.config === 'string' ? message.config : '');
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

			// CyberBrick 和 none 都不需要 platformio.ini
			const isMicroPythonBoard = message.board === 'cyberbrick';

			if (message.board === 'none' || isMicroPythonBoard) {
				// 刪除 platformio.ini（如果存在）
				if (this.fileService.fileExists(platformioIni)) {
					await this.fileService.deleteFile(platformioIni);
					log(`[blockly] 已刪除 platformio.ini (board: ${message.board})`, 'info');
				}
			} else {
				const boardConfig = await this.getBoardConfig(message.board);
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
			const errorMsg = await this.localeService.getLocalizedMessage(
				'VSCODE_FAILED_UPDATE_INI',
				'Failed to update platformio.ini: {0}',
				(error as Error).message
			);

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
	 * 提示使用者輸入新變數名稱
	 * @param message 提示訊息物件
	 */
	private async handlePromptNewVariable(message: any): Promise<void> {
		try {
			const isRename = Boolean(message?.isRename);
			const currentName = typeof message?.currentName === 'string' ? message.currentName : '';

			const prompt =
				isRename && currentName
					? await this.localeService.getLocalizedMessage(
							'VSCODE_ENTER_NEW_VARIABLE_NAME',
							'Enter new variable name (current: {0})',
							currentName
						)
					: await this.localeService.getLocalizedMessage('VSCODE_ENTER_VARIABLE_NAME', 'Enter variable name');

			const emptyError = await this.localeService.getLocalizedMessage('VSCODE_VARIABLE_NAME_EMPTY', 'Variable name cannot be empty');
			const invalidError = await this.localeService.getLocalizedMessage(
				'VSCODE_VARIABLE_NAME_INVALID',
				'Variable name can only contain letters, numbers, and underscores, and cannot start with a number'
			);

			const input = await vscodeApi.window.showInputBox({
				prompt: prompt,
				value: isRename ? currentName : undefined,
				validateInput: (value: string) => {
					const trimmed = value.trim();
					if (!trimmed) {
						return emptyError;
					}

					if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
						return invalidError;
					}

					return null;
				},
			});

			if (input === undefined) {
				return; // 使用者取消
			}

			const name = input.trim();
			if (!name) {
				return;
			}

			this.panel.webview.postMessage({
				command: 'createVariable',
				name: name,
				isRename: isRename,
				oldName: currentName || undefined,
			});
		} catch (error) {
			log('Failed to prompt new variable name', 'error', error);
		}
	}

	/**
	 * 確認刪除變數
	 * @param message 確認刪除訊息物件
	 */
	private async handleConfirmDeleteVariable(message: any): Promise<void> {
		try {
			const variableName = message?.variableName;
			if (!variableName) {
				log('Variable name not provided for delete confirmation', 'warn');
				return;
			}

			const confirmMessage = await this.localeService.getLocalizedMessage(
				'VSCODE_CONFIRM_DELETE_VARIABLE',
				'Confirm delete variable {0}?',
				variableName
			);
			const okLabel = await this.localeService.getLocalizedMessage('VSCODE_OK', 'OK');
			const cancelLabel = await this.localeService.getLocalizedMessage('VSCODE_CANCEL', 'Cancel');

			const selection = await vscodeApi.window.showWarningMessage(confirmMessage, okLabel, cancelLabel);

			this.panel.webview.postMessage({
				command: 'deleteVariable',
				name: variableName,
				confirmed: selection === okLabel,
			});
		} catch (error) {
			log('Failed to confirm variable deletion', 'error', error);
		}
	}

	/**
	 * 一般確認對話框
	 * @param message 確認訊息物件
	 */
	private async handleConfirmDialog(message: any): Promise<void> {
		try {
			const okLabel = await this.localeService.getLocalizedMessage('VSCODE_OK', 'OK');
			const cancelLabel = await this.localeService.getLocalizedMessage('VSCODE_CANCEL', 'Cancel');
			const confirmId = message?.confirmId ?? message?.messageId;

			const selection = await vscodeApi.window.showWarningMessage(message?.message || '', okLabel, cancelLabel);

			this.panel.webview.postMessage({
				command: 'confirmDialogResult',
				confirmed: selection === okLabel,
				originalMessage: message?.message,
				confirmId: confirmId,
				purpose: message?.purpose,
			});
		} catch (error) {
			log('Failed to handle confirm dialog', 'error', error);
		}
	}

	/**
	 * 處理更新主題訊息
	 * @param message 更新主題訊息物件
	 */
	private async handleUpdateTheme(message: any): Promise<void> {
		try {
			await this.settingsManager.updateTheme(message.theme || 'light');
		} catch (error) {
			log('Failed to save theme preference:', 'error', error);
		}
	}

	/**
	 * 處理語言偏好更新訊息
	 * @param message 語言更新訊息物件
	 */
	private async handleUpdateLanguage(message: any): Promise<void> {
		const requestedLanguage = typeof message.language === 'string' ? message.language : 'auto';
		let languagePreference = requestedLanguage;

		try {
			await this.settingsManager.updateLanguage(languagePreference);
		} catch (error) {
			log(`Invalid language code received: ${requestedLanguage}, fallback to auto`, 'warn', error);
			languagePreference = 'auto';
			try {
				await this.settingsManager.updateLanguage(languagePreference);
			} catch (updateError) {
				log('Failed to update language preference:', 'error', updateError);
			}
		}

		const resolvedLanguage = this.settingsManager.resolveLanguage(languagePreference);

		this.panel.webview.postMessage({
			command: 'languageUpdated',
			languagePreference: languagePreference,
			resolvedLanguage: resolvedLanguage,
		});
	}

	/**
	 * 處理請求初始狀態訊息
	 */
	private async handleRequestInitialState(): Promise<void> {
		try {
			const mainJsonPath = path.join('blockly', 'main.json');
			let saveData: { workspace: any; board: string } = {
				workspace: {},
				board: 'none',
			};

			await this.migrateThemeFromMainJson(mainJsonPath);

			let theme = 'light';
			try {
				theme = await this.settingsManager.getTheme();
			} catch (error) {
				log('Failed to read theme setting, using default', 'warn', error);
			}

			if (this.fileService.fileExists(mainJsonPath)) {
				try {
					const existingData = await this.fileService.readJsonFile<any>(mainJsonPath, saveData);

					// 驗證資料結構
					if (existingData && typeof existingData === 'object' && existingData.workspace) {
						saveData = {
							workspace: existingData.workspace,
							board: existingData.board || 'none',
						};
					} else {
						throw new Error('Invalid workspace state format');
					}
				} catch (parseError) {
					log('JSON parsing error:', 'error', parseError);
					// 建立新的空白狀態
					await this.fileService.writeJsonFile(mainJsonPath, saveData);
				}
			}

			// 如果是 MicroPython 專案，提前刪除 platformio.ini 避免 PlatformIO 擴充功能鎖定檔案
			if (saveData.board === 'cyberbrick') {
				log('[blockly] 偵測到 CyberBrick 專案，提前刪除 platformio.ini', 'info');
				await this.deletePlatformioIniIfExists();
			}

			let languagePreference = 'auto';
			try {
				languagePreference = await this.settingsManager.getLanguage();
			} catch (error) {
				log('Failed to read language preference, fallback to auto', 'warn', error);
			}

			const resolvedLanguage = this.settingsManager.resolveLanguage(languagePreference);

			this.panel.webview.postMessage({
				command: 'init',
				theme: theme,
				board: saveData.board || 'none',
				workspace: saveData.workspace || {},
				languagePreference: languagePreference,
				resolvedLanguage: resolvedLanguage,
			});

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
	 * 從舊版 main.json 遷移 theme 到 settings.json
	 * @param mainJsonPath main.json 檔案路徑
	 */
	private async migrateThemeFromMainJson(mainJsonPath: string): Promise<void> {
		try {
			if (!this.fileService.fileExists(mainJsonPath)) {
				return;
			}

			const saveData = await this.fileService.readJsonFile<any>(mainJsonPath, null);
			if (!saveData || typeof saveData !== 'object' || saveData.theme === undefined) {
				return;
			}

			const storedTheme = saveData.theme;
			const themeSentinel = '__unset__';
			const currentTheme = await this.settingsManager.readSetting<string>('singular-blockly.theme', themeSentinel);

			if (currentTheme === themeSentinel && (storedTheme === 'light' || storedTheme === 'dark')) {
				await this.settingsManager.updateTheme(storedTheme);
				log(`Migrated theme from main.json to settings: ${storedTheme}`, 'info');
			}

			// 從 main.json 移除 theme 欄位
			delete saveData.theme;
			await this.fileService.writeJsonFile(mainJsonPath, saveData);
		} catch (error) {
			log('Failed to migrate theme from main.json:', 'warn', error);
		}
	}

	/**
	 * 建立備份檔案
	 * @param message 建立備份訊息物件
	 */
	private async handleCreateBackup(message: any): Promise<void> {
		const backupDir = path.join('blockly', 'backup');
		const mainJsonPath = path.join('blockly', 'main.json');
		const backupName = message?.name;

		if (!backupName) {
			const errorMsg = await this.localeService.getLocalizedMessage('BACKUP_ERROR_NAME_NOT_SPECIFIED', 'Backup name not specified');
			this.panel.webview.postMessage({
				command: 'backupCreated',
				name: backupName,
				success: false,
				error: errorMsg,
			});
			return;
		}

		try {
			await this.fileService.createDirectory(backupDir);
			const backupPath = path.join(backupDir, `${backupName}.json`);

			if (message?.state) {
				const saveData = {
					workspace: message.state,
					board: message.board || 'none',
				};
				await this.fileService.writeJsonFile(backupPath, saveData);
			} else {
				if (!this.fileService.fileExists(mainJsonPath)) {
					const errorMsg = await this.localeService.getLocalizedMessage(
						'BACKUP_ERROR_MAIN_NOT_FOUND',
						'main.json does not exist'
					);
					this.panel.webview.postMessage({
						command: 'backupCreated',
						name: backupName,
						success: false,
						error: errorMsg,
					});
					return;
				}
				await this.fileService.copyFile(mainJsonPath, backupPath);
			}

			this.panel.webview.postMessage({
				command: 'backupCreated',
				name: backupName,
				success: true,
				isQuickBackup: Boolean(message?.isQuickBackup),
			});
		} catch (error) {
			const rawErrorMessage = error instanceof Error ? error.message : String(error);
			let errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_CREATE_FAILED',
				'Failed to create backup: {0}',
				rawErrorMessage
			);
			if (errorMsg.includes('{0}')) {
				errorMsg = errorMsg.replace('{0}', rawErrorMessage);
			} else if (!errorMsg.includes(rawErrorMessage)) {
				errorMsg = `${errorMsg} ${rawErrorMessage}`;
			}
			this.panel.webview.postMessage({
				command: 'backupCreated',
				name: backupName,
				success: false,
				error: errorMsg,
			});
		}
	}

	/**
	 * 取得備份清單
	 */
	private async handleGetBackupList(): Promise<void> {
		const backupDir = path.join('blockly', 'backup');

		try {
			await this.fileService.createDirectory(backupDir);
			const files = await this.fileService.listFiles(backupDir);
			const jsonFiles = files.filter(file => file.endsWith('.json'));

			const backups = await Promise.all(
				jsonFiles.map(async file => {
					const backupPath = path.join(backupDir, file);
					const name = file.replace(/\.json$/, '');
					let date: Date | string | number | null = null;
					let size: number | undefined;

					try {
						const data = await this.fileService.readJsonFile<any>(backupPath, null);
						if (data && data.date) {
							date = data.date;
						}
					} catch (error) {
						log('Failed to read backup metadata:', 'warn', error);
					}

					try {
						const stats = await this.fileService.getFileStats(backupPath);
						if (!date && stats?.birthtime) {
							date = stats.birthtime;
						}
						if (stats?.size !== undefined) {
							size = stats.size;
						}
					} catch (error) {
						log('Failed to get backup file stats:', 'warn', error);
					}

					if (!date) {
						date = new Date();
					}

					return {
						name,
						date,
						size,
					};
				})
			);

			backups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

			this.panel.webview.postMessage({
				command: 'backupListResponse',
				backups,
			});
		} catch (error) {
			log('Failed to get backup list:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupListResponse',
				backups: [],
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * 刪除備份
	 * @param message 刪除備份訊息物件
	 */
	private async handleDeleteBackup(message: any): Promise<void> {
		const backupName = message?.name;
		if (!backupName) {
			const errorMsg = await this.localeService.getLocalizedMessage('BACKUP_ERROR_NAME_NOT_SPECIFIED', 'Backup name not specified');
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: backupName,
				success: false,
				error: errorMsg,
			});
			return;
		}

		const backupPath = path.join('blockly', 'backup', `${backupName}.json`);
		if (!this.fileService.fileExists(backupPath)) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_NOT_FOUND',
				'Backup "{0}" does not exist',
				backupName
			);
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: backupName,
				success: false,
				error: errorMsg,
			});
			return;
		}

		try {
			const confirmMessage = await this.localeService.getLocalizedMessage(
				'BACKUP_CONFIRM_DELETE',
				'Are you sure you want to delete "{0}"?',
				backupName
			);
			const deleteBtn = await this.localeService.getLocalizedMessage('BUTTON_DELETE', 'Delete');
			const cancelBtn = await this.localeService.getLocalizedMessage('BUTTON_CANCEL', 'Cancel');

			const selection = await vscodeApi.window.showWarningMessage(confirmMessage, deleteBtn, cancelBtn);
			if (selection !== deleteBtn) {
				this.panel.webview.postMessage({
					command: 'backupDeleted',
					name: backupName,
					success: false,
					cancelled: true,
				});
				return;
			}

			await this.fileService.deleteFile(backupPath);
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: backupName,
				success: true,
			});
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_DELETE_FAILED',
				'Failed to delete backup: {0}',
				error instanceof Error ? error.message : String(error)
			);
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: backupName,
				success: false,
				error: errorMsg,
			});
		}
	}

	/**
	 * 還原備份
	 * @param message 還原備份訊息物件
	 */
	private async handleRestoreBackup(message: any): Promise<void> {
		const backupName = message?.name;
		if (!backupName) {
			const errorMsg = await this.localeService.getLocalizedMessage('BACKUP_ERROR_NAME_NOT_SPECIFIED', 'Backup name not specified');
			this.panel.webview.postMessage({
				command: 'backupRestored',
				name: backupName,
				success: false,
				error: errorMsg,
			});
			return;
		}

		const backupPath = path.join('blockly', 'backup', `${backupName}.json`);
		const mainJsonPath = path.join('blockly', 'main.json');

		if (!this.fileService.fileExists(backupPath)) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_NOT_FOUND',
				'Backup "{0}" does not exist',
				backupName
			);
			this.panel.webview.postMessage({
				command: 'backupRestored',
				name: backupName,
				success: false,
				error: errorMsg,
			});
			return;
		}

		try {
			const confirmMessage = await this.localeService.getLocalizedMessage(
				'BACKUP_CONFIRM_RESTORE',
				'Are you sure you want to restore "{0}"?',
				backupName
			);
			const restoreBtn = await this.localeService.getLocalizedMessage('BUTTON_RESTORE', 'Restore');
			const cancelBtn = await this.localeService.getLocalizedMessage('BUTTON_CANCEL', 'Cancel');

			const selection = await vscodeApi.window.showWarningMessage(confirmMessage, restoreBtn, cancelBtn);
			if (selection !== restoreBtn) {
				this.panel.webview.postMessage({
					command: 'backupRestored',
					name: backupName,
					success: false,
					cancelled: true,
				});
				return;
			}

			let autoBackupName: string | undefined;
			if (this.fileService.fileExists(mainJsonPath)) {
				const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/T/, '_').slice(0, 15);
				autoBackupName = `auto_restore_${timestamp}`;
				const autoBackupPath = path.join('blockly', 'backup', `${autoBackupName}.json`);
				await this.fileService.copyFile(mainJsonPath, autoBackupPath);
			}

			await this.fileService.copyFile(backupPath, mainJsonPath);
			const saveData = await this.fileService.readJsonFile<any>(mainJsonPath, null);

			if (saveData) {
				this.panel.webview.postMessage({
					command: 'loadWorkspace',
					state: saveData,
					board: saveData.board,
				});
			}

			this.panel.webview.postMessage({
				command: 'backupRestored',
				name: backupName,
				success: true,
				autoBackupName,
			});
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_RESTORE_FAILED',
				'Failed to restore backup: {0}',
				error instanceof Error ? error.message : String(error)
			);
			this.panel.webview.postMessage({
				command: 'backupRestored',
				name: backupName,
				success: false,
				error: errorMsg,
			});
		}
	}

	/**
	 * 預覽備份
	 * @param message 預覽備份訊息物件
	 */
	private async handlePreviewBackup(message: any): Promise<void> {
		const backupName = message?.name;
		if (!backupName) {
			const errorMsg = await this.localeService.getLocalizedMessage('BACKUP_ERROR_NAME_NOT_SPECIFIED', 'Backup name not specified');
			this.showErrorMessage(errorMsg);
			return;
		}

		const backupPath = path.join('blockly', 'backup', `${backupName}.json`);
		if (!this.fileService.fileExists(backupPath)) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_NOT_FOUND',
				'Backup "{0}" does not exist',
				backupName
			);
			this.showErrorMessage(errorMsg);
			return;
		}

		const workspaceFolders = vscodeApi.workspace.workspaceFolders;
		if (!workspaceFolders) {
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
			this.showErrorMessage(errorMsg);
			return;
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		const fullPath = path.join(workspaceRoot, backupPath);
		try {
			await vscodeApi.commands.executeCommand('singular-blockly.previewBackup', fullPath);
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage(
				'BACKUP_ERROR_PREVIEW_FAILED',
				'Failed to preview backup: {0}',
				error instanceof Error ? error.message : String(error)
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

		// 上傳前關閉 Monitor（釋放 COM 埠）
		if (this.serialMonitorService?.isRunning()) {
			await this.serialMonitorService.stopForUpload();
		}

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

	// ===== Serial Monitor 功能 =====

	/**
	 * 處理啟動 Monitor 請求
	 * @param message 啟動訊息
	 */
	private async handleStartMonitor(message: { board: string }): Promise<void> {
		if (message.board !== 'cyberbrick') {
			log('[blockly] Monitor 僅支援 CyberBrick', 'warn');
			return;
		}

		if (!this.serialMonitorService) {
			log('[blockly] SerialMonitorService 未初始化', 'error');
			return;
		}

		const result = await this.serialMonitorService.start();

		if (result.success) {
			this.panel.webview.postMessage({
				command: 'monitorStarted',
				port: result.port,
			});
		} else {
			this.panel.webview.postMessage({
				command: 'monitorError',
				error: result.error,
			});
		}
	}

	/**
	 * 處理停止 Monitor 請求
	 */
	private async handleStopMonitor(): Promise<void> {
		if (!this.serialMonitorService) {
			log('[blockly] SerialMonitorService 未初始化', 'error');
			return;
		}

		await this.serialMonitorService.stop();
		this.panel.webview.postMessage({
			command: 'monitorStopped',
			reason: 'user_closed',
		});
	}

	private showErrorMessage(message: string): void {
		try {
			vscodeApi.window.showErrorMessage(message);
		} catch (error) {
			log('Failed to show error message:', 'error', error);
		}
	}
}
