/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { log, showOutputChannel, disposeOutputChannel } from './services/logging';
import { LocaleService } from './services/localeService';
import { SettingsManager } from './services/settingsManager';
import { WebViewManager } from './webview/webviewManager';

/**
 * 啟用擴充功能
 * @param context 擴充功能上下文
 */
export function activate(context: vscode.ExtensionContext) {
	log('Starting Singular Blockly extension...', 'info');

	try {
		// 初始化服務
		const localeService = new LocaleService(context.extensionPath);

		// 註冊活動欄視圖
		registerActivityBarView(context);

		// 註冊命令
		registerCommands(context, localeService);

		// 設定狀態列按鈕
		setupStatusBar(context, localeService);

		log('Singular Blockly extension fully activated!', 'info');
	} catch (error) {
		log('Error starting Singular Blockly:', 'error', error);
		vscode.window.showErrorMessage(`Failed to start Singular Blockly: ${error}`);
	}
}

/**
 * 註冊活動欄視圖
 * @param context 擴充功能上下文
 */
function registerActivityBarView(context: vscode.ExtensionContext) {
	log('Registering activity bar view...', 'info');

	const activityBarListener = vscode.window.registerWebviewViewProvider('singular-blockly-view', {
		resolveWebviewView: async webviewView => {
			// 立即關閉側邊欄
			await vscode.commands.executeCommand('workbench.action.closeSidebar');
			await vscode.commands.executeCommand('singular-blockly.openBlocklyEdit');
			log('Initialization complete, closing sidebar', 'info');

			// 監聽後續的可見性變更
			webviewView.onDidChangeVisibility(async () => {
				if (webviewView.visible) {
					log('Activity bar button clicked!', 'info');
					await vscode.commands.executeCommand('workbench.action.closeSidebar');
					await vscode.commands.executeCommand('singular-blockly.openBlocklyEdit');
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
	const openBlocklyEdit = vscode.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
		try {
			// 懶初始化 WebView 管理器
			if (!webViewManager) {
				webViewManager = new WebViewManager(context);
			}

			await webViewManager.createAndShowWebView();
		} catch (error) {
			log('Error opening Blockly editor:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage('VSCODE_FAILED_OPEN_EDITOR', error);
			vscode.window.showErrorMessage(errorMsg);
		}
	});

	// 註冊主題切換命令
	const toggleThemeCommand = vscode.commands.registerCommand('singular-blockly.toggleTheme', async () => {
		try {
			const workspaceFolders = vscode.workspace.workspaceFolders;
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

			// 如果 Blockly 編輯器已開啟，通知它更新主題
			vscode.window.visibleTextEditors.forEach(editor => {
				if (editor.document.fileName.endsWith('blocklyEdit.html')) {
					editor.document.save();
				}
			});
		} catch (error) {
			log('Error toggling theme:', 'error', error);
		}
	});
	// 註冊顯示輸出窗口命令
	const showOutputCommand = vscode.commands.registerCommand('singular-blockly.showOutput', () => {
		showOutputChannel();
	});
	// 註冊預覽備份命令
	const previewBackupCommand = vscode.commands.registerCommand('singular-blockly.previewBackup', async (backupPath?: string) => {
		try {
			log('Preview backup command triggered', 'info');

			// 若沒有提供備份路徑，可能需要讓用戶選擇
			if (!backupPath) {
				log('No backup path provided, need to select a backup file', 'info');

				// 獲取工作區路徑
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders) {
					vscode.window.showErrorMessage('請先開啟項目資料夾');
					return;
				}

				// 獲取備份目錄
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const backupsDir = path.join(workspaceRoot, 'backups');

				// 檢查備份目錄是否存在
				try {
					const stat = await vscode.workspace.fs.stat(vscode.Uri.file(backupsDir));
					if ((stat.type & vscode.FileType.Directory) === 0) {
						vscode.window.showInformationMessage('尚無備份檔案可以預覽');
						return;
					}
				} catch (error) {
					vscode.window.showInformationMessage('尚無備份檔案可以預覽');
					return;
				}

				// 讓用戶選擇備份檔案
				const fileUris = await vscode.window.showOpenDialog({
					canSelectFiles: true,
					canSelectFolders: false,
					canSelectMany: false,
					defaultUri: vscode.Uri.file(backupsDir),
					filters: {
						備份檔案: ['json'],
					},
					title: '選擇要預覽的備份檔案',
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
			const errorMsg = await localeService.getLocalizedMessage('VSCODE_FAILED_PREVIEW_BACKUP', error);
			vscode.window.showErrorMessage(errorMsg);
		}
	});

	// 添加到訂閱清單
	context.subscriptions.push(openBlocklyEdit);
	context.subscriptions.push(toggleThemeCommand);
	context.subscriptions.push(showOutputCommand);
	context.subscriptions.push(previewBackupCommand);
}

/**
 * 設定狀態列按鈕
 * @param context 擴充功能上下文
 * @param localeService 多語言服務
 */
function setupStatusBar(context: vscode.ExtensionContext, localeService: LocaleService) {
	log('Creating status bar button...', 'info');

	// 建立狀態列按鈕
	const blocklyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
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
