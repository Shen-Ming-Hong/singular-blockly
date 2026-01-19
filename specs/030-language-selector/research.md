# Research: Blockly Language Selector

**Feature Branch**: `030-language-selector`  
**Research Date**: 2026-01-19  
**Status**: Complete

## 研究目標

解析以下技術問題：

1. 現有 `window.languageManager` 機制如何運作
2. `settings.json` 與 `main.json` 的資料結構
3. 語言切換時的 UI 更新機制
4. 控制列按鈕的 CSS 樣式規範

---

## 1. 現有語言管理機制

### 決定：使用現有 `window.languageManager.setLanguage()` API

**來源**：[blocklyEdit.html](../../media/html/blocklyEdit.html) 第 21-96 行

**現有 API**：

```javascript
window.languageManager = {
    currentLanguage: '{vscodeLanguage}',
    messages: {},
    loadMessages: function(locale, messages) { ... },
    getMessage: function(key, defaultValue) { ... },
    setLanguage: function(locale) { ... },
    syncToBlocklyMsg: function(locale, messages) { ... }
};
```

**關鍵流程**：

1. `setLanguage(locale)` 驗證語言檔案是否已載入
2. 更新 `currentLanguage` 屬性
3. 呼叫 `syncToBlocklyMsg()` 同步翻譯到 `Blockly.Msg`
4. 觸發 `languageChanged` 事件
5. 呼叫 `Blockly.getMainWorkspace().render()` 重新渲染

**理由**：此機制已經成熟且經過測試，直接使用可減少開發風險。

**考慮的替代方案**：

- 建立全新的語言管理模組 — 拒絕，因為會增加不必要的複雜性

---

## 2. 設定儲存結構

### 決定：語言偏好儲存在 `settings.json`，移除 `main.json` 中的 `theme`

**來源**：

- [settingsManager.ts](../../src/services/settingsManager.ts) — 現有設定管理邏輯
- [messageHandler.ts](../../src/webview/messageHandler.ts#L370) — 現有 `main.json` 儲存邏輯

**現有 `main.json` 結構**（將移除 `theme`）：

```json
{
  "workspace": { ... },
  "board": "esp32",
  "theme": "light"  // ← 將移除此欄位
}
```

**新的設定結構**：

```json
// .vscode/settings.json
{
  "singular-blockly.theme": "light",
  "singular-blockly.language": "auto"  // ← 新增此欄位
}

// blockly/main.json
{
  "workspace": { ... },
  "board": "esp32"
  // theme 欄位已移除
}
```

**理由**：

1. 主題和語言都是「介面設定」，應該統一存放
2. `settings.json` 是 VS Code 標準設定位置
3. 避免同一設定存在多處造成混淆

**考慮的替代方案**：

- 在 `main.json` 中新增 `language` 欄位 — 拒絕，因為會持續增加技術債

---

## 3. 語言選項清單

### 決定：提供 15 種語言 + Auto 選項

**來源**：[media/locales/](../../media/locales/) 目錄結構

**支援的語言**：
| 代碼 | 原生名稱 | 英文名稱 |
|------|----------|----------|
| auto | Auto (跟隨 VS Code) | Auto (follow VS Code) |
| en | English | English |
| zh-hant | 繁體中文 | Traditional Chinese |
| ja | 日本語 | Japanese |
| ko | 한국어 | Korean |
| es | Español | Spanish |
| fr | Français | French |
| de | Deutsch | German |
| it | Italiano | Italian |
| pt-br | Português (Brasil) | Portuguese (Brazil) |
| ru | Русский | Russian |
| pl | Polski | Polish |
| hu | Magyar | Hungarian |
| cs | Čeština | Czech |
| bg | Български | Bulgarian |
| tr | Türkçe | Turkish |

**理由**：這是專案現有的 15 種語言翻譯，加上 Auto 選項提供彈性。

---

## 4. 控制列 UI 設計

### 決定：使用圓形按鈕 + 下拉選單模式

**來源**：[blocklyEdit.html](../../media/html/blocklyEdit.html) 第 117-146 行

**現有按鈕 HTML 結構**：

```html
<div class="theme-switch">
	<button id="themeToggle" title="">
		<svg ...></svg>
	</button>
</div>
```

**語言按鈕位置**：放在 `theme-switch` 之前，形成「介面設定」視覺群組

**CSS 樣式規範**（來自 `blocklyEdit.css`）：

- 按鈕尺寸：32x32px
- 圓角：50%（圓形）
- 背景：`var(--button-bg)`
- 懸停效果：`var(--button-hover-bg)`
- 圖示尺寸：16x16px

**理由**：保持與現有控制列按鈕的視覺一致性。

---

## 5. Extension ↔ WebView 通訊

### 決定：新增 `updateLanguage` 訊息類型

**來源**：[messageHandler.ts](../../src/webview/messageHandler.ts) — 現有訊息處理模式

**訊息流程**：

**A. 初始化時**：

```
Extension → WebView
{ command: 'init', language: 'auto', resolvedLanguage: 'zh-hant' }
```

**B. 使用者切換語言時**：

```
WebView → Extension
{ command: 'updateLanguage', language: 'ja' }

Extension → WebView (確認)
{ command: 'languageUpdated', language: 'ja' }
```

**理由**：遵循現有的雙向通訊模式，保持架構一致性。

---

## 6. 向後相容性

### 決定：讀取時忽略 `theme`，儲存時移除 `theme`

**處理策略**：

1. 讀取 `main.json` 時：如果存在 `theme` 欄位，忽略它
2. 儲存 `main.json` 時：不寫入 `theme` 欄位
3. 首次開啟舊專案時：從 `main.json` 讀取 `theme` 並寫入 `settings.json`（一次性遷移）

**理由**：確保舊專案可以正常開啟，同時逐步清理技術債。

---

## 7. i18n 新增鍵名

### 決定：新增以下翻譯鍵

```javascript
// 需要加入所有 15 個語言檔案
LANGUAGE_SELECTOR_TITLE: 'Select Language',
LANGUAGE_AUTO: 'Auto (follow VS Code)',
LANGUAGE_ENGLISH: 'English',
LANGUAGE_CHINESE_TRADITIONAL: '繁體中文',
// ... 其他語言
```

**理由**：確保語言選擇器本身也可以被翻譯。

---

## 研究結論

所有技術問題已解決，可以進入 Phase 1 設計階段。

**關鍵技術決策摘要**：

1. 使用現有 `window.languageManager.setLanguage()` — 已驗證可行
2. 語言偏好存 `settings.json`，key 為 `singular-blockly.language`
3. 移除 `main.json` 中的 `theme` 欄位
4. 支援 15 種語言 + Auto 選項
5. 語言按鈕放在主題按鈕之前
6. 向後相容處理：一次性遷移 + 讀取時忽略
