# Blockly 語言選擇器規格

> 整合自 specs/030-language-selector

## 概述

在 Blockly 編輯器控制列新增語言選擇器，讓使用者可獨立設定 Blockly 介面語言（與 VS Code 語言分離），並在重新開啟後維持設定。

---

## 功能範圍

- 控制列新增語言按鈕與下拉選單
- 支援 Auto + 15 種既有翻譯語言
- 語言偏好持久化到 `.vscode/settings.json`
- 「Auto」會跟隨 VS Code 語言設定

---

## 設定與資料儲存

### settings.json

- `singular-blockly.language`: 語言偏好（預設 `"auto"`）
- `singular-blockly.theme`: 主題偏好（既有）

### blockly/main.json

- 僅保留 `workspace` 與 `board`
- 移除 `theme` 欄位（向後相容遷移）

---

## 行為流程

### 初始化

Extension 讀取語言偏好並解析後，透過 `init` 訊息傳給 WebView：

```json
{
  "command": "init",
  "languagePreference": "auto",
  "resolvedLanguage": "zh-hant"
}
```

### 使用者切換語言

1. WebView 發送 `updateLanguage`
2. Extension 驗證後更新設定
3. 回傳 `languageUpdated`，WebView 立即切換語言

---

## 向後相容

- 若舊版 `main.json` 仍含 `theme` 欄位，會在首次開啟時遷移至 `settings.json`
- 寫回 `main.json` 時不再包含 `theme`

---

## 驗收標準

1. ? 語言按鈕可展開/收合下拉選單
2. ? 切換語言後 Blockly UI 即時更新
3. ? 重新開啟後語言設定保持
4. ? Auto 模式會跟隨 VS Code 語言
5. ? `main.json` 不再包含 `theme`

---

## 相關檔案

- `src/services/settingsManager.ts`
- `src/webview/messageHandler.ts`
- `src/webview/webviewManager.ts`
- `media/html/blocklyEdit.html`
- `media/css/blocklyEdit.css`
- `media/js/blocklyEdit.js`
- `media/locales/*/messages.js`
