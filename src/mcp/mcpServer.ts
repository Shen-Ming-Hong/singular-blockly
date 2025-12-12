/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MCP Server 主入口
 * 使用 STDIO Transport 與 MCP Client 通訊
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerBlockQueryTools } from './tools/blockQuery.js';
import { registerPlatformConfigTools } from './tools/platformConfig.js';
import { registerWorkspaceOpsTools } from './tools/workspaceOps.js';

// 讀取版本號
const VERSION = '1.0.0';

/**
 * 建立並啟動 MCP Server
 */
async function main() {
	// 建立 MCP Server 實例
	const server = new McpServer({
		name: 'singular-blockly-mcp',
		version: VERSION,
	});

	// 註冊所有工具
	registerBlockQueryTools(server);
	registerPlatformConfigTools(server);
	registerWorkspaceOpsTools(server);

	// 建立 STDIO Transport
	const transport = new StdioServerTransport();

	// 連接並啟動 Server
	await server.connect(transport);

	// 記錄啟動訊息（輸出到 stderr 避免干擾 STDIO 協議）
	console.error(`[Singular Blockly MCP Server] Started v${VERSION}`);
}

// 啟動 Server
main().catch(error => {
	console.error('[Singular Blockly MCP Server] Fatal error:', error);
	process.exit(1);
});
