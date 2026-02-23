# MCP Server 整合規格

> 整合自 specs/015-mcp-server-integration

## 概述

**目標**：在 VSCode 擴展中整合 MCP Server，讓 AI 工具（Copilot、Claude 等）可以查詢積木用法、讀取專案狀態、修改工作區

**狀態**：✅ 完成

---

## 架構設計

### 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│  AI Client (Copilot / Claude)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ MCP Protocol (STDIO)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP Server (dist/mcp-server.js)                            │
│  ├── mcpServer.ts          # STDIO 傳輸                     │
│  └── tools/*.ts            # 工具實作                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ FileWatcher / postMessage
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Extension Host                    │  WebView               │
│  ├── mcpProvider.ts               │  └── blocklyEdit.js    │
│  └── 監聽 main.json 變更          │      重載工作區         │
└─────────────────────────────────────────────────────────────┘
```

### 通訊機制

1. **AI → MCP Server**：STDIO 傳輸（JSON-RPC）
2. **MCP Server → Extension**：透過 FileWatcher 監聽 main.json 變更
3. **Extension → WebView**：postMessage 通知重載

---

## MCP 工具

### 積木查詢

| 工具                      | 用途         | 輸入                           | 輸出                     |
| ------------------------- | ------------ | ------------------------------ | ------------------------ |
| `get_block_usage`         | 查詢積木用法 | blockType, context?, language? | 完整用法文件 + JSON 範本 |
| `search_blocks`           | 關鍵字搜尋   | keyword                        | 相關積木列表             |
| `list_blocks_by_category` | 按分類列出   | category                       | 該分類所有積木           |

### 工作區操作

| 工具                  | 用途       | 輸入 | 輸出              |
| --------------------- | ---------- | ---- | ----------------- |
| `get_workspace_state` | 讀取工作區 | 無   | main.json 內容    |
| `get_generated_code`  | 讀取程式碼 | 無   | main.cpp 內容     |
| `refresh_editor`      | 重載編輯器 | 無   | 觸發 WebView 重載 |

---

## 積木字典

### 結構定義

```typescript
interface BlockDefinition {
	name: string; // 積木類型 ID
	category: string; // 分類
	description: string; // 繁體中文說明
	fields: FieldDef[]; // 欄位定義
	jsonTemplate: object; // JSON 結構範例
	generatedCode: string; // Arduino 程式碼範例
	relatedBlocks: string[]; // 相關積木
	notes: string[]; // 注意事項
}

interface FieldDef {
	name: string;
	type: 'input' | 'dropdown' | 'checkbox' | 'number';
	options?: string[];
	default?: any;
}
```

### 範例

```javascript
// blockDictionary.ts
{
  "servo_setup": {
    name: "servo_setup",
    category: "motors",
    description: "設定伺服馬達的腳位",
    fields: [
      { name: "NAME", type: "input", default: "myServo" },
      { name: "PIN", type: "dropdown", options: ["D2", "D3", ...] }
    ],
    jsonTemplate: {
      type: "servo_setup",
      fields: { NAME: "myServo", PIN: "D9" }
    },
    generatedCode: `
#include <Servo.h>
Servo myServo;
void setup() {
  myServo.attach(9);
}`,
    relatedBlocks: ["servo_write", "servo_read"],
    notes: ["ESP32 需使用 ESP32Servo 庫"]
  }
}
```

### 涵蓋範圍

共 55 個自訂積木，分類包括：

- Arduino 基礎
- 馬達控制
- 感測器
- 視覺鏡頭（HuskyLens、Pixetto）
- 通訊（Serial、WiFi、MQTT）
- 邏輯與迴圈

---

## `get_block_usage` 工具詳解

### 輸入參數

```typescript
interface GetBlockUsageInput {
	blockType: string; // 必要：積木類型 ID
	context?: object; // 選填：用於生成 JSON 範本的上下文
	language?: string; // 選填：語言代碼（預設 zh-hant）
}
```

### Context 參數範例

```javascript
// 函數呼叫積木
get_block_usage({
	blockType: 'arduino_function_call',
	context: {
		functionName: '馬達',
		arguments: [{ name: 'L', type: 'int', defaultValue: 0 }],
	},
});

// 編碼器 PID 設定
get_block_usage({
	blockType: 'encoder_pid_setup',
	context: {
		pidName: 'leftPID',
		encoderName: 'leftEncoder',
		kp: 1,
		ki: 0,
		kd: 0,
	},
});
```

### 輸出格式

```json
{
  "name": "servo_setup",
  "description": "設定伺服馬達的腳位",
  "fields": [...],
  "jsonTemplate": {
    "type": "servo_setup",
    "fields": { "NAME": "myServo", "PIN": "D9" }
  },
  "generatedCode": "...",
  "notes": [...]
}
```

---

## 安全機制

### 原子寫入 + 備份

```typescript
// update_workspace 實作
async function updateWorkspace(newState: string): Promise<void> {
	const mainJson = getMainJsonPath();
	const backupPath = mainJson + '.bak';

	// 1. 備份現有檔案
	await fs.copyFile(mainJson, backupPath);

	// 2. 驗證 JSON 格式
	try {
		JSON.parse(newState);
	} catch (e) {
		throw new Error('Invalid JSON format');
	}

	// 3. 原子寫入
	await fs.writeFile(mainJson, newState);
}
```

### 回傳訊息

```
工作區已更新。
若需回復，可使用 main.json.bak 備份檔案。
```

---

## VSCode API 整合

### MCP Server 註冊

```typescript
// mcpProvider.ts
import * as vscode from 'vscode';

export function registerMcpProvider(context: vscode.ExtensionContext) {
	const provider: vscode.McpServerDefinitionProvider = {
		provideMcpServerDefinition: () => ({
			command: 'node',
			args: [path.join(context.extensionPath, 'dist', 'mcp-server.js')],
			env: {},
		}),
	};

	context.subscriptions.push(vscode.mcp.registerMcpServerDefinitionProvider('singular-blockly', provider));
}
```

### 需求版本

- VSCode 1.105.0+（`registerMcpServerDefinitionProvider` API）

---

## AI 工作流程範例

### 新增積木流程

1. **查詢積木用法**

    ```
    AI: get_block_usage("ultrasonic_setup")
    ```

2. **讀取當前工作區**

    ```
    AI: get_workspace_state()
    ```

3. **修改 main.json**

    ```
    AI: update_workspace(newJsonContent)
    ```

4. **觸發重載**

    ```
    AI: refresh_editor()
    ```

5. **驗證程式碼**
    ```
    AI: get_generated_code()
    ```

---

## 驗收標準

1. ✅ AI 完成查詢 → 修改 → 驗證流程，20 種積木組合通過率 95%
2. ✅ 55 個積木都有完整說明
3. ✅ 單一積木操作 < 10 秒
4. ✅ refresh_editor 後 WebView 在 2 秒內更新
5. ✅ MCP Server 在擴展啟動後 3 秒內可用

---

---

## MCP 優雅降級與 Node.js 依賴處理（040）

> 來源：spec/040-mcp-graceful-degradation（2026-02）

### 問題背景

Node.js 未安裝或不在 PATH 中時，MCP Server 啟動失敗。原本靜默失敗，使用者不知道原因，也不影響核心 Blockly 功能。

**設計原則**：MCP 為增強功能，失敗不阻擋 Blockly 核心功能（積木拖放、程式碼生成、硬體上傳）。

### 優雅降級流程

```
Extension 啟動 → 偵測 Node.js
  ├── 找到 Node.js → 正常啟動 MCP Server
  └── 找不到 Node.js → 顯示警告訊息（含安裝連結）→ Blockly 正常運作（MCP 功能不可用）
```

### 警告訊息行為

- **「安裝 Node.js」**：開啟 `https://nodejs.org/` 下載頁面
- **「稍後提醒」**：永久停用（設定 `singularBlockly.mcp.showStartupWarning: false`）
- **再次啟動**：若 `showStartupWarning: false` 則不再顯示警告

### 自訂 Node.js 路徑（進階使用者）

支援 nvm/fnm 使用者透過 `singularBlockly.mcp.nodePath` 設定自訂路徑。設定變更時立即驗證並顯示警告（若路徑無效）。

### 診斷命令

`Singular Blockly: MCP 診斷` 命令透過 `vscode.window.showInformationMessage` 顯示：

- 偵測到的 Node.js 路徑與版本
- MCP Server 啟動狀態與錯誤原因

**Node.js 偵測頻率**：Extension 啟動時偵測一次，結果快取於同一 session 中。

---

## MCP SDK 打包修復（041）

> 來源：spec/041-fix-mcp-bundling（2026-02）

### 問題描述

**症狀**：從 Marketplace 安裝後出現 `Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'` 錯誤，MCP Server 完全無法啟動。

**根本原因**：`mcpServerConfig` 的 webpack 設定將 `@modelcontextprotocol/sdk` 和 `zod` 列為 `externals`，導致這些模組未被打包進 `dist/mcp-server.js`。安裝後的擴展環境沒有 `node_modules`，因此找不到這些模組。

### 修復策略

將 `@modelcontextprotocol/sdk` 和 `zod` 從 `externals` 移除，確保完整打包進 bundle：

```javascript
// webpack.config.js - mcpServerConfig
module.exports = {
	// ...
	externals: {
		vscode: 'commonjs vscode', // 只保留 vscode（由 VS Code 提供）
		// 移除 @modelcontextprotocol/sdk 和 zod
	},
};
```

**打包體積影響**：`dist/mcp-server.js` 增加數百 KB（應低於 5 MB），`.vsix` 總大小增幅低於 20%。

### 驗收標準

1. ✅ `npm run compile` exit code 為 0，`dist/mcp-server.js` 正確生成
2. ✅ `dist/mcp-server.js` 不包含對 `@modelcontextprotocol/sdk` 或 `zod` 的外部 `require()` 呼叫
3. ✅ 從 `.vsix` 安裝後，MCP Server 正常啟動，不出現 `MODULE_NOT_FOUND` 錯誤
4. ✅ 開發環境（`npm run watch`）與生產環境行為一致

---

## 相關文件

- MCP Provider：`src/mcp/mcpProvider.ts`
- MCP Server：`src/mcp/mcpServer.ts`
- 工具實作：`src/mcp/tools/`
- 積木字典：`src/mcp/blockDictionary.ts`
- 打包設定：`webpack.config.js`（`mcpServerConfig`）
