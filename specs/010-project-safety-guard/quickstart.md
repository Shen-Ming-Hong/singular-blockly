# Quickstart Guide: 專案安全防護機制

**Feature**: 010-project-safety-guard  
**Target Audience**: 開發者、貢獻者、測試人員

## 概述

本功能在使用者於非 Blockly 專案中觸發「開啟 Blockly 編輯器」命令時,會顯示警告對話框,防止誤觸破壞其他專案的檔案結構。

**核心流程**:

```
使用者觸發命令 → 檢查是否為 Blockly 專案
  ├─ 是 → 直接開啟編輯器
  └─ 否 → 檢查偏好設定
      ├─ 已抑制警告 → 直接開啟編輯器
      └─ 未抑制警告 → 偵測專案類型 → 顯示警告對話框
          ├─ 「繼續」 → 開啟編輯器
          ├─ 「取消」 → 中止操作
          └─ 「不再提醒」 → 儲存偏好 + 開啟編輯器
```

---

## 前置需求

### 必備工具

-   **Node.js**: 22.16.0 或更高版本
-   **npm**: 隨 Node.js 安裝
-   **VS Code**: 1.96.0 或更高版本
-   **Git**: 用於版本控制

### 環境設定

1. **Clone 專案**:

    ```powershell
    git clone <repository-url>
    cd singular-blockly
    ```

2. **安裝依賴**:

    ```powershell
    npm install
    ```

3. **啟動監看模式**(開發時使用):

    ```powershell
    npm run watch
    ```

4. **編譯專案**(測試前使用):
    ```powershell
    npm run compile
    ```

---

## 開發工作流程

### 1. 建立開發分支

```powershell
git checkout -b feature/010-project-safety-guard
```

### 2. 理解核心檔案

**必讀檔案**(按順序):

1. `specs/010-project-safety-guard/spec.md` - 功能規格與需求
2. `specs/010-project-safety-guard/data-model.md` - 資料實體與狀態流轉
3. `src/types/safetyGuard.ts` - TypeScript 介面定義與契約
4. `src/webview/webviewManager.ts` (整合點約在 lines 150-172) - 現有工作區檢查邏輯
5. `src/services/settingsManager.ts` - 現有設定管理服務

**架構重點**:

-   新增服務: `WorkspaceValidator`, `ProjectTypeDetector`
-   修改入口: `extension.ts` (命令處理器)
-   整合點: `webviewManager.ts` (`createWebviewPanel` 方法)
-   設定檔: `package.json` (新增設定項目)

### 3. 實作步驟(P1 核心功能)

#### Step 1: 定義常數與類型

在 `src/types/` 新增 `safetyGuard.ts`:

```typescript
// 定義核心介面與契約
export interface WorkspaceValidationResult { ... }
export type SafetyGuardDialogResult = 'continue' | 'cancel' | 'suppress';
export const PROJECT_TYPE_RULES = [ ... ];
export const MESSAGE_KEYS = { ... };
```

#### Step 2: 實作 ProjectTypeDetector(純函數)

在 `src/services/projectTypeDetector.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { ProjectTypeRule } from '../types/safetyGuard';

export function detectProjectType(workspacePath: string, rules: readonly ProjectTypeRule[]): string | undefined {
	// 按 priority 排序
	const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

	for (const rule of sortedRules) {
		for (const file of rule.files) {
			const fullPath = path.join(workspacePath, file);

			// 支援萬用字元檢查
			if (file.includes('*')) {
				// 使用 glob 或簡單的檔案列舉
				// ...實作萬用字元邏輯
			} else {
				if (fs.existsSync(fullPath)) {
					return rule.type;
				}
			}
		}
	}

	return undefined;
}
```

**測試檔案**: `src/test/services/projectTypeDetector.test.ts`

```typescript
import * as assert from 'assert';
import { detectProjectType } from '../../services/projectTypeDetector';

suite('ProjectTypeDetector', () => {
	test('應偵測 Node.js 專案', () => {
		// 建立測試資料夾,包含 package.json
		// 呼叫 detectProjectType,驗證返回 'Node.js'
	});

	test('應返回 undefined 當無法識別專案類型', () => {
		// 建立空資料夾
		// 呼叫 detectProjectType,驗證返回 undefined
	});
});
```

#### Step 3: 實作 WorkspaceValidator 服務

在 `src/services/workspaceValidator.ts`:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { detectProjectType } from './projectTypeDetector';
import { PROJECT_TYPE_RULES, BLOCKLY_FOLDER_NAME } from '../types/safetyGuard';
import { log } from './logging';

export class WorkspaceValidator {
	async validateWorkspace(workspacePath: string): Promise<WorkspaceValidationResult> {
		// 1. 檢查 blockly/ 資料夾
		const blocklyPath = path.join(workspacePath, BLOCKLY_FOLDER_NAME);
		const isBlocklyProject = fs.existsSync(blocklyPath);

		if (isBlocklyProject) {
			return {
				isBlocklyProject: true,
				shouldShowWarning: false,
				suppressWarning: false,
				workspacePath,
			};
		}

		// 2. 讀取使用者偏好設定
		const suppressWarning = await this.getUserPreference(workspacePath);

		if (suppressWarning) {
			return {
				isBlocklyProject: false,
				shouldShowWarning: false,
				suppressWarning: true,
				workspacePath,
			};
		}

		// 3. 偵測專案類型
		const projectType = detectProjectType(workspacePath, PROJECT_TYPE_RULES);

		return {
			isBlocklyProject: false,
			projectType,
			shouldShowWarning: true,
			suppressWarning: false,
			workspacePath,
		};
	}

	async getUserPreference(workspacePath: string): Promise<boolean> {
		try {
			const config = vscode.workspace.getConfiguration('singularBlockly.safetyGuard');
			return config.get<boolean>('suppressWarning', false);
		} catch (error) {
			log.error('讀取偏好設定失敗', { error });
			return false; // 預設值
		}
	}

	async saveUserPreference(workspacePath: string, suppress: boolean): Promise<boolean> {
		try {
			const config = vscode.workspace.getConfiguration('singularBlockly.safetyGuard');
			await config.update('suppressWarning', suppress, vscode.ConfigurationTarget.Workspace);
			log.info('儲存偏好設定成功', { suppress });
			return true;
		} catch (error) {
			log.error('儲存偏好設定失敗', { error });
			return false;
		}
	}

	async showSafetyWarning(projectType?: string): Promise<SafetyGuardDialogResult> {
		// 使用 LocaleService 取得翻譯訊息
		const message = projectType ? `偵測到 ${projectType} 專案。這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?` : '這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?';

		const result = await vscode.window.showWarningMessage(message, { modal: true }, '繼續', '取消', '不再提醒');

		if (result === '繼續') return 'continue';
		if (result === '不再提醒') return 'suppress';
		return 'cancel';
	}
}
```

#### Step 4: 整合至命令處理器

修改 `src/webview/webviewManager.ts` 的 `createWebviewPanel` 方法:

```typescript
public async createWebviewPanel(context: vscode.ExtensionContext): Promise<void> {
  // ... 現有程式碼 ...

  // 現有工作區檢查(lines 67-77)
  if (!workspaceFolders) {
    vscode.window.showErrorMessage(/* ... */);
    return;
  }

  // ========== 新增:專案安全防護 ==========
  const validator = new WorkspaceValidator();
  const validationResult = await validator.validateWorkspace(workspacePath);

  if (validationResult.shouldShowWarning) {
    const choice = await validator.showSafetyWarning(validationResult.projectType);

    if (choice === 'cancel') {
      log.info('使用者取消開啟 Blockly 編輯器');
      return; // 中止操作
    }

    if (choice === 'suppress') {
      await validator.saveUserPreference(workspacePath, true);
    }
  }
  // ========== 專案安全防護結束 ==========

  // 繼續原有流程(PlatformIO 設定、建立 WebView 等)
  // ...
}
```

#### Step 5: 更新 package.json

新增設定項目:

```json
{
	"contributes": {
		"configuration": {
			"title": "Singular Blockly",
			"properties": {
				"singularBlockly.safetyGuard.suppressWarning": {
					"type": "boolean",
					"default": false,
					"description": "不再顯示非 Blockly 專案的安全警告"
				}
			}
		}
	}
}
```

#### Step 6: 新增翻譯訊息

在 `media/locales/zh-hant/messages.js` 新增:

```javascript
'SAFETY_WARNING_BODY_NO_TYPE': '這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?',
'SAFETY_WARNING_BODY_WITH_TYPE': '偵測到 {0} 專案。這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?',
'BUTTON_CONTINUE': '繼續',
'BUTTON_CANCEL': '取消',
'BUTTON_SUPPRESS': '不再提醒',
```

(其他語系檔案同步新增)

---

## 測試流程

### 1. 單元測試

**執行所有測試**:

```powershell
npm test
```

**執行特定測試檔案**:

```powershell
npm test -- --grep "WorkspaceValidator"
```

**測試覆蓋率目標**: 100%(所有新增程式碼)

### 2. 手動測試情境

#### 情境 A: Blockly 專案(已有 blockly/ 資料夾)

1. 開啟已有 `blockly/` 資料夾的專案
2. 執行「開啟 Blockly 編輯器」命令
3. **預期**: 直接開啟編輯器,無警告

#### 情境 B: 非 Blockly 專案 + 首次觸發

1. 開啟 Node.js 專案(有 `package.json`,無 `blockly/`)
2. 執行「開啟 Blockly 編輯器」命令
3. **預期**: 顯示警告「偵測到 Node.js 專案...」
4. 點擊「繼續」
5. **預期**: 編輯器開啟,`blockly/` 資料夾建立

#### 情境 C: 非 Blockly 專案 + 點擊「不再提醒」

1. 開啟 Python 專案(有 `requirements.txt`,無 `blockly/`)
2. 執行命令,點擊「不再提醒」
3. **預期**: 編輯器開啟,`.vscode/settings.json` 中新增 `singularBlockly.safetyGuard.suppressWarning: true`
4. 關閉編輯器後再次執行命令
5. **預期**: 直接開啟,無警告

#### 情境 D: 無法識別專案類型

1. 開啟空白資料夾或未知類型專案
2. 執行命令
3. **預期**: 顯示警告(不包含專案類型名稱)

#### 情境 E: 多根工作區

1. 開啟 Multi-root Workspace,第一個資料夾為 Node.js 專案
2. 執行命令
3. **預期**: 僅檢查第一個資料夾,顯示對應警告

### 3. 效能測試

**測量指標**:

-   檢查 blockly/ 資料夾時間: <10ms
-   偵測專案類型時間: <50ms
-   顯示對話框時間: <100ms

**測試方法**:

```typescript
const start = Date.now();
const result = await validator.validateWorkspace(path);
const duration = Date.now() - start;
console.log(`驗證耗時: ${duration}ms`);
```

---

## 除錯技巧

### 1. 啟用詳細日誌

在 Extension Development Host 中:

1. 開啟 Output 面板(View → Output)
2. 選擇 "Singular Blockly" 頻道
3. 查看 `log.info/error` 輸出

### 2. 檢查設定檔

**查看工作區設定**:

```powershell
code .vscode/settings.json
```

**手動清除偏好設定**:
刪除 `.vscode/settings.json` 中的 `singularBlockly.safetyGuard.suppressWarning` 鍵

### 3. WebView 除錯

1. 右鍵點擊 WebView 面板
2. 選擇 "Open Developer Tools"
3. 查看 Console 日誌

### 4. 常見問題

**問題**: 警告對話框未顯示

-   **檢查**: `blockly/` 資料夾是否已存在
-   **檢查**: `.vscode/settings.json` 中 `suppressWarning` 是否為 `true`

**問題**: 專案類型偵測錯誤

-   **檢查**: `PROJECT_TYPE_RULES` 的 priority 順序
-   **檢查**: 檔案名稱是否正確(區分大小寫)

**問題**: 偏好設定未儲存

-   **檢查**: 工作區是否有寫入權限
-   **檢查**: VSCode 輸出面板的錯誤訊息

---

## 程式碼風格指南

### TypeScript 慣例

-   **命名**: 使用 camelCase(變數/函數),PascalCase(類別/介面)
-   **類型註解**: 明確標註返回型別
-   **錯誤處理**: 使用 try-catch,記錄至 log.error
-   **非同步**: 優先使用 async/await 而非 Promise.then

### 測試慣例

-   **命名**: `應該...當...` 格式(如 `應偵測 Node.js 專案`)
-   **結構**: Arrange-Act-Assert 模式
-   **Mock**: 使用 Sinon.js mock VSCode API

### 日誌慣例

```typescript
log.info('操作成功', { key: 'value' }); // 正常流程
log.warn('警告訊息', { context }); // 潛在問題
log.error('錯誤發生', { error }); // 錯誤狀況
log.debug('除錯資訊', { data }); // 開發除錯
```

---

## 效能檢查清單

開發完成後執行:

```powershell
# 1. 編譯時間
npm run compile
# 目標: ≤5 秒

# 2. 測試執行時間
npm test
# 目標: ≤5 秒(包含新測試,原基準 3 秒 + 54 新測試容許增量)

# 3. 打包大小
npm run compile
# 檢查 dist/extension.js 大小
# 目標: ≤155KB (原基準 137KB + 合理功能增量 15-20KB)
```

---

## 提交 Pull Request

### 準備工作

1. **執行完整測試**:

    ```powershell
    npm test
    ```

2. **執行 Lint 檢查**:

    ```powershell
    npm run lint
    ```

3. **更新文件**:
    - `CHANGELOG.md`: 新增版本變更說明
    - `README.md`: 必要時更新功能說明

### PR 描述範本

```markdown
## 功能描述

實作專案安全防護機制(#010-project-safety-guard),在非 Blockly 專案中開啟編輯器時顯示警告。

## 實作內容

-   ✅ 新增 WorkspaceValidator 服務
-   ✅ 新增 ProjectTypeDetector 純函數
-   ✅ 整合至 webviewManager.ts
-   ✅ 新增 package.json 設定項目
-   ✅ 完成多語系翻譯(15 語系)
-   ✅ 單元測試覆蓋率 100%

## 測試情境

-   ✅ Blockly 專案(直接開啟)
-   ✅ 非 Blockly 專案(顯示警告)
-   ✅ 「不再提醒」功能(偏好設定持久化)
-   ✅ 多根工作區支援
-   ✅ 無法識別專案類型處理

## 效能指標

-   驗證時間: <50ms
-   測試執行時間: 3s
-   打包大小: 135KB(符合基準)

## Screenshots

(附上警告對話框截圖)

Closes #<issue-number>
```

---

## 進階主題

### P2: 智慧偵測(未來擴展)

**擴展 ProjectTypeDetector**:

```typescript
// 支援子目錄遞迴搜尋
export function detectProjectTypeRecursive(workspacePath: string, rules: readonly ProjectTypeRule[], maxDepth: number = 2): string | undefined {
	// 實作遞迴搜尋邏輯
}
```

**新增專案類型**:

```typescript
{ type: 'Rust', files: ['Cargo.toml'], priority: 7 },
{ type: 'Ruby', files: ['Gemfile'], priority: 8 },
```

### 國際化擴展

**新增語系**:

1. 複製 `media/locales/en/messages.js` 至 `media/locales/<lang>/messages.js`
2. 翻譯所有訊息鍵
3. 更新 `src/services/localeService.ts` 的語系映射

---

## 參考資源

-   **VSCode Extension API**: [https://code.visualstudio.com/api](https://code.visualstudio.com/api)
-   **Specification**: `specs/010-project-safety-guard/spec.md`
-   **Data Model**: `specs/010-project-safety-guard/data-model.md`
-   **Type Definitions**: `src/types/safetyGuard.ts`
-   **Project Constitution**: `.github/copilot-instructions.md`

---

## 需要協助?

-   查看現有類似實作: `src/services/settingsManager.ts`, `src/services/fileService.ts`
-   參考測試範例: `src/test/services/settingsManager.test.ts`
-   查看 MCP 工具使用: `mcp_upstash_conte_get-library-docs` for VSCode API
-   檢視原有架構文件: `.github/copilot-instructions.md`

Happy coding! 🚀
