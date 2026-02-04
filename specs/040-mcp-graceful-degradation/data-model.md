# Data Model: MCP Server 優雅降級與 Node.js 依賴處理

**Feature**: MCP Server 優雅降級與 Node.js 依賴處理  
**Branch**: `040-mcp-graceful-degradation`  
**Date**: 2026-02-04  
**Phase**: Phase 1 - Design

## 概述

本文件定義 MCP Server 優雅降級功能所需的資料模型與實體。這些實體用於表示 Node.js 檢測結果、診斷資訊與使用者設定。

---

## 核心實體

### 1. NodeDetectionResult (Node.js 檢測結果)

代表 Node.js 檢測過程的完整結果,包含可用性、版本資訊與錯誤詳情。

**TypeScript 介面定義**:

```typescript
/**
 * Node.js 檢測結果
 */
export interface NodeDetectionResult {
	/** Node.js 是否可用 (能成功執行 node --version) */
	available: boolean;

	/** Node.js 版本號 (格式: v22.16.0),僅當 available 為 true 時有值 */
	version?: string;

	/** 解析後的版本物件,僅當 available 為 true 時有值 */
	parsedVersion?: NodeVersion;

	/** 版本是否符合最低需求 (>= 22.16.0) */
	versionCompatible: boolean;

	/** 使用的 Node.js 可執行檔路徑 (可能是 'node' 或自訂路徑) */
	nodePath: string;

	/** 錯誤訊息 (僅當檢測失敗時) */
	errorMessage?: string;

	/** 錯誤類型 (僅當檢測失敗時) */
	errorType?: NodeDetectionErrorType;
}

/**
 * Node.js 版本物件 (解析後的語意化版本)
 */
export interface NodeVersion {
	major: number;
	minor: number;
	patch: number;
}

/**
 * Node.js 檢測錯誤類型
 */
export type NodeDetectionErrorType =
	| 'not_found' // 命令不存在或不在 PATH 中
	| 'not_executable' // 檔案存在但不是有效的 Node.js
	| 'permission' // 沒有執行權限
	| 'timeout' // 執行逾時
	| 'version_low' // 版本過低
	| 'parse_error' // 版本號解析失敗
	| 'unknown'; // 其他未知錯誤
```

**狀態轉換**:

- **初始**: 無 → 開始檢測
- **檢測成功**: 有可用的 Node.js → `available: true, versionCompatible: true|false`
- **檢測失敗**: Node.js 不可用或不符合需求 → `available: false` 或 `versionCompatible: false`

**驗證規則**:

- `available` 為 `true` 時,`version` 和 `parsedVersion` 必須有值
- `versionCompatible` 僅在 `available` 為 `true` 時才有意義
- `errorMessage` 和 `errorType` 僅在 `available` 為 `false` 或 `versionCompatible` 為 `false` 時才有值

---

### 2. PathValidationResult (路徑驗證結果)

代表 Node.js 路徑驗證的結果,用於 `nodePath` 設定變更時的即時驗證。

**TypeScript 介面定義**:

```typescript
/**
 * 路徑驗證結果
 */
export interface PathValidationResult {
	/** 路徑是否有效 */
	valid: boolean;

	/** 錯誤訊息 (僅當 valid 為 false 時) */
	error?: string;

	/** 錯誤類型 (僅當 valid 為 false 時) */
	errorType?: 'not_found' | 'not_executable' | 'permission' | 'invalid_path' | 'unknown';

	/** 驗證的路徑 */
	path: string;
}
```

**使用場景**:

- 使用者在 VSCode 設定中修改 `singularBlockly.mcp.nodePath`
- Extension 透過 `onDidChangeConfiguration` 監聽器立即觸發驗證
- 根據 `PathValidationResult` 決定是否顯示警告訊息

---

### 3. McpDiagnosticReport (MCP 診斷報告)

代表完整的 MCP Server 診斷資訊,包含 Node.js 狀態、MCP Server bundle 狀態、VSCode API 相容性等。

**TypeScript 介面定義**:

```typescript
/**
 * MCP 診斷報告
 */
export interface McpDiagnosticReport {
	/** Node.js 檢測結果 */
	nodeDetection: NodeDetectionResult;

	/** MCP Server bundle 檔案是否存在 */
	mcpServerBundleExists: boolean;

	/** MCP Server bundle 檔案路徑 */
	mcpServerBundlePath: string;

	/** VSCode API 是否支援 MCP (版本 >= 1.105.0) */
	vscodeApiSupported: boolean;

	/** VSCode 版本號 */
	vscodeVersion: string;

	/** 工作區路徑 */
	workspacePath: string | null;

	/** 綜合狀態評估 */
	overallStatus: McpStatus;

	/** 建議的解決方案列表 */
	recommendations: string[];

	/** 生成報告的時間戳 */
	timestamp: string;
}

/**
 * MCP 綜合狀態
 */
export type McpStatus =
	| 'operational' // 可正常運作
	| 'partially_available' // 部分可用 (如 Node.js 版本低但可執行)
	| 'unavailable'; // 無法啟動

/**
 * 診斷報告格式化選項
 */
export interface DiagnosticReportFormatOptions {
	/** 是否包含時間戳 */
	includeTimestamp?: boolean;

	/** 是否使用 emoji 圖示 */
	useEmoji?: boolean;

	/** 目標格式 */
	format: 'text' | 'markdown' | 'json';
}
```

**建議生成規則**:

- Node.js 不可用 → "安裝 Node.js 22.16.0 或更新版本"
- Node.js 版本過低 → "升級 Node.js 至 22.16.0 或更新版本"
- MCP Server bundle 不存在 → "執行 `npm run compile` 或重新安裝 Extension"
- VSCode API 不支援 → "升級 VSCode 至 1.105.0 或更新版本"
- 工作區路徑為空 → "開啟一個專案資料夾"

---

### 4. McpSettings (MCP 設定)

代表使用者在 VSCode 設定中配置的 MCP 相關設定項目。

**TypeScript 介面定義**:

```typescript
/**
 * MCP 設定
 */
export interface McpSettings {
	/** 自訂的 Node.js 可執行檔路徑 (空字串或 undefined 表示使用預設 'node') */
	nodePath: string;

	/** 是否顯示啟動警告 */
	showStartupWarning: boolean;
}

/**
 * 預設的 MCP 設定值
 */
export const DEFAULT_MCP_SETTINGS: McpSettings = {
	nodePath: 'node',
	showStartupWarning: true,
};
```

**設定鍵對應** (package.json):

- `nodePath` → `singularBlockly.mcp.nodePath`
- `showStartupWarning` → `singularBlockly.mcp.showStartupWarning`

---

## 常數定義

### 最低 Node.js 版本需求

```typescript
/**
 * MCP Server 所需的最低 Node.js 版本
 */
export const MIN_NODE_VERSION: NodeVersion = {
	major: 22,
	minor: 16,
	patch: 0,
};

/**
 * MCP Server 所需的最低 Node.js 版本字串
 */
export const MIN_NODE_VERSION_STRING = '22.16.0';
```

### 檢測參數

```typescript
/**
 * Node.js 檢測參數
 */
export const NODE_DETECTION_CONFIG = {
	/** 執行 node --version 的逾時時間 (毫秒) */
	TIMEOUT: 3000,

	/** 檢測結果快取時間 (毫秒),Extension 啟動時檢測一次並快取 */
	CACHE_DURATION: Infinity, // 快取直到 Extension 重新啟動

	/** 版本號解析的正規表示式 */
	VERSION_REGEX: /^v?(\d+)\.(\d+)\.(\d+)/,
};
```

---

## 服務介面

### NodeDetectionService

Node.js 檢測服務的公開介面。

```typescript
/**
 * Node.js 檢測服務介面
 */
export interface INodeDetectionService {
	/**
	 * 檢測 Node.js 可用性與版本
	 * @param nodePath Node.js 可執行檔路徑 (預設: 'node')
	 * @returns Node.js 檢測結果
	 */
	detectNodeJs(nodePath?: string): Promise<NodeDetectionResult>;

	/**
	 * 驗證指定的 Node.js 路徑
	 * @param nodePath Node.js 可執行檔路徑
	 * @returns 路徑驗證結果
	 */
	validateNodePath(nodePath: string): Promise<PathValidationResult>;

	/**
	 * 比較兩個版本號
	 * @param version 檢測到的版本
	 * @param minVersion 最低需求版本
	 * @returns 是否符合最低需求
	 */
	isVersionCompatible(version: NodeVersion, minVersion: NodeVersion): boolean;

	/**
	 * 解析 Node.js 版本字串
	 * @param versionString 版本字串 (如 'v22.16.0')
	 * @returns 解析後的版本物件,失敗返回 null
	 */
	parseVersion(versionString: string): NodeVersion | null;
}
```

### DiagnosticService

診斷服務的公開介面。

```typescript
/**
 * 診斷服務介面
 */
export interface IDiagnosticService {
	/**
	 * 收集 MCP 診斷資訊
	 * @param extensionPath Extension 安裝路徑
	 * @returns MCP 診斷報告
	 */
	collectDiagnostics(extensionPath: string): Promise<McpDiagnosticReport>;

	/**
	 * 格式化診斷報告為使用者可讀的文字
	 * @param report 診斷報告
	 * @param options 格式化選項
	 * @returns 格式化後的報告文字
	 */
	formatReport(report: McpDiagnosticReport, options?: DiagnosticReportFormatOptions): string;

	/**
	 * 將診斷報告複製到剪貼簿
	 * @param report 診斷報告
	 * @returns 是否成功複製
	 */
	copyToClipboard(report: McpDiagnosticReport): Promise<boolean>;
}
```

---

## 資料流程

### 1. Extension 啟動時的檢測流程

```
Extension.activate()
    ↓
registerMcpProviderIfAvailable(context)
    ↓
NodeDetectionService.detectNodeJs()
    ↓
[Node.js 可用 且 版本符合]
    ↓ YES
registerMcpProvider(context) → MCP 功能正常運作
    ↓ NO
showNodeJsWarning() → 優雅降級,僅顯示警告
```

### 2. 設定變更時的驗證流程

```
vscode.workspace.onDidChangeConfiguration
    ↓
[affectsConfiguration('singularBlockly.mcp')]
    ↓ YES
讀取新的 nodePath 設定
    ↓
NodeDetectionService.validateNodePath(nodePath)
    ↓
[PathValidationResult]
    ↓
valid: false → 顯示警告訊息
valid: true  → 無動作 (下次啟動時生效)
```

### 3. 診斷命令執行流程

```
使用者執行 "Singular Blockly: Check MCP Status"
    ↓
DiagnosticService.collectDiagnostics(extensionPath)
    ↓ (平行收集)
├─ NodeDetectionService.detectNodeJs()
├─ 檢查 MCP Server bundle 存在性
├─ 檢查 VSCode API 版本
└─ 讀取工作區路徑
    ↓
DiagnosticService.formatReport(report, options)
    ↓
顯示格式化的診斷報告 (訊息框)
    ↓
[使用者點擊「複製診斷資訊」]
    ↓
DiagnosticService.copyToClipboard(report)
```

---

## 錯誤處理

### NodeDetectionResult 的錯誤狀態對應

| 錯誤類型         | available | versionCompatible | errorMessage 範例                            |
| ---------------- | --------- | ----------------- | -------------------------------------------- |
| `not_found`      | `false`   | `false`           | "Node.js 未安裝或不在 PATH 中"               |
| `not_executable` | `false`   | `false`           | "指定的檔案不是有效的 Node.js 可執行檔"      |
| `permission`     | `false`   | `false`           | "沒有執行權限"                               |
| `timeout`        | `false`   | `false`           | "執行逾時 (超過 3 秒)"                       |
| `version_low`    | `true`    | `false`           | "Node.js 版本 v20.0.0 低於最低需求 v22.16.0" |
| `parse_error`    | `true`    | `false`           | "無法解析版本號"                             |
| `unknown`        | `false`   | `false`           | "未知錯誤: [詳細訊息]"                       |

### 建議訊息對應

| 錯誤類型         | 建議訊息 (繁體中文)                                          |
| ---------------- | ------------------------------------------------------------ |
| `not_found`      | "請安裝 Node.js 22.16.0 或更新版本,或在設定中指定正確的路徑" |
| `not_executable` | "請指定正確的 node.exe 路徑"                                 |
| `permission`     | "請檢查檔案權限,確保 Extension 有執行權限"                   |
| `timeout`        | "Node.js 執行逾時,請檢查系統狀態"                            |
| `version_low`    | "請升級 Node.js 至 22.16.0 或更新版本"                       |
| `parse_error`    | "無法解析 Node.js 版本號,請檢查安裝是否正確"                 |
| `unknown`        | "請檢查 Output Channel 日誌以獲取更多資訊"                   |

---

## 測試考量

### 需要測試的場景

1. **NodeDetectionService**:
    - ✅ Node.js 可用且版本符合
    - ✅ Node.js 可用但版本過低
    - ✅ Node.js 不存在 (ENOENT)
    - ✅ Node.js 路徑錯誤 (檔案不存在)
    - ✅ 檔案存在但不是 Node.js
    - ✅ 執行逾時
    - ✅ 權限不足 (EACCES, EPERM)
    - ✅ 版本號解析異常

2. **PathValidationResult**:
    - ✅ 有效的絕對路徑
    - ✅ 相對路徑 (無效)
    - ✅ 預設值 'node' (有效,無需額外驗證)
    - ✅ 檔案不存在的路徑
    - ✅ Windows 長路徑 (超過 260 字元)
    - ✅ 包含中文字元的路徑

3. **McpDiagnosticReport**:
    - ✅ 所有前置條件滿足 (operational)
    - ✅ Node.js 缺失 (unavailable)
    - ✅ VSCode API 不支援 (unavailable)
    - ✅ MCP Server bundle 不存在 (unavailable)
    - ✅ 多個問題同時存在

---

## 版本演進

### v0.60.0 (初始實作)

- 定義所有核心資料模型
- 實作 `NodeDetectionResult`, `PathValidationResult`, `McpDiagnosticReport`
- 實作 `NodeDetectionService` 與 `DiagnosticService` 介面

### 未來擴展 (v0.61.0+)

可能的擴展方向:

- 支援多個 Node.js 版本檢測 (如 nvm 切換後)
- 快取檢測結果以提升效能
- 提供更詳細的診斷資訊 (如 npm 版本、系統資訊)
- 支援自動修復功能 (如自動安裝 Node.js)
