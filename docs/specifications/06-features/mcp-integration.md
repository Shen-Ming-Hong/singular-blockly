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

-   Arduino 基礎
-   馬達控制
-   感測器
-   視覺鏡頭（HuskyLens、Pixetto）
-   通訊（Serial、WiFi、MQTT）
-   邏輯與迴圈

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

-   VSCode 1.105.0+（`registerMcpServerDefinitionProvider` API）

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

## 相關文件

-   MCP Provider：`src/mcp/mcpProvider.ts`
-   MCP Server：`src/mcp/mcpServer.ts`
-   工具實作：`src/mcp/tools/`
-   積木字典：`src/mcp/blockDictionary.ts`
