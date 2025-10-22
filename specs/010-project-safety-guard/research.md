# Research: 專案安全防護機制

**Date**: 2025-10-22  
**Feature**: 010-project-safety-guard  
**Purpose**: 解決技術脈絡中的未知項目,為 Phase 1 設計提供決策依據

## Research Questions

從 Technical Context 與 Constitution Check 識別出以下需研究的問題:

1. VSCode `showWarningMessage` API 是否支援核取方塊選項?
2. Workspace settings API 的最佳實踐(設定鍵命名、作用域)
3. 現有 `webviewManager.ts` 工作區檢查邏輯的詳細實作
4. VSCode API 對話框按鈕本地化的最佳實踐
5. 專案類型識別的檔案模式與最佳實踐

## Research Results

### R1: VSCode 對話框 API 與核取方塊支援

**決策**: 使用 `vscode.window.showWarningMessage()` 搭配 `MessageOptions.modal` 選項

**研究發現**:

-   VSCode API 的 `showWarningMessage` **不直接支援核取方塊選項**
-   可用的 `MessageOptions` 屬性僅有 `modal: boolean` (是否為模態對話框)
-   標準對話框只能提供按鈕選項(透過 items 參數傳入字串陣列或 MessageItem 陣列)

**替代方案**:

1. **方案 A (採用)**: 使用三個按鈕:「繼續」、「取消」、「不再提醒並繼續」

    - 優點:符合 VSCode 標準 API,無需額外依賴,實作簡單
    - 缺點:按鈕較多,但對兒童使用者仍清晰

2. **方案 B (捨棄)**: 使用 `vscode.window.showInputBox()` 搭配自訂提示

    - 缺點:不適合確認對話框情境,使用者體驗差

3. **方案 C (捨棄)**: 自訂 WebView 對話框
    - 缺點:過度複雜,違反憲法簡單性原則,增加維護負擔

**最終決策**: 採用方案 A,將「不再提醒」選項改為第三個按鈕

-   按鈕設計:「繼續」、「取消」、「不再提醒」
-   當使用者點擊「不再提醒」時,儲存偏好設定後直接開啟編輯器(等同於「不再提醒並繼續」)
-   符合兒童友善原則:文字清楚直白,無核取方塊操作複雜度

**API 範例**:

```typescript
const result = await vscode.window.showWarningMessage('這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?', { modal: true }, '繼續', '取消', '不再提醒');
```

**文檔來源**: VSCode Extension API - `/websites/code_visualstudio_api`

---

### R2: Workspace Settings API 最佳實踐

**決策**: 使用 `workspace.getConfiguration()` 搭配工作區作用域設定

**研究發現**:

-   設定鍵命名慣例:`<extensionId>.<category>.<settingName>`
-   本專案設定鍵:`singularBlockly.safetyGuard.suppressWarning`
-   作用域選擇:WorkspaceConfiguration (儲存於 `.vscode/settings.json`)
-   更新方法:`config.update(key, value, ConfigurationTarget.Workspace)`

**API 使用範例**:

```typescript
// 讀取偏好設定
const config = vscode.workspace.getConfiguration('singularBlockly.safetyGuard');
const suppressWarning = config.get<boolean>('suppressWarning', false);

// 寫入偏好設定
await config.update('suppressWarning', true, vscode.ConfigurationTarget.Workspace);
```

**設定作用域比較**:
| 作用域 | 儲存位置 | 是否跨專案 | 採用原因 |
|--------|---------|-----------|----------|
| Global | User settings | 是 | ❌ 不適用(需求要求不跨專案) |
| Workspace | `.vscode/settings.json` | 否 | ✅ 符合需求 |
| WorkspaceFolder | 多根工作區個別設定 | 否 | ⚠️ 過度複雜 |

**最佳實踐**:

-   設定預設值在 `package.json` 的 `contributes.configuration` 中宣告
-   使用 TypeScript 型別斷言確保型別安全
-   提供明確的設定說明文字(繁體中文)

**文檔來源**: VSCode Extension API - Workspace Configuration Access

---

### R3: 現有工作區檢查邏輯分析

**研究發現**:

-   位置:`src/webview/webviewManager.ts` 第 67-77 行
-   現有實作已檢查 `vscode.workspace.workspaceFolders` 是否存在
-   空工作區處理:顯示錯誤訊息並提供「開啟資料夾」按鈕

**現有程式碼**:

```typescript
// 檢查工作區
const workspaceFolders = vscodeApi.workspace.workspaceFolders;
if (!workspaceFolders) {
	const errorMsg = await this.localeService.getLocalizedMessage('VSCODE_PLEASE_OPEN_PROJECT');
	const openFolderBtn = await this.localeService.getLocalizedMessage('VSCODE_OPEN_FOLDER');

	vscodeApi.window.showErrorMessage(errorMsg, openFolderBtn).then(selection => {
		if (selection === openFolderBtn) {
			vscodeApi.commands.executeCommand('workbench.action.files.openFolder');
		}
	});
	return;
}
```

**整合策略**:

-   保留現有空工作區檢查邏輯(位於 `createAndShowWebView()` 開頭)
-   在空工作區檢查**之後**,插入新的 Blockly 專案偵測邏輯
-   更新錯誤訊息為兒童友善版本:「請先開啟一個資料夾,才能使用 Blockly 積木喔!」

**整合位置決策**:

-   在 `webviewManager.ts` 的 `createAndShowWebView()` 方法中插入
-   順序:空工作區檢查 → **Blockly 專案檢查(新增)** → PlatformIO 設定 → 面板建立

---

### R4: 對話框本地化最佳實踐

**決策**: 使用 `LocaleService` 整合多語言訊息

**研究發現**:

-   現有專案已有 `LocaleService` 處理多語言
-   訊息儲存於 `media/locales/{lang}/messages.js`
-   需新增以下訊息鍵:
    -   `SAFETY_GUARD_WARNING_MESSAGE`: 警告訊息主文
    -   `SAFETY_GUARD_BUTTON_CONTINUE`: 「繼續」按鈕
    -   `SAFETY_GUARD_BUTTON_CANCEL`: 「取消」按鈕
    -   `SAFETY_GUARD_BUTTON_SUPPRESS`: 「不再提醒」按鈕
    -   `SAFETY_GUARD_PROJECT_TYPE_DETECTED`: 「偵測到 {0} 專案」(P2 功能)

**多語言訊息範例**:

```javascript
// media/locales/zh-hant/messages.js
SAFETY_GUARD_WARNING_MESSAGE: '這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?',
SAFETY_GUARD_BUTTON_CONTINUE: '繼續',
SAFETY_GUARD_BUTTON_CANCEL: '取消',
SAFETY_GUARD_BUTTON_SUPPRESS: '不再提醒',
SAFETY_GUARD_PROJECT_TYPE_DETECTED: '偵測到 {0} 專案',

// media/locales/en/messages.js
SAFETY_GUARD_WARNING_MESSAGE: 'This project doesn\'t have Blockly blocks yet. Continuing will create a blockly folder and files here. Continue?',
SAFETY_GUARD_BUTTON_CONTINUE: 'Continue',
SAFETY_GUARD_BUTTON_CANCEL: 'Cancel',
SAFETY_GUARD_BUTTON_SUPPRESS: 'Don\'t remind me again',
SAFETY_GUARD_PROJECT_TYPE_DETECTED: 'Detected {0} project',
```

**最佳實踐**:

-   使用佔位符 `{0}`, `{1}` 支援動態內容
-   兒童友善文字:避免艱深術語,使用簡單直白語句
-   所有按鈕文字長度控制在 10 字以內

---

### R5: 專案類型識別模式

**決策**: 使用檔案存在性檢查,參考現有 `board_configs.js` 模式

**專案類型識別規則** (P2 功能):

| 專案類型      | 識別檔案                                             | 優先級 |
| ------------- | ---------------------------------------------------- | ------ |
| Node.js       | `package.json`                                       | 1      |
| Python        | `requirements.txt` OR `setup.py` OR `pyproject.toml` | 2      |
| Java (Maven)  | `pom.xml`                                            | 3      |
| Java (Gradle) | `build.gradle` OR `build.gradle.kts`                 | 4      |
| .NET          | `*.csproj` OR `*.sln`                                | 5      |
| Go            | `go.mod`                                             | 6      |
| 未知          | 上述檔案皆不存在                                     | 7      |

**實作策略**:

```typescript
interface ProjectTypeRule {
	type: string; // 專案類型名稱(用於顯示)
	files: string[]; // 識別檔案模式(OR 邏輯)
	priority: number; // 優先級(數字越小優先級越高)
}

const PROJECT_TYPE_RULES: ProjectTypeRule[] = [
	{ type: 'Node.js', files: ['package.json'], priority: 1 },
	{ type: 'Python', files: ['requirements.txt', 'setup.py', 'pyproject.toml'], priority: 2 },
	{ type: 'Java Maven', files: ['pom.xml'], priority: 3 },
	{ type: 'Java Gradle', files: ['build.gradle', 'build.gradle.kts'], priority: 4 },
	{ type: '.NET', files: ['*.csproj', '*.sln'], priority: 5 },
	{ type: 'Go', files: ['go.mod'], priority: 6 },
];
```

**檢查邏輯**:

1. 遍歷 `PROJECT_TYPE_RULES` 陣列(已按優先級排序)
2. 對每個規則,檢查工作區根目錄是否存在任一識別檔案
3. 找到第一個匹配的專案類型即返回
4. 若無匹配,返回 `'unknown'`

**檔案檢查實作**:

```typescript
async detectProjectType(workspaceRoot: string): Promise<string> {
  for (const rule of PROJECT_TYPE_RULES) {
    for (const file of rule.files) {
      const filePath = path.join(workspaceRoot, file);
      if (await this.fileService.exists(filePath)) {
        return rule.type;
      }
    }
  }
  return 'unknown';
}
```

**最佳實踐**:

-   純函式設計:輸入工作區路徑,輸出專案類型字串
-   可擴展性:新增專案類型只需修改 `PROJECT_TYPE_RULES` 陣列
-   效能考量:按優先級排序,找到即返回(短路求值)

---

## Alternatives Considered

### 核取方塊實作替代方案

**Option 1: 使用 Quick Pick API**

-   API: `vscode.window.showQuickPick()`
-   支援多選模式 (`canPickMany: true`)
-   **捨棄原因**: Quick Pick 主要用於列表選擇,不適合確認對話框情境

**Option 2: 使用 Webview 自訂對話框**

-   完全控制 UI,可實作核取方塊
-   **捨棄原因**: 違反憲法簡單性原則,過度複雜,增加維護成本

**Option 3: 使用第三方對話框套件**

-   可能存在支援進階功能的套件
-   **捨棄原因**: 增加外部依賴,違反避免過度開發原則

### 專案類型識別替代方案

**Option 1: 深度檔案內容解析**

-   解析 `package.json` 的 `dependencies` 判斷框架類型
-   **捨棄原因**: 過度複雜,不符合需求範圍(只需識別語言類型)

**Option 2: 使用 VSCode Language Detection API**

-   可能存在內建的語言偵測功能
-   **捨棄原因**: 研究後發現無此 API,且需求為專案類型(非檔案語言)

---

## Implementation Recommendations

### Phase 1 優先順序

1. **P1 - 核心防護功能**

    - 實作 `WorkspaceValidator` 服務
    - 整合至 `webviewManager.ts`
    - 實作三按鈕對話框(繼續/取消/不再提醒)
    - 擴展 `SettingsManager` 支援偏好設定

2. **P2 - 智慧識別**

    - 實作 `ProjectTypeDetector` 純函式
    - 整合專案類型至警告訊息

3. **P3 - 偏好記憶** (已在 P1 完成)
    - 偏好設定邏輯已包含在 P1 實作中

### 測試策略

-   **Unit Tests**: `ProjectTypeDetector` 純函式測試(100% 覆蓋率)
-   **Integration Tests**: Mock VSCode API 測試對話框流程
-   **Manual Tests**: 在真實專案中測試使用者體驗

### 風險評估

| 風險               | 影響 | 緩解策略                                |
| ------------------ | ---- | --------------------------------------- |
| 核取方塊無法實作   | 中   | ✅ 已解決:改用三按鈕方案                |
| 偏好設定無法持久化 | 低   | 使用標準 VSCode API,風險極低            |
| 專案類型誤判       | 低   | 提供「未知專案」fallback,不影響核心功能 |

---

## References

-   [VSCode Extension API Documentation](https://code.visualstudio.com/api/references/vscode-api)
-   [VSCode Extension Samples](https://github.com/microsoft/vscode-extension-samples)
-   現有專案程式碼:`src/webview/webviewManager.ts`
-   現有專案程式碼:`src/services/settingsManager.ts`
-   現有專案程式碼:`media/blockly/blocks/board_configs.js`
