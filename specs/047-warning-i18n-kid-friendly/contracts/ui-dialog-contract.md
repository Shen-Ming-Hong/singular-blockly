# UI Dialog Contract: 安全守衛模態對話框

**Feature Branch**: `047-warning-i18n-kid-friendly`  
**Date**: 2025-07-15  
**Interface Type**: VS Code Native Modal Warning Dialog

---

## 概述

安全守衛（Safety Guard）透過 VS Code 原生 `vscode.window.showWarningMessage()` API 顯示模態警告對話框。此合約定義對話框的結構、按鈕行為與訊息格式。

---

## 對話框結構

```text
┌─────────────────────────────────────────────────┐
│ ⚠️  [警告圖示 - VS Code 自動提供]              │
│                                                 │
│  {SAFETY_WARNING_BODY_NO_TYPE}                  │
│  或                                             │
│  {SAFETY_WARNING_BODY_WITH_TYPE}                │
│  (其中 {0} 會被替換為偵測到的專案類型名稱)      │
│                                                 │
│  ┌─────────────────┐  ┌───────────────────────┐ │
│  │ {BUTTON_CONTINUE}│  │ {BUTTON_SUPPRESS}     │ │
│  └─────────────────┘  └───────────────────────┘ │
│                                                 │
│  [X] 關閉 / ESC (模態內建取消功能)              │
└─────────────────────────────────────────────────┘
```

---

## API 呼叫規格

### 主要呼叫（正常流程）

```typescript
const selection = await vscode.window.showWarningMessage(
  message,           // string: 本地化後的警告本文
  { modal: true },   // MessageOptions: 模態模式
  continueButton,    // string: 本地化後的「繼續」按鈕文字
  suppressButton     // string: 本地化後的「不再提醒」按鈕文字
);
```

### Fallback 呼叫（i18n 服務失敗時）

```typescript
const selection = await vscode.window.showWarningMessage(
  fallbackMessage,           // string: 孩子友善英文後備訊息
  { modal: true },
  'Yes, let\'s go!',        // string: 英文後備「繼續」按鈕
  'Don\'t ask again'        // string: 英文後備「不再提醒」按鈕
);
```

---

## 按鈕行為合約

| 按鈕 | 鍵值 | 回傳值 | 後續行為 |
|------|------|--------|----------|
| 繼續 | `BUTTON_CONTINUE` | 按鈕文字字串 | `return 'continue'` → 建立積木專案結構 |
| 不再提醒 | `BUTTON_SUPPRESS` | 按鈕文字字串 | `return 'suppress'` → 儲存偏好 + 建立專案 + 顯示 `SAFETY_GUARD_SUPPRESSED` |
| 取消 | （模態內建） | `undefined` | `return 'cancel'` → 顯示 `SAFETY_GUARD_CANCELLED` + 中止開啟 |

> **重要**: VS Code `showWarningMessage({ modal: true })` 回傳值為使用者點擊的按鈕文字字串，或 `undefined`（使用者按 ESC 或點擊關閉）。

---

## 回饋訊息合約

使用者操作完成後，透過 `vscode.window.showInformationMessage()` 顯示回饋。

| 情境 | 鍵值 | API |
|------|------|-----|
| 使用者取消 | `SAFETY_GUARD_CANCELLED` | `showInformationMessage(cancelMsg)` |
| 使用者選不再提醒 | `SAFETY_GUARD_SUPPRESSED` | `showInformationMessage(suppressMsg)` |
| 使用者選繼續 | （無回饋訊息） | 直接進入編輯器開啟流程 |

---

## 訊息文案格式規範

### 占位符

- `{0}` — 專案類型名稱（如 "Node.js"、"Python"、"Java Maven"）
- 僅在 `SAFETY_WARNING_BODY_WITH_TYPE` 中使用
- 專案類型名稱保持原始英文技術名稱，不翻譯
- 替換邏輯: `message.replace('{0}', projectType)`

### 字元長度限制

| 類型 | 上限 | 計算方式 |
|------|------|----------|
| 警告本文 | 200 字元 | 各語系字元數（`{0}` 替換前） |
| 按鈕文字 | 15 字元 | 各語系字元數 |
| 回饋訊息 | 100 字元 | 各語系字元數 |

### 孩子友善文案原則

1. 不使用開發者術語（project、folder、workspace、block）
2. 使用第二人稱「你」直接對話
3. 語氣親切、正面
4. 按鈕描述按下後的「結果」
5. 不使用威脅性措辭（如「可能導致檔案遺失」）
6. 技術專有名稱（Node.js、Python 等）保留原文

---

## 偏好儲存合約

| 設定鍵 | 型別 | 預設值 | 說明 |
|--------|------|--------|------|
| `singularBlockly.safetyGuard.suppressWarning` | `boolean` | `false` | `true` 表示使用者已選擇不再顯示警告 |

**儲存方式**: `SettingsManager.updateSetting()` → VS Code workspace configuration  
**讀取方式**: `SettingsManager.getSetting()` 於安全守衛啟動時檢查  
**文案更新影響**: 無 — 偏好值為 boolean，與文字內容無關

---

## 觸發條件

安全守衛在以下情境觸發（不變更）：

| 情境 | 偵測方式 | projectType 值 |
|------|---------|----------------|
| 空白資料夾 | 資料夾無任何檔案 | `undefined` |
| 僅含 `.vscode` | 資料夾僅有 `.vscode` 子目錄 | `undefined` |
| Node.js 專案 | 偵測到 `package.json` | `'Node.js'` |
| Python 專案 | 偵測到 `requirements.txt` 等 | `'Python'` |
| Java Maven 專案 | 偵測到 `pom.xml` | `'Java Maven'` |
| 其他專案類型 | 依偵測邏輯 | 對應技術名稱 |
