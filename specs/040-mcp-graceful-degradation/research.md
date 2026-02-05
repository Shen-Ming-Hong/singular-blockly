# Research Report: MCP Server 優雅降級技術研究

**Feature**: MCP Server 優雅降級與 Node.js 依賴處理  
**Branch**: `040-mcp-graceful-degradation`  
**Date**: 2026-02-04  
**Researcher**: AI Agent (speckit.plan Phase 0)  
**Status**: ✅ 完成

## 研究概述

本文件記錄 Phase 0 研究階段對 Technical Context 中標記為 NEEDS CLARIFICATION 的技術決策進行深入調查的結果。研究範圍涵蓋 Node.js 檢測方法、版本比較實作、VSCode API 使用模式、MCP Provider 條件註冊與路徑驗證策略。

---

## 研究項目

### 1. Node.js 檢測方法選擇

**研究目標**: 決定使用 `child_process.exec`, `execSync` 或 `spawn` 執行 `node --version` 的最佳方案

**研究方法**: 查詢 Node.js 官方 API 文件、分析現有專案模式

**研究結果** ✅

**Decision (決定)**: 使用 `child_process.exec()` 進行 Node.js 檢測

**Rationale (選擇理由)**:

1. **簡潔性**: `exec()` 自動緩衝輸出到字串,適合檢測簡短的 `--version` 輸出
2. **非阻塞**: 非同步執行,不會阻塞 Extension 啟動流程
3. **錯誤處理友善**: 提供 callback 處理成功/失敗,易於區分「命令不存在」vs「執行失敗」
4. **Shell 支援**: 自動在 shell 中執行,可處理系統 PATH 環境變數與自訂路徑
5. **項目慣例**: 專案文件 (spec.md) 已假設使用 `child_process.exec()` 作為檢測方式

**Alternatives Considered (評估過的其他方案)**:

- **`execSync()`**: 同步執行會阻塞 Extension 啟動,不符合「不影響使用者體驗」的設計目標
- **`spawn()`**: 需手動處理 stdout 串流與緩衝,對於簡單版本檢測過於複雜

**Implementation Notes (實作注意事項)**:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function detectNodeJs(nodePath: string = 'node'): Promise<{ available: boolean; version?: string }> {
	try {
		const { stdout } = await execAsync(`"${nodePath}" --version`, { timeout: 3000 });
		const version = stdout.trim(); // 例如: v22.16.0
		return { available: true, version };
	} catch (error) {
		// 錯誤碼 ENOENT 表示命令不存在
		return { available: false };
	}
}
```

---

### 2. 版本比較實作策略

**研究目標**: 評估使用 `semver` npm 套件 vs 自行實作正規表示式解析的優劣

**研究方法**: 分析專案依賴策略、評估套件引入成本

**研究結果** ✅

**Decision (決定)**: 自行實作簡單的版本比較邏輯,不引入 `semver` npm 套件

**Rationale (選擇理由)**:

1. **需求簡單**: 僅需比較 Node.js 版本是否 >= 22.16.0,不需要複雜的 semver 範圍解析
2. **零依賴原則**: 避免增加 npm 套件依賴,減少 Extension 打包大小與安全風險
3. **可維護性**: 簡單的版本比較邏輯易於理解、測試與維護
4. **專案一致性**: 已有 TypeScript strict mode 與完善的測試框架,不需外部套件保證正確性

**Alternatives Considered (評估過的其他方案)**:

- **`semver` npm 套件**: 功能強大但過於複雜,會增加 40KB+ 依賴 (minified + gzipped)
- **`compare-versions` 套件**: 輕量(4KB)但仍是非必要的外部依賴

**Implementation Notes (實作注意事項)**:

```typescript
interface NodeVersion {
	major: number;
	minor: number;
	patch: number;
}

function parseNodeVersion(versionString: string): NodeVersion | null {
	// 解析 "v22.16.0" 格式
	const match = versionString.match(/^v?(\d+)\.(\d+)\.(\d+)/);
	if (!match) return null;

	return {
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10),
		patch: parseInt(match[3], 10),
	};
}

function isVersionCompatible(version: NodeVersion, minVersion: NodeVersion): boolean {
	if (version.major !== minVersion.major) {
		return version.major > minVersion.major;
	}
	if (version.minor !== minVersion.minor) {
		return version.minor > minVersion.minor;
	}
	return version.patch >= minVersion.patch;
}

// 使用範例
const MIN_NODE_VERSION = { major: 22, minor: 16, patch: 0 };
const detected = parseNodeVersion('v22.16.0');
if (detected && isVersionCompatible(detected, MIN_NODE_VERSION)) {
	// Node.js 版本合格
}
```

---

### 3. VSCode 設定監聽模式

**研究目標**: 了解 `vscode.workspace.onDidChangeConfiguration` 的使用模式與效能考量

**研究方法**: 查詢 VSCode API 文件、搜尋專案中現有設定處理實作

**研究結果** ✅

**Decision (決定)**: 使用 `vscode.workspace.onDidChangeConfiguration` 監聽 `nodePath` 設定變更,立即驗證新路徑

**Rationale (選擇理由)**:

1. **即時反饋**: 使用者修改設定後立即驗證並顯示警告,提升使用體驗
2. **官方推薦模式**: VSCode API 官方設計,專為擴充功能設定變更設計
3. **效能可控**: 事件觸發頻率低(僅當設定變更時),可加入防抖動(debounce)避免過度驗證
4. **符合 spec 需求**: spec.md FR-014 明確要求「修改設定時立即驗證路徑」

**Alternatives Considered (評估過的其他方案)**:

- **輪詢檢查 (Polling)**: 不必要的資源消耗,使用者體驗差
- **延遲驗證 (Lazy Validation)**: 僅在使用時驗證,無法提供即時反饋

**Implementation Notes (實作注意事項)**:

```typescript
import * as vscode from 'vscode';

function setupConfigurationListener(context: vscode.ExtensionContext) {
	const disposable = vscode.workspace.onDidChangeConfiguration(async event => {
		// 僅處理 MCP 相關設定變更
		if (event.affectsConfiguration('singularBlockly.mcp')) {
			const config = vscode.workspace.getConfiguration('singularBlockly.mcp');
			const nodePath = config.get<string>('nodePath', 'node');

			// 立即驗證新路徑
			const result = await validateNodePath(nodePath);

			if (!result.valid) {
				vscode.window.showWarningMessage(`指定的 Node.js 路徑無效:${nodePath}。${result.error}`);
			}
		}
	});

	context.subscriptions.push(disposable);
}
```

**專案現存模式參考**: 專案中目前沒有使用 `onDidChangeConfiguration` 的範例,但有完整的 `SettingsManager` 類別處理設定讀寫 (`src/services/settingsManager.ts`)。新功能將遵循現有模式,在 `NodeDetectionService` 中處理檢測與驗證邏輯。

---

### 4. 條件式 MCP Provider 註冊

**研究目標**: 確定如何安全改造 MCP Provider 註冊邏輯,避免破壞現有功能

**研究方法**: 檢視現有 `src/mcp/mcpProvider.ts` 與 `src/extension.ts` 程式碼

**研究結果** ✅

**Decision (決定)**: 在 `extension.ts` 的 `registerMcpProviderIfAvailable()` 中加入 Node.js 檢測前置檢查

**Rationale (選擇理由)**:

1. **現有架構友善**: `registerMcpProviderIfAvailable()` 已經是條件式註冊(檢查 VSCode API 版本),僅需擴展條件
2. **職責清晰**: `mcpProvider.ts` 保持單一職責(MCP 註冊邏輯),檢測邏輯在 `extension.ts` 進行
3. **錯誤隔離**: Node.js 檢測失敗不影響 Extension 其他功能,MCP Provider 僅在條件滿足時註冊
4. **向後相容**: 現有使用者(有 Node.js)體驗完全不變,檢測通過後行為與現在一致

**Alternatives Considered (評估過的其他方案)**:

- **在 `mcpProvider.ts` 內部檢測**: 違反單一職責原則,MCP Provider 不應關心外部依賴
- **啟動時完全跳過 MCP**: 過於保守,有 Node.js 的使用者會失去 AI 功能

**Implementation Notes (實作注意事項)**:

```typescript
// src/extension.ts (修改現有函數)
async function registerMcpProviderIfAvailable(context: vscode.ExtensionContext) {
	log('Checking MCP prerequisites...', 'info');

	// 1. 檢查 VSCode API 版本 (現有邏輯)
	if (!vscode.lm || typeof vscode.lm.registerMcpServerDefinitionProvider !== 'function') {
		log('MCP API not available', 'info');
		return;
	}

	// 2. 檢查 Node.js (新增邏輯)
	const nodeDetectionService = new NodeDetectionService();
	const nodeResult = await nodeDetectionService.detectNodeJs();

	if (!nodeResult.available || !nodeResult.versionCompatible) {
		log('Node.js not available or incompatible', 'warn');
		await showNodeJsWarning(nodeResult); // 顯示友善警告
		return; // 優雅降級：不註冊 MCP Provider
	}

	// 3. 註冊 MCP Provider (現有邏輯)
	const disposable = registerMcpProvider(context);
	if (disposable) {
		context.subscriptions.push(disposable);
		log('MCP Provider registered successfully', 'info');
	}
}
```

**向後相容性保證**:

- ✅ 有 Node.js 的使用者: 檢測通過 → 行為與現在一致
- ✅ 無 Node.js 的使用者: 顯示友善警告 → Extension 其他功能正常運作
- ✅ VSCode < 1.105.0 的使用者: MCP API 檢查失敗 → 靜默跳過(現有行為)

---

### 5. 路徑驗證策略

**研究目標**: 設計能區分「檔案不存在」、「不是 Node.js」、「權限不足」的驗證邏輯

**研究方法**: 研究專案現有檔案檢測模式 (`FileService`, `projectTypeDetector`, `arduinoUploader`)

**研究結果** ✅

**Decision (決定)**: 分階段驗證策略,結合 `fs.existsSync()` 與 `child_process.exec()` 執行測試

**Rationale (選擇理由)**:

1. **專案一致性**: 遵循現有 `FileService` 與 `arduinoUploader.ts` 的檔案檢測模式
2. **明確錯誤類型**: 分階段檢查可提供清晰的錯誤訊息給使用者
3. **跨平台相容**: 使用 Node.js fs API,自動處理 Windows/Linux/macOS 路徑差異
4. **實用主義**: 區分「檔案不存在」vs「不是 Node.js」已足夠,權限錯誤歸類為「執行失敗」

**Alternatives Considered (評估過的其他方案)**:

- **僅使用 `fs.access()` 檢查權限**: 無法區分「不是可執行檔」vs「沒有執行權限」
- **複雜的權限檢測 (`fs.stat()` + mode bits)**: 跨平台行為不一致(Windows vs Unix),過度工程

**Implementation Notes (實作注意事項)**:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PathValidationResult {
	valid: boolean;
	error?: string;
	errorType?: 'not_found' | 'not_executable' | 'permission' | 'unknown';
}

async function validateNodePath(nodePath: string): Promise<PathValidationResult> {
	// 階段 1: 檢查檔案是否存在(僅當路徑不是預設 'node' 時)
	if (nodePath !== 'node' && !path.isAbsolute(nodePath)) {
		return {
			valid: false,
			error: '路徑必須是絕對路徑',
			errorType: 'not_found',
		};
	}

	if (nodePath !== 'node' && !fs.existsSync(nodePath)) {
		return {
			valid: false,
			error: '指定的檔案不存在',
			errorType: 'not_found',
		};
	}

	// 階段 2: 嘗試執行 --version 來驗證是否為 Node.js
	try {
		const { stdout } = await execAsync(`"${nodePath}" --version`, { timeout: 3000 });

		// 階段 3: 驗證輸出格式是否為 Node.js 版本
		if (!/^v\d+\.\d+\.\d+/.test(stdout.trim())) {
			return {
				valid: false,
				error: '指定的檔案不是有效的 Node.js 可執行檔',
				errorType: 'not_executable',
			};
		}

		return { valid: true };
	} catch (error: any) {
		// 根據錯誤碼區分錯誤類型
		if (error.code === 'ENOENT') {
			return {
				valid: false,
				error: 'Node.js 未安裝或不在 PATH 中',
				errorType: 'not_found',
			};
		}

		if (error.code === 'EACCES' || error.code === 'EPERM') {
			return {
				valid: false,
				error: '沒有執行權限',
				errorType: 'permission',
			};
		}

		return {
			valid: false,
			error: `執行失敗: ${error.message}`,
			errorType: 'unknown',
		};
	}
}
```

**專案現存模式參考**:

- `src/services/fileService.ts` - 使用 `fs.existsSync()` 檢查檔案存在
- `src/mcp/mcpProvider.ts` - `checkMcpServerExists()` 函數範例
- `src/services/arduinoUploader.ts` - `checkPioInstalled()` 使用 `exec()` 驗證 CLI 工具

---

## 研究總結

所有 5 個研究項目已完成,技術決策明確且符合專案現有架構與憲法原則。主要決策摘要:

| 項目         | 決定方案                   | 關鍵考量                       |
| ------------ | -------------------------- | ------------------------------ |
| Node.js 檢測 | `child_process.exec()`     | 非阻塞、簡潔、符合專案慣例     |
| 版本比較     | 自行實作正規表示式解析     | 零依賴、需求簡單、易測試       |
| 設定監聽     | `onDidChangeConfiguration` | 即時反饋、官方 API、效能可控   |
| MCP 註冊     | 條件式註冊 + 前置檢查      | 向後相容、錯誤隔離、職責清晰   |
| 路徑驗證     | 分階段驗證 + 明確錯誤類型  | 跨平台、使用者友善、專案一致性 |

**下一步驟**: Phase 1 - 設計資料模型與 API contracts
