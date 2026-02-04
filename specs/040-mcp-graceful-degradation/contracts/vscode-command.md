# VSCode Command Contract: 檢查 MCP 狀態命令

**Feature**: MCP Server 優雅降級與 Node.js 依賴處理  
**File**: contracts/vscode-command.md  
**Date**: 2026-02-04

## 概述

本文件定義新增的 VSCode 命令契約:「Singular Blockly: Check MCP Status」,包含命令 ID、觸發方式、執行邏輯與使用者介面設計。

---

## 命令定義

### Command: `singular-blockly.checkMcpStatus`

**顯示名稱**: `Singular Blockly: Check MCP Status`

**用途**: 檢查 MCP Server 的運作狀態並生成詳細的診斷報告,協助使用者與技術支援人員排查問題。

**觸發方式**:

1. **命令面板**: `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) → 搜尋 "MCP Status"
2. **程式碼觸發**: `vscode.commands.executeCommand('singular-blockly.checkMcpStatus')`

**執行時機**:

- 使用者需要診斷 MCP 功能無法正常運作的原因
- 技術支援人員要求提供診斷報告
- 開發者驗證 MCP 環境配置

---

## package.json 定義

```json
{
	"contributes": {
		"commands": [
			{
				"command": "singular-blockly.checkMcpStatus",
				"title": "%command.checkMcpStatus.title%",
				"category": "Singular Blockly"
			}
		]
	}
}
```

**國際化鍵** (`package.nls.*.json`):

```json
{
	"command.checkMcpStatus.title": "Check MCP Status"
}
```

**15 種語言翻譯範例**:

| 語言    | 翻譯                    |
| ------- | ----------------------- |
| zh-hant | 檢查 MCP 狀態           |
| en      | Check MCP Status        |
| ja      | MCP ステータスを確認    |
| ko      | MCP 상태 확인           |
| es      | Comprobar estado de MCP |
| pt-br   | Verificar status do MCP |
| fr      | Vérifier l'état MCP     |
| de      | MCP-Status prüfen       |
| it      | Verifica stato MCP      |
| ru      | Проверить состояние MCP |
| pl      | Sprawdź status MCP      |
| hu      | MCP állapot ellenőrzése |
| tr      | MCP durumunu kontrol et |
| bg      | Проверка на MCP статус  |
| cs      | Zkontrolovat stav MCP   |

---

## 命令執行邏輯

### 1. 註冊命令

```typescript
// src/extension.ts
function registerCommands(context: vscode.ExtensionContext, localeService: LocaleService) {
	// ... 現有命令 ...

	// 註冊診斷命令
	const checkMcpStatusCommand = vscode.commands.registerCommand('singular-blockly.checkMcpStatus', async () => {
		try {
			await handleCheckMcpStatus(context, localeService);
		} catch (error) {
			log('Error executing checkMcpStatus command:', 'error', error);
			const errorMsg = await localeService.getLocalizedMessage('ERROR_COMMAND_FAILED', 'Command failed: {0}', String(error));
			vscode.window.showErrorMessage(errorMsg);
		}
	});

	context.subscriptions.push(checkMcpStatusCommand);
}
```

### 2. 命令處理函數

```typescript
// src/extension.ts 或獨立的 commands/checkMcpStatus.ts
async function handleCheckMcpStatus(context: vscode.ExtensionContext, localeService: LocaleService): Promise<void> {
	// 顯示進度指示器
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: await localeService.getLocalizedMessage('PROGRESS_CHECKING_MCP', 'Checking MCP status...'),
			cancellable: false,
		},
		async () => {
			// 1. 收集診斷資訊
			const diagnosticService = new DiagnosticService(localeService);
			const report = await diagnosticService.collectDiagnostics(context.extensionPath);

			// 2. 格式化報告
			const formattedReport = diagnosticService.formatReport(report, {
				format: 'text',
				useEmoji: true,
				includeTimestamp: true,
			});

			// 3. 顯示診斷報告 (使用訊息框)
			const copyButtonText = await localeService.getLocalizedMessage('BUTTON_COPY_DIAGNOSTICS', '複製診斷資訊');

			const action = await vscode.window.showInformationMessage(
				formattedReport,
				{ modal: false }, // 非模態,允許使用者繼續操作
				copyButtonText
			);

			// 4. 處理使用者動作
			if (action === copyButtonText) {
				const copied = await diagnosticService.copyToClipboard(report);
				if (copied) {
					const successMsg = await localeService.getLocalizedMessage('INFO_COPIED_TO_CLIPBOARD', '已複製到剪貼簿');

					vscode.window.showInformationMessage(successMsg);
				}
			}
		}
	);
}
```

---

## 診斷報告格式

### 文字格式 (預設)

```text
【MCP Server 診斷報告】

✅ Node.js 版本: v22.16.0
✅ MCP Server Bundle: 存在
✅ VSCode API 版本: 1.105.0
📁 工作區路徑: E:\my-project
⚙️ Node.js 路徑: node (系統 PATH)

狀態：MCP Server 可正常運作

⏰ 生成時間: 2026-02-04 14:30:25
```

### 文字格式 (Node.js 不可用範例)

```text
【MCP Server 診斷報告】

❌ Node.js: 未安裝或不在 PATH 中
✅ MCP Server Bundle: 存在
✅ VSCode API 版本: 1.105.0
📁 工作區路徑: E:\my-project
⚙️ Node.js 路徑: node (系統 PATH)

狀態：MCP Server 無法啟動

建議：
• 安裝 Node.js 22.16.0 或更新版本
• 若已安裝,請在設定中指定 Node.js 路徑

⏰ 生成時間: 2026-02-04 14:30:25
```

### JSON 格式 (用於 API 呼叫或自動化)

```json
{
	"nodeDetection": {
		"available": false,
		"version": null,
		"versionCompatible": false,
		"nodePath": "node",
		"errorMessage": "Node.js 未安裝或不在 PATH 中",
		"errorType": "not_found"
	},
	"mcpServerBundleExists": true,
	"mcpServerBundlePath": "E:\\singular-blockly\\dist\\mcp-server.js",
	"vscodeApiSupported": true,
	"vscodeVersion": "1.105.0",
	"workspacePath": "E:\\my-project",
	"overallStatus": "unavailable",
	"recommendations": ["安裝 Node.js 22.16.0 或更新版本", "若已安裝,請在設定中指定 Node.js 路徑"],
	"timestamp": "2026-02-04T14:30:25.123Z"
}
```

---

## 使用者介面設計

### 1. 命令面板中的顯示

```
> Singular Blockly: Check MCP Status
```

**圖示**: 無 (VSCode 命令面板預設不顯示圖示)

**分類**: `Singular Blockly` (與其他命令一致)

### 2. 診斷報告訊息框

**類型**: `vscode.window.showInformationMessage()` (資訊訊息框)

**特性**:

- 非模態 (modal: false),允許使用者繼續操作
- 可滾動,支援長文字內容
- 包含「複製診斷資訊」按鈕

**位置**: VSCode 視窗右下角 (預設 notification 位置)

### 3. 進度指示器

**類型**: `vscode.ProgressLocation.Notification` (通知區域進度條)

**顯示文字**: "Checking MCP status..." (本地化)

**持續時間**: 通常 < 1 秒 (Node.js 檢測 + 檔案檢查)

---

## 國際化訊息鍵

### 需要新增的翻譯鍵 (media/locales/\*/messages.js)

```javascript
{
    // 命令相關
    PROGRESS_CHECKING_MCP: 'Checking MCP status...',
    BUTTON_COPY_DIAGNOSTICS: 'Copy Diagnostic Information',
    INFO_COPIED_TO_CLIPBOARD: 'Copied to clipboard',
    ERROR_COMMAND_FAILED: 'Command failed: {0}',

    // 診斷報告標題
    DIAG_REPORT_TITLE: '【MCP Server 診斷報告】',

    // 診斷項目標籤
    DIAG_NODE_VERSION: 'Node.js Version',
    DIAG_NODE_NOT_AVAILABLE: 'Node.js: Not available or not in PATH',
    DIAG_MCP_BUNDLE: 'MCP Server Bundle',
    DIAG_MCP_BUNDLE_EXISTS: 'Exists',
    DIAG_MCP_BUNDLE_MISSING: 'File not found',
    DIAG_VSCODE_API: 'VSCode API Version',
    DIAG_WORKSPACE_PATH: 'Workspace Path',
    DIAG_NODE_PATH: 'Node.js Path',
    DIAG_NODE_PATH_SYSTEM: 'node (System PATH)',

    // 狀態標籤
    DIAG_STATUS: 'Status',
    DIAG_STATUS_OPERATIONAL: 'MCP Server is operational',
    DIAG_STATUS_UNAVAILABLE: 'MCP Server cannot start',

    // 建議標籤
    DIAG_RECOMMENDATIONS: 'Recommendations',
    DIAG_RECOMMEND_INSTALL_NODE: 'Install Node.js 22.16.0 or newer',
    DIAG_RECOMMEND_SPECIFY_PATH: 'If already installed, specify Node.js path in settings',
    DIAG_RECOMMEND_COMPILE: 'Run `npm run compile` or reinstall Extension',
    DIAG_RECOMMEND_UPGRADE_VSCODE: 'Upgrade VSCode to 1.105.0 or newer',
    DIAG_RECOMMEND_OPEN_WORKSPACE: 'Open a project folder',

    // 時間戳
    DIAG_TIMESTAMP: 'Generated at',
}
```

**驗證方式**: 執行 `npm run validate:i18n` 確保所有 15 種語言都有對應翻譯鍵

---

## 診斷資訊的可複製性

### 純文字格式 (剪貼簿內容)

使用者點擊「複製診斷資訊」後,以下純文字格式被複製到剪貼簿:

```text
MCP Server 診斷報告
==================
生成時間: 2026-02-04 14:30:25

Node.js 狀態:
  - 可用: 否
  - 錯誤: Node.js 未安裝或不在 PATH 中
  - 路徑: node (系統 PATH)

MCP Server Bundle:
  - 存在: 是
  - 路徑: E:\singular-blockly\dist\mcp-server.js

VSCode API:
  - 支援: 是
  - 版本: 1.105.0

工作區:
  - 路徑: E:\my-project

綜合狀態: 無法啟動

建議:
  1. 安裝 Node.js 22.16.0 或更新版本
  2. 若已安裝,請在設定中指定 Node.js 路徑
```

**使用場景**:

- 使用者在 GitHub Issue 中回報問題時附上診斷資訊
- 技術支援人員分析問題原因
- 開發者除錯 Extension 配置問題

---

## 錯誤處理

### 命令執行失敗的處理

**可能的錯誤場景**:

1. **DiagnosticService 初始化失敗**: 顯示「無法初始化診斷服務」錯誤訊息
2. **檔案系統存取失敗**: 顯示「無法存取檔案系統」錯誤訊息
3. **剪貼簿存取失敗**: 顯示「無法複製到剪貼簿」錯誤訊息

**錯誤訊息格式**:

```
Command failed: [錯誤詳情]
```

**日誌記錄**:

- 所有錯誤都記錄到 Output Channel (`log('...', 'error')`)
- 使用者可透過「顯示輸出」查看詳細日誌

---

## 測試場景

### 功能測試

1. **正常執行**: 開啟專案 → 執行命令 → 看到完整診斷報告
2. **無工作區**: 未開啟專案 → 執行命令 → 診斷報告顯示「工作區路徑: 無」
3. **Node.js 不可用**: 移除 Node.js → 執行命令 → 報告顯示「❌ Node.js: 未安裝」
4. **複製到剪貼簿**: 執行命令 → 點擊「複製」 → 驗證剪貼簿內容
5. **多語言**: 切換 VSCode 語言 → 執行命令 → 驗證報告使用對應語言

### 效能測試

1. **執行時間**: 應在 3 秒內完成 (spec.md SC-004)
2. **並發執行**: 連續點擊命令 3 次 → 應正確處理並顯示 3 份報告

### 使用者體驗測試

1. **進度指示器**: 執行命令時應顯示 "Checking MCP status..." 進度條
2. **訊息框位置**: 診斷報告應顯示在視窗右下角,不遮擋編輯區
3. **可讀性**: 報告使用 emoji 圖示 (✅/❌/📁/⚙️) 提升可讀性

---

## 未來擴展

### v0.61.0+ 可能的增強功能

1. **匯出為檔案**: 允許使用者將診斷報告匯出為 `.txt` 或 `.json` 檔案
2. **自動修復**: 檢測到問題時,提供「自動修復」按鈕 (如自動安裝 Node.js)
3. **歷史記錄**: 保存最近 10 次診斷報告,允許使用者查看歷史
4. **進階模式**: 提供更詳細的診斷資訊 (如 npm 版本、環境變數、系統資訊)
5. **分享連結**: 生成可分享的診斷報告連結 (匿名化工作區路徑)

---

## 參考資料

- [VSCode Commands API 文件](https://code.visualstudio.com/api/references/vscode-api#commands)
- [VSCode Progress UI 文件](https://code.visualstudio.com/api/references/vscode-api#Progress)
- [VSCode Clipboard API 文件](https://code.visualstudio.com/api/references/vscode-api#env.clipboard)
- 專案現有命令: `singular-blockly.openBlocklyEdit`, `singular-blockly.toggleTheme`, `singular-blockly.showOutput`
