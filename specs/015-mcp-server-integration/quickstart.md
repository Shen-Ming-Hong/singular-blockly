# Quickstart: MCP Server Integration

**Feature**: 015-mcp-server-integration  
**適用對象**: 開發者  
**閱讀時間**: 10 分鐘

---

## 概述

本功能在 Singular Blockly VSCode 擴展中整合 MCP (Model Context Protocol) Server，讓 AI 工具（如 GitHub Copilot）可以：

-   🔍 **查詢積木用法** - 搜尋積木、取得欄位說明與程式碼範例
-   📖 **讀取專案狀態** - 取得工作區積木列表、板卡配置
-   ✏️ **修改工作區** - 新增、移除、修改積木
-   🔄 **同步編輯器** - 外部修改後刷新 WebView

---

## 架構概覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        VSCode Extension                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │  extension.ts   │────>│  MCP Provider   │                    │
│  │  (activation)   │     │  (registration) │                    │
│  └─────────────────┘     └────────┬────────┘                    │
│                                   │                             │
│                                   ▼                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MCP Server (STDIO)                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│  │  │ Block Query │  │ Workspace   │  │ Platform    │      │   │
│  │  │   Tools     │  │   Tools     │  │   Tools     │      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                   │                             │
│                                   ▼                             │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │  FileService    │     │  Block          │                    │
│  │  (main.json)    │     │  Dictionary     │                    │
│  └─────────────────┘     └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         AI Tools                                │
│  (GitHub Copilot, Claude, etc.)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 檔案結構

### 新增檔案

```
src/
├── mcp/
│   ├── mcpServer.ts              # MCP Server 主入口
│   ├── mcpProvider.ts            # VSCode MCP Provider 註冊
│   ├── blockDictionary.ts        # 積木字典載入與查詢
│   ├── block-dictionary.json     # 編譯時生成的積木字典
│   └── tools/
│       ├── index.ts              # 工具匯出
│       ├── blockQuery.ts         # get_block_usage, search_blocks, list_blocks_by_category
│       ├── workspaceOps.ts       # get_workspace_state, update_workspace, refresh_editor
│       └── platformConfig.ts     # get_generated_code, get_platform_config, get_board_pins

scripts/
└── generate-block-dictionary.js  # 積木字典生成腳本
```

### 修改檔案

```
src/
├── extension.ts                  # 新增 MCP Provider 註冊
└── webview/
    ├── webviewManager.ts         # 新增 FileWatcher 支援
    └── messageHandler.ts         # 新增 refresh_editor 命令處理

package.json                      # 新增 MCP 貢獻點
```

---

## 開發環境設置

### 1. 安裝依賴

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node
```

### 2. 更新 package.json

```json
{
	"contributes": {
		"mcpServerDefinitionProviders": [
			{
				"id": "singularBlockly.mcpServer",
				"label": "Singular Blockly MCP Server"
			}
		]
	},
	"scripts": {
		"generate:dictionary": "node scripts/generate-block-dictionary.js"
	}
}
```

### 3. 生成積木字典

```bash
npm run generate:dictionary
```

---

## MCP 工具一覽

| 工具名稱                  | 用途           | 輸入參數                                           |
| ------------------------- | -------------- | -------------------------------------------------- |
| `get_block_usage`         | 查詢積木用法   | `blockType`, `language?`                           |
| `search_blocks`           | 搜尋積木       | `query`, `category?`, `board?`, `limit?`           |
| `list_blocks_by_category` | 列出分類積木   | `category`, `language?`                            |
| `get_workspace_state`     | 取得工作區狀態 | `includeFullJson?`                                 |
| `update_workspace`        | 更新工作區     | `action`, `blocks?`, `blockIds?`, `modifications?` |
| `refresh_editor`          | 刷新編輯器     | -                                                  |
| `get_generated_code`      | 取得生成程式碼 | `format?`                                          |
| `get_platform_config`     | 取得平台配置   | -                                                  |
| `get_board_pins`          | 取得板卡腳位   | `board?`                                           |

---

## 快速實作指南

### Step 1: 建立 MCP Server

```typescript
// src/mcp/mcpServer.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerBlockQueryTools } from './tools/blockQuery';
import { registerWorkspaceTools } from './tools/workspaceOps';
import { registerPlatformTools } from './tools/platformConfig';

const server = new McpServer({
	name: 'singular-blockly-mcp',
	version: '1.0.0',
});

// 註冊所有工具
registerBlockQueryTools(server);
registerWorkspaceTools(server);
registerPlatformTools(server);

// 啟動 Server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 2: 實作工具

```typescript
// src/mcp/tools/blockQuery.ts
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getBlockDictionary } from '../blockDictionary';

export function registerBlockQueryTools(server: McpServer) {
	// get_block_usage 工具
	server.registerTool(
		'get_block_usage',
		{
			title: '查詢積木用法',
			description: '查詢特定積木的用法、欄位、範例',
			inputSchema: z.object({
				blockType: z.string().describe('積木類型識別碼'),
				language: z.string().optional().default('zh-hant'),
			}),
		},
		async ({ blockType, language }) => {
			const dictionary = getBlockDictionary();
			const block = dictionary.blocks.find(b => b.type === blockType);

			if (!block) {
				return {
					content: [{ type: 'text', text: `找不到積木: ${blockType}` }],
					isError: true,
				};
			}

			const result = formatBlockForLanguage(block, language);
			return {
				content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
				structuredContent: result,
			};
		}
	);
}
```

### Step 3: 註冊 MCP Provider

```typescript
// src/mcp/mcpProvider.ts
import * as vscode from 'vscode';

export function registerMcpProvider(context: vscode.ExtensionContext) {
	const mcpProvider: vscode.McpServerDefinitionProvider<vscode.McpStdioServerDefinition> = {
		provideMcpServerDefinitions(token: vscode.CancellationToken) {
			const serverPath = context.asAbsolutePath('dist/mcp-server.js');

			return [new vscode.McpStdioServerDefinition('Singular Blockly', 'node', [serverPath], {}, '1.0.0')];
		},
	};

	const disposable = vscode.lm.registerMcpServerDefinitionProvider('singularBlockly.mcpServer', mcpProvider);

	context.subscriptions.push(disposable);
}
```

### Step 4: 在 extension.ts 中啟用

```typescript
// src/extension.ts
import { registerMcpProvider } from './mcp/mcpProvider';

export function activate(context: vscode.ExtensionContext) {
	// ... 現有程式碼 ...

	// 註冊 MCP Server Provider
	registerMcpProvider(context);
}
```

---

## 測試指南

### 單元測試

```typescript
// src/test/mcp/blockQuery.test.ts
import * as assert from 'assert';
import { getBlockDictionary, searchBlocks } from '../../mcp/blockDictionary';

suite('Block Query Tools', () => {
	test('should find servo_setup block', () => {
		const dictionary = getBlockDictionary();
		const block = dictionary.blocks.find(b => b.type === 'servo_setup');

		assert.ok(block);
		assert.strictEqual(block.category, 'motors');
	});

	test('should search blocks by keyword', () => {
		const results = searchBlocks('馬達', { limit: 5 });

		assert.ok(results.length > 0);
		assert.ok(results.some(r => r.type.includes('servo') || r.type.includes('motor')));
	});
});
```

### 整合測試

```typescript
// src/test/integration/mcpIntegration.test.ts
import * as vscode from 'vscode';
import * as assert from 'assert';

suite('MCP Integration', () => {
	test('should register MCP provider on activation', async () => {
		// 確認 MCP provider 已註冊
		// 注意：需要 VSCode 1.99+ 才能測試
	});
});
```

### 手動測試

1. 啟動擴展（F5）
2. 開啟 Blockly 編輯器
3. 在 Copilot Chat 中輸入：`使用 Singular Blockly 搜尋伺服馬達相關的積木`
4. 確認 Copilot 能呼叫 MCP 工具並返回結果

---

## 常見問題

### Q: MCP Server 沒有啟動？

確認以下事項：

-   VSCode 版本 >= 1.99
-   `package.json` 有正確的 `mcpServerDefinitionProviders` 貢獻點
-   `dist/mcp-server.js` 已正確打包

### Q: 積木字典找不到？

執行 `npm run generate:dictionary` 重新生成。

### Q: FileWatcher 沒有觸發？

確認 `main.json` 路徑正確：`{workspace}/blockly/main.json`

---

## 下一步

完成本 quickstart 後，您應該：

1. ✅ 理解 MCP Server 的架構
2. ✅ 知道如何新增 MCP 工具
3. ✅ 能夠測試 MCP 功能

接下來請參考：

-   [research.md](./research.md) - 技術研究細節
-   [data-model.md](./data-model.md) - 完整資料模型
-   [contracts/mcp-tools.json](./contracts/mcp-tools.json) - MCP 工具契約
