/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MCP Provider 註冊模組
 * 負責向 VSCode 註冊 MCP Server Definition Provider
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { log } from '../services/logging';

/**
 * 註冊 MCP Provider 到 VSCode
 * @param context Extension context
 */
export function registerMcpProvider(context: vscode.ExtensionContext): vscode.Disposable | undefined {
	// 檢查 VSCode 是否支援 MCP API
	if (!vscode.lm || typeof vscode.lm.registerMcpServerDefinitionProvider !== 'function') {
		log(`MCP API not available in this VSCode version (requires 1.105.0+, current: ${vscode.version})`, 'warn');
		return undefined;
	}

	try {
		const extensionPath = context.extensionPath;

		// 建立事件發射器（用於通知 Server 定義變更）
		const didChangeEmitter = new vscode.EventEmitter<void>();

		// 註冊 Provider - ID 必須與 package.json 中的 mcpServerDefinitionProviders.id 匹配
		const disposable = vscode.lm.registerMcpServerDefinitionProvider('singularBlockly.mcpServer', {
			// 當 MCP Server 配置變更時觸發的事件
			onDidChangeMcpServerDefinitions: didChangeEmitter.event,

			// 提供 MCP Server 定義
			provideMcpServerDefinitions: async (_token: vscode.CancellationToken): Promise<vscode.McpServerDefinition[]> => {
				// 取得 MCP Server 執行檔路徑
				const serverPath = path.join(extensionPath, 'dist', 'mcp-server.js');

				// 取得工作區路徑
				const workspaceFolders = vscode.workspace.workspaceFolders;
				const workspacePath = workspaceFolders?.[0]?.uri.fsPath;

				log(`Providing MCP Server definition: serverPath=${serverPath}, workspacePath=${workspacePath}`, 'info');

				// 建立 STDIO Server 定義
				// McpStdioServerDefinition(label, command, args?, env?, cwd?)
				const serverDefinition = new vscode.McpStdioServerDefinition(
					'Singular Blockly', // label
					'node', // command
					[serverPath], // args
					{
						// env
						WORKSPACE_PATH: workspacePath || '',
						VSCODE_LANG: vscode.env.language,
					},
					workspacePath // cwd (string | undefined)
				);

				return [serverDefinition];
			},

			// 解析 Server 定義（可用於添加動態配置如 API Key）
			resolveMcpServerDefinition: async (
				server: vscode.McpServerDefinition,
				_token: vscode.CancellationToken
			): Promise<vscode.McpServerDefinition | undefined> => {
				log(`Resolving MCP Server: ${server.label}`, 'info');
				return server;
			},
		});

		// 將事件發射器添加到訂閱清單以便正確釋放
		context.subscriptions.push(didChangeEmitter);

		log('MCP Server Definition Provider registered successfully', 'info');

		return disposable;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		log(`Failed to register MCP Provider: ${errorMsg}`, 'error');
		return undefined;
	}
}

/**
 * 檢查 MCP Server 檔案是否存在
 * @param extensionPath Extension 安裝路徑
 */
export function checkMcpServerExists(extensionPath: string): boolean {
	const serverPath = path.join(extensionPath, 'dist', 'mcp-server.js');

	try {
		// 使用同步方式檢查（在啟動時使用）
		const fs = require('fs');
		return fs.existsSync(serverPath);
	} catch {
		return false;
	}
}
