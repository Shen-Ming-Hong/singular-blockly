/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { log, handleWebViewLog } from '../services/logging';
import { FileService } from '../services/fileService';
import { SettingsManager } from '../services/settingsManager';
import { LocaleService } from '../services/localeService';

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
	 */
	constructor(private context: vscode.ExtensionContext, private panel: vscode.WebviewPanel, private localeService: LocaleService) {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			throw new Error('No workspace folder open');
		}

		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		this.fileService = new FileService(workspaceRoot);
		this.settingsManager = new SettingsManager(workspaceRoot);
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
				case 'boardConfigResult':
					// 這個訊息是對 getBoardConfig 請求的回應，不需要特殊處理
					break;
				default:
					log(`Unhandled message command: ${message.command}`, 'warn');
					break;
			}
		} catch (error) {
			log(`Error handling message: ${message.command}`, 'error', error);
			this.showErrorMessage(`處理訊息時發生錯誤: ${error}`);
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
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
				const openFolderBtn = await this.localeService.getLocalizedMessage('VSCODE_OPEN_FOLDER');

				vscode.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
					if (selection === openFolderBtn) {
						vscode.commands.executeCommand('workbench.action.files.openFolder');
					}
				});
				return;
			}

			// 確保 src 目錄存在
			await this.fileService.createDirectory('src');

			// 寫入程式碼
			await this.fileService.writeFile('src/main.cpp', message.code);
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_FAILED_SAVE_FILE', (error as Error).message);

			vscode.window.showErrorMessage(errorMsg);
			log(errorMsg, 'error', error);
		}
	}

	/**
	 * 處理更新板子配置訊息
	 * @param message 更新板子訊息物件
	 */
	private async handleUpdateBoard(message: any): Promise<void> {
		try {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
				const openFolderBtn = await this.localeService.getLocalizedMessage('VSCODE_OPEN_FOLDER');

				vscode.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
					if (selection === openFolderBtn) {
						vscode.commands.executeCommand('workbench.action.files.openFolder');
					}
				});
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const platformioIni = 'platformio.ini';
			const boardConfig = await this.getBoardConfig(message.board);

			if (message.board === 'none') {
				if (this.fileService.fileExists(platformioIni)) {
					await this.fileService.deleteFile(platformioIni);
				}
			} else {
				const isFirstTime = !this.fileService.fileExists(platformioIni);
				await this.fileService.writeFile(platformioIni, boardConfig);

				// 使用 setTimeout 延遲訊息顯示，避免干擾面板顯示
				setTimeout(async () => {
					const boardUpdatedMsg = await this.localeService.getLocalizedMessage('VSCODE_BOARD_UPDATED', message.board);
					const reloadMsg = isFirstTime ? await this.localeService.getLocalizedMessage('VSCODE_RELOAD_REQUIRED') : '';
					const reloadBtn = await this.localeService.getLocalizedMessage('VSCODE_RELOAD');

					vscode.window
						.showInformationMessage(boardUpdatedMsg + reloadMsg, ...(isFirstTime ? [reloadBtn] : []))
						.then(selection => {
							if (selection === reloadBtn) {
								vscode.commands.executeCommand('workbench.action.reloadWindow');
							}
						});
				}, 100);

				// 確保 Blockly 編輯器保持在前景
				setTimeout(() => this.panel.reveal(vscode.ViewColumn.One, true), 200);
			}
		} catch (error) {
			const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_FAILED_UPDATE_INI', (error as Error).message);

			vscode.window.showErrorMessage(errorMsg);
			log(errorMsg, 'error', error);
		}
	}

	/**
	 * 處理儲存工作區訊息
	 * @param message 儲存工作區訊息物件
	 */
	private async handleSaveWorkspace(message: any): Promise<void> {
		try {
			const blocklyDir = 'blockly';
			const mainJsonPath = path.join(blocklyDir, 'main.json');

			// 建立 blockly 目錄
			await this.fileService.createDirectory(blocklyDir);

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

			vscode.window.showErrorMessage(errorMsg);
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
						// 將主題信息一併傳送
						this.panel.webview.postMessage({
							command: 'loadWorkspace',
							state: saveData.workspace,
							board: saveData.board || 'none',
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
		} catch (error) {
			log('Failed to read workspace state:', 'error', error);
		}
	}

	/**
	 * 處理提示新變數訊息
	 * @param message 提示新變數訊息物件
	 */
	private async handlePromptNewVariable(message: any): Promise<void> {
		try {
			const promptMsg = message.isRename
				? await this.localeService.getLocalizedMessage('VSCODE_ENTER_NEW_VARIABLE_NAME', message.currentName)
				: await this.localeService.getLocalizedMessage('VSCODE_ENTER_VARIABLE_NAME');

			const emptyErrorMsg = await this.localeService.getLocalizedMessage('VSCODE_VARIABLE_NAME_EMPTY');
			const invalidErrorMsg = await this.localeService.getLocalizedMessage('VSCODE_VARIABLE_NAME_INVALID');

			const result = await vscode.window.showInputBox({
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
			const confirmMsg = await this.localeService.getLocalizedMessage('VSCODE_CONFIRM_DELETE_VARIABLE', message.variableName);
			const okBtn = await this.localeService.getLocalizedMessage('VSCODE_OK');
			const cancelBtn = await this.localeService.getLocalizedMessage('VSCODE_CANCEL');

			const result = await vscode.window.showWarningMessage(confirmMsg, okBtn, cancelBtn);

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
			const result = await vscode.window.showWarningMessage(message.message, 'OK', 'Cancel');

			this.panel.webview.postMessage({
				command: 'confirmDialogResult',
				confirmed: result === 'OK',
				originalMessage: message.message,
				confirmId: message.confirmId, // 回傳原始的 confirmId
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
				throw new Error('無法找到 main.json 檔案');
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
			this.showErrorMessage(`建立備份失敗: ${error}`);
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
					// 讀取備份檔案
					const data = await this.fileService.readJsonFile<any>(path.join('blockly', 'backup', file), {});

					backups.push({
						name: name,
						date: data.created || new Date().toISOString(),
						size: 0, // 暫不處理檔案大小
					});
				} catch (err) {
					// 如果讀取檔案失敗，使用當前時間
					backups.push({
						name: name,
						date: new Date().toISOString(),
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
				throw new Error('未指定備份名稱');
			}

			const backupDir = path.join('blockly', 'backup');
			const backupPath = path.join(backupDir, `${message.name}.json`);

			// 檢查檔案是否存在
			if (this.fileService.fileExists(backupPath)) {
				// 顯示確認對話框，詢問用戶是否確定要刪除
				const confirmMessage = `確定要刪除備份檔案: ${message.name}.json 嗎？`;
				const deleteBtn = '刪除';
				const cancelBtn = '取消';

				const selection = await vscode.window.showWarningMessage(confirmMessage, deleteBtn, cancelBtn);

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
				throw new Error(`備份 ${message.name} 不存在`);
			}
		} catch (error) {
			log('刪除備份失敗:', 'error', error);
			this.panel.webview.postMessage({
				command: 'backupDeleted',
				name: message.name || '未知',
				success: false,
				error: `${error}`,
			});
			this.showErrorMessage(`刪除備份失敗: ${error}`);
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
					}, 10000);
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
		vscode.window.showErrorMessage(message);
	}
}
