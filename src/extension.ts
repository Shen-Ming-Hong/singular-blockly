/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { log, showOutputChannel, disposeOutputChannel } from './services/logging';
import { LocaleService } from './services/localeService';
import { SettingsManager } from './services/settingsManager';
import { WebViewManager } from './webview/webviewManager';
import { registerMcpProvider } from './mcp/mcpProvider';

// Status bar priority constant
const STATUS_BAR_PRIORITY = 100;

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
 * 啟用擴充功能
 * @param context 擴充功能上下文
 */
export async function activate(context: vscode.ExtensionContext) {
	log('Starting Singular Blockly extension...', 'info');

	try {
		// 初始化服務
		const localeService = new LocaleService(context.extensionPath);

		// 【最優先】檢查是否為 CyberBrick/MicroPython 專案，若是則刪除 platformio.ini
		// 必須在 PlatformIO 擴充功能偵測到 ini 檔案之前執行
		const workspaceFolders = vscodeApi.workspace.workspaceFolders;
		if (workspaceFolders) {
			const workspaceRoot = workspaceFolders[0].uri.fsPath;

			// 檢查 main.json 中的 board 設定
			const mainJsonPath = path.join(workspaceRoot, 'blockly', 'main.json');
			const platformioIniPath = path.join(workspaceRoot, 'platformio.ini');

			try {
				if (fs.existsSync(mainJsonPath)) {
					const mainJsonContent = fs.readFileSync(mainJsonPath, 'utf-8');
					const mainJson = JSON.parse(mainJsonContent);
					const board = mainJson.board || 'none';

					// 如果是 CyberBrick 專案，刪除 platformio.ini
					if (board === 'cyberbrick') {
						log('CyberBrick project detected at activation, checking platformio.ini', 'info');
						if (fs.existsSync(platformioIniPath)) {
							fs.unlinkSync(platformioIniPath);
							log('Deleted platformio.ini for CyberBrick project at activation', 'info');
						}
					}
				}
			} catch (err) {
				log('Error checking/deleting platformio.ini at activation', 'warn', err);
			}

			// 設定 PlatformIO 不自動開啟 ini 檔案
			const settingsManager = new SettingsManager(workspaceRoot);
			await settingsManager.configurePlatformIOSettings();
			log('PlatformIO auto-open settings configured at activation', 'info');
		}

		// 清理過期的臨時工具箱檔案（非阻塞）
		WebViewManager.cleanupStaleTempFiles(context.extensionPath).catch(err => {
			log('Failed to cleanup stale temp files during activation', 'warn', err);
		});

		// 註冊活動欄視圖
		registerActivityBarView(context);

		// 註冊命令
		registerCommands(context, localeService);

		// 設定狀態列按鈕
		setupStatusBar(context, localeService);

		// 註冊 MCP Provider（VSCode 1.105.0+ 支援）
		registerMcpProviderIfAvailable(context);

		log('Singular Blockly extension fully activated!', 'info');
	} catch (error) {
		log('Error starting Singular Blockly:', 'error', error);
		vscodeApi.window.showErrorMessage(`Failed to start Singular Blockly: ${error}`);
	}
}

/**
 * 註冊活動欄視圖
 * @param context 擴充功能上下文
 */
function registerActivityBarView(context: vscode.ExtensionContext) {
	log('Registering activity bar view...', 'info');

	const activityBarListener = vscodeApi.window.registerWebviewViewProvider('singular-blockly-view', {
		resolveWebviewView: async webviewView => {
			// 立即關閉側邊欄
			await vscodeApi.commands.executeCommand('workbench.action.closeSidebar');
			await vscodeApi.commands.executeCommand('singular-blockly.openBlocklyEdit');
			log('Initialization complete, closing sidebar', 'info');

			// 監聽後續的可見性變更
			webviewView.onDidChangeVisibility(async () => {
				if (webviewView.visible) {
					log('Activity bar button clicked!', 'info');
					await vscodeApi.commands.executeCommand('workbench.action.closeSidebar');
					await vscodeApi.commands.executeCommand('singular-blockly.openBlocklyEdit');
				}
			});
		},
	});

	context.subscriptions.push(activityBarListener);
}

/**
 * 註冊命令
 * @param context 擴充功能上下文
 * @param localeService 多語言服務
 */
function registerCommands(context: vscode.ExtensionContext, localeService: LocaleService) {
	log('Registering commands...', 'info');

	// WebView 管理器（單例）
	let webViewManager: WebViewManager | undefined;

	// 註冊開啟 Blockly 編輯器命令
	const openBlocklyEdit = vscodeApi.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
		try {
			// 懶初始化 WebView 管理器
			if (!webViewManager) {
				webViewManager = new WebViewManager(context);
			}

			await webViewManager.createAndShowWebView();
		} catch (error) {
			log('Error opening Blockly editor:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'VSCODE_FAILED_OPEN_EDITOR',
				'Failed to open Blockly editor: {0}',
				String(error)
			);
			vscodeApi.window.showErrorMessage(errorMsg);
		}
	});

	// 註冊主題切換命令
	const toggleThemeCommand = vscodeApi.commands.registerCommand('singular-blockly.toggleTheme', async () => {
		try {
			const workspaceFolders = vscodeApi.workspace.workspaceFolders;
			if (!workspaceFolders) {
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const settingsManager = new SettingsManager(workspaceRoot);

			// 切換主題
			const newTheme = await settingsManager.toggleTheme();

			log(`Theme toggled to: ${newTheme}`, 'info');

			// 如果 WebView 已經開啟，通知更新主題
			if (webViewManager && webViewManager.isPanelCreated()) {
				const panel = webViewManager.getPanel();
				panel?.webview.postMessage({
					command: 'updateTheme',
					theme: newTheme,
				});
			}

			// 如果 Blockly 編輯器已開啟,通知它更新主題
			vscodeApi.window.visibleTextEditors.forEach(editor => {
				if (editor.document.fileName.endsWith('blocklyEdit.html')) {
					editor.document.save();
				}
			});
		} catch (error) {
			log('Error toggling theme:', 'error', error);
		}
	});
	// 註冊顯示輸出窗口命令
	const showOutputCommand = vscodeApi.commands.registerCommand('singular-blockly.showOutput', () => {
		showOutputChannel();
	});
	// 註冊預覽備份命令
	const previewBackupCommand = vscodeApi.commands.registerCommand('singular-blockly.previewBackup', async (backupPath?: string) => {
		try {
			log('Preview backup command triggered', 'info');

			// 若沒有提供備份路徑,可能需要讓用戶選擇
			if (!backupPath) {
				log('No backup path provided, need to select a backup file', 'info');

				// 獲取工作區路徑
				const workspaceFolders = vscodeApi.workspace.workspaceFolders;
				if (!workspaceFolders) {
					const errorMsg = await localeService.getLocalizedMessage(
						'ERROR_OPEN_PROJECT_FOLDER_FIRST',
						'Please open a project folder first'
					);
					vscodeApi.window.showErrorMessage(errorMsg);
					return;
				}

				// 獲取備份目錄
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const backupsDir = path.join(workspaceRoot, 'backups');

				// 檢查備份目錄是否存在
				try {
					const stat = await vscodeApi.workspace.fs.stat(vscodeApi.Uri.file(backupsDir));
					if ((stat.type & vscodeApi.FileType.Directory) === 0) {
						const infoMsg = await localeService.getLocalizedMessage('INFO_NO_BACKUPS_TO_PREVIEW', 'No backup files to preview');
						vscodeApi.window.showInformationMessage(infoMsg);
						return;
					}
				} catch (error) {
					const infoMsg = await localeService.getLocalizedMessage('INFO_NO_BACKUPS_TO_PREVIEW', 'No backup files to preview');
					vscodeApi.window.showInformationMessage(infoMsg);
					return;
				}

				// 讓用戶選擇備份檔案
				const selectTitle = await localeService.getLocalizedMessage('DIALOG_SELECT_BACKUP_TITLE', 'Select backup file to preview');
				const backupFilesLabel = await localeService.getLocalizedMessage('DIALOG_BACKUP_FILES_LABEL', 'Backup Files');
				const fileUris = await vscodeApi.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					defaultUri: vscodeApi.Uri.file(backupsDir),
					filters: {
						[backupFilesLabel]: ['json'],
					},
					title: selectTitle,
				});
				if (!fileUris || fileUris.length === 0) {
					return;
				}

				backupPath = fileUris[0].fsPath;
			}

			log(`Attempting to preview backup: ${backupPath}`, 'info');

			// 懶初始化 WebView 管理器
			if (!webViewManager) {
				webViewManager = new WebViewManager(context);
			}

			// 調用預覽功能
			await webViewManager.previewBackup(backupPath);
		} catch (error) {
			log('Error previewing backup:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'VSCODE_FAILED_PREVIEW_BACKUP',
				'Failed to preview backup: {0}',
				String(error)
			);
			vscodeApi.window.showErrorMessage(errorMsg);
		}
	});

	// 添加到訂閱清單
	context.subscriptions.push(openBlocklyEdit);
	context.subscriptions.push(toggleThemeCommand);
	context.subscriptions.push(showOutputCommand);
	context.subscriptions.push(previewBackupCommand);
}

/**
 * 註冊 MCP Provider（如果 VSCode 版本支援）
 * @param context 擴充功能上下文
 */
function registerMcpProviderIfAvailable(context: vscode.ExtensionContext) {
	log('Checking MCP API availability...', 'info');

	const disposable = registerMcpProvider(context);

	if (disposable) {
		context.subscriptions.push(disposable);
		log('MCP Provider registered and added to subscriptions', 'info');
	} else {
		log('MCP Provider not registered (API not available)', 'info');
	}
}

/**
 * 設定狀態列按鈕
 * @param context 擴充功能上下文
 * @param localeService 多語言服務
 */
function setupStatusBar(context: vscode.ExtensionContext, localeService: LocaleService) {
	log('Creating status bar button...', 'info');

	// 建立狀態列按鈕
	const blocklyStatusBarItem = vscodeApi.window.createStatusBarItem(vscodeApi.StatusBarAlignment.Left, STATUS_BAR_PRIORITY);
	blocklyStatusBarItem.command = 'singular-blockly.openBlocklyEdit';
	blocklyStatusBarItem.text = '$(wand)';
	blocklyStatusBarItem.tooltip = 'Open Blockly Editor'; // 預設工具提示

	// 非同步設定本地化的工具提示
	localeService.getLocalizedMessage('VSCODE_OPEN_BLOCKLY_EDITOR').then(message => {
		blocklyStatusBarItem.tooltip = message;
	});

	blocklyStatusBarItem.show();

	// 添加到訂閱清單
	context.subscriptions.push(blocklyStatusBarItem);
}

/**
 * 停用擴充功能
 */
export function deactivate() {
	// 清理資源
	disposeOutputChannel();
}
