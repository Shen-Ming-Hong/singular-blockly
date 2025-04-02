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
					const boardConfig = await getBoardConfig(currentPanel, message.board);

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
								theme: message.theme || 'light', // 儲存主題設定
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
									if (saveData && typeof saveData === 'object' && saveData.workspace) {
										// 將主題信息一併傳送
										currentPanel?.webview.postMessage({
											command: 'loadWorkspace',
											state: saveData.workspace,
											board: saveData.board || 'none',
											theme: saveData.theme || 'light', // 附加主題設定
										});
									} else {
										throw new Error('Invalid workspace state format');
									}
								} catch (parseError) {
									console.error('JSON parsing error:', parseError);
									// Create a new blank state
									const newState = { workspace: {}, board: 'none', theme: 'light' };
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
				} else if (message.command === 'updateTheme') {
					// 更新主題設定
					try {
						const workspaceFolders = vscode.workspace.workspaceFolders;
						if (workspaceFolders) {
							const workspaceRoot = workspaceFolders[0].uri.fsPath;
							const vscodeDir = path.join(workspaceRoot, '.vscode');
							const settingsPath = path.join(vscodeDir, 'settings.json');

							// 確保 .vscode 目錄存在
							if (!fs.existsSync(vscodeDir)) {
								await fs.promises.mkdir(vscodeDir, { recursive: true });
							}

							// 讀取現有設定
							let settings = {};
							if (fs.existsSync(settingsPath)) {
								try {
									const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
									settings = JSON.parse(settingsContent);
								} catch (e) {
									console.error('Invalid settings.json, will create new one');
								}
							}

							// 更新主題設定
							settings = {
								...settings,
								'singular-blockly.theme': message.theme || 'light',
							};

							// 寫入更新後的設定
							await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
							console.log(`Theme preference updated to: ${message.theme}`);

							// 同時更新 blockly/main.json 中的主題設定
							const blocklyDir = path.join(workspaceRoot, 'blockly');
							const mainJsonPath = path.join(blocklyDir, 'main.json');

							if (fs.existsSync(mainJsonPath)) {
								try {
									const fileContent = await fs.promises.readFile(mainJsonPath, 'utf8');
									const saveData = JSON.parse(fileContent);

									if (saveData && typeof saveData === 'object') {
										saveData.theme = message.theme || 'light';
										await fs.promises.writeFile(mainJsonPath, JSON.stringify(saveData, null, 2), 'utf8');
									}
								} catch (e) {
									console.error('Failed to update theme in main.json:', e);
								}
							}
						}
					} catch (error) {
						console.error('Failed to save theme preference:', error);
					}
				}
			});
		});

		// Register theme toggle command
		const toggleThemeCommand = vscode.commands.registerCommand('singular-blockly.toggleTheme', async () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				return;
			}

			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const settingsPath = path.join(workspaceRoot, '.vscode', 'settings.json');

			// 讀取現有設定
			let settings: { [key: string]: any } = {};
			let currentTheme = 'light';

			if (fs.existsSync(settingsPath)) {
				try {
					const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
					settings = JSON.parse(settingsContent);
					currentTheme = settings['singular-blockly.theme'] || 'light';
				} catch (e) {
					console.error('Invalid settings.json');
				}
			}

			// 切換主題
			const newTheme = currentTheme === 'light' ? 'dark' : 'light';

			// 更新設定
			settings = {
				...settings,
				'singular-blockly.theme': newTheme,
			};

			// 儲存新設定
			const vscodeDir = path.join(workspaceRoot, '.vscode');
			if (!fs.existsSync(vscodeDir)) {
				await fs.promises.mkdir(vscodeDir, { recursive: true });
			}

			await fs.promises.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');

			// 如果 Blockly 編輯器已開啟，通知它更新主題
			vscode.window.visibleTextEditors.forEach(editor => {
				if (editor.document.fileName.endsWith('blocklyEdit.html')) {
					editor.document.save();
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
		context.subscriptions.push(toggleThemeCommand); // 註冊主題切換命令

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
				settings = JSON.parse(settingsContent) as { [key: string]: any };
			} catch (e) {
				// 如果 JSON 無效，就使用空物件
				console.error('Invalid settings.json, will override with new settings');
			}
		}

		// 設定 PlatformIO 不自動開啟 ini 檔案及 Singular Blockly 主題
		settings = {
			...settings,
			'platformio-ide.autoOpenPlatformIOIniFile': false,
			'platformio-ide.disablePIOHomeStartup': true,
			'singular-blockly.theme': (settings as { [key: string]: any })['singular-blockly.theme'] || 'light', // 預設主題設定
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
		`<script src="${blocklyCompressedJsUri}"></script>
    ${localeScripts}` // Inject locale scripts
	);

	// 更新主題路徑 - 明確替換主題檔案路徑
	const themesPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/themes'));
	const themesUri = webview.asWebviewUri(themesPath);
	const singularJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/blockly/themes/singular.js')));
	const singularDarkJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/blockly/themes/singularDark.js')));

	// 替換主題相關URI
	htmlContent = htmlContent.replace('{themesUri}', themesUri.toString());
	htmlContent = htmlContent.replace('{themesUri}/singular.js', singularJsUri.toString());
	htmlContent = htmlContent.replace('{themesUri}/singularDark.js', singularDarkJsUri.toString());

	// 替換其他URI
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

	// 讀取使用者主題偏好
	let theme = 'light';
	try {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders) {
			const workspaceRoot = workspaceFolders[0].uri.fsPath;
			const settingsPath = path.join(workspaceRoot, '.vscode', 'settings.json');

			if (fs.existsSync(settingsPath)) {
				const settingsContent = await fs.promises.readFile(settingsPath, 'utf8');
				const settings = JSON.parse(settingsContent);
				theme = settings['singular-blockly.theme'] || 'light';
			}
		}
	} catch (error) {
		console.error('Failed to read theme preference:', error);
	}

	// Inject theme preference
	htmlContent = htmlContent.replace(/\{theme\}/g, theme);

	return htmlContent;
}

// Add a function to get board configuration
async function getBoardConfig(panel: vscode.WebviewPanel | undefined, board: string): Promise<string> {
	// 如果面板不存在，無法獲取設定
	if (!panel) {
		console.log('WebView 面板不可用，無法獲取板子設定');
		return ''; // 返回空字串
	}

	// 透過 WebView 獲取板子設定
	try {
		console.log(`向 WebView 請求板子設定：${board}`);

		// 設定一個 Promise 等待 webview 回應
		return new Promise<string>((resolve, reject) => {
			// 建立唯一的訊息 ID
			const messageId = `get-board-config-${Date.now()}`;
			console.log(`建立訊息 ID：${messageId}`);

			// 標記是否已收到回應
			let responseReceived = false;

			// 設定訊息監聽器
			const messageListener = panel.webview.onDidReceiveMessage(message => {
				console.log(`收到 WebView 回應：`, message);
				if (message.command === 'boardConfigResult' && message.messageId === messageId) {
					// 設定已收到回應標記
					responseReceived = true;
					// 收到回應後，移除監聽器
					messageListener.dispose();
					console.log(`成功從 WebView 獲取板子設定`);
					resolve(message.config || '');
				}
			});

			// 發送訊息到 webview，要求取得板子設定
			panel.webview.postMessage({
				command: 'getBoardConfig',
				board: board,
				messageId: messageId,
			});
			console.log(`已發送 getBoardConfig 請求到 WebView，等待回應`);

			// 設定逾時，如果 10 秒內沒有回應，則返回空字串
			const timeoutId = setTimeout(() => {
				// 只有在尚未收到回應時才執行超時處理
				if (!responseReceived) {
					messageListener.dispose();
					console.log(`板子設定請求逾時，無法獲取設定`);
					resolve(''); // 返回空字串
				} else {
					console.log(`已收到回應，取消超時處理`);
				}
			}, 10000);
		});
	} catch (error) {
		console.error('從 WebView 獲取板子設定時發生錯誤:', error);
		return ''; // 返回空字串
	}
}
