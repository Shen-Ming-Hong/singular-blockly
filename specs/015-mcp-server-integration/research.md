# Research: MCP Server Integration

**Date**: 2025-12-11  
**Feature**: 015-mcp-server-integration  
**Status**: Phase 0 完成

---

## 1. VSCode MCP Server Definition Provider API

### 1.1 API 概述

**決策**: 使用 VSCode 1.105.0+ 提供的 `vscode.lm.registerMcpServerDefinitionProvider` API 註冊 MCP Server。

**依據**:

-   VSCode API Reference 確認 `lm` 命名空間提供 MCP 相關功能
-   `McpServerDefinitionProvider<T>` 介面定義了 MCP Server 的提供者模式
-   支援 `McpStdioServerDefinition` 用於本地進程 STDIO 傳輸

### 1.2 核心型別定義

```typescript
// McpServerDefinitionProvider 介面
interface McpServerDefinitionProvider<T extends McpServerDefinition> {
	// 選填：當 MCP Server 定義變更時觸發
	onDidChangeMcpServerDefinitions?: Event<void>;

	// 提供 MCP Server 定義列表
	provideMcpServerDefinitions(token: CancellationToken): ProviderResult<T[]>;

	// 解析 MCP Server 定義（選填，用於延遲載入詳細資訊）
	resolveMcpServerDefinition?(server: T, token: CancellationToken): ProviderResult<T>;
}

// McpStdioServerDefinition - 本地進程 STDIO 傳輸
class McpStdioServerDefinition {
	constructor(
		label: string, // 顯示名稱
		command: string, // 執行命令 (node, python, etc.)
		args?: string[], // 命令參數
		env?: Record<string, string | number>, // 環境變數
		version?: string // 版本號
	);

	label: string;
	command: string;
	args: string[];
	cwd?: Uri; // 工作目錄
	env: Record<string, string | number>;
	version?: string;
}

// McpHttpServerDefinition - HTTP 傳輸（備用選項）
class McpHttpServerDefinition {
	constructor(label: string, uri: Uri, headers?: Record<string, string>, version?: string);
}

// 聯合型別
type McpServerDefinition = McpStdioServerDefinition | McpHttpServerDefinition;
```

### 1.3 package.json 貢獻點

```json
{
	"contributes": {
		"mcpServerDefinitionProviders": [
			{
				"id": "singularBlockly.mcpServer",
				"label": "Singular Blockly MCP Server"
			}
		]
	}
}
```

### 1.4 註冊範例

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	// 註冊 MCP Server Definition Provider
	const mcpProvider: vscode.McpServerDefinitionProvider<vscode.McpStdioServerDefinition> = {
		provideMcpServerDefinitions(token: vscode.CancellationToken) {
			const serverPath = context.asAbsolutePath('dist/mcp-server.js');

			return [
				new vscode.McpStdioServerDefinition(
					'Singular Blockly', // label
					'node', // command
					[serverPath], // args
					{}, // env
					'1.0.0' // version
				),
			];
		},
	};

	// 註冊 provider
	const disposable = vscode.lm.registerMcpServerDefinitionProvider('singularBlockly.mcpServer', mcpProvider);

	context.subscriptions.push(disposable);
}
```

### 1.5 考量的替代方案

| 方案            | 優點                      | 缺點                  | 結論      |
| --------------- | ------------------------- | --------------------- | --------- |
| STDIO Transport | VSCode 原生支援、無需網路 | 需打包 Node.js 腳本   | ✅ 採用   |
| HTTP Transport  | 可獨立部署                | 複雜度高、需管理連接  | ❌ 不採用 |
| 內嵌 MCP Server | 減少進程                  | VSCode API 不直接支援 | ❌ 不可行 |

---

## 2. @modelcontextprotocol/sdk TypeScript SDK

### 2.1 SDK 概述

**決策**: 使用 `@modelcontextprotocol/sdk` 建立 MCP Server，使用 Zod 定義 Schema。

**依據**:

-   Context7 文件確認 SDK 提供完整的 Server/Client 實作
-   原生支援 STDIO Transport
-   使用 Zod 進行 Schema 驗證（型別安全）

### 2.2 Server 建立

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 建立 MCP Server
const server = new McpServer({
	name: 'singular-blockly-mcp',
	version: '1.0.0',
});

// 建立 STDIO Transport
const transport = new StdioServerTransport();

// 連接並啟動
await server.connect(transport);
```

### 2.3 工具註冊模式

```typescript
import { z } from 'zod';

// 定義輸入 Schema (Zod)
const GetBlockUsageInput = z.object({
	blockType: z.string().describe('積木類型識別碼，例如 "servo_setup"'),
	language: z.string().optional().default('zh-hant').describe('語言代碼'),
});

// 定義輸出 Schema (Zod)
const GetBlockUsageOutput = z.object({
	name: z.string(),
	description: z.string(),
	category: z.string(),
	fields: z.array(
		z.object({
			name: z.string(),
			type: z.string(),
			options: z.array(z.string()).optional(),
		})
	),
	example: z.object({
		json: z.any(),
		arduinoCode: z.string(),
	}),
});

// 註冊工具
server.registerTool(
	'get_block_usage',
	{
		title: '查詢積木用法',
		description: '查詢特定積木的用法、欄位、範例',
		inputSchema: GetBlockUsageInput,
		outputSchema: GetBlockUsageOutput,
	},
	async ({ blockType, language }) => {
		// 工具實作邏輯
		const blockInfo = await getBlockInfo(blockType, language);

		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(blockInfo, null, 2),
				},
			],
			structuredContent: blockInfo,
		};
	}
);
```

### 2.4 回應格式

MCP 工具回應必須遵循以下格式：

```typescript
interface ToolResponse {
	// 文字內容（供 AI 讀取）
	content: Array<{
		type: 'text';
		text: string;
	}>;

	// 結構化內容（符合 outputSchema）
	structuredContent?: Record<string, unknown>;

	// 是否為錯誤
	isError?: boolean;
}
```

### 2.5 錯誤處理

```typescript
// 工具內部錯誤處理
server.registerTool('update_workspace', {...}, async (params) => {
    try {
        const result = await updateWorkspace(params);
        return {
            content: [{ type: 'text', text: 'Workspace updated successfully' }],
            structuredContent: result
        };
    } catch (error) {
        // 返回錯誤回應
        return {
            content: [{
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
        };
    }
});
```

---

## 3. FileWatcher 機制實作

### 3.1 VSCode FileSystemWatcher API

**決策**: 使用 `vscode.workspace.createFileSystemWatcher` 監聽 `main.json` 變更。

**依據**: VSCode API 提供高效能的檔案監聽機制，支援 glob 模式。

### 3.2 實作範例

```typescript
import * as vscode from 'vscode';

export function setupFileWatcher(context: vscode.ExtensionContext): vscode.FileSystemWatcher {
	// 建立 FileSystemWatcher
	const watcher = vscode.workspace.createFileSystemWatcher(
		'**/blockly/main.json', // Glob pattern
		false, // ignoreCreateEvents
		false, // ignoreChangeEvents
		false // ignoreDeleteEvents
	);

	// 監聽變更事件
	watcher.onDidChange(async uri => {
		log.info('main.json changed by external tool', { uri: uri.fsPath });
		await refreshWebView();
	});

	watcher.onDidCreate(async uri => {
		log.info('main.json created', { uri: uri.fsPath });
		await refreshWebView();
	});

	watcher.onDidDelete(uri => {
		log.warn('main.json deleted', { uri: uri.fsPath });
		// 可選：通知用戶
	});

	context.subscriptions.push(watcher);
	return watcher;
}
```

### 3.3 去抖動策略

為避免快速連續變更觸發多次重載：

```typescript
import { debounce } from 'lodash';

// 去抖動後的重載函數（500ms）
const debouncedRefresh = debounce(
	async () => {
		await refreshWebView();
	},
	500,
	{ leading: false, trailing: true }
);

watcher.onDidChange(uri => {
	debouncedRefresh();
});
```

### 3.4 避免循環觸發

當 Extension 自己修改 `main.json` 時，需避免觸發 FileWatcher：

```typescript
let isInternalUpdate = false;

async function updateMainJson(newState: WorkspaceState): Promise<void> {
	isInternalUpdate = true;
	try {
		await fileService.writeFile(mainJsonPath, JSON.stringify(newState, null, 2));
	} finally {
		// 延遲重置，確保 FileWatcher 事件已被忽略
		setTimeout(() => {
			isInternalUpdate = false;
		}, 100);
	}
}

watcher.onDidChange(async uri => {
	if (isInternalUpdate) {
		log.debug('Ignoring internal update');
		return;
	}
	await debouncedRefresh();
});
```

---

## 4. 積木字典格式設計

### 4.1 資料提取策略

**決策**: 編譯時從 `media/blockly/blocks/*.js` 提取積木定義，生成靜態 JSON 字典。

**理由**:

-   積木定義為靜態資料，無需執行時動態解析
-   避免 WebView 與 Extension 的跨境資料傳輸
-   支援多語言（從 locales 提取翻譯）

### 4.2 字典資料結構

```typescript
interface BlockDictionary {
	version: string;
	blocks: BlockDefinition[];
	categories: CategoryInfo[];
}

interface BlockDefinition {
	type: string; // 積木識別碼，例如 'servo_setup'
	category: string; // 分類，例如 'motors', 'sensors'
	names: {
		// 多語言名稱
		[locale: string]: string;
	};
	descriptions: {
		// 多語言描述
		[locale: string]: string;
	};
	fields: BlockField[]; // 欄位定義
	inputs: BlockInput[]; // 輸入連接點
	output?: OutputType; // 輸出型別（若為值積木）
	examples: BlockExample[];
	boards: string[]; // 支援的板卡
	tags: string[]; // 搜尋標籤
}

interface BlockField {
	name: string;
	type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'angle' | 'colour';
	label: {
		[locale: string]: string;
	};
	default?: unknown;
	options?: FieldOption[]; // dropdown 選項
	min?: number; // number 最小值
	max?: number; // number 最大值
}

interface FieldOption {
	value: string;
	label: {
		[locale: string]: string;
	};
}

interface BlockInput {
	name: string;
	type: 'value' | 'statement';
	check?: string | string[]; // 型別檢查
	shadow?: ShadowBlock; // 預設陰影積木
}

interface BlockExample {
	board: string; // 目標板卡
	json: object; // Blockly JSON 序列化
	arduinoCode: string; // 生成的 Arduino 程式碼
	description: {
		[locale: string]: string;
	};
}

interface CategoryInfo {
	id: string;
	name: {
		[locale: string]: string;
	};
	colour: string;
	icon?: string;
}
```

### 4.3 範例：Servo 積木字典條目

```json
{
	"type": "servo_setup",
	"category": "motors",
	"names": {
		"en": "Setup Servo",
		"zh-hant": "設定伺服馬達"
	},
	"descriptions": {
		"en": "Initialize a servo motor on a specific pin",
		"zh-hant": "初始化伺服馬達於指定腳位"
	},
	"fields": [
		{
			"name": "SERVO_NAME",
			"type": "text",
			"label": { "en": "Name", "zh-hant": "名稱" },
			"default": "myServo"
		},
		{
			"name": "PIN",
			"type": "dropdown",
			"label": { "en": "Pin", "zh-hant": "腳位" },
			"options": [
				{ "value": "9", "label": { "en": "Pin 9", "zh-hant": "腳位 9" } },
				{ "value": "10", "label": { "en": "Pin 10", "zh-hant": "腳位 10" } }
			]
		}
	],
	"inputs": [],
	"examples": [
		{
			"board": "arduino_uno",
			"json": {
				"type": "servo_setup",
				"fields": { "SERVO_NAME": "myServo", "PIN": "9" }
			},
			"arduinoCode": "#include <Servo.h>\nServo myServo;\nvoid setup() {\n  myServo.attach(9);\n}",
			"description": {
				"en": "Setup servo on pin 9",
				"zh-hant": "設定伺服馬達於腳位 9"
			}
		}
	],
	"boards": ["arduino_uno", "arduino_nano", "arduino_mega", "esp32", "esp32_supermini"],
	"tags": ["servo", "motor", "pwm", "伺服", "馬達"]
}
```

### 4.4 字典生成腳本

將建立 `scripts/generate-block-dictionary.js`：

```javascript
// 概念性實作
const fs = require('fs');
const path = require('path');

// 解析 blocks/*.js 檔案提取 Blockly.Blocks 定義
function parseBlockDefinitions(blockFilePath) {
	// 使用 AST 解析或正則表達式提取
}

// 從 locales/*/messages.js 提取翻譯
function extractTranslations(localesDir) {
	// 讀取每個語言的 messages.js
}

// 從 generators/arduino/*.js 提取程式碼範例
function extractCodeExamples(generatorFilePath) {
	// 解析 generator 函數
}

// 主函數
function generateDictionary() {
	const dictionary = {
		version: require('../package.json').version,
		blocks: [],
		categories: [],
	};

	// 處理所有積木檔案
	// ...

	fs.writeFileSync('src/mcp/block-dictionary.json', JSON.stringify(dictionary, null, 2));
}
```

---

## 5. main.json 工作區狀態格式

### 5.1 現有格式分析

從 `blocklyEdit.js` 觀察，main.json 儲存格式：

```json
{
	"workspace": {
		"blocks": {
			"languageVersion": 0,
			"blocks": [
				{
					"type": "arduino_setup",
					"id": "abc123",
					"x": 100,
					"y": 50,
					"fields": {},
					"inputs": {},
					"next": {}
				}
			]
		}
	},
	"board": "arduino_uno",
	"theme": "light"
}
```

### 5.2 MCP 工具的讀寫介面

```typescript
// get_workspace_state 回應格式
interface WorkspaceStateResponse {
	board: string;
	theme: string;
	blockCount: number;
	blocks: BlockSummary[]; // 簡化的積木列表
	fullJson?: object; // 完整 JSON（可選，大型專案時可能省略）
}

interface BlockSummary {
	id: string;
	type: string;
	position: { x: number; y: number };
	connections: {
		next?: string; // 下一個積木 ID
		previous?: string; // 上一個積木 ID
		inputs?: Record<string, string>; // 輸入連接的積木 ID
	};
}

// update_workspace 輸入格式
interface UpdateWorkspaceInput {
	action: 'add' | 'remove' | 'modify' | 'replace';
	blocks?: object[]; // 要新增的積木（JSON 格式）
	blockIds?: string[]; // 要移除的積木 ID
	modifications?: BlockModification[];
	fullState?: object; // 完整替換狀態
}

interface BlockModification {
	id: string;
	fields?: Record<string, unknown>;
	position?: { x: number; y: number };
}
```

---

## 6. 板卡配置與腳位資訊

### 6.1 現有板卡定義

從 `media/blockly/blocks/board_configs.js` 提取：

```javascript
// 現有 5 種板卡
const BOARD_CONFIGS = {
	arduino_uno: {
		platformio: { platform: 'atmelavr', board: 'uno', framework: 'arduino' },
		pins: {
			digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
			analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
			pwm: [3, 5, 6, 9, 10, 11],
			interrupt: [2, 3],
			i2c: { sda: 'A4', scl: 'A5' },
			spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
		},
	},
	arduino_nano: {
		/* 類似結構 */
	},
	arduino_mega: {
		/* 類似結構 */
	},
	esp32: {
		platformio: { platform: 'espressif32', board: 'esp32dev', framework: 'arduino' },
		pins: {
			digital: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
			analog: [32, 33, 34, 35, 36, 39],
			pwm: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
			touch: [0, 2, 4, 12, 13, 14, 15, 27, 32, 33],
			i2c: { sda: 21, scl: 22 },
			spi: { mosi: 23, miso: 19, sck: 18, ss: 5 },
		},
	},
	esp32_supermini: {
		/* 類似結構 */
	},
};
```

### 6.2 get_board_pins 工具回應格式

```typescript
interface BoardPinsResponse {
	board: string;
	platformio: {
		platform: string;
		board: string;
		framework: string;
	};
	pins: {
		digital: (number | string)[];
		analog: string[];
		pwm: number[];
		interrupt: number[];
		i2c: { sda: number | string; scl: number | string };
		spi: { mosi: number; miso: number; sck: number; ss: number };
		touch?: number[]; // ESP32 only
	};
	capabilities: string[]; // ['wifi', 'bluetooth', 'pwm_channels']
}
```

---

## 7. 實作風險與緩解

### 7.1 已識別風險

| 風險                                  | 影響                   | 緩解策略                                |
| ------------------------------------- | ---------------------- | --------------------------------------- |
| VSCode MCP API 不穩定（proposed API） | 未來版本可能變更       | 檢查 VSCode 1.99+ 穩定性，抽象化 API 層 |
| 積木字典維護負擔                      | 新增積木需手動更新字典 | 建立自動化生成腳本                      |
| FileWatcher 效能                      | 大型專案可能頻繁觸發   | 去抖動 + 差異比對                       |
| MCP Server 啟動延遲                   | 首次查詢較慢           | 預載字典、lazy loading                  |

### 7.2 效能預估

-   **MCP Server 啟動**: ~1-2s（Node.js 進程 + SDK 初始化）
-   **get_block_usage**: ~50ms（記憶體查詢）
-   **search_blocks**: ~100ms（字串匹配）
-   **update_workspace**: ~200ms（檔案 I/O + 驗證）
-   **refresh_editor**: ~500ms（WebView 重載）

---

## 8. 結論與下一步

### 8.1 技術決策摘要

| 項目        | 決策                                                |
| ----------- | --------------------------------------------------- |
| MCP 傳輸    | STDIO（McpStdioServerDefinition）                   |
| MCP SDK     | @modelcontextprotocol/sdk with Zod                  |
| 積木字典    | 編譯時生成靜態 JSON                                 |
| FileWatcher | vscode.workspace.createFileSystemWatcher + debounce |
| 板卡配置    | 複用現有 board_configs.js                           |

### 8.2 Phase 1 待產出

1. **data-model.md**: 完整的資料模型定義
2. **contracts/mcp-tools.json**: 8 個 MCP 工具的 JSON Schema 契約
3. **quickstart.md**: 開發者快速入門指南

### 8.3 研究完成確認

-   [x] VSCode MCP Server Definition Provider API 已釐清
-   [x] @modelcontextprotocol/sdk 使用模式已確認
-   [x] FileWatcher 機制已設計
-   [x] 積木字典格式已定義
-   [x] main.json 讀寫介面已規劃
-   [x] 板卡配置已分析
