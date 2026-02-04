# VSCode Settings Contract: MCP 設定項

**Feature**: MCP Server 優雅降級與 Node.js 依賴處理  
**File**: contracts/vscode-settings.md  
**Date**: 2026-02-04

## 概述

本文件定義新增的 VSCode 設定項契約,包含設定項的 `package.json` 定義、預設值、驗證規則與使用者介面描述。

---

## 設定項定義

### 1. `singularBlockly.mcp.nodePath`

**用途**: 指定 Node.js 可執行檔的完整路徑,用於啟動 MCP Server。

**package.json 定義**:

```json
{
	"singularBlockly.mcp.nodePath": {
		"type": "string",
		"default": "node",
		"markdownDescription": "Node.js 可執行檔路徑。留空以使用系統 PATH 的 `node` 命令。\n\n範例: `C:\\Program Files\\nodejs\\node.exe`\n\n**使用場景**:\n- 使用 nvm 或 fnm 管理多版本 Node.js\n- Node.js 不在系統 PATH 中\n- 需要使用特定版本的 Node.js",
		"markdownDeprecationMessage": null,
		"scope": "machine-overridable"
	}
}
```

**多語言支援** (15 種語言):

| 語言               | 設定鍵路徑                 | 描述文字鍵                        |
| ------------------ | -------------------------- | --------------------------------- |
| 繁體中文 (zh-hant) | `package.nls.zh-hant.json` | `config.mcp.nodePath.description` |
| 英文 (en)          | `package.nls.json`         | `config.mcp.nodePath.description` |
| 日文 (ja)          | `package.nls.ja.json`      | `config.mcp.nodePath.description` |
| [其他 12 種語言]   | ...                        | ...                               |

**繁體中文描述範例**:

```json
{
	"config.mcp.nodePath.description": "Node.js 可執行檔路徑。留空以使用系統 PATH 的 'node' 命令。範例：C:\\Program Files\\nodejs\\node.exe"
}
```

**預設值**: `"node"` (使用系統 PATH 的 `node` 命令)

**驗證規則**:

- **空字串或 `"node"`**: 視為預設值,使用系統 PATH
- **非絕對路徑**: 顯示警告「路徑必須是絕對路徑」
- **檔案不存在**: 顯示警告「指定的檔案不存在」
- **不是 Node.js**: 執行 `--version` 測試,失敗則顯示「不是有效的 Node.js 可執行檔」
- **權限不足**: 顯示警告「沒有執行權限」

**使用者介面**:

- **設定頁面位置**: `Extensions` → `Singular Blockly` → `Mcp` → `Node Path`
- **輸入方式**: 文字輸入框
- **Placeholder**: `node (預設使用系統 PATH)`
- **Hover 提示**: 與 `markdownDescription` 一致

**即時驗證**:

- 使用者儲存設定後,Extension 透過 `vscode.workspace.onDidChangeConfiguration` 監聽器立即驗證
- 驗證失敗顯示警告訊息,但不阻擋使用者儲存設定
- 新設定在下次 Extension 啟動時生效

---

### 2. `singularBlockly.mcp.showStartupWarning`

**用途**: 控制是否在 Extension 啟動時顯示 Node.js 缺失警告訊息。

**package.json 定義**:

```json
{
	"singularBlockly.mcp.showStartupWarning": {
		"type": "boolean",
		"default": true,
		"markdownDescription": "當 Node.js 不可用時,是否在 Extension 啟動時顯示警告訊息。\n\n設為 `false` 可停用警告(適用於不需要使用 MCP 功能的使用者)。",
		"scope": "machine-overridable"
	}
}
```

**多語言支援** (15 種語言):

| 語言               | 設定鍵路徑                 | 描述文字鍵                                  |
| ------------------ | -------------------------- | ------------------------------------------- |
| 繁體中文 (zh-hant) | `package.nls.zh-hant.json` | `config.mcp.showStartupWarning.description` |
| 英文 (en)          | `package.nls.json`         | `config.mcp.showStartupWarning.description` |
| 日文 (ja)          | `package.nls.ja.json`      | `config.mcp.showStartupWarning.description` |
| [其他 12 種語言]   | ...                        | ...                                         |

**繁體中文描述範例**:

```json
{
	"config.mcp.showStartupWarning.description": "當 Node.js 不可用時,是否在 Extension 啟動時顯示警告訊息。設為 false 可停用警告。"
}
```

**預設值**: `true` (顯示警告)

**行為定義**:

- `true`: Extension 啟動時,若檢測到 Node.js 不可用或版本過低,顯示警告訊息框
- `false`: Extension 啟動時,即使 Node.js 不可用,也不顯示警告訊息

**自動更新時機**:

- 使用者在警告訊息框中點擊「稍後提醒」按鈕
- Extension 自動設定 `showStartupWarning: false`
- 使用 `vscode.workspace.getConfiguration('singularBlockly.mcp').update('showStartupWarning', false, vscode.ConfigurationTarget.Global)`

**使用者介面**:

- **設定頁面位置**: `Extensions` → `Singular Blockly` → `Mcp` → `Show Startup Warning`
- **輸入方式**: 核取方塊 (Checkbox)
- **Hover 提示**: 與 `markdownDescription` 一致

---

## 設定範圍 (Scope)

兩個設定項都使用 `machine-overridable` 範圍:

- **`machine`**: 針對當前電腦,不隨 Settings Sync 同步到其他裝置
- **`overridable`**: 可在使用者、工作區、資料夾層級覆寫

**理由**:

- `nodePath` 是電腦特定的路徑,不應同步到其他裝置 (如 Windows vs Linux 路徑不同)
- `showStartupWarning` 是使用者偏好,但也不應同步 (不同電腦可能有不同的 Node.js 安裝狀態)

---

## 讀取設定的程式碼範例

```typescript
import * as vscode from 'vscode';

/**
 * 讀取 MCP 設定
 */
function getMcpSettings(): { nodePath: string; showStartupWarning: boolean } {
	const config = vscode.workspace.getConfiguration('singularBlockly.mcp');

	const nodePath = config.get<string>('nodePath', 'node');
	const showStartupWarning = config.get<boolean>('showStartupWarning', true);

	return { nodePath, showStartupWarning };
}
```

---

## 設定變更監聽範例

```typescript
import * as vscode from 'vscode';

/**
 * 監聽 MCP 設定變更
 */
function setupConfigurationListener(context: vscode.ExtensionContext): void {
	const disposable = vscode.workspace.onDidChangeConfiguration(async event => {
		// 僅處理 MCP 設定變更
		if (!event.affectsConfiguration('singularBlockly.mcp')) {
			return;
		}

		// 檢查具體是哪個設定變更了
		if (event.affectsConfiguration('singularBlockly.mcp.nodePath')) {
			const { nodePath } = getMcpSettings();
			log(`nodePath changed to: ${nodePath}`, 'info');

			// 立即驗證新路徑
			const validation = await validateNodePath(nodePath);
			if (!validation.valid) {
				vscode.window.showWarningMessage(`指定的 Node.js 路徑無效: ${nodePath}。${validation.error}`);
			}
		}

		if (event.affectsConfiguration('singularBlockly.mcp.showStartupWarning')) {
			const { showStartupWarning } = getMcpSettings();
			log(`showStartupWarning changed to: ${showStartupWarning}`, 'info');
			// 此設定變更不需即時動作,下次啟動時生效
		}
	});

	context.subscriptions.push(disposable);
}
```

---

## 國際化鍵定義

### 需要新增的翻譯鍵 (package.nls.\*.json)

```json
{
	"config.mcp.nodePath.description": "Node.js executable path. Leave empty to use 'node' from system PATH. Example: C:\\Program Files\\nodejs\\node.exe",
	"config.mcp.showStartupWarning.description": "Whether to show a warning message when Node.js is unavailable. Set to false to suppress the warning."
}
```

**15 種語言完整翻譯列表**:

- `en`, `zh-hant`, `ja`, `ko`, `es`, `pt-br`, `fr`, `de`, `it`, `ru`, `pl`, `hu`, `tr`, `bg`, `cs`

**驗證方式**: 執行 `npm run validate:i18n` 確保所有 15 種語言都有對應翻譯鍵

---

## 測試場景

### `nodePath` 設定測試

1. **預設值**: 不設定 → 使用 `"node"`
2. **自訂路徑 (有效)**: 設定為 `C:\Program Files\nodejs\node.exe` → 驗證通過,無警告
3. **自訂路徑 (無效)**: 設定為 `C:\invalid\node.exe` → 顯示「檔案不存在」警告
4. **相對路徑**: 設定為 `./node` → 顯示「路徑必須是絕對路徑」警告
5. **非 Node.js 檔案**: 設定為 `C:\Windows\System32\cmd.exe` → 顯示「不是有效的 Node.js」警告

### `showStartupWarning` 設定測試

1. **預設值**: 不設定 → 啟動時顯示警告 (假設 Node.js 不可用)
2. **設為 true**: 明確設定為 `true` → 啟動時顯示警告
3. **設為 false**: 設定為 `false` → 啟動時不顯示警告
4. **點擊「稍後提醒」**: 自動設定為 `false` → 驗證設定已更新

---

## 向後相容性

### 新增設定項不影響現有使用者

- **安裝前的使用者**: 升級後,設定項使用預設值,行為與舊版本一致 (使用系統 PATH 的 `node`)
- **自訂設定的使用者**: 可繼續使用現有設定,新設定項不影響現有功能
- **Settings Sync 使用者**: 由於使用 `machine-overridable` 範圍,設定不會同步到其他裝置,避免路徑衝突

### 設定項棄用策略

若未來需要棄用或重命名設定項:

1. 使用 `markdownDeprecationMessage` 標記棄用資訊
2. 提供遷移指引
3. 保留舊設定項至少 2 個主要版本 (如 v0.60.0 → v0.62.0)

---

## 參考資料

- [VSCode Settings API 文件](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)
- [VSCode Configuration Scope 說明](https://code.visualstudio.com/api/working-with-extensions/settings-sync#user-data-to-synchronize)
- 專案現有設定: `singular-blockly.theme`, `singular-blockly.language`, `singular-blockly.autoBackupInterval`
