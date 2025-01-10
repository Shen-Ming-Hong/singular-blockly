import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "singular-blockly" is now active!');

	const disposable = vscode.commands.registerCommand('singular-blockly.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Singular Blockly!');
	});

	const openBlocklyEdit = vscode.commands.registerCommand('singular-blockly.openBlocklyEdit', async () => {
		const panel = vscode.window.createWebviewPanel('blocklyEdit', 'Blockly Edit', vscode.ViewColumn.One, {
			enableScripts: true,
		});

		panel.webview.html = await getWebviewContent(context, panel.webview);

		// 確保 src 目錄存在
		const srcPath = path.join(context.extensionPath, 'src');
		if (!fs.existsSync(srcPath)) {
			await fs.promises.mkdir(srcPath, { recursive: true });
		}

		// 監聽來自 webview 的訊息
		panel.webview.onDidReceiveMessage(async message => {
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
						await fs.promises.writeFile(platformioIni, boardConfig);
						vscode.window.showInformationMessage(`已更新開發板設定為: ${message.board}`);

						// 提示使用者需要重新載入
						const reload = '重新載入視窗';
						const result = await vscode.window.showInformationMessage('需要重新載入視窗以套用新的開發板設定。', reload);

						if (result === reload) {
							// 執行重新載入命令
							await vscode.commands.executeCommand('workbench.action.reloadWindow');
						}
					}
				} catch (error) {
					vscode.window.showErrorMessage(`無法更新 platformio.ini: ${(error as Error).message}`);
					console.error(error);
				}
			}
		});
	});

	context.subscriptions.push(disposable, openBlocklyEdit);
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

// 修改 getWebviewContent 函數
async function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview) {
	const htmlPath = vscode.Uri.file(context.asAbsolutePath('media/html/blocklyEdit.html'));
	const cssPath = vscode.Uri.file(context.asAbsolutePath('media/css/file.css'));
	const jsPath = vscode.Uri.file(context.asAbsolutePath('media/js/file.js'));
	const toolboxPath = vscode.Uri.file(context.asAbsolutePath('media/toolbox/index.json'));

	const cssUri = webview.asWebviewUri(cssPath);
	const jsUri = webview.asWebviewUri(jsPath);
	const toolboxUri = webview.asWebviewUri(toolboxPath);

	const blocklyCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/blockly_compressed.js'))
	);
	const blocksCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/blocks_compressed.js'))
	);
	const javascriptCompressedJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/javascript_compressed.js'))
	);
	const msgEnJsUri = webview.asWebviewUri(vscode.Uri.file(context.asAbsolutePath('node_modules/blockly/msg/en.js')));
	const themeModernJsUri = webview.asWebviewUri(
		vscode.Uri.file(context.asAbsolutePath('node_modules/@blockly/theme-modern/dist/index.js'))
	);

	// 更新 Arduino 生成器路徑
	const arduinoGeneratorPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/generators/arduino/index.js'));
	const arduinoGeneratorUri = webview.asWebviewUri(arduinoGeneratorPath);

	// 更新 Arduino blocks 路徑
	const arduinoBlocksPath = vscode.Uri.file(context.asAbsolutePath('media/blockly/blocks/arduino.js'));
	const arduinoBlocksUri = webview.asWebviewUri(arduinoBlocksPath);

	// Arduino 生成器模組路徑
	const arduinoModules = [
		'io.js',
		'logic.js',
		'loops.js',
		'math.js',
		'text.js',
		'lists.js', // 新增這行
	]
		.map(file => {
			const modulePath = vscode.Uri.file(context.asAbsolutePath(`media/blockly/generators/arduino/${file}`));
			const moduleUri = webview.asWebviewUri(modulePath);
			return `<script src="${moduleUri}"></script>`;
		})
		.join('\n    ');

	let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
	htmlContent = htmlContent.replace('{cssUri}', cssUri.toString());
	htmlContent = htmlContent.replace('{jsUri}', jsUri.toString());
	htmlContent = htmlContent.replace('{blocklyCompressedJsUri}', blocklyCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{blocksCompressedJsUri}', blocksCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{javascriptCompressedJsUri}', javascriptCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{msgEnJsUri}', msgEnJsUri.toString());
	htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());

	// 替換 Arduino 生成器路徑
	htmlContent = htmlContent.replace('{arduinoGeneratorUri}', arduinoGeneratorUri.toString());

	// 替換 Arduino blocks 路徑
	htmlContent = htmlContent.replace('{arduinoBlocksUri}', arduinoBlocksUri.toString());

	// 替換 Arduino 生成器模組路徑
	htmlContent = htmlContent.replace('{arduinoModules}', arduinoModules);

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
