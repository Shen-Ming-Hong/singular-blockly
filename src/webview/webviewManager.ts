/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { log } from '../services/logging';
import { FileService } from '../services/fileService';
import { LocaleService } from '../services/localeService';
import { SettingsManager } from '../services/settingsManager';
import { WebViewMessageHandler } from './messageHandler';

/**
 * WebView 管理類別
 * 負責建立和管理擴充功能的 WebView 面板
 */
export class WebViewManager {
	private panel: vscode.WebviewPanel | undefined;
	private messageHandler: WebViewMessageHandler | undefined;
	private fileService: FileService | undefined;
	private extensionFileService: FileService;
	private localeService: LocaleService;
	private previewPanels: Map<string, vscode.WebviewPanel> = new Map();
	private currentTempToolboxFile: string | null = null;

	/**
	 * 建立 WebView 管理器實例
	 * @param context 擴充功能上下文
	 * @param localeService 語言服務（可選，用於測試）
	 * @param extensionFileService 擴充功能檔案服務（可選，用於測試）
	 */
	constructor(
		private context: vscode.ExtensionContext,
		localeService?: LocaleService,
		extensionFileService?: FileService
	) {
		this.localeService = localeService || new LocaleService(context.extensionPath);
		this.extensionFileService = extensionFileService || new FileService(context.extensionPath);
	}

	/**
	 * 建立並顯示 WebView 面板
	 */
	async createAndShowWebView(): Promise<void> {
		// 檢查工作區
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

		// 初始化檔案服務
		const workspaceRoot = workspaceFolders[0].uri.fsPath;
		this.fileService = new FileService(workspaceRoot);

		// 設定 PlatformIO 不自動開啟 ini 檔案
		const settingsManager = new SettingsManager(workspaceRoot);
		await settingsManager.configurePlatformIOSettings();

		// 如果已有面板，則顯示已有的面板
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One, true);
			return;
		}

		// 建立新的 WebView 面板
		this.panel = vscode.window.createWebviewPanel(
			'blocklyEdit',
			'Blockly Edit',
			{
				viewColumn: vscode.ViewColumn.One,
				preserveFocus: true, // 確保不會搶走焦點
			},
			{
				enableScripts: true,
				retainContextWhenHidden: true, // 保持 WebView 內容，避免重新載入
			}
		);

		// 設定 WebView 內容
		this.panel.webview.html = await this.getWebviewContent();

		// 建立訊息處理器
		this.messageHandler = new WebViewMessageHandler(this.context, this.panel, this.localeService);

		// 監聽 WebView 訊息
		this.panel.webview.onDidReceiveMessage(message => this.messageHandler?.handleMessage(message));

		// 當面板關閉時清理資源
		this.panel.onDidDispose(() => {
			this.panel = undefined;
			this.messageHandler = undefined;
			this.cleanupTempFile();
			log('WebView panel disposed', 'info');
		});

		log('WebView panel created and shown', 'info');
	}

	/**
	 * 確保 WebView 面板在前景可見
	 */
	ensurePanelVisible(): void {
		if (this.panel) {
			this.panel.reveal(vscode.ViewColumn.One, true);
		}
	}

	/**
	 * 獲取 WebView 內容
	 * @returns WebView HTML 內容
	 */
	private async getWebviewContent(): Promise<string> {
		try {
			let htmlContent = await this.extensionFileService.readFile('media/html/blocklyEdit.html');

			// 取得當前語言和主題設定
			const localeService = new LocaleService(this.context.extensionPath);
			const blocklyLanguage = localeService.getCurrentLanguage();

			let theme = 'light';
			if (this.fileService) {
				const settingsManager = new SettingsManager(vscode.workspace.workspaceFolders![0].uri.fsPath);
				theme = await settingsManager.getTheme();
			}

			// 準備各種資源 URI
			const cssPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/css/blocklyEdit.css'));
			const jsPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/js/blocklyEdit.js'));
			const boardConfigsPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/board_configs.js'));

			// 轉換為 WebView 可用的 URI
			const webview = this.panel!.webview;
			const cssUri = webview.asWebviewUri(cssPath);
			const jsUri = webview.asWebviewUri(jsPath);
			const boardConfigsUri = webview.asWebviewUri(boardConfigsPath);

			// Blockly 核心庫
			const blocklyCompressedJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/blockly_compressed.js'))
			);
			const blocksCompressedJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/blocks_compressed.js'))
			);
			const javascriptCompressedJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/javascript_compressed.js'))
			);
			const themeModernJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/@blockly/theme-modern/dist/index.js'))
			);

			// Arduino 生成器和區塊
			const arduinoGeneratorPath = vscode.Uri.file(
				path.join(this.context.extensionPath, 'media/blockly/generators/arduino/index.js')
			);
			const arduinoGeneratorUri = webview.asWebviewUri(arduinoGeneratorPath);
			const arduinoBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/arduino.js'));
			const arduinoBlocksUri = webview.asWebviewUri(arduinoBlocksPath);
			const functionBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/functions.js'));
			const functionBlocksUri = webview.asWebviewUri(functionBlocksPath);
			const sensorsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/sensors.js'));
			const sensorsBlocksUri = webview.asWebviewUri(sensorsBlocksPath);
			// 伺服馬達積木定義
			const motorsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/motors.js'));
			const motorsBlocksUri = webview.asWebviewUri(motorsBlocksPath);

			// 循環區塊定義
			const loopsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/loops.js'));
			const loopsBlocksUri = webview.asWebviewUri(loopsBlocksPath);

			// Pixetto 智慧鏡頭積木定義
			const pixettoBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/pixetto.js'));
			const pixettoBlocksUri = webview.asWebviewUri(pixettoBlocksPath);

			// HUSKYLENS 智慧鏡頭積木定義
			const huskyLensBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/huskylens.js'));
			const huskyLensBlocksUri = webview.asWebviewUri(huskyLensBlocksPath);
			// Arduino 生成器模組（動態發現）
			const discoveredModules = await this.discoverArduinoModules();
			const arduinoModules = discoveredModules
				.map(file => {
					const modulePath = vscode.Uri.file(path.join(this.context.extensionPath, `media/blockly/generators/arduino/${file}`));
					const moduleUri = webview.asWebviewUri(modulePath);
					return `<script src="${moduleUri}"></script>`;
				})
				.join('\n    ');

			// 多語言文件
			const localePath = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, `media/locales/${blocklyLanguage}/messages.js`))
			);

			const msgJsPath = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, `node_modules/blockly/msg/${blocklyLanguage}.js`))
			);

			// 載入所有支援的語言文件
			const localeScripts = await this.loadLocaleScripts(webview); // 主題文件
			const singularJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singular.js'))
			);

			const singularDarkJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singularDark.js'))
			);

			// 讀取並處理工具箱配置
			const toolboxJson = await this.extensionFileService.readJsonFile('media/toolbox/index.json', {});
			const resolvedToolbox = await this.resolveToolboxIncludes(toolboxJson);

			// 寫入處理後的配置到唯一命名的臨時檔案
			this.currentTempToolboxFile = this.generateTempToolboxPath();
			await this.extensionFileService.writeJsonFile(this.currentTempToolboxFile, resolvedToolbox, true);
			const tempToolboxUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, this.currentTempToolboxFile))
			);

			// 替換所有預留位置
			htmlContent = htmlContent.replace("currentLanguage: '{vscodeLanguage}'", `currentLanguage: '${blocklyLanguage}'`);
			htmlContent = htmlContent.replace(
				'<script src="{blocklyCompressedJsUri}"></script>',
				`<script src="${blocklyCompressedJsUri}"></script>
    ${localeScripts}` // 注入語言腳本
			);

			// 替換主題相關 URI
			htmlContent = htmlContent.replace('{themesUri}/singular.js', singularJsUri.toString());
			htmlContent = htmlContent.replace('{themesUri}/singularDark.js', singularDarkJsUri.toString());

			// 替換其他 URI
			htmlContent = htmlContent.replace('{cssUri}', cssUri.toString());
			htmlContent = htmlContent.replace(
				'{experimentalCssUri}',
				webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media/css/experimentalBlocks.css'))).toString()
			);
			htmlContent = htmlContent.replace('{jsUri}', jsUri.toString());
			htmlContent = htmlContent.replace(
				'{experimentalMarkerUri}',
				webview
					.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media/js/experimentalBlockMarker.js')))
					.toString()
			);
			htmlContent = htmlContent.replace('{blocklyCompressedJsUri}', blocklyCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{blocksCompressedJsUri}', blocksCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{javascriptCompressedJsUri}', javascriptCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{langJsUri}', localePath.toString());
			htmlContent = htmlContent.replace('{msgJsUri}', msgJsPath.toString());
			htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());
			htmlContent = htmlContent.replace('{arduinoGeneratorUri}', arduinoGeneratorUri.toString());
			htmlContent = htmlContent.replace('{arduinoBlocksUri}', arduinoBlocksUri.toString());
			htmlContent = htmlContent.replace('{boardConfigsUri}', boardConfigsUri.toString());
			htmlContent = htmlContent.replace('{functionBlocksUri}', functionBlocksUri.toString());
			// 載入感測器及馬達區塊定義
			htmlContent = htmlContent.replace('{sensorsBlocksUri}', sensorsBlocksUri.toString());
			htmlContent = htmlContent.replace('{motorsBlocksUri}', motorsBlocksUri.toString());
			htmlContent = htmlContent.replace('{loopsBlocksUri}', loopsBlocksUri.toString());
			htmlContent = htmlContent.replace('{pixettoBlocksUri}', pixettoBlocksUri.toString());
			htmlContent = htmlContent.replace('{huskyLensBlocksUri}', huskyLensBlocksUri.toString());
			htmlContent = htmlContent.replace('{arduinoModules}', arduinoModules);
			htmlContent = htmlContent.replace('{toolboxUri}', tempToolboxUri.toString());

			// 注入主題偏好
			htmlContent = htmlContent.replace(/\{theme\}/g, theme);

			return htmlContent;
		} catch (error) {
			log('Error getting WebView content:', 'error', error);
			throw error;
		}
	}

	/**
	 * 遞迴處理 toolbox 引用
	 * @param json Toolbox JSON 物件
	 * @returns 處理後的 JSON 物件
	 */
	private async resolveToolboxIncludes(json: any): Promise<any> {
		if (typeof json !== 'object') {
			return json;
		}

		if (Array.isArray(json)) {
			const results = await Promise.all(json.map(item => this.resolveToolboxIncludes(item)));
			return results;
		}

		if (json.$include) {
			const includePath = `media/toolbox/${json.$include}`;
			const content = await this.extensionFileService.readJsonFile(includePath, {});
			return content;
		}

		const result: any = {};
		for (const key in json) {
			result[key] = await this.resolveToolboxIncludes(json[key]);
		}
		return result;
	}

	/**
	 * 載入所有語言文件（統一方法）
	 * @param webview WebView 實例
	 * @returns 語言腳本 HTML
	 */
	private async loadLocaleScripts(webview: vscode.Webview): Promise<string> {
		// 獲取支援語言列表
		const supportedLocales = await this.localeService.getSupportedLocales();
		log('Supported languages:', 'info', supportedLocales);

		// 載入語言檔案
		const localeFiles = supportedLocales.map(locale => {
			const localePath = vscode.Uri.file(path.join(this.context.extensionPath, `media/locales/${locale}/messages.js`));
			return {
				locale,
				uri: webview.asWebviewUri(localePath).toString(),
			};
		});

		// 生成腳本標籤
		const localeScripts = localeFiles.map(file => `<script src="${file.uri}"></script>`).join('\n    ');

		return localeScripts;
	}

	/**
	 * 生成唯一的臨時工具箱檔案路徑
	 * @returns 臨時檔案的相對路徑
	 */
	private generateTempToolboxPath(): string {
		const timestamp = Date.now();
		return `media/toolbox/temp_toolbox_${timestamp}.json`;
	}

	/**
	 * 自動發現 Arduino 生成器模組
	 * @returns 模組檔案名稱列表（已排序）
	 */
	private async discoverArduinoModules(): Promise<string[]> {
		try {
			const generatorsPath = 'media/blockly/generators/arduino';
			const files = await this.extensionFileService.listFiles(generatorsPath);

			// 過濾 .js 檔案，排除 index.js
			const modules = files.filter(f => f.endsWith('.js') && f !== 'index.js').sort(); // 字母排序確保載入順序一致

			log(`Discovered ${modules.length} Arduino generator modules`, 'info', modules);
			return modules;
		} catch (error) {
			// Fallback to hardcoded list with warning
			log('Warning: Failed to scan Arduino generators directory, using fallback list', 'warn', error);
			return [
				'functions.js',
				'huskylens.js',
				'io.js',
				'lists.js',
				'logic.js',
				'loops.js',
				'math.js',
				'motors.js',
				'pixetto.js',
				'sensors.js',
				'text.js',
				'variables.js',
			];
		}
	}

	/**
	 * 清理過期的臨時工具箱檔案（超過 1 小時）
	 * 在擴充套件啟動時執行，清理殘留的舊檔案
	 * @param extensionPath 擴充套件路徑
	 */
	static async cleanupStaleTempFiles(extensionPath: string): Promise<void> {
		const TEMP_FILE_MAX_AGE_MS = 60 * 60 * 1000; // 1 小時
		const TEMP_FILE_PREFIX = 'temp_toolbox_';
		const TOOLBOX_DIR = 'media/toolbox';

		try {
			const fileService = new FileService(extensionPath);
			const files = await fileService.listFiles(TOOLBOX_DIR);
			const tempFiles = files.filter(f => f.startsWith(TEMP_FILE_PREFIX) && f.endsWith('.json'));

			let deletedCount = 0;
			for (const file of tempFiles) {
				const filePath = `${TOOLBOX_DIR}/${file}`;
				const stats = await fileService.getFileStats(filePath);

				if (stats) {
					const ageMs = Date.now() - stats.mtime.getTime();
					if (ageMs > TEMP_FILE_MAX_AGE_MS) {
						await fileService.deleteFile(filePath);
						deletedCount++;
					}
				}
			}

			if (deletedCount > 0) {
				log(`Cleaned up ${deletedCount} stale temporary toolbox file(s)`, 'info');
			}
		} catch (error) {
			// Non-blocking cleanup - log warning but don't throw
			log('Warning: Failed to cleanup stale temporary files', 'warn', error);
		}
	}

	/**
	 * 清理臨時工具箱檔案（非阻塞，錯誤不拋出）
	 */
	private async cleanupTempFile(): Promise<void> {
		if (!this.currentTempToolboxFile) {
			return;
		}

		try {
			await this.extensionFileService.deleteFile(this.currentTempToolboxFile);
			log(`Cleaned up temp file: ${this.currentTempToolboxFile}`, 'info');
			this.currentTempToolboxFile = null;
		} catch (error) {
			// Non-blocking: log warning but don't throw
			log(`Warning: Failed to cleanup temp file ${this.currentTempToolboxFile}`, 'warn', error);
		}
	}

	/**
	 * 檢查面板是否建立
	 * @returns 面板是否已建立
	 */
	isPanelCreated(): boolean {
		return !!this.panel;
	}

	/**
	 * 關閉面板
	 */
	closePanel(): void {
		if (this.panel) {
			this.panel.dispose();
			this.panel = undefined;
		}
	}

	/**
	 * 獲取 WebView 面板實例
	 * @returns WebView 面板實例
	 */
	getPanel(): vscode.WebviewPanel | undefined {
		return this.panel;
	}

	/**
	 * 預覽備份內容
	 * @param backupPath 備份檔案的完整路徑
	 */
	async previewBackup(backupPath: string): Promise<void> {
		try {
			log(`預覽備份文件: ${backupPath}`, 'info');

			// 檢查檔案是否存在 (backupPath is absolute, need to make it relative to workspace)
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				throw new Error('請先開啟項目資料夾');
			}
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const relativeBackupPath = path.relative(workspaceRoot, backupPath);

			// Initialize workspace file service if needed
			if (!this.fileService) {
				this.fileService = new FileService(workspaceRoot);
			}

			if (!this.fileService.fileExists(relativeBackupPath)) {
				log(`備份檔案不存在: ${backupPath}`, 'error');
				throw new Error(`備份檔案不存在: ${backupPath}`);
			}

			const fileName = path.basename(backupPath);

			// 如果已有該備份的預覽窗口，直接顯示
			if (this.previewPanels.has(backupPath)) {
				this.previewPanels.get(backupPath)?.reveal(vscode.ViewColumn.Two);
				return;
			}

			// 初始化檔案服務（如果尚未初始化）
			if (!this.fileService) {
				const workspaceFolders = vscode.workspace.workspaceFolders;
				if (!workspaceFolders) {
					throw new Error('請先開啟項目資料夾');
				}
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				this.fileService = new FileService(workspaceRoot);
			} // 建立新的預覽視窗
			// 使用多語言文字作為標題
			const previewTitle = await this.localeService.getLocalizedMessage('PREVIEW_WINDOW_TITLE', fileName);
			const previewPanel = vscode.window.createWebviewPanel(
				'blocklyPreview',
				previewTitle,
				{
					viewColumn: vscode.ViewColumn.Two,
					preserveFocus: true,
				},
				{
					enableScripts: true,
					retainContextWhenHidden: true,
					localResourceRoots: [
						vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
						vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules')),
					],
				}
			);

			// 設定預覽窗口內容
			previewPanel.webview.html = await this.getPreviewContent(fileName);

			// 監聽視窗關閉事件
			previewPanel.onDidDispose(() => {
				this.previewPanels.delete(backupPath);
				log(`預覽窗口已關閉: ${fileName}`, 'info');
			});

			// 將視窗添加到管理集合中
			this.previewPanels.set(backupPath, previewPanel);

			// 從備份檔案載入XML
			await this.loadBackupContent(backupPath, previewPanel);

			// 監聽來自預覽視窗的訊息
			previewPanel.webview.onDidReceiveMessage(async message => {
				await this.handlePreviewMessage(message, backupPath, previewPanel);
			});

			log(`預覽窗口已創建: ${fileName}`, 'info');
		} catch (error) {
			log('建立預覽窗口失敗', 'error', error);
			throw error;
		}
	}

	/**
	 * 處理來自預覽視窗的訊息
	 * @param message 訊息內容
	 * @param backupPath 備份檔案路徑
	 * @param panel 面板實例
	 */
	private async handlePreviewMessage(message: any, backupPath: string, panel: vscode.WebviewPanel): Promise<void> {
		try {
			switch (message.command) {
				case 'log':
					// 轉發日誌訊息
					log(message.message, message.level, ...(message.args || []));
					break;

				case 'themeChanged':
					// 同步主題變更
					const settingsManager = new SettingsManager(vscode.workspace.workspaceFolders![0].uri.fsPath);
					await settingsManager.updateTheme(message.theme);

					// 如果主編輯窗口開啟，也一併更新
					if (this.panel) {
						this.panel.webview.postMessage({
							command: 'updateTheme',
							theme: message.theme,
						});
					}

					// 更新其他所有預覽窗口
					for (const [path, previewPanel] of this.previewPanels.entries()) {
						if (path !== backupPath && previewPanel) {
							previewPanel.webview.postMessage({
								command: 'updateTheme',
								theme: message.theme,
							});
						}
					}
					break;

				case 'loadBackupData':
					// 重新載入備份數據
					await this.loadBackupContent(backupPath, panel);
					break;
			}
		} catch (error) {
			log('處理預覽窗口訊息時發生錯誤', 'error', error);
		}
	}
	/**
	 * 載入備份檔案內容並傳送到預覽窗口
	 * @param backupPath 備份檔案路徑
	 * @param panel 預覽視窗實例
	 */
	private async loadBackupContent(backupPath: string, panel: vscode.WebviewPanel): Promise<void> {
		try {
			// 根據絕對路徑獲取相對路徑
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				throw new Error('請先開啟項目資料夾');
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;

			// 確保 FileService 已初始化
			if (!this.fileService) {
				this.fileService = new FileService(workspaceRoot);
			}

			// 將絕對路徑轉換為相對路徑
			let relativePath = backupPath;
			if (backupPath.startsWith(workspaceRoot)) {
				relativePath = backupPath.substring(workspaceRoot.length + 1); // +1 移除前導斜線
			}

			log(`嘗試讀取備份檔案 (相對路徑): ${relativePath}`, 'info');

			// 檢查檔案是否存在
			if (!this.fileService.fileExists(relativePath)) {
				throw new Error(`備份檔案不存在: ${relativePath}`);
			}

			// 使用 FileService 讀取檔案
			const content = await this.fileService.readFile(relativePath);

			// 檢查內容是否為空
			if (!content || content.trim() === '') {
				throw new Error('備份檔案內容為空');
			}

			log(`成功讀取備份檔案，準備解析JSON`, 'info');

			try {
				const backupData = JSON.parse(content);

				if (!backupData) {
					throw new Error('解析JSON後得到空對象');
				}

				if (!backupData.workspace) {
					throw new Error('備份檔案中缺少有效的workspace欄位');
				}

				// 取得工作區狀態
				const blocklyState = backupData.workspace;

				// 檢查積木狀態是否有效
				if (!blocklyState || !blocklyState.blocks) {
					throw new Error('備份檔案中缺少有效的工作區資料');
				}

				// 將 workspace 對象直接傳送到視窗，讓視窗端負責解析和顯示
				panel.webview.postMessage({
					command: 'loadWorkspaceState',
					workspaceState: blocklyState,
				});

				log('備份 workspace 狀態已成功載入到預覽窗口', 'info');
			} catch (parseError) {
				log('解析JSON內容失敗', 'error', parseError);
				throw new Error(`無法解析備份檔案內容: ${parseError}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : '未知錯誤';
			log(`載入備份內容失敗: ${errorMessage}`, 'error', error);

			// 顯示載入失敗訊息在預覽窗口
			panel.webview.postMessage({
				command: 'loadError',
				error: `載入備份內容失敗: ${errorMessage}`,
			});
		}
	}

	/**
	 * 獲取預覽窗口的 HTML 內容
	 * @param fileName 顯示在預覽標題中的檔案名稱
	 * @returns HTML 字符串
	 */
	private async getPreviewContent(fileName: string): Promise<string> {
		try {
			let htmlContent = await this.extensionFileService.readFile('media/html/blocklyPreview.html');

			// 使用多語言模板更新 HTML <title> 標籤
			const localizedWindowTitle = await this.localeService.getLocalizedMessage('PREVIEW_WINDOW_TITLE', fileName);
			htmlContent = htmlContent.replace(/<title[^>]*>[\s\S]*?<\/title>/, `<title id="pageTitle">${localizedWindowTitle}</title>`);

			// 取得當前語言和主題設定
			const localeService = new LocaleService(this.context.extensionPath);
			const blocklyLanguage = localeService.getCurrentLanguage();

			let theme = 'light';
			if (this.fileService) {
				const settingsManager = new SettingsManager(vscode.workspace.workspaceFolders![0].uri.fsPath);
				theme = await settingsManager.getTheme();
			}

			// 建立預覽頁面時使用的 webview (因為此時還沒有 panel.webview)
			const tempWebview = this.getWebviewForPreview();

			// 準備各種資源 URI
			const cssPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/css/blocklyEdit.css'));
			const jsPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/js/blocklyPreview.js'));
			const boardConfigsPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/board_configs.js'));

			// 實驗性 CSS 和標記器
			const experimentalCssPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/css/experimentalBlocks.css'));
			const experimentalMarkerPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/js/experimentalBlockMarker.js'));

			// 轉換為 WebView 可用的 URI
			const cssUri = tempWebview.asWebviewUri(cssPath);
			const jsUri = tempWebview.asWebviewUri(jsPath);
			const boardConfigsUri = tempWebview.asWebviewUri(boardConfigsPath);
			const experimentalCssUri = tempWebview.asWebviewUri(experimentalCssPath);
			const experimentalMarkerUri = tempWebview.asWebviewUri(experimentalMarkerPath);

			// Blockly 核心庫
			const blocklyCompressedJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/blockly_compressed.js'))
			);
			const blocksCompressedJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/blocks_compressed.js'))
			);
			const javascriptCompressedJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/blockly/javascript_compressed.js'))
			);
			const themeModernJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules/@blockly/theme-modern/dist/index.js'))
			);

			// Arduino 生成器和區塊
			const arduinoGeneratorPath = vscode.Uri.file(
				path.join(this.context.extensionPath, 'media/blockly/generators/arduino/index.js')
			);
			const arduinoGeneratorUri = tempWebview.asWebviewUri(arduinoGeneratorPath);
			const arduinoBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/arduino.js'));
			const arduinoBlocksUri = tempWebview.asWebviewUri(arduinoBlocksPath);
			const functionBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/functions.js'));
			const functionBlocksUri = tempWebview.asWebviewUri(functionBlocksPath);
			const sensorsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/sensors.js'));
			const sensorsBlocksUri = tempWebview.asWebviewUri(sensorsBlocksPath);
			// 伺服馬達積木定義
			const motorsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/motors.js'));
			const motorsBlocksUri = tempWebview.asWebviewUri(motorsBlocksPath);

			// 循環區塊定義
			const loopsBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/loops.js'));
			const loopsBlocksUri = tempWebview.asWebviewUri(loopsBlocksPath);

			// Pixetto 智慧鏡頭積木定義
			const pixettoBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/pixetto.js'));
			const pixettoBlocksUri = tempWebview.asWebviewUri(pixettoBlocksPath);

			// HUSKYLENS 智慧鏡頭積木定義
			const huskyLensBlocksPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/blocks/huskylens.js'));
			const huskyLensBlocksUri = tempWebview.asWebviewUri(huskyLensBlocksPath);
			// Arduino 生成器模組（動態發現）
			const discoveredModules = await this.discoverArduinoModules();
			const arduinoModules = discoveredModules
				.map(file => {
					const modulePath = vscode.Uri.file(path.join(this.context.extensionPath, `media/blockly/generators/arduino/${file}`));
					const moduleUri = tempWebview.asWebviewUri(modulePath);
					return `<script src="${moduleUri}"></script>`;
				})
				.join('\n    ');

			// 多語言文件
			const localePath = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, `media/locales/${blocklyLanguage}/messages.js`))
			);

			const msgJsPath = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, `node_modules/blockly/msg/${blocklyLanguage}.js`))
			);

			// 載入所有支援的語言文件
			const localeScripts = await this.loadLocaleScripts(tempWebview); // 主題文件
			const singularJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singular.js'))
			);

			const singularDarkJsUri = tempWebview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singularDark.js'))
			);

			// 替換所有預留位置
			htmlContent = htmlContent.replace("currentLanguage: '{vscodeLanguage}'", `currentLanguage: '${blocklyLanguage}'`);
			htmlContent = htmlContent.replace(
				'<script src="{blocklyCompressedJsUri}"></script>',
				`<script src="${blocklyCompressedJsUri}"></script>
    ${localeScripts}` // 注入語言腳本
			);

			// 設定檔案名稱
			htmlContent = htmlContent.replace(/\{fileName\}/g, fileName);
			// 更新預覽頁面標題欄為多語言模板
			const localizedInPageTitle = await this.localeService.getLocalizedMessage('PREVIEW_WINDOW_TITLE', fileName);
			htmlContent = htmlContent.replace(
				/<div class="preview-title">[\s\S]*?<\/div>/,
				`<div class="preview-title">${localizedInPageTitle} <span class="preview-badge" id="previewBadge"></span></div>`
			);

			// 替換主題相關 URI
			htmlContent = htmlContent.replace('{themesUri}/singular.js', singularJsUri.toString());
			htmlContent = htmlContent.replace('{themesUri}/singularDark.js', singularDarkJsUri.toString());

			// 替換其他 URI
			htmlContent = htmlContent.replace('{cssUri}', cssUri.toString());
			htmlContent = htmlContent.replace('{experimentalCssUri}', experimentalCssUri.toString());
			htmlContent = htmlContent.replace('{experimentalMarkerUri}', experimentalMarkerUri.toString());
			htmlContent = htmlContent.replace('{previewJsUri}', jsUri.toString());
			htmlContent = htmlContent.replace('{blocklyCompressedJsUri}', blocklyCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{blocksCompressedJsUri}', blocksCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{javascriptCompressedJsUri}', javascriptCompressedJsUri.toString());
			htmlContent = htmlContent.replace('{langJsUri}', localePath.toString());
			htmlContent = htmlContent.replace('{msgJsUri}', msgJsPath.toString());
			htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());
			htmlContent = htmlContent.replace('{arduinoGeneratorUri}', arduinoGeneratorUri.toString());
			htmlContent = htmlContent.replace('{arduinoBlocksUri}', arduinoBlocksUri.toString());
			htmlContent = htmlContent.replace('{boardConfigsUri}', boardConfigsUri.toString());
			htmlContent = htmlContent.replace('{arduinoModules}', arduinoModules);
			htmlContent = htmlContent.replace('{functionBlocksUri}', functionBlocksUri.toString());
			// 載入感測器及馬達區塊定義
			htmlContent = htmlContent.replace('{sensorsBlocksUri}', sensorsBlocksUri.toString());
			htmlContent = htmlContent.replace('{motorsBlocksUri}', motorsBlocksUri.toString());
			htmlContent = htmlContent.replace('{loopsBlocksUri}', loopsBlocksUri.toString());
			htmlContent = htmlContent.replace('{pixettoBlocksUri}', pixettoBlocksUri.toString());
			htmlContent = htmlContent.replace('{huskyLensBlocksUri}', huskyLensBlocksUri.toString());

			// 注入主題偏好
			htmlContent = htmlContent.replace(/\{theme\}/g, theme);

			return htmlContent;
		} catch (error) {
			log('獲取預覽內容時發生錯誤:', 'error', error);
			throw error;
		}
	}

	/**
	 * 為預覽頁面準備臨時 webview 以生成 URI
	 * @returns 用於資源地址轉換的 webview
	 */
	private getWebviewForPreview(): vscode.Webview {
		// 如果有存在的面板，重用其 webview
		if (this.panel) {
			return this.panel.webview;
		}

		// 否則創建臨時的 webviewPanel 進行 URI 轉換
		const tempPanel = vscode.window.createWebviewPanel('blocklyTemp', 'Temp', vscode.ViewColumn.One, {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
				vscode.Uri.file(path.join(this.context.extensionPath, 'node_modules')),
			],
		});

		// 使用後立即處理
		const webview = tempPanel.webview;
		tempPanel.dispose();

		return webview;
	}

	/**
	 * 載入預覽頁面的語言文件
	 * @param webview WebView 實例
	 * @returns 語言腳本 HTML
	 */
}
