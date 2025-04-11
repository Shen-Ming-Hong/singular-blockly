/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
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
	private localeService: LocaleService;

	/**
	 * 建立 WebView 管理器實例
	 * @param context 擴充功能上下文
	 */
	constructor(private context: vscode.ExtensionContext) {
		this.localeService = new LocaleService(context.extensionPath);
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
			const htmlPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media/html/blocklyEdit.html'));
			let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

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

			// Arduino 生成器模組
			const arduinoModules = ['io.js', 'logic.js', 'loops.js', 'math.js', 'text.js', 'lists.js', 'functions.js', 'variables.js']
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
			const localeScripts = await this.loadLocaleFiles(webview);

			// 主題文件
			const singularJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singular.js'))
			);

			const singularDarkJsUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(this.context.extensionPath, 'media/blockly/themes/singularDark.js'))
			);

			// 讀取並處理工具箱配置
			const toolboxJsonPath = path.join(this.context.extensionPath, 'media/toolbox/index.json');
			const toolboxJson = JSON.parse(fs.readFileSync(toolboxJsonPath, 'utf8'));
			const resolvedToolbox = await this.resolveToolboxIncludes(toolboxJson);

			// 寫入處理後的配置到臨時檔案
			const tempToolboxPath = path.join(this.context.extensionPath, 'media/toolbox/temp_toolbox.json');
			fs.writeFileSync(tempToolboxPath, JSON.stringify(resolvedToolbox, null, 2));
			const tempToolboxUri = webview.asWebviewUri(vscode.Uri.file(tempToolboxPath));

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
			htmlContent = htmlContent.replace('{jsUri}', jsUri.toString());
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
			const includePath = path.join(this.context.extensionPath, 'media/toolbox', json.$include);
			const content = JSON.parse(fs.readFileSync(includePath, 'utf8'));
			return content;
		}

		const result: any = {};
		for (const key in json) {
			result[key] = await this.resolveToolboxIncludes(json[key]);
		}
		return result;
	}

	/**
	 * 載入所有語言文件
	 * @param webview WebView 實例
	 * @returns 語言腳本 HTML
	 */
	private async loadLocaleFiles(webview: vscode.Webview): Promise<string> {
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
}
