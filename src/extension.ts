import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('開始啟動 Singular Blockly 擴充功能...');

	try {
		console.log('正在註冊指令...');

		const disposable = vscode.commands.registerCommand('singular-blockly.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from Singular Blockly!');
		});

		const openBlocklyEdit = vscode.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
			// 將面板保存為全局變數，以便後續引用
			let currentPanel: vscode.WebviewPanel | undefined = vscode.window.createWebviewPanel(
				'blocklyEdit',
				'Blockly Edit',
				{
					viewColumn: vscode.ViewColumn.One,
					preserveFocus: true, // 加入此設定確保焦點不會被搶走
				},
				{
					enableScripts: true,
					retainContextWhenHidden: true, // 保持 webview 內容，避免重新加載
				}
			);

			// 監聽面板關閉事件
			currentPanel.onDidDispose(() => {
				currentPanel = undefined;
			});

			// 確保面板始終顯示在最前面
			async function ensurePanelVisible() {
				if (currentPanel) {
					currentPanel.reveal(vscode.ViewColumn.One, true); // true 表示不獲取焦點
				}
			}

			// 確保 blockly 目錄存在
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (workspaceFolders) {
				const workspaceRoot = workspaceFolders[0].uri.fsPath;
				const blocklyDir = path.join(workspaceRoot, 'blockly');
				if (!fs.existsSync(blocklyDir)) {
					await fs.promises.mkdir(blocklyDir, { recursive: true });
				}
			}

			currentPanel.webview.html = await getWebviewContent(context, currentPanel.webview);

			// 確保 src 目錄存在
			const srcPath = path.join(context.extensionPath, 'src');
			if (!fs.existsSync(srcPath)) {
				await fs.promises.mkdir(srcPath, { recursive: true });
			}

			// 監聽來自 webview 的訊息
			currentPanel.webview.onDidReceiveMessage(async message => {
				if (message.command === 'updateCode') {
					// 取得當前工作區域
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders) {
						vscode.window.showErrorMessage('請先開啟一個專案資料夾！');
						return;
					}

					const workspaceRoot = workspaceFolders[0].uri.fsPath;
					const srcDir = path.join(workspaceRoot, 'src');
					if (!fs.existsSync(srcDir)) {
						await fs.promises.mkdir(srcDir, { recursive: true });
					}

					const filePath = vscode.Uri.file(path.join(srcDir, 'main.cpp'));

					try {
						// 直接寫入檔案，不需要開啟或關閉
						await fs.promises.writeFile(filePath.fsPath, message.code);
					} catch (error) {
						vscode.window.showErrorMessage(`無法儲存檔案: ${(error as Error).message}`);
						console.error(error);
					}
				} else if (message.command === 'updateBoard') {
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders) {
						vscode.window.showErrorMessage('請先開啟一個專案資料夾！');
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

							// 使用 setTimeout 延遲顯示訊息，避免干擾面板顯示
							setTimeout(() => {
								vscode.window
									.showInformationMessage(
										`已更新開發板設定為: ${message.board}${isFirstTime ? '\n請重新載入視窗以完成設定' : ''}`,
										...(isFirstTime ? ['重新載入'] : [])
									)
									.then(selection => {
										if (selection === '重新載入') {
											vscode.commands.executeCommand('workbench.action.reloadWindow');
										}
									});
							}, 100);

							// 確保 Blockly 編輯器保持在最前面
							setTimeout(ensurePanelVisible, 200);
						}
					} catch (error) {
						vscode.window.showErrorMessage(`無法更新 platformio.ini: ${(error as Error).message}`);
						console.error(error);
					}
				} else if (message.command === 'saveWorkspace') {
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (workspaceFolders) {
						const workspaceRoot = workspaceFolders[0].uri.fsPath;
						const blocklyDir = path.join(workspaceRoot, 'blockly');
						const mainJsonPath = path.join(blocklyDir, 'main.json');

						try {
							// 驗證並清理資料
							const cleanState = message.state ? JSON.parse(JSON.stringify(message.state)) : {};
							const saveData = {
								workspace: cleanState,
								board: message.board || 'none',
							};

							// 寫入前先驗證 JSON 是否有效
							JSON.parse(JSON.stringify(saveData)); // 測試序列化

							await fs.promises.writeFile(mainJsonPath, JSON.stringify(saveData, null, 2), { encoding: 'utf8' });
						} catch (error) {
							console.error('保存工作區狀態失敗:', error);
							vscode.window.showErrorMessage(`無法保存工作區狀態: ${(error as Error).message}`);
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
									// 先嘗試解析 JSON
									const saveData = JSON.parse(fileContent);

									// 驗證資料結構
									if (saveData && typeof saveData === 'object' && saveData.workspace && saveData.board) {
										currentPanel?.webview.postMessage({
											command: 'loadWorkspace',
											state: saveData.workspace,
											board: saveData.board,
										});
									} else {
										throw new Error('無效的工作區狀態格式');
									}
								} catch (parseError) {
									console.error('JSON 解析錯誤:', parseError);
									// 建立新的空白狀態
									const newState = { workspace: {}, board: 'none' };
									await fs.promises.writeFile(mainJsonPath, JSON.stringify(newState, null, 2), 'utf8');
								}
							}
						}
					} catch (error) {
						console.error('讀取工作區狀態失敗:', error);
					}
				} else if (message.command === 'promptNewVariable') {
					const result = await vscode.window.showInputBox({
						prompt: message.isRename ? `請輸入新的變數名稱 (目前: ${message.currentName})` : '請輸入新變數名稱',
						value: message.currentName || '',
						validateInput: text => {
							if (!text) {
								return '變數名稱不能為空';
							}
							if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(text)) {
								return '變數名稱只能包含字母、數字和底線，且不能以數字開頭';
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
					const result = await vscode.window.showWarningMessage(`確定要刪除變數 "${message.variableName}" 嗎？`, '確定', '取消');

					currentPanel?.webview.postMessage({
						command: 'deleteVariable',
						confirmed: result === '確定',
						name: message.variableName,
					});
				}
			});
		});

		console.log('正在建立狀態列按鈕...');
		// 建立狀態列按鈕
		const blocklyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
		blocklyStatusBarItem.command = 'singular-blockly.openBlocklyEdit';
		blocklyStatusBarItem.text = '$(wand)';
		blocklyStatusBarItem.tooltip = '開啟 Blockly 編輯器';
		blocklyStatusBarItem.show();

		console.log('正在設定訂閱...');
		// 將狀態列按鈕加入訂閱清單
		context.subscriptions.push(blocklyStatusBarItem);

		context.subscriptions.push(disposable, openBlocklyEdit);

		console.log('Singular Blockly 擴充功能已完全啟動！');
	} catch (error) {
		console.error('Singular Blockly 啟動時發生錯誤:', error);
		vscode.window.showErrorMessage(`Singular Blockly 啟動失敗: ${error}`);
	}
}

export function deactivate() {}

// 新增一個函數來遞迴處理 JSON 引入
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
		// 讀取 msg 目錄下的所有檔案
		const files = await fs.promises.readdir(msgPath);

		// 過濾出 .js 檔案並移除副檔名
		const languages = files.filter(file => file.endsWith('.js')).map(file => path.basename(file, '.js'));

		return languages;
	} catch (error) {
		console.error('無法讀取 Blockly 語言檔案:', error);
		return ['en']; // 如果發生錯誤，至少返回英文
	}
}

function mapVSCodeLangToBlockly(vscodeLanguage: string): string {
	// 語言對應表
	const languageMap: { [key: string]: string } = {
		'zh-tw': 'zh-hant',
		en: 'en',
		'en-us': 'en',
		// 可以根據需要添加更多對應
	};

	// 將 VSCode 語言代碼轉換為小寫以進行比對
	const normalizedLang = vscodeLanguage.toLowerCase();

	// 檢查是否有直接對應
	if (languageMap[normalizedLang]) {
		return languageMap[normalizedLang];
	}

	// 如果沒有完全匹配，嘗試找到基礎語言的對應
	const baseLang = normalizedLang.split('-')[0];
	if (languageMap[baseLang]) {
		return languageMap[baseLang];
	}

	// 如果都找不到對應，返回預設語言 'en'
	return 'en';
}

async function getSupportedLocales(context: vscode.ExtensionContext): Promise<string[]> {
	const localesPath = path.join(context.extensionPath, 'media/locales');
	try {
		const files = await fs.promises.readdir(localesPath);
		return files.filter(file => fs.statSync(path.join(localesPath, file)).isDirectory());
	} catch (error) {
		console.error('無法讀取語言檔案目錄:', error);
		return ['en']; // 如果發生錯誤，至少返回英文
	}
}

async function loadLocaleFiles(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<string> {
	// 取得支援的語言清單
	const supportedLocales = await getSupportedLocales(context);
	console.log('支援的語言:', supportedLocales);

	// 載入語言檔案
	const localeFiles = supportedLocales.map(locale => {
		const localePath = vscode.Uri.file(context.asAbsolutePath(`media/locales/${locale}/messages.js`));
		return {
			locale,
			uri: webview.asWebviewUri(localePath).toString(),
		};
	});

	// 生成 script 標籤
	const localeScripts = localeFiles.map(file => `<script src="${file.uri}"></script>`).join('\n    ');

	return localeScripts;
}

// 修改 getWebviewContent 函數
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

	// 更新 Arduino 生成器路徑
	const arduinoGeneratorPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/generators/arduino/index.js'));
	const arduinoGeneratorUri = webview.asWebviewUri(arduinoGeneratorPath);

	// 更新 Arduino blocks 路徑
	const arduinoBlocksPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/arduino.js'));
	const arduinoBlocksUri = webview.asWebviewUri(arduinoBlocksPath);

	// 添加函式積木路徑
	const functionBlocksPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/functions.js'));
	const functionBlocksUri = webview.asWebviewUri(functionBlocksPath);

	// Arduino 生成器模組路徑
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
	console.log(`VSCode 語言: ${vscodeLanguage} -> Blockly 語言: ${blocklyLanguage}`);

	// 載入對應的 Blockly 語言檔案
	const msgJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath(`node_modules/blockly/msg/${blocklyLanguage}.js`))); // 獲取可用的 Blockly 語言
	const availableLanguages = await getAvailableBlocklyLanguages(context);
	console.log('可用的 Blockly 語言:', availableLanguages);
	// 載入語言檔案，目前是全部載入，未來可以根據需要進行優化
	const localeScripts = await loadLocaleFiles(context, webview);

	// 注入語言設定
	htmlContent = htmlContent.replace("currentLanguage: '{vscodeLanguage}'", `currentLanguage: '${blocklyLanguage}'`);
	// 在讀取 HTML 內容後，在適當位置注入語言檔案
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
	htmlContent = htmlContent.replace('{msgJsUri}', msgJsUri.toString());
	htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());
	htmlContent = htmlContent.replace('{arduinoGeneratorUri}', arduinoGeneratorUri.toString());
	htmlContent = htmlContent.replace('{arduinoBlocksUri}', arduinoBlocksUri.toString());
	htmlContent = htmlContent.replace('{boardConfigsUri}', boardConfigsUri.toString());
	htmlContent = htmlContent.replace('{arduinoModules}', arduinoModules);
	htmlContent = htmlContent.replace('{functionBlocksUri}', functionBlocksUri.toString());

	// 讀取並處理 toolbox 配置
	const toolboxJsonPath = context.asAbsolutePath('media/toolbox/index.json');
	const toolboxJson = JSON.parse(await fs.promises.readFile(toolboxJsonPath, 'utf8'));
	const resolvedToolbox = await resolveToolboxIncludes(context, toolboxJson);

	// 將處理後的配置寫入臨時檔案
	const tempToolboxPath = context.asAbsolutePath('media/toolbox/temp_toolbox.json');
	await fs.promises.writeFile(tempToolboxPath, JSON.stringify(resolvedToolbox, null, 2));
	const tempToolboxUri = webview.asWebviewUri(vscode.Uri.file(tempToolboxPath));

	htmlContent = htmlContent.replace('{toolboxUri}', tempToolboxUri.toString());

	// 更新主題路徑
	const themesUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('media/blockly/themes')));
	htmlContent = htmlContent.replace('{themesUri}', themesUri.toString());

	return htmlContent;
}

// 新增一個函數來取得開發板配置
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
		none: ``, // 空配置
	};
	return configs[board] || configs.none;
};
