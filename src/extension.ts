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
import { NodeDetectionService } from './services/nodeDetectionService';
import { DiagnosticService } from './services/diagnosticService';

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
		const nodeDetectionService = new NodeDetectionService();
		const diagnosticService = new DiagnosticService(nodeDetectionService, localeService);

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
		registerCommands(context, localeService, diagnosticService);

		// 設定狀態列按鈕
		setupStatusBar(context, localeService);

		// 註冊 MCP Provider（VSCode 1.105.0+ 支援，需要 Node.js 22.16.0+）
		await registerMcpProviderIfAvailable(context, nodeDetectionService, localeService);

		// 設定配置變更監聽器（監聽 Node.js 路徑設定變更）
		setupConfigurationListener(context, nodeDetectionService, localeService);

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
 * @param diagnosticService 診斷服務
 */
function registerCommands(context: vscode.ExtensionContext, localeService: LocaleService, diagnosticService: DiagnosticService) {
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

	// 註冊 MCP 狀態診斷命令
	const checkMcpStatusCommand = vscodeApi.commands.registerCommand('singular-blockly.checkMcpStatus', async () => {
		try {
			log('Executing checkMcpStatus command', 'info');

			// 顯示進度通知
			const progressMsg = await localeService.getLocalizedMessage('PROGRESS_CHECKING_MCP', 'Checking MCP status...');

			await vscodeApi.window.withProgress(
				{
					location: vscodeApi.ProgressLocation.Notification,
					title: progressMsg,
					cancellable: false,
				},
				async () => {
					// 收集診斷資訊
					const report = await diagnosticService.collectDiagnostics(context.extensionPath);

					// 格式化報告 (now async)
					const formattedReport = await diagnosticService.formatReport(report, { format: 'text', useEmoji: true });

					// 獲取複製按鈕文字
					const copyButton = await localeService.getLocalizedMessage('BUTTON_COPY_DIAGNOSTICS', '複製診斷資訊');

					// 顯示報告訊息框
					const action = await vscodeApi.window.showInformationMessage(formattedReport, { modal: false }, copyButton);

					// 處理複製按鈕點擊
					if (action === copyButton) {
						const copied = await diagnosticService.copyToClipboard(report);
						if (copied) {
							const successMsg = await localeService.getLocalizedMessage('INFO_COPIED_TO_CLIPBOARD', '已複製到剪貼簿');
							vscodeApi.window.showInformationMessage(successMsg);
							log('Diagnostic report copied to clipboard', 'info');
						}
					}
				}
			);

			log('checkMcpStatus command completed', 'info');
		} catch (error) {
			log('Error executing checkMcpStatus command:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage(
				'ERROR_DIAGNOSTIC_COMMAND_FAILED',
				'MCP 診斷命令執行失敗: {0}',
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
	context.subscriptions.push(checkMcpStatusCommand);
}

/**
 * 註冊 MCP Provider（如果 VSCode 版本支援且 Node.js 可用）
 * @param context 擴充功能上下文
 * @param nodeDetectionService Node.js 檢測服務
 * @param localeService 多語言服務
 */
async function registerMcpProviderIfAvailable(
	context: vscode.ExtensionContext,
	nodeDetectionService: NodeDetectionService,
	localeService: LocaleService
) {
	log('Checking MCP prerequisites...', 'info');

	// 1. Check VSCode API version (vscode.lm API availability)
	if (!vscodeApi.lm || typeof vscodeApi.lm.registerMcpServerDefinitionProvider !== 'function') {
		log('MCP API not available (VSCode < 1.105.0), skipping MCP Provider registration', 'info');
		return;
	}

	// 2. Get Node.js path setting
	const config = vscodeApi.workspace.getConfiguration('singularBlockly.mcp');
	const nodePath = config.get<string>('nodePath', 'node');
	const showStartupWarning = config.get<boolean>('showStartupWarning', true);

	// 3. Detect Node.js
	const nodeDetection = await nodeDetectionService.detectNodeJs(nodePath);

	// 4. Check if Node.js is available and compatible
	if (!nodeDetection.available || !nodeDetection.versionCompatible) {
		log(`Node.js unavailable or incompatible: ${nodeDetection.errorMessage || 'version too low'}`, 'warn', {
			available: nodeDetection.available,
			versionCompatible: nodeDetection.versionCompatible,
			version: nodeDetection.version,
			errorType: nodeDetection.errorType,
		});

		// Show warning if enabled
		if (showStartupWarning) {
			await showNodeJsWarning(nodeDetection, localeService);
		}

		// Graceful degradation: skip MCP registration, other features work normally
		return;
	}

	// 5. Node.js available and compatible, register MCP Provider
	log(`Node.js ${nodeDetection.version} detected, registering MCP Provider`, 'info');

	const disposable = registerMcpProvider(context);

	if (disposable) {
		context.subscriptions.push(disposable);
		log('MCP Provider registered successfully', 'info');
	} else {
		log('MCP Provider registration failed', 'warn');
	}
}

/**
 * 顯示 Node.js 不可用警告訊息
 * @param nodeDetection Node.js 檢測結果
 * @param localeService 多語言服務
 */
async function showNodeJsWarning(nodeDetection: import('./types/nodeDetection').NodeDetectionResult, localeService: LocaleService) {
	// Get localized messages
	const warningMsg = await localeService.getLocalizedMessage(
		'WARNING_NODE_NOT_AVAILABLE',
		'Node.js 22.16.0 或以上版本未檢測到。MCP 功能將無法使用,但 Blockly 編輯功能仍可正常運作。\n\n錯誤: {0}',
		nodeDetection.errorMessage || '未知錯誤'
	);

	const installButton = await localeService.getLocalizedMessage('BUTTON_INSTALL_GUIDE', '安裝指引');

	const laterButton = await localeService.getLocalizedMessage('BUTTON_REMIND_LATER', '稍後提醒');

	// Show warning message with buttons (fire-and-forget to avoid blocking activation)
	vscodeApi.window.showWarningMessage(warningMsg, installButton, laterButton).then(async action => {
		try {
			// Handle button clicks
			if (action === installButton) {
				// Open Node.js download page
				await vscodeApi.env.openExternal(vscodeApi.Uri.parse('https://nodejs.org/'));
				log('User clicked Install Guide button', 'info');
			} else if (action === laterButton) {
				// Disable startup warning
				await vscodeApi.workspace
					.getConfiguration('singularBlockly.mcp')
					.update('showStartupWarning', false, vscodeApi.ConfigurationTarget.Global);
				log('User disabled Node.js startup warning', 'info');
			}
		} catch (error) {
			log('Failed to handle Node.js warning action', 'error', error);
		}
	});
}

/**
 * 設定配置變更監聽器
 * @param context 擴充功能上下文
 * @param nodeDetectionService Node.js 檢測服務
 * @param localeService 多語言服務
 */
function setupConfigurationListener(
	context: vscode.ExtensionContext,
	nodeDetectionService: NodeDetectionService,
	localeService: LocaleService
) {
	const disposable = vscodeApi.workspace.onDidChangeConfiguration(async event => {
		// Check if singularBlockly.mcp.nodePath setting changed
		if (!event.affectsConfiguration('singularBlockly.mcp.nodePath')) {
			return;
		}

		log('singularBlockly.mcp.nodePath setting changed, validating new path', 'info');

		// Get new nodePath setting
		const config = vscodeApi.workspace.getConfiguration('singularBlockly.mcp');
		const nodePath = config.get<string>('nodePath', 'node');

		// Validate path with progress indicator (non-blocking UI)
		const progressMsg = await localeService.getLocalizedMessage('PROGRESS_VALIDATING_NODE_PATH', '正在驗證 Node.js 路徑...');

		const validationResult = await vscodeApi.window.withProgress(
			{
				location: vscodeApi.ProgressLocation.Notification,
				title: progressMsg,
				cancellable: false,
			},
			async () => {
				return await nodeDetectionService.validateNodePath(nodePath);
			}
		);

		log('Node.js path validation completed', 'info', {
			nodePath,
			valid: validationResult.valid,
			error: validationResult.error,
			errorType: validationResult.errorType,
		});

		// Show result message
		if (!validationResult.valid) {
			// Invalid path - show warning
			const warningMsg = await localeService.getLocalizedMessage(
				'WARNING_INVALID_NODE_PATH',
				'指定的 Node.js 路徑無效: {0}。錯誤: {1}。請修正路徑或清空設定以使用預設的 "node" 命令。',
				nodePath,
				validationResult.error || '未知錯誤'
			);
			await vscodeApi.window.showWarningMessage(warningMsg);
		} else {
			// Valid path - show info
			const infoMsg = await localeService.getLocalizedMessage('INFO_NODE_PATH_VALID', 'Node.js 路徑已驗證: {0}', nodePath);
			await vscodeApi.window.showInformationMessage(infoMsg);
		}
	});

	context.subscriptions.push(disposable);
	log('Configuration listener registered', 'info');
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
