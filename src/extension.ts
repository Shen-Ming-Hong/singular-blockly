/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// 用於翻譯的 UI 訊息
interface UIMessages {
	[key: string]: string;
}

// 暫存已載入的訊息
let cachedMessages: UIMessages = {};
let currentLanguage: string = 'en';

// 從多語言檔案中讀取 UI 訊息
async function loadUIMessages(context: vscode.ExtensionContext): Promise<UIMessages> {
	try {
		const vscodeLanguage = vscode.env.language;
		const blocklyLanguage = mapVSCodeLangToBlockly(vscodeLanguage);

		// 如果已經載入此語言，則直接返回已快取的訊息
		if (cachedMessages && currentLanguage === blocklyLanguage) {
			return cachedMessages;
		}

		// 找到對應的語言檔案
		const langFilePath = path.join(context.extensionPath, 'media/locales', blocklyLanguage, 'messages.js');

		// 如果找不到對應的語言檔，則使用英文
		if (!fs.existsSync(langFilePath)) {
			const enFilePath = path.join(context.extensionPath, 'media/locales/en/messages.js');
			if (!fs.existsSync(enFilePath)) {
				return {}; // 如果連英文檔案都找不到，返回空物件
			}

			// 讀取英文語言檔
			const content = await fs.promises.readFile(enFilePath, 'utf8');
			cachedMessages = extractMessagesFromJs(content);
			currentLanguage = 'en';
		} else {
			// 讀取對應語言檔
			const content = await fs.promises.readFile(langFilePath, 'utf8');
			cachedMessages = extractMessagesFromJs(content);
			currentLanguage = blocklyLanguage;
		}

		return cachedMessages;
	} catch (error) {
		console.error('Error loading UI messages:', error);
		return {}; // 發生錯誤時返回空物件
	}
}

// 從 JS 檔案中提取訊息
function extractMessagesFromJs(content: string): UIMessages {
	const messages: UIMessages = {};

	// 使用正則表達式尋找 VSCODE_ 開頭的訊息
	const regex = /VSCODE_(\w+):\s*['"](.+?)['"]/g;
	let match;

	while ((match = regex.exec(content)) !== null) {
		const key = 'VSCODE_' + match[1];
		const value = match[2];
		messages[key] = value;
	}

	return messages;
}

// 獲取翻譯後的 UI 訊息
async function getLocalizedMessage(context: vscode.ExtensionContext, key: string, ...args: any[]): Promise<string> {
	const messages = await loadUIMessages(context);
	let message = messages[key] || key; // 如果找不到翻譯，則使用 key 本身

	// 替換參數 {0}, {1}, 等
	args.forEach((arg, index) => {
		message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
	});

	return message;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting Singular Blockly extension...');

	try {
		console.log('Registering commands...');

		// Add activity bar click listener
		const activityBarListener = vscode.window.registerWebviewViewProvider('singular-blockly-view', {
			resolveWebviewView: async webviewView => {
				// Immediately close sidebar
				await vscode.commands.executeCommand('workbench.action.closeSidebar');
				await vscode.commands.executeCommand('singular-blockly.openBlocklyEdit');
				console.log('Initialization complete, closing sidebar');

				// Listen for subsequent visibility changes
				webviewView.onDidChangeVisibility(async () => {
					if (webviewView.visible) {
						console.log('Activity bar button clicked!');
						await vscode.commands.executeCommand('workbench.action.closeSidebar');
						await vscode.commands.executeCommand('singular-blockly.openBlocklyEdit');
					}
				});
			},
		});

		const openBlocklyEdit = vscode.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
			// 檢查工作區
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				const errorMsg = await getLocalizedMessage(context, 'VSCODE_PLEASE_OPEN_PROJECT');
				const openFolderBtn = await getLocalizedMessage(context, 'VSCODE_OPEN_FOLDER');
				vscode.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
					if (selection === openFolderBtn) {
						vscode.commands.executeCommand('workbench.action.files.openFolder');
					}
				});
				return;
			}

			// 設定 PlatformIO 不自動開啟 ini 檔案
			await configurePlatformIOSettings(workspaceFolders[0].uri.fsPath);

			// Save panel as global variable for later reference
			let currentPanel: vscode.WebviewPanel | undefined = vscode.window.createWebviewPanel(
				'blocklyEdit',
				'Blockly Edit',
				{
					viewColumn: vscode.ViewColumn.One,
					preserveFocus: true, // Add this setting to ensure focus is not stolen
				},
				{
					enableScripts: true,
					retainContextWhenHidden: true, // Keep webview content to avoid reloading
				}
			);

			// Ensure the panel is always visible at the front
			async function ensurePanelVisible() {
				if (currentPanel) {
					currentPanel.reveal(vscode.ViewColumn.One, true); // true means do not take focus
				}
			}

			currentPanel.webview.html = await getWebviewContent(context, currentPanel.webview);

			// Ensure the src directory exists
			const srcPath = path.join(context.extensionPath, 'src');
			if (!fs.existsSync(srcPath)) {
				await fs.promises.mkdir(srcPath, { recursive: true });
			}

			// Listen for messages from the webview
			currentPanel.webview.onDidReceiveMessage(async message => {
				if (message.command === 'updateCode') {
					// Get the current workspace
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders) {
						const errorMsg = await getLocalizedMessage(context, 'VSCODE_PLEASE_OPEN_PROJECT');
						const openFolderBtn = await getLocalizedMessage(context, 'VSCODE_OPEN_FOLDER');
						vscode.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
							if (selection === openFolderBtn) {
								vscode.commands.executeCommand('workbench.action.files.openFolder');
							}
						});
						return;
					}

					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const srcDir = path.join(workspaceRoot, 'src');
					if (!fs.existsSync(srcDir)) {
						await fs.promises.mkdir(srcDir, { recursive: true });
					}

					const filePath = vscode.Uri.file(path.join(srcDir, 'main.cpp'));

					try {
						// Direct file write, no need to open/close
						await fs.promises.writeFile(filePath.fsPath, message.code);
					} catch (error) {
						const errorMsg = await getLocalizedMessage(context, 'VSCODE_FAILED_SAVE_FILE', (error as Error).message);
						vscode.window.showErrorMessage(errorMsg);
						console.error(error);
					}
				} else if (message.command === 'updateBoard') {
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders) {
						vscode.window.showErrorMessage('Please open a project folder first!', 'Open Folder').then(selection => {
							if (selection === 'Open Folder') {
								vscode.commands.executeCommand('workbench.action.files.openFolder');
							}
						});
						return;
					}

					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const platformioIni = path.join(workspaceRoot, 'platformio.ini');
					const boardConfig = getBoardConfig(message.board);

					try {
						if (message.board === 'none') {
							if (fs.existsSync(platformioIni)) {
								await fs.promises.unlink(platformioIni);
							}
						} else {
							const isFirstTime = !fs.existsSync(platformioIni);
							await fs.promises.writeFile(platformioIni, boardConfig);

							// Use setTimeout to delay the message display to avoid interfering with the panel display
							setTimeout(async () => {
								const boardUpdatedMsg = await getLocalizedMessage(context, 'VSCODE_BOARD_UPDATED', message.board);
								const reloadMsg = isFirstTime ? await getLocalizedMessage(context, 'VSCODE_RELOAD_REQUIRED') : '';
								const reloadBtn = await getLocalizedMessage(context, 'VSCODE_RELOAD');

								vscode.window
									.showInformationMessage(boardUpdatedMsg + reloadMsg, ...(isFirstTime ? [reloadBtn] : []))
									.then(selection => {
										if (selection === reloadBtn) {
											vscode.commands.executeCommand('workbench.action.reloadWindow');
										}
									});
							}, 100);

							// Ensure the Blockly editor remains at the front
							setTimeout(ensurePanelVisible, 200);
						}
					} catch (error) {
						const errorMsg = await getLocalizedMessage(context, 'VSCODE_FAILED_UPDATE_INI', (error as Error).message);
						vscode.window.showErrorMessage(errorMsg);
						console.error(error);
					}
				} else if (message.command === 'saveWorkspace') {
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (workspaceFolders) {
						const workspaceRoot = workspaceFolders[0].uri.fsPath;
						const blocklyDir = path.join(workspaceRoot, 'blockly');
						const mainJsonPath = path.join(blocklyDir, 'main.json');

						try {
							// Create blockly directory if it doesn't exist
							if (!fs.existsSync(blocklyDir)) {
								await fs.promises.mkdir(blocklyDir, { recursive: true });
							}

							// Validate and clean data
							const cleanState = message.state ? JSON.parse(JSON.stringify(message.state)) : {};
							const saveData = {
								workspace: cleanState,
								board: message.board || 'none',
							};

							// Validate JSON before writing
							JSON.parse(JSON.stringify(saveData)); // Test serialization

							await fs.promises.writeFile(mainJsonPath, JSON.stringify(saveData, null, 2), { encoding: 'utf8' });
						} catch (error) {
							console.error('Failed to save workspace state:', error);
							const errorMsg = await getLocalizedMessage(context, 'VSCODE_UNABLE_SAVE_WORKSPACE', (error as Error).message);
							vscode.window.showErrorMessage(errorMsg);
						}
					}
				} else if (message.command === 'requestInitialState') {
					try {
						const workspaceFolders = vscode.workspace.workspaceFolders;
						if (workspaceFolders) {
							const workspaceRoot = workspaceFolders[0].uri.fsPath;
							const mainJsonPath = path.join(workspaceRoot, 'blockly', 'main.json');

							if (fs.existsSync(mainJsonPath)) {
								const fileContent = await fs.promises.readFile(mainJsonPath, 'utf8');
								try {
									// First try to parse JSON
									const saveData = JSON.parse(fileContent);

									// Validate data structure
									if (saveData && typeof saveData === 'object' && saveData.workspace && saveData.board) {
										currentPanel?.webview.postMessage({
											command: 'loadWorkspace',
											state: saveData.workspace,
											board: saveData.board,
										});
									} else {
										throw new Error('Invalid workspace state format');
									}
								} catch (parseError) {
									console.error('JSON parsing error:', parseError);
									// Create a new blank state
									const newState = { workspace: {}, board: 'none' };
									await fs.promises.writeFile(mainJsonPath, JSON.stringify(newState, null, 2), 'utf8');
								}
							}
						}
					} catch (error) {
						console.error('Failed to read workspace state:', error);
					}
				} else if (message.command === 'promptNewVariable') {
					const promptMsg = message.isRename
						? await getLocalizedMessage(context, 'VSCODE_ENTER_NEW_VARIABLE_NAME', message.currentName)
						: await getLocalizedMessage(context, 'VSCODE_ENTER_VARIABLE_NAME');

					const emptyErrorMsg = await getLocalizedMessage(context, 'VSCODE_VARIABLE_NAME_EMPTY');
					const invalidErrorMsg = await getLocalizedMessage(context, 'VSCODE_VARIABLE_NAME_INVALID');

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
						currentPanel?.webview.postMessage({
							command: 'createVariable',
							name: result,
							isRename: message.isRename,
							oldName: message.currentName,
						});
					}
				} else if (message.command === 'confirmDeleteVariable') {
					const confirmMsg = await getLocalizedMessage(context, 'VSCODE_CONFIRM_DELETE_VARIABLE', message.variableName);
					const okBtn = await getLocalizedMessage(context, 'VSCODE_OK');
					const cancelBtn = await getLocalizedMessage(context, 'VSCODE_CANCEL');

					const result = await vscode.window.showWarningMessage(confirmMsg, okBtn, cancelBtn);

					currentPanel?.webview.postMessage({
						command: 'deleteVariable',
						confirmed: result === okBtn,
						name: message.variableName,
					});
				} else if (message.command === 'confirmDialog') {
					// 處理確認對話框請求
					const result = await vscode.window.showWarningMessage(
						message.message, // 顯示從 webview 傳來的訊息
						'OK',
						'Cancel'
					);

					// 將結果回傳給 webview，包含原始的 confirmId
					currentPanel?.webview.postMessage({
						command: 'confirmDialogResult',
						confirmed: result === 'OK',
						originalMessage: message.message,
						confirmId: message.confirmId, // 回傳原始的 confirmId
					});
				}
			});
		});

		console.log('Creating status bar button...');
		// Create status bar button
		const blocklyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
		blocklyStatusBarItem.command = 'singular-blockly.openBlocklyEdit';
		blocklyStatusBarItem.text = '$(wand)';
		blocklyStatusBarItem.tooltip = 'Open Blockly Editor'; // Default tooltip

		// Set localized tooltip asynchronously
		getLocalizedMessage(context, 'VSCODE_OPEN_BLOCKLY_EDITOR').then(message => {
			blocklyStatusBarItem.tooltip = message;
		});

		blocklyStatusBarItem.show();

		console.log('Setting up subscriptions...');
		// Add status bar button to subscription list
		context.subscriptions.push(blocklyStatusBarItem);
		context.subscriptions.push(activityBarListener);

		console.log('Singular Blockly extension fully activated!');
	} catch (error) {
		console.error('Error starting Singular Blockly:', error);
		vscode.window.showErrorMessage(`Failed to start Singular Blockly: ${error}`);
	}
}

// 新增函數：設定 PlatformIO IDE 不自動開啟 platformio.ini 檔案
async function configurePlatformIOSettings(workspacePath: string) {
	try {
		// 檢查 .vscode 目錄是否存在，若不存在則建立
		const vscodeDir = path.join(workspacePath, '.vscode');
		if (!fs.existsSync(vscodeDir)) {
			await fs.promises.mkdir(vscodeDir, { recursive: true });
		}

		// 檢查 settings.json 是否存在
		const settingsPath = path.join(vscodeDir, 'settings.json');
		let settings = {};

		// 讀取現有設定 (如果存在)
		if (fs.existsSync(settingsPath)) {
			const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
			try {
				settings = JSON.parse(settingsContent);
			} catch (e) {
				// 如果 JSON 無效，就使用空物件
				console.error('Invalid settings.json, will override with new settings');
			}
		}

		// 設定 PlatformIO 不自動開啟 ini 檔案
		settings = {
			...settings,
			'platformio-ide.autoOpenPlatformIOIniFile': false,
			'platformio-ide.disablePIOHomeStartup': true,
		};

		// 寫入設定檔
		await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2));
		console.log('PlatformIO settings updated: disabled auto-open platformio.ini');
	} catch (error) {
		console.error('Failed to configure PlatformIO settings:', error);
	}
}

export function deactivate() {}

// Add a function to recursively handle JSON includes
async function resolveToolboxIncludes(context: vscode.ExtensionContext, json: any): Promise<any> {
	if (typeof json !== 'object') {
		return json;
	}

	if (Array.isArray(json)) {
		const results = await Promise.all(json.map(item => resolveToolboxIncludes(context, item)));
		return results;
	}

	if (json.$include) {
		const includePath = context.asAbsolutePath(path.join('media/toolbox', json.$include));
		const content = JSON.parse(await fs.promises.readFile(includePath, 'utf8'));
		return content;
	}

	const result: any = {};
	for (const key in json) {
		result[key] = await resolveToolboxIncludes(context, json[key]);
	}
	return result;
}

async function getAvailableBlocklyLanguages(context: vscode.ExtensionContext): Promise<string[]> {
	const msgPath = path.join(context.extensionPath, 'node_modules', 'blockly', 'msg');

	try {
		// Read all files in the msg directory
		const files = await fs.promises.readdir(msgPath);

		// Filter out .js files and remove extensions
		const languages = files.filter(file => file.endsWith('.js')).map(file => path.basename(file, '.js'));

		return languages;
	} catch (error) {
		console.error('Unable to read language file directory:', error);
		return ['en']; // Return at least English if an error occurs
	}
}

function mapVSCodeLangToBlockly(vscodeLanguage: string): string {
	// Language mapping table
	const languageMap: { [key: string]: string } = {
		'zh-tw': 'zh-hant',
		en: 'en',
		'en-us': 'en',
		ja: 'ja',
		es: 'es',
		'pt-br': 'pt-br',
		ru: 'ru',
		ko: 'ko',
		fr: 'fr',
		de: 'de',
		it: 'it',
		pl: 'pl',
		hu: 'hu',
		cs: 'cs',
		bg: 'bg',
		tr: 'tr',
		// Add more mappings as needed
	};

	// Convert VSCode language code to lowercase for comparison
	const normalizedLang = vscodeLanguage.toLowerCase();

	// Check for direct mapping
	if (languageMap[normalizedLang]) {
		return languageMap[normalizedLang];
	}

	// If no exact match, try to find a base language mapping
	const baseLang = normalizedLang.split('-')[0];
	if (languageMap[baseLang]) {
		return languageMap[baseLang];
	}

	// Return default language 'en' if no match found
	return 'en';
}

async function getSupportedLocales(context: vscode.ExtensionContext): Promise<string[]> {
	const localesPath = path.join(context.extensionPath, 'media/locales');
	try {
		const files = await fs.promises.readdir(localesPath);
		return files.filter(file => fs.statSync(path.join(localesPath, file)).isDirectory());
	} catch (error) {
		console.error('Unable to read language file directory:', error);
		return ['en']; // Return at least English if an error occurs
	}
}

async function loadLocaleFiles(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<string> {
	// Get the list of supported languages
	const supportedLocales = await getSupportedLocales(context);
	console.log('Supported languages:', supportedLocales);

	// Load language files
	const localeFiles = supportedLocales.map(locale => {
		const localePath = vscode.Uri.file(context.asAbsolutePath(`media/locales/${locale}/messages.js`));
		return {
			locale,
			uri: webview.asWebviewUri(localePath).toString(),
		};
	});

	// Generate script tags
	const localeScripts = localeFiles.map(file => `<script src="${file.uri}"></script>`).join('\n    ');

	return localeScripts;
}

// Modify the getWebviewContent function
async function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview) {
	const htmlPath = vscode.Uri.file(context.asAbsolutePath('media/html/blocklyEdit.html'));
	const cssPath = vscode.Uri.file(context.asAbsolutePath('media/css/blocklyEdit.css'));
	const jsPath = vscode.Uri.file(context.asAbsolutePath('media/js/blocklyEdit.js'));
	const boardConfigsPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/board_configs.js'));

	const cssUri = webview.asWebviewUri(cssPath);
	const jsUri = webview.asWebviewUri(jsPath);
	const boardConfigsUri = webview.asWebviewUri(boardConfigsPath);

	const blocklyCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/blockly_compressed.js'))
	);
	const blocksCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/blocks_compressed.js'))
	);
	const javascriptCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/javascript_compressed.js'))
	);
	const themeModernJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/@blockly/theme-modern/dist/index.js'))
	);

	// Update Arduino generator path
	const arduinoGeneratorPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/generators/arduino/index.js'));
	const arduinoGeneratorUri = webview.asWebviewUri(arduinoGeneratorPath);

	// Update Arduino blocks path
	const arduinoBlocksPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/arduino.js'));
	const arduinoBlocksUri = webview.asWebviewUri(arduinoBlocksPath);

	// Add function blocks path
	const functionBlocksPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/functions.js'));
	const functionBlocksUri = webview.asWebviewUri(functionBlocksPath);

	// Arduino generator module paths
	const arduinoModules = ['io.js', 'logic.js', 'loops.js', 'math.js', 'text.js', 'lists.js', 'functions.js', 'variables.js']
		.map(file => {
			const modulePath = vscode.Uri.file(context.asAbsolutePath(`media/blockly/generators/arduino/${file}`));
			const moduleUri = webview.asWebviewUri(modulePath);
			return `<script src="${moduleUri}"></script>`;
		})
		.join('\n    ');

	let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

	const vscodeLanguage = vscode.env.language;
	const blocklyLanguage = mapVSCodeLangToBlockly(vscodeLanguage);
	console.log(`VSCode language: ${vscodeLanguage} -> Blockly language: ${blocklyLanguage}`);

	// Load the corresponding Blockly language file
	const langJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath(`media/locales/${blocklyLanguage}/messages.js`)));
	const msgJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath(`node_modules/blockly/msg/${blocklyLanguage}.js`))); // Get available Blockly languages
	const availableLanguages = await getAvailableBlocklyLanguages(context);
	console.log('Available Blockly languages:', availableLanguages);
	// Load language files, currently loading all, can be optimized as needed in the future
	const localeScripts = await loadLocaleFiles(context, webview);

	// Inject language settings
	htmlContent = htmlContent.replace("currentLanguage: '{vscodeLanguage}'", `currentLanguage: '${blocklyLanguage}'`);
	// After reading the HTML content, inject language files at the appropriate location
	htmlContent = htmlContent.replace(
		'<script src="{blocklyCompressedJsUri}"></script>',
		`<script src="{blocklyCompressedJsUri}"></script>
    ${localeScripts}`
	);

	htmlContent = htmlContent.replace('{cssUri}', cssUri.toString());
	htmlContent = htmlContent.replace('{jsUri}', jsUri.toString());
	htmlContent = htmlContent.replace('{blocklyCompressedJsUri}', blocklyCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{blocksCompressedJsUri}', blocksCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{javascriptCompressedJsUri}', javascriptCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{langJsUri}', langJsUri.toString());
	htmlContent = htmlContent.replace('{msgJsUri}', msgJsUri.toString());
	htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());
	htmlContent = htmlContent.replace('{arduinoGeneratorUri}', arduinoGeneratorUri.toString());
	htmlContent = htmlContent.replace('{arduinoBlocksUri}', arduinoBlocksUri.toString());
	htmlContent = htmlContent.replace('{boardConfigsUri}', boardConfigsUri.toString());
	htmlContent = htmlContent.replace('{arduinoModules}', arduinoModules);
	htmlContent = htmlContent.replace('{functionBlocksUri}', functionBlocksUri.toString());

	// Read and process toolbox configuration
	const toolboxJsonPath = context.asAbsolutePath('media/toolbox/index.json');
	const toolboxJson = JSON.parse(await fs.promises.readFile(toolboxJsonPath, 'utf8'));
	const resolvedToolbox = await resolveToolboxIncludes(context, toolboxJson);

	// Write the processed configuration to a temporary file
	const tempToolboxPath = context.asAbsolutePath('media/toolbox/temp_toolbox.json');
	await fs.promises.writeFile(tempToolboxPath, JSON.stringify(resolvedToolbox, null, 2));
	const tempToolboxUri = webview.asWebviewUri(vscode.Uri.file(tempToolboxPath));

	htmlContent = htmlContent.replace('{toolboxUri}', tempToolboxUri.toString());

	// Update theme path
	const themesUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/blockly/themes')));
	htmlContent = htmlContent.replace('{themesUri}', themesUri.toString());

	return htmlContent;
}

// Add a function to get board configuration
const getBoardConfig = (board: string): string => {
	const configs: { [key: string]: string } = {
		uno: `[env:uno]
platform = atmelavr
board = uno
framework = arduino`,
		nano: `[env:nano]
platform = atmelavr
board = nanoatmega328
framework = arduino`,
		mega: `[env:mega]
platform = atmelavr
board = megaatmega2560
framework = arduino`,
		esp32: `[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino`,
		supermini: `[env:lolin_c3_mini]
platform = espressif32
board = lolin_c3_mini
framework = arduino`,
		none: ``, // Empty configuration
	};
	return configs[board] || configs.none;
};
