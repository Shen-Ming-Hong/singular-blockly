import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "singular-blockly" is now active!');

	const disposable = vscode.commands.registerCommand('singular-blockly.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Singular Blockly!');
	});

	const openBlocklyEdit = vscode.commands.registerCommand('singular-blockly.openBlocklyEdit', () => {
		const panel = vscode.window.createWebviewPanel('blocklyEdit', 'Blockly Edit', vscode.ViewColumn.One, {
			enableScripts: true,
		});

		panel.webview.html = getWebviewContent(context, panel.webview);
	});

	context.subscriptions.push(disposable, openBlocklyEdit);
}

export function deactivate() {}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview) {
	const htmlPath = vscode.Uri.file(context.asAbsolutePath('media/html/blocklyEdit.html'));
	const cssPath = vscode.Uri.file(context.asAbsolutePath('media/css/file.css'));
	const jsPath = vscode.Uri.file(context.asAbsolutePath('media/js/file.js'));
	const toolboxPath = vscode.Uri.file(context.asAbsolutePath('media/toolbox/toolbox.json'));

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

	let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
	htmlContent = htmlContent.replace('{cssUri}', cssUri.toString());
	htmlContent = htmlContent.replace('{jsUri}', jsUri.toString());
	htmlContent = htmlContent.replace('{blocklyCompressedJsUri}', blocklyCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{blocksCompressedJsUri}', blocksCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{javascriptCompressedJsUri}', javascriptCompressedJsUri.toString());
	htmlContent = htmlContent.replace('{msgEnJsUri}', msgEnJsUri.toString());
	htmlContent = htmlContent.replace('{themeModernJsUri}', themeModernJsUri.toString());
	htmlContent = htmlContent.replace('{toolboxUri}', toolboxUri.toString());

	return htmlContent;
}
