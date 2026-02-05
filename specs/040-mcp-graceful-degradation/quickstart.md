# Quickstart: MCP Server 優雅降級開發指引

**Feature**: MCP Server 優雅降級與 Node.js 依賴處理  
**File**: quickstart.md  
**Date**: 2026-02-04  
**Target Version**: v0.60.0

## 概述

本指引幫助開發者快速理解「MCP Server 優雅降級」功能的架構設計、檔案結構與開發流程,並提供實作步驟與測試策略。

**功能目標**:

- ✅ Extension 啟動時檢測 Node.js 可用性,不可用時顯示友好警告但不阻擋其他功能
- ✅ 允許使用者自訂 Node.js 路徑 (適用於 nvm/fnm 多版本管理情境)
- ✅ 提供診斷命令,生成詳細的 MCP Server 狀態報告

**非目標**:

- ❌ 不自動安裝 Node.js (超出 Extension 職責範圍)
- ❌ 不支援 Node.js < 22.16.0 版本 (MCP Server 硬性需求)
- ❌ 不提供 Node.js 版本管理功能 (使用者應使用 nvm/fnm 等工具)

---

## 架構概覽

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                      VSCode Extension                        │
│  (src/extension.ts)                                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  activate() {                                                 │
│    1. 註冊命令 (registerCommands)                            │
│    2. 設定監聽器 (setupConfigurationListener)                │
│    3. 檢查 Node.js (NodeDetectionService.detect)             │
│    4. 條件式 MCP 註冊 (registerMcpProviderIfAvailable)       │
│  }                                                            │
│                                                               │
└────┬──────────────────────────────────────────────┬─────────┘
     │                                                │
     │ 使用                                          │ 使用
     │                                                │
     ▼                                                ▼
┌─────────────────────────────┐    ┌───────────────────────────┐
│  NodeDetectionService       │    │  DiagnosticService        │
│  (src/services/             │    │  (src/services/           │
│   nodeDetectionService.ts)  │    │   diagnosticService.ts)   │
├─────────────────────────────┤    ├───────────────────────────┤
│                             │    │                           │
│  + detect(): Promise<       │    │  + collectDiagnostics():  │
│      NodeDetectionResult>   │    │      Promise<             │
│                             │    │      McpDiagnosticReport> │
│  + validatePath():          │    │                           │
│      Promise<               │    │  + formatReport():        │
│      PathValidationResult>  │    │      string               │
│                             │    │                           │
│  + parseVersion():          │    │  + copyToClipboard():     │
│      { major, minor, patch }│    │      Promise<boolean>     │
│                             │    │                           │
└────┬─────────────────────────┘    └───────────────────────────┘
     │ 呼叫
     │
     ▼
┌──────────────────────────────────────┐
│  child_process.exec                  │
│  (Node.js built-in)                  │
├──────────────────────────────────────┤
│                                      │
│  執行: node --version                │
│  逾時: 3000ms                        │
│  返回: stdout | stderr | error      │
│                                      │
└──────────────────────────────────────┘
```

### 資料流程圖

```
Extension 啟動
    │
    ├─> [Phase 1] NodeDetectionService.detect()
    │       │
    │       ├─> 讀取 singularBlockly.mcp.nodePath 設定
    │       │       (預設: "node")
    │       │
    │       ├─> fs.existsSync(nodePath)
    │       │       │
    │       │       ├─> false → 返回 { available: false, errorType: 'not_found' }
    │       │       │
    │       │       └─> true → 繼續
    │       │
    │       ├─> exec(`${nodePath} --version`, { timeout: 3000 })
    │       │       │
    │       │       ├─> 成功 → parseVersion(stdout)
    │       │       │       │
    │       │       │       ├─> 解析 "v22.16.0" → { major: 22, minor: 16, patch: 0 }
    │       │       │       │
    │       │       │       └─> 比較版本 >= 22.16.0
    │       │       │               │
    │       │       │               ├─> true → 返回 { available: true, version: "22.16.0", compatible: true }
    │       │       │               │
    │       │       │               └─> false → 返回 { available: true, version: "14.0.0", compatible: false }
    │       │       │
    │       │       └─> 失敗 → 返回 { available: false, errorType: 'execution_failed' }
    │       │
    │       └─> 返回 NodeDetectionResult
    │
    ├─> [Phase 2] 判斷 Node.js 可用性
    │       │
    │       ├─> available = true & compatible = true
    │       │       │
    │       │       └─> registerMcpProviderIfAvailable() → ✅ MCP Server 啟動
    │       │
    │       └─> available = false 或 compatible = false
    │               │
    │               ├─> 讀取 singularBlockly.mcp.showStartupWarning
    │               │       │
    │               │       ├─> true → 顯示警告訊息框
    │               │       │       - 訊息: "Node.js {version.required} 以上版本未檢測到..."
    │               │       │       - 按鈕: [安裝指引] [稍後提醒]
    │               │       │       - 點擊「稍後提醒」→ 設定 showStartupWarning = false
    │               │       │
    │               │       └─> false → 靜默處理 (log only)
    │               │
    │               └─> 跳過 MCP Provider 註冊,其他功能正常運作

使用者執行 "Check MCP Status" 命令
    │
    └─> DiagnosticService.collectDiagnostics()
            │
            ├─> NodeDetectionService.detect()
            ├─> 檢查 MCP Bundle 檔案 (dist/mcp-server.js)
            ├─> 檢查 VSCode API 版本
            ├─> 讀取工作區路徑
            │
            └─> 返回 McpDiagnosticReport
                    │
                    └─> formatReport() → 生成使用者友好的文字/JSON 報告
                            │
                            └─> 顯示在 VSCode 通知中,附帶「複製診斷資訊」按鈕
```

---

## 檔案結構與職責

### 新增檔案

```
src/
├── services/
│   ├── nodeDetectionService.ts       # Node.js 檢測服務 (核心邏輯)
│   │   ├── INodeDetectionService     # 介面定義 (依賴注入)
│   │   ├── NodeDetectionService      # 實作類別
│   │   └── detectNode()              # 主要檢測函數
│   │
│   └── diagnosticService.ts          # MCP 診斷服務
│       ├── IDiagnosticService        # 介面定義
│       ├── DiagnosticService         # 實作類別
│       ├── collectDiagnostics()      # 收集診斷資訊
│       ├── formatReport()            # 格式化報告 (文字/JSON)
│       └── copyToClipboard()         # 複製到剪貼簿
│
├── types/
│   └── nodeDetection.ts              # TypeScript 型別定義
│       ├── NodeDetectionResult       # Node.js 檢測結果
│       ├── PathValidationResult      # 路徑驗證結果
│       ├── McpDiagnosticReport       # 診斷報告
│       ├── McpSettings               # MCP 設定
│       └── NodeErrorType             # 錯誤類型枚舉
│
└── test/
    ├── suite/
    │   ├── nodeDetectionService.test.ts  # NodeDetectionService 單元測試
    │   └── diagnosticService.test.ts     # DiagnosticService 單元測試
    │
    └── integration/
        └── mcpGracefulDegradation.test.ts # 整合測試
```

### 修改檔案

```
src/
├── extension.ts                       # Extension 入口點
│   ├── 新增: registerMcpProviderIfAvailable()
│   ├── 新增: setupConfigurationListener()
│   ├── 修改: activate() - 加入 Node.js 檢測邏輯
│   └── 修改: registerCommands() - 加入 checkMcpStatus 命令
│
├── webview/
│   └── messageHandler.ts              # (無修改) 保持現有 WebView 邏輯
│
└── mcp/
    └── mcpProvider.ts                 # (無修改) 保持現有 MCP 註冊邏輯

package.json                           # Extension manifest
├── 新增: singular-blockly.mcp.nodePath 設定
├── 新增: singular-blockly.mcp.showStartupWarning 設定
└── 新增: singular-blockly.checkMcpStatus 命令

media/locales/*/messages.js            # 15 種語言檔案
└── 新增: 15+ 個新翻譯鍵 (見 contracts/vscode-settings.md)
```

---

## 開發流程

### Step 1: 建立型別定義 (30 分鐘)

**檔案**: `src/types/nodeDetection.ts`

**任務**:

1. 複製 `specs/040-mcp-graceful-degradation/data-model.md` 中的 TypeScript 介面
2. 移除註解,保留純 TypeScript 程式碼
3. 匯出所有介面與枚舉

**完成標準**:

- ✅ `NodeDetectionResult`, `PathValidationResult`, `McpDiagnosticReport`, `McpSettings` 介面正確定義
- ✅ `NodeErrorType` 枚舉包含 5 種錯誤類型
- ✅ `INodeDetectionService`, `IDiagnosticService` 介面正確定義
- ✅ TypeScript 編譯無錯誤 (`npm run compile`)

**程式碼範例**:

```typescript
// src/types/nodeDetection.ts
export interface NodeDetectionResult {
	readonly available: boolean;
	readonly version: string | null;
	readonly versionCompatible: boolean;
	readonly nodePath: string;
	readonly errorMessage?: string;
	readonly errorType?: NodeErrorType;
}

export enum NodeErrorType {
	NotFound = 'not_found',
	ExecutionFailed = 'execution_failed',
	VersionTooOld = 'version_too_old',
	PermissionDenied = 'permission_denied',
	InvalidPath = 'invalid_path',
}

// ... (其他介面)
```

---

### Step 2: 實作 NodeDetectionService (2 小時)

**檔案**: `src/services/nodeDetectionService.ts`

**任務**:

1. 實作 `INodeDetectionService` 介面
2. 使用 `child_process.exec` (promisify) 執行 `node --version`
3. 實作版本解析函數 (Regex-based, 不使用 semver npm package)
4. 實作路徑驗證函數 (fs.existsSync + exec 測試)
5. 加入 3 秒逾時保護

**完成標準**:

- ✅ `detect()` 函數正確返回 `NodeDetectionResult`
- ✅ `parseVersion()` 正確解析 "v22.16.0" → `{ major: 22, minor: 16, patch: 0 }`
- ✅ `compareVersion()` 正確比較版本 (>= 22.16.0)
- ✅ 處理所有 5 種錯誤類型 (not_found, execution_failed, version_too_old, permission_denied, invalid_path)
- ✅ 單元測試覆蓋率 >= 90% (參考 `src/test/suite/nodeDetectionService.test.ts`)

**程式碼範例**:

```typescript
// src/services/nodeDetectionService.ts
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs';
import { NodeDetectionResult, NodeErrorType } from '../types/nodeDetection';

const execAsync = promisify(exec);

export class NodeDetectionService {
	private readonly REQUIRED_MAJOR = 22;
	private readonly REQUIRED_MINOR = 16;
	private readonly REQUIRED_PATCH = 0;
	private readonly EXEC_TIMEOUT = 3000; // 3 seconds

	async detect(nodePath: string = 'node'): Promise<NodeDetectionResult> {
		// 1. 路徑驗證
		if (nodePath !== 'node' && !fs.existsSync(nodePath)) {
			return {
				available: false,
				version: null,
				versionCompatible: false,
				nodePath,
				errorMessage: 'Specified Node.js path does not exist',
				errorType: NodeErrorType.NotFound,
			};
		}

		// 2. 執行 node --version
		try {
			const { stdout } = await execAsync(`${nodePath} --version`, {
				timeout: this.EXEC_TIMEOUT,
				windowsHide: true,
			});

			// 3. 解析版本
			const version = stdout.trim();
			const parsed = this.parseVersion(version);

			if (!parsed) {
				return {
					available: true,
					version,
					versionCompatible: false,
					nodePath,
					errorMessage: 'Unable to parse version',
					errorType: NodeErrorType.ExecutionFailed,
				};
			}

			// 4. 比較版本
			const compatible = this.compareVersion(parsed);

			return {
				available: true,
				version,
				versionCompatible: compatible,
				nodePath,
				errorMessage: compatible ? undefined : 'Version too old',
				errorType: compatible ? undefined : NodeErrorType.VersionTooOld,
			};
		} catch (error: any) {
			// 5. 錯誤處理
			if (error.code === 'ENOENT') {
				return {
					available: false,
					version: null,
					versionCompatible: false,
					nodePath,
					errorMessage: 'Node.js not found in PATH',
					errorType: NodeErrorType.NotFound,
				};
			}

			if (error.code === 'EACCES' || error.code === 'EPERM') {
				return {
					available: false,
					version: null,
					versionCompatible: false,
					nodePath,
					errorMessage: 'Permission denied',
					errorType: NodeErrorType.PermissionDenied,
				};
			}

			return {
				available: false,
				version: null,
				versionCompatible: false,
				nodePath,
				errorMessage: String(error),
				errorType: NodeErrorType.ExecutionFailed,
			};
		}
	}

	private parseVersion(versionString: string): { major: number; minor: number; patch: number } | null {
		const match = versionString.match(/^v?(\d+)\.(\d+)\.(\d+)/);
		if (!match) {
			return null;
		}

		return {
			major: parseInt(match[1], 10),
			minor: parseInt(match[2], 10),
			patch: parseInt(match[3], 10),
		};
	}

	private compareVersion(version: { major: number; minor: number; patch: number }): boolean {
		if (version.major > this.REQUIRED_MAJOR) return true;
		if (version.major < this.REQUIRED_MAJOR) return false;

		if (version.minor > this.REQUIRED_MINOR) return true;
		if (version.minor < this.REQUIRED_MINOR) return false;

		return version.patch >= this.REQUIRED_PATCH;
	}
}
```

---

### Step 3: 實作 DiagnosticService (1.5 小時)

**檔案**: `src/services/diagnosticService.ts`

**任務**:

1. 實作 `IDiagnosticService` 介面
2. `collectDiagnostics()`: 整合 NodeDetectionService + 檔案檢查 + VSCode API 檢查
3. `formatReport()`: 生成使用者友好的文字報告 (使用 emoji 圖示)
4. `copyToClipboard()`: 使用 `vscode.env.clipboard.writeText()` 複製報告

**完成標準**:

- ✅ `collectDiagnostics()` 正確返回 `McpDiagnosticReport`
- ✅ `formatReport()` 生成格式化的文字報告 (包含 emoji)
- ✅ `copyToClipboard()` 成功複製純文字格式到剪貼簿
- ✅ 單元測試覆蓋率 >= 90%

**程式碼範例**:

```typescript
// src/services/diagnosticService.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NodeDetectionService } from './nodeDetectionService';
import { McpDiagnosticReport } from '../types/nodeDetection';
import { LocaleService } from './localeService';

export class DiagnosticService {
	constructor(
		private nodeDetectionService: NodeDetectionService,
		private localeService: LocaleService
	) {}

	async collectDiagnostics(extensionPath: string): Promise<McpDiagnosticReport> {
		// 1. Node.js 檢測
		const config = vscode.workspace.getConfiguration('singularBlockly.mcp');
		const nodePath = config.get<string>('nodePath', 'node');
		const nodeDetection = await this.nodeDetectionService.detect(nodePath);

		// 2. MCP Server Bundle 檢查
		const mcpBundlePath = path.join(extensionPath, 'dist', 'mcp-server.js');
		const mcpServerBundleExists = fs.existsSync(mcpBundlePath);

		// 3. VSCode API 版本檢查
		const vscodeVersion = vscode.version;
		const vscodeApiSupported = this.checkVSCodeVersion(vscodeVersion);

		// 4. 工作區路徑
		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null;

		// 5. 綜合狀態判斷
		const overallStatus = nodeDetection.available && nodeDetection.versionCompatible && mcpServerBundleExists && vscodeApiSupported ? 'operational' : 'unavailable';

		// 6. 建議生成
		const recommendations = this.generateRecommendations(nodeDetection, mcpServerBundleExists, vscodeApiSupported, workspacePath);

		return {
			nodeDetection,
			mcpServerBundleExists,
			mcpServerBundlePath,
			vscodeApiSupported,
			vscodeVersion,
			workspacePath,
			overallStatus,
			recommendations,
			timestamp: new Date().toISOString(),
		};
	}

	formatReport(report: McpDiagnosticReport, options?: { useEmoji?: boolean }): string {
		const useEmoji = options?.useEmoji ?? true;
		const checkmark = useEmoji ? '✅' : '[OK]';
		const cross = useEmoji ? '❌' : '[FAIL]';
		const folder = useEmoji ? '📁' : '[DIR]';
		const gear = useEmoji ? '⚙️' : '[CFG]';
		const time = useEmoji ? '⏰' : '[TIME]';

		let report_text = '【MCP Server 診斷報告】\n\n';

		// Node.js 狀態
		if (report.nodeDetection.available && report.nodeDetection.versionCompatible) {
			report_text += `${checkmark} Node.js 版本: ${report.nodeDetection.version}\n`;
		} else {
			report_text += `${cross} Node.js: ${report.nodeDetection.errorMessage}\n`;
		}

		// MCP Bundle
		report_text += `${report.mcpServerBundleExists ? checkmark : cross} MCP Server Bundle: ${report.mcpServerBundleExists ? '存在' : '檔案不存在'}\n`;

		// VSCode API
		report_text += `${report.vscodeApiSupported ? checkmark : cross} VSCode API 版本: ${report.vscodeVersion}\n`;

		// 工作區路徑
		report_text += `${folder} 工作區路徑: ${report.workspacePath || '無'}\n`;

		// Node.js 路徑設定
		report_text += `${gear} Node.js 路徑: ${report.nodeDetection.nodePath === 'node' ? 'node (系統 PATH)' : report.nodeDetection.nodePath}\n`;

		// 狀態
		report_text += `\n狀態：${report.overallStatus === 'operational' ? 'MCP Server 可正常運作' : 'MCP Server 無法啟動'}\n`;

		// 建議
		if (report.recommendations.length > 0) {
			report_text += '\n建議：\n';
			for (const recommendation of report.recommendations) {
				report_text += `• ${recommendation}\n`;
			}
		}

		// 時間戳
		const timestamp = new Date(report.timestamp).toLocaleString('zh-TW', { hour12: false });
		report_text += `\n${time} 生成時間: ${timestamp}\n`;

		return report_text;
	}

	async copyToClipboard(report: McpDiagnosticReport): Promise<boolean> {
		try {
			const plainTextReport = this.formatPlainTextReport(report);
			await vscode.env.clipboard.writeText(plainTextReport);
			return true;
		} catch (error) {
			return false;
		}
	}

	private checkVSCodeVersion(version: string): boolean {
		const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
		if (!match) return false;

		const major = parseInt(match[1], 10);
		const minor = parseInt(match[2], 10);

		return major > 1 || (major === 1 && minor >= 105);
	}

	private generateRecommendations(nodeDetection: any, mcpBundleExists: boolean, vscodeSupported: boolean, workspacePath: string | null): string[] {
		const recommendations: string[] = [];

		if (!nodeDetection.available) {
			recommendations.push('安裝 Node.js 22.16.0 或更新版本');
			recommendations.push('若已安裝,請在設定中指定 Node.js 路徑');
		} else if (!nodeDetection.versionCompatible) {
			recommendations.push(`升級 Node.js 至 22.16.0 或更新版本 (目前: ${nodeDetection.version})`);
		}

		if (!mcpBundleExists) {
			recommendations.push('執行 `npm run compile` 或重新安裝 Extension');
		}

		if (!vscodeSupported) {
			recommendations.push('升級 VSCode 至 1.105.0 或更新版本');
		}

		if (!workspacePath) {
			recommendations.push('開啟專案資料夾以使用完整功能');
		}

		return recommendations;
	}

	private formatPlainTextReport(report: McpDiagnosticReport): string {
		// 純文字格式 (無 emoji),適合複製到 GitHub Issue
		let text = 'MCP Server 診斷報告\n';
		text += '==================\n';
		text += `生成時間: ${new Date(report.timestamp).toLocaleString('zh-TW', { hour12: false })}\n\n`;

		text += 'Node.js 狀態:\n';
		text += `  - 可用: ${report.nodeDetection.available ? '是' : '否'}\n`;
		if (report.nodeDetection.version) {
			text += `  - 版本: ${report.nodeDetection.version}\n`;
			text += `  - 相容: ${report.nodeDetection.versionCompatible ? '是' : '否'}\n`;
		} else {
			text += `  - 錯誤: ${report.nodeDetection.errorMessage}\n`;
		}
		text += `  - 路徑: ${report.nodeDetection.nodePath === 'node' ? 'node (系統 PATH)' : report.nodeDetection.nodePath}\n\n`;

		text += 'MCP Server Bundle:\n';
		text += `  - 存在: ${report.mcpServerBundleExists ? '是' : '否'}\n`;
		text += `  - 路徑: ${report.mcpServerBundlePath}\n\n`;

		text += 'VSCode API:\n';
		text += `  - 支援: ${report.vscodeApiSupported ? '是' : '否'}\n`;
		text += `  - 版本: ${report.vscodeVersion}\n\n`;

		text += '工作區:\n';
		text += `  - 路徑: ${report.workspacePath || '無'}\n\n`;

		text += `綜合狀態: ${report.overallStatus === 'operational' ? '可正常運作' : '無法啟動'}\n`;

		if (report.recommendations.length > 0) {
			text += '\n建議:\n';
			for (let i = 0; i < report.recommendations.length; i++) {
				text += `  ${i + 1}. ${report.recommendations[i]}\n`;
			}
		}

		return text;
	}
}
```

---

### Step 4: 修改 extension.ts (1.5 小時)

**檔案**: `src/extension.ts`

**任務**:

1. 在 `activate()` 中初始化 `NodeDetectionService` 與 `DiagnosticService`
2. 實作 `registerMcpProviderIfAvailable()` 函數,加入 Node.js 檢測前置檢查
3. 實作 `setupConfigurationListener()` 函數,監聽 `singularBlockly.mcp.*` 設定變更
4. 在 `registerCommands()` 中註冊 `singular-blockly.checkMcpStatus` 命令
5. 實作警告訊息框 (包含「安裝指引」與「稍後提醒」按鈕)

**完成標準**:

- ✅ Extension 啟動時正確檢測 Node.js
- ✅ Node.js 不可用時顯示警告訊息 (若 `showStartupWarning = true`)
- ✅ Node.js 可用時正常註冊 MCP Provider
- ✅ 設定變更時立即驗證新路徑
- ✅ `checkMcpStatus` 命令正確執行並顯示診斷報告
- ✅ 整合測試通過 (`src/test/integration/mcpGracefulDegradation.test.ts`)

**程式碼範例**:

```typescript
// src/extension.ts (部分修改)
import { NodeDetectionService } from './services/nodeDetectionService';
import { DiagnosticService } from './services/diagnosticService';

export async function activate(context: vscode.ExtensionContext) {
	// ... 現有程式碼 ...

	// 初始化服務
	const nodeDetectionService = new NodeDetectionService();
	const diagnosticService = new DiagnosticService(nodeDetectionService, localeService);

	// 檢測 Node.js 並條件式註冊 MCP Provider
	await registerMcpProviderIfAvailable(context, nodeDetectionService, localeService);

	// 設定監聽器
	setupConfigurationListener(context, nodeDetectionService, localeService);

	// 註冊命令 (包含 checkMcpStatus)
	registerCommands(context, localeService, diagnosticService);

	// ... 現有程式碼 ...
}

async function registerMcpProviderIfAvailable(context: vscode.ExtensionContext, nodeDetectionService: NodeDetectionService, localeService: LocaleService): Promise<void> {
	// 1. 讀取設定
	const config = vscode.workspace.getConfiguration('singularBlockly.mcp');
	const nodePath = config.get<string>('nodePath', 'node');
	const showStartupWarning = config.get<boolean>('showStartupWarning', true);

	// 2. 檢測 Node.js
	const nodeDetection = await nodeDetectionService.detect(nodePath);

	// 3. 判斷是否可註冊 MCP Provider
	if (!nodeDetection.available || !nodeDetection.versionCompatible) {
		log(`Node.js unavailable or incompatible: ${nodeDetection.errorMessage}`, 'warn');

		// 4. 顯示警告 (若啟用)
		if (showStartupWarning) {
			await showNodeJsWarning(nodeDetection, localeService);
		}

		return; // 跳過 MCP 註冊,其他功能正常運作
	}

	// 5. Node.js 可用,註冊 MCP Provider
	log(`Node.js ${nodeDetection.version} detected, registering MCP Provider`, 'info');

	const disposable = registerMcpProvider(context.extensionPath);
	if (disposable) {
		context.subscriptions.push(disposable);
		log('MCP Provider registered successfully', 'info');
	}
}

async function showNodeJsWarning(nodeDetection: NodeDetectionResult, localeService: LocaleService): Promise<void> {
	const warningMsg = await localeService.getLocalizedMessage('WARNING_NODE_NOT_AVAILABLE', 'Node.js 22.16.0 或以上版本未檢測到。MCP 功能將無法使用,但 Blockly 編輯功能仍可正常運作。\n\n錯誤: {0}', nodeDetection.errorMessage || '未知錯誤');

	const installButton = await localeService.getLocalizedMessage('BUTTON_INSTALL_GUIDE', '安裝指引');

	const laterButton = await localeService.getLocalizedMessage('BUTTON_REMIND_LATER', '稍後提醒');

	const action = await vscode.window.showWarningMessage(warningMsg, installButton, laterButton);

	if (action === installButton) {
		vscode.env.openExternal(vscode.Uri.parse('https://nodejs.org/'));
	} else if (action === laterButton) {
		// 停用警告
		await vscode.workspace.getConfiguration('singularBlockly.mcp').update('showStartupWarning', false, vscode.ConfigurationTarget.Global);
		log('User disabled Node.js startup warning', 'info');
	}
}

function setupConfigurationListener(context: vscode.ExtensionContext, nodeDetectionService: NodeDetectionService, localeService: LocaleService): void {
	const disposable = vscode.workspace.onDidChangeConfiguration(async event => {
		// 僅處理 MCP 設定變更
		if (!event.affectsConfiguration('singularBlockly.mcp.nodePath')) {
			return;
		}

		const config = vscode.workspace.getConfiguration('singularBlockly.mcp');
		const nodePath = config.get<string>('nodePath', 'node');

		log(`nodePath changed to: ${nodePath}`, 'info');

		// 立即驗證新路徑
		const validation = await nodeDetectionService.detect(nodePath);

		if (!validation.available || !validation.versionCompatible) {
			const warningMsg = await localeService.getLocalizedMessage('WARNING_INVALID_NODE_PATH', '指定的 Node.js 路徑無效: {0}。{1}', nodePath, validation.errorMessage || '未知錯誤');
			vscode.window.showWarningMessage(warningMsg);
		} else {
			const infoMsg = await localeService.getLocalizedMessage('INFO_NODE_PATH_VALID', 'Node.js 路徑已驗證: {0}', validation.version || '');
			vscode.window.showInformationMessage(infoMsg);
		}
	});

	context.subscriptions.push(disposable);
}

function registerCommands(context: vscode.ExtensionContext, localeService: LocaleService, diagnosticService: DiagnosticService) {
	// ... 現有命令 ...

	// 新增: checkMcpStatus 命令
	const checkMcpStatusCommand = vscode.commands.registerCommand('singular-blockly.checkMcpStatus', async () => {
		try {
			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: await localeService.getLocalizedMessage('PROGRESS_CHECKING_MCP', 'Checking MCP status...'),
					cancellable: false,
				},
				async () => {
					// 收集診斷資訊
					const report = await diagnosticService.collectDiagnostics(context.extensionPath);

					// 格式化報告
					const formattedReport = diagnosticService.formatReport(report, { useEmoji: true });

					// 顯示報告
					const copyButton = await localeService.getLocalizedMessage('BUTTON_COPY_DIAGNOSTICS', '複製診斷資訊');

					const action = await vscode.window.showInformationMessage(formattedReport, { modal: false }, copyButton);

					// 處理複製動作
					if (action === copyButton) {
						const copied = await diagnosticService.copyToClipboard(report);
						if (copied) {
							const successMsg = await localeService.getLocalizedMessage('INFO_COPIED_TO_CLIPBOARD', '已複製到剪貼簿');
							vscode.window.showInformationMessage(successMsg);
						}
					}
				}
			);
		} catch (error) {
			log('Error executing checkMcpStatus command:', 'error', error);
			vscode.window.showErrorMessage(`Command failed: ${error}`);
		}
	});

	context.subscriptions.push(checkMcpStatusCommand);
}
```

---

### Step 5: 更新 package.json (30 分鐘)

**檔案**: `package.json`

**任務**:

1. 在 `contributes.configuration` 中新增 `singularBlockly.mcp.nodePath` 與 `singularBlockly.mcp.showStartupWarning`
2. 在 `contributes.commands` 中新增 `singular-blockly.checkMcpStatus`
3. 更新版本號為 `0.60.0`

**完成標準**:

- ✅ 設定項正確定義,包含 `type`, `default`, `markdownDescription`, `scope`
- ✅ 命令正確定義,包含 `command`, `title`, `category`
- ✅ 國際化鍵使用 `%key%` 格式
- ✅ `npm run validate:i18n` 通過

**程式碼範例**:

```json
// package.json (部分修改)
{
	"name": "singular-blockly",
	"version": "0.60.0",
	"contributes": {
		"configuration": {
			"title": "Singular Blockly",
			"properties": {
				// ... 現有設定 ...

				"singularBlockly.mcp.nodePath": {
					"type": "string",
					"default": "node",
					"markdownDescription": "%config.mcp.nodePath.description%",
					"scope": "machine-overridable"
				},
				"singularBlockly.mcp.showStartupWarning": {
					"type": "boolean",
					"default": true,
					"markdownDescription": "%config.mcp.showStartupWarning.description%",
					"scope": "machine-overridable"
				}
			}
		},
		"commands": [
			// ... 現有命令 ...

			{
				"command": "singular-blockly.checkMcpStatus",
				"title": "%command.checkMcpStatus.title%",
				"category": "Singular Blockly"
			}
		]
	}
}
```

---

### Step 6: 國際化 (15 種語言, 2 小時)

**檔案**: `package.nls.*.json` (15 個檔案) 與 `media/locales/*/messages.js` (15 個檔案)

**任務**:

1. 在 `package.nls.*.json` 中新增設定項與命令的翻譯鍵
2. 在 `media/locales/*/messages.js` 中新增診斷報告與警告訊息的翻譯鍵
3. 使用 GitHub Copilot 或 ChatGPT 輔助翻譯
4. 修改後執行 `npm run validate:i18n` 驗證

**完成標準**:

- ✅ 所有 15 種語言都有完整翻譯
- ✅ `npm run validate:i18n` 無錯誤
- ✅ `npm run audit:i18n:all` 品質評分 >= 8.0 (參考 `031-bugfix-batch-jan` spec)

**語言列表**:

- `en`, `zh-hant`, `ja`, `ko`, `es`, `pt-br`, `fr`, `de`, `it`, `ru`, `pl`, `hu`, `tr`, `bg`, `cs`

**程式碼範例** (package.nls.json):

```json
// package.nls.json (en)
{
	"command.checkMcpStatus.title": "Check MCP Status",
	"config.mcp.nodePath.description": "Node.js executable path. Leave empty to use 'node' from system PATH. Example: C:\\Program Files\\nodejs\\node.exe",
	"config.mcp.showStartupWarning.description": "Whether to show a warning message when Node.js is unavailable. Set to false to suppress the warning."
}
```

```json
// package.nls.zh-hant.json (繁體中文)
{
	"command.checkMcpStatus.title": "檢查 MCP 狀態",
	"config.mcp.nodePath.description": "Node.js 可執行檔路徑。留空以使用系統 PATH 的 'node' 命令。範例：C:\\Program Files\\nodejs\\node.exe",
	"config.mcp.showStartupWarning.description": "當 Node.js 不可用時,是否在 Extension 啟動時顯示警告訊息。設為 false 可停用警告。"
}
```

**程式碼範例** (media/locales/en/messages.js):

```javascript
// media/locales/en/messages.js
export default {
	// ... 現有翻譯 ...

	// 命令相關
	PROGRESS_CHECKING_MCP: 'Checking MCP status...',
	BUTTON_COPY_DIAGNOSTICS: 'Copy Diagnostic Information',
	INFO_COPIED_TO_CLIPBOARD: 'Copied to clipboard',
	ERROR_COMMAND_FAILED: 'Command failed: {0}',

	// 警告訊息
	WARNING_NODE_NOT_AVAILABLE: 'Node.js 22.16.0 or newer not detected. MCP features will be unavailable, but Blockly editing will work normally.\\n\\nError: {0}',
	BUTTON_INSTALL_GUIDE: 'Installation Guide',
	BUTTON_REMIND_LATER: 'Remind Me Later',
	WARNING_INVALID_NODE_PATH: 'Specified Node.js path is invalid: {0}. {1}',
	INFO_NODE_PATH_VALID: 'Node.js path validated: {0}',

	// 診斷報告
	// ... (參考 contracts/vscode-command.md)
};
```

---

### Step 7: 單元測試與整合測試 (3 小時)

**測試策略**: TDD (Test-Driven Development),目標覆蓋率 >= 90% (參考 `docs/specifications/04-quality-testing/test-coverage.md`)

#### 7.1 NodeDetectionService 單元測試

**檔案**: `src/test/suite/nodeDetectionService.test.ts`

**測試場景**:

1. ✅ Node.js 可用且版本相容 (v22.16.0+)
2. ✅ Node.js 可用但版本過舊 (< v22.16.0)
3. ✅ Node.js 不在 PATH 中 (ENOENT 錯誤)
4. ✅ 自訂路徑存在且有效
5. ✅ 自訂路徑存在但不是 Node.js
6. ✅ 自訂路徑不存在
7. ✅ 權限拒絕 (EACCES/EPERM 錯誤)
8. ✅ 執行逾時 (3 秒保護)
9. ✅ 版本解析函數正確性 (各種格式: "v22.16.0", "22.16.0", "v14.0.0")
10. ✅ 版本比較函數正確性 (邊界案例: 22.15.99, 22.16.0, 23.0.0)

**程式碼範例**:

```typescript
// src/test/suite/nodeDetectionService.test.ts
import * as assert from 'assert';
import * as sinon from 'sinon';
import { NodeDetectionService } from '../../services/nodeDetectionService';
import { NodeErrorType } from '../../types/nodeDetection';
import * as childProcess from 'child_process';

suite('NodeDetectionService Test Suite', () => {
	let service: NodeDetectionService;
	let execStub: sinon.SinonStub;

	setup(() => {
		service = new NodeDetectionService();
	});

	teardown(() => {
		sinon.restore();
	});

	test('Node.js available and compatible (v22.16.0)', async () => {
		execStub = sinon.stub(childProcess, 'exec').callsArgWith(2, null, 'v22.16.0\n', '');

		const result = await service.detect('node');

		assert.strictEqual(result.available, true);
		assert.strictEqual(result.version, 'v22.16.0');
		assert.strictEqual(result.versionCompatible, true);
		assert.strictEqual(result.nodePath, 'node');
		assert.strictEqual(result.errorMessage, undefined);
		assert.strictEqual(result.errorType, undefined);
	});

	test('Node.js available but version too old (v14.0.0)', async () => {
		execStub = sinon.stub(childProcess, 'exec').callsArgWith(2, null, 'v14.0.0\n', '');

		const result = await service.detect('node');

		assert.strictEqual(result.available, true);
		assert.strictEqual(result.version, 'v14.0.0');
		assert.strictEqual(result.versionCompatible, false);
		assert.strictEqual(result.errorMessage, 'Version too old');
		assert.strictEqual(result.errorType, NodeErrorType.VersionTooOld);
	});

	test('Node.js not found in PATH (ENOENT)', async () => {
		const error: any = new Error('Command not found');
		error.code = 'ENOENT';
		execStub = sinon.stub(childProcess, 'exec').callsArgWith(2, error, '', '');

		const result = await service.detect('node');

		assert.strictEqual(result.available, false);
		assert.strictEqual(result.version, null);
		assert.strictEqual(result.versionCompatible, false);
		assert.strictEqual(result.errorMessage, 'Node.js not found in PATH');
		assert.strictEqual(result.errorType, NodeErrorType.NotFound);
	});

	test('Permission denied (EACCES)', async () => {
		const error: any = new Error('Permission denied');
		error.code = 'EACCES';
		execStub = sinon.stub(childProcess, 'exec').callsArgWith(2, error, '', '');

		const result = await service.detect('/usr/bin/node');

		assert.strictEqual(result.available, false);
		assert.strictEqual(result.errorType, NodeErrorType.PermissionDenied);
	});

	test('parseVersion correctly parses "v22.16.0"', () => {
		const result = (service as any).parseVersion('v22.16.0');
		assert.deepStrictEqual(result, { major: 22, minor: 16, patch: 0 });
	});

	test('parseVersion correctly parses "22.16.0" (no v prefix)', () => {
		const result = (service as any).parseVersion('22.16.0');
		assert.deepStrictEqual(result, { major: 22, minor: 16, patch: 0 });
	});

	test('parseVersion returns null for invalid format', () => {
		const result = (service as any).parseVersion('invalid');
		assert.strictEqual(result, null);
	});

	test('compareVersion returns true for 22.16.0', () => {
		const result = (service as any).compareVersion({ major: 22, minor: 16, patch: 0 });
		assert.strictEqual(result, true);
	});

	test('compareVersion returns false for 22.15.99', () => {
		const result = (service as any).compareVersion({ major: 22, minor: 15, patch: 99 });
		assert.strictEqual(result, false);
	});

	test('compareVersion returns true for 23.0.0', () => {
		const result = (service as any).compareVersion({ major: 23, minor: 0, patch: 0 });
		assert.strictEqual(result, true);
	});

	// ... 更多測試場景 ...
});
```

#### 7.2 DiagnosticService 單元測試

**檔案**: `src/test/suite/diagnosticService.test.ts`

**測試場景**:

1. ✅ `collectDiagnostics()` 正確整合所有檢測結果
2. ✅ `formatReport()` 生成正確的文字格式
3. ✅ `formatReport()` 支援 emoji 開/關
4. ✅ `copyToClipboard()` 成功複製
5. ✅ `generateRecommendations()` 根據不同錯誤類型生成正確建議

#### 7.3 整合測試

**檔案**: `src/test/integration/mcpGracefulDegradation.test.ts`

**測試場景**:

1. ✅ 完整流程: Extension 啟動 → Node.js 檢測 → MCP 註冊
2. ✅ Node.js 不可用: Extension 啟動 → 顯示警告 → 跳過 MCP 註冊
3. ✅ 設定變更: 修改 `nodePath` → 立即驗證 → 顯示結果
4. ✅ 命令執行: 執行 `checkMcpStatus` → 顯示診斷報告 → 複製到剪貼簿

---

## 測試與除錯指令

### 本地測試

```powershell
# 編譯
npm run compile

# 執行單元測試
npm test

# 執行測試並生成覆蓋率報告
npm run test:coverage

# 驗證測試覆蓋率 (至少 90%)
# 查看 coverage/index.html 的 Statements/Branches/Functions/Lines 指標

# 驗證國際化完整性
npm run validate:i18n

# 國際化品質稽核
npm run audit:i18n:all
```

### VSCode 除錯

1. **F5**: 啟動 Extension 除錯 (Extension Development Host 視窗)
2. 在新視窗中開啟測試專案
3. 設中斷點於 `src/extension.ts` 的 `activate()`, `registerMcpProviderIfAvailable()` 函數
4. 觀察 Output Channel (`View` → `Output` → `Singular Blockly`) 的日誌輸出
5. 執行 `Ctrl+Shift+P` → `Singular Blockly: Check MCP Status` 驗證命令執行

### 模擬 Node.js 不可用

**方法 1: 暫時重命名 node.exe**

```powershell
# Windows (以管理員身份執行)
where node  # 找到 node.exe 位置,如 C:\Program Files\nodejs\node.exe
ren "C:\Program Files\nodejs\node.exe" "node.exe.bak"

# 測試完成後恢復
ren "C:\Program Files\nodejs\node.exe.bak" "node.exe"
```

**方法 2: 使用自訂 nodePath 設定**

```json
// VSCode settings.json
{
	"singularBlockly.mcp.nodePath": "C:\\invalid\\not-exist\\node.exe"
}
```

**方法 3: 使用單元測試 Mock**

```typescript
// src/test/suite/nodeDetectionService.test.ts
sinon.stub(childProcess, 'exec').callsArgWith(2, new Error('ENOENT'), '', '');
```

---

## 向後相容性與安全性

### 向後相容性保證

- ✅ 現有使用者升級後,預設使用系統 PATH 的 `node`,行為與舊版本一致
- ✅ Node.js 不可用時,Blockly 編輯、上傳功能仍正常運作 (僅 MCP 功能受影響)
- ✅ 新設定項使用 `machine-overridable` 範圍,不影響 Settings Sync

### 安全性考量

- ✅ 使用 `child_process.exec` 執行 `node --version`,但:
    - 不執行使用者輸入的任意命令
    - 僅執行 `--version` 參數 (安全且唯讀)
    - 使用 `windowsHide: true` 隱藏命令視窗
    - 設定 3 秒逾時,避免無限等待
- ✅ 路徑驗證:使用 `fs.existsSync()` 檢查檔案存在性,不執行任意檔案
- ✅ 不使用 `eval()` 或 `Function()` 動態執行程式碼
- ✅ 遵循 VSCode Extension 安全性最佳實踐 (參考 `.github/skills/security-checker/SKILL.md`)

---

## 發布與回溯計畫

### 發布流程

1. **完成所有測試**: 確保測試覆蓋率 >= 90%, `npm run validate:i18n` 通過
2. **更新 CHANGELOG.md**: 遵循 Keep a Changelog 格式
3. **語意化版本**: v0.60.0 (次要版本,新增功能)
4. **Git 標籤**: `git tag v0.60.0` → `git push --tags`
5. **GitHub Release**: 發布 v0.60.0,附上變更摘要與 `.vsix` 檔案
6. **VS Marketplace**: 上傳 `.vsix` 到 Marketplace (需 publisher 權限)

### 回溯計畫

若發現嚴重 Bug (如 Extension 啟動失敗、MCP Server 無法正常運作):

1. **緊急 Hotfix**: 建立 `hotfix/v0.60.1` 分支
2. **最小化修復**: 僅修復 Bug,不引入新功能
3. **快速測試**: 僅執行受影響模組的測試
4. **發布 v0.60.1**: 遵循語意化版本 (修訂號 +1)
5. **通知使用者**: 在 GitHub Release 說明中標記為 Hotfix

---

## 常見問題 (FAQ)

### Q1: 為什麼不使用 `semver` npm package 進行版本比較?

**A**: 遵循專案 Constitution Principle III「Simplicity」原則 (參考 `.specify/memory/constitution.md`),避免引入非必要的外部依賴。手動實作版本解析與比較邏輯簡單且可控,測試覆蓋容易。

### Q2: 為什麼不使用 `child_process.execSync`?

**A**: `execSync` 是同步操作,會阻塞 Extension 啟動流程。使用非同步的 `exec` (promisify) 可避免 UI 凍結,提供更好的使用者體驗。

### Q3: 為什麼不在 Extension 內自動安裝 Node.js?

**A**:

1. **權限問題**: Extension 沒有系統管理員權限,無法安裝全域軟體
2. **使用者選擇**: 使用者應自主選擇 Node.js 版本與安裝方式 (官方安裝器、nvm、fnm 等)
3. **職責範圍**: Extension 的職責是「檢測」與「引導」,不應接管系統環境配置

### Q4: Node.js 版本需求為何是 22.16.0+?

**A**: MCP Server 使用 Node.js 22.16.0+ 的原生 WebSocket 與 Fetch API,不相容舊版本。這是 MCP SDK 的硬性需求,無法降級。

### Q5: 為什麼診斷報告使用 emoji 圖示?

**A**: emoji (✅/❌/📁) 提升可讀性,讓使用者快速掃視報告狀態。但也提供 `useEmoji: false` 選項,適用於純文字環境 (如複製到 GitHub Issue)。

---

## 相關文件連結

- [Feature Specification (spec.md)](./spec.md)
- [Implementation Plan (plan.md)](./plan.md)
- [Data Model (data-model.md)](./data-model.md)
- [VSCode Settings Contract (contracts/vscode-settings.md)](./contracts/vscode-settings.md)
- [VSCode Command Contract (contracts/vscode-command.md)](./contracts/vscode-command.md)
- [Project Constitution (.specify/memory/constitution.md)](../../.specify/memory/constitution.md)
- [Security Checker Skill (.github/skills/security-checker/SKILL.md)](../../.github/skills/security-checker/SKILL.md)
- [Test Coverage Specification (docs/specifications/04-quality-testing/test-coverage.md)](../../docs/specifications/04-quality-testing/test-coverage.md)

---

## 貢獻者指引

歡迎貢獻!請遵循以下步驟:

1. **Fork 專案** 並建立功能分支: `git checkout -b feat/your-feature-name`
2. **遵循程式碼風格**: 執行 `npm run lint` 確保無 ESLint 錯誤
3. **撰寫測試**: 新增功能必須包含單元測試,覆蓋率 >= 90%
4. **提交 PR**: 使用 Conventional Commits 格式 (如 `feat(mcp): add graceful degradation`)
5. **通過 CI**: PR 必須通過 ESLint + 測試 + i18n 驗證

更多細節請參考 [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**最後更新**: 2026-02-04  
**版本**: v0.60.0  
**維護者**: Singular Blockly Team
