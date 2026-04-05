# PostMessage 合約：CyberBrick 範例工作區瀏覽器

**功能**: 048-cyberbrick-sample-browser
**日期**: 2026-04-04

---

## 概述

Extension Host（Node.js TypeScript）與 WebView（瀏覽器 JavaScript）之間僅通過 `postMessage` 通訊。本文件定義本功能新增的所有訊息格式及流程。

---

## WebView → Extension Host

### `openSampleBrowserRequest`

**觸發時機**：使用者點擊工具列的「範例」按鈕

```typescript
{
	command: 'openSampleBrowserRequest';
	hasBlocks: boolean; // true = 工作區有積木（需確認對話框）
}
```

**Extension Host 回應**：發送 `showSampleBrowser` 訊息

---

### `loadSelectedSampleRequest`

**觸發時機**：使用者在模態瀏覽器中點擊卡片的「載入」按鈕

```typescript
{
	command: 'loadSelectedSampleRequest';
	filename: string; // 相對檔名，例如 "cyberbrick-soccer-robot.json"
	hasBlocks: boolean; // 傳遞以便 Extension Host 決定是否顯示確認對話框（二次確認）
}
```

**Extension Host 回應**：顯示確認對話框（若 `hasBlocks === true`），然後發送 `loadSampleWorkspace` 訊息；若使用者取消，不發送任何訊息。

---

## Extension Host → WebView

### `showSampleBrowser`

**觸發時機**：Extension Host 成功取得（或 fallback）`index.json` 後

```typescript
{
    command: 'showSampleBrowser';
    samples: SampleEntry[];   // index.json 中的 samples 陣列
    isOffline: boolean;       // true = 使用本機 fallback 版本
    language: string;         // 當前語系代碼，例如 "zh-hant"，供 WebView 解析多語言文字
}
```

**WebView 行為**：關閉 loading spinner，依 `samples` 渲染卡片；若 `isOffline === true` 顯示離線提示橫幅；若 `samples` 為空顯示「目前沒有可用範例」。

---

### `loadSampleWorkspace`

**觸發時機**：Extension Host 取得並驗證範例 JSON 後（使用者確認或工作區為空）

```typescript
{
	command: 'loadSampleWorkspace';
	state: object; // Blockly workspace 序列化狀態
	board: 'cyberbrick'; // 固定值
}
```

**WebView 行為**：關閉模態瀏覽器，設定 board 為 `cyberbrick`，呼叫 `handleWorkspaceLoadMessage(message)` 載入工作區。

---

## 完整流程圖

```
WebView                          Extension Host
  │                                    │
  │ openSampleBrowserRequest           │
  │ (hasBlocks: boolean)               │
  ├──────────────────────────────────► │
  │                                    │ fetchWithTimeout(indexUrl, 10s)
  │                                    │   失敗 → 讀本機 index.json (isOffline: true)
  │                                    │
  │        showSampleBrowser           │
  │ ◄────────────────────────────────[samples, isOffline, language]
  │                                    │
  │ 渲染卡片，使用者選擇後：           │
  │                                    │
  │ loadSelectedSampleRequest          │
  │ (filename, hasBlocks)              │
  ├──────────────────────────────────► │
  │                                    │ if hasBlocks: showWarningMessage()
  │                                    │   使用者取消: 流程結束
  │                                    │
  │                                    │ fetchWithTimeout(sampleUrl, 10s)
  │                                    │   失敗 → 讀本機 {filename}
  │                                    │
  │                                    │ validateWorkspace(json)
  │                                    │   失敗: showErrorMessage(), 流程結束
  │                                    │
  │          loadSampleWorkspace       │
  │ ◄────────────────────────────────[state, board]
  │                                    │
  │ 關閉模態，載入工作區              │
```

---

## 錯誤處理合約

| 情境                        | Extension Host 行為                       | WebView 行為                                                |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `index.json` 雲端取得失敗   | isOffline: true，改讀本機                 | 顯示離線提示橫幅                                            |
| `index.json` 本機檔案不存在 | 發送 `showSampleBrowser` 帶 `samples: []` | 顯示「目前沒有可用範例」                                    |
| 範例 JSON 雲端取得失敗      | 改讀本機檔案                              | 工作區正常更新（無特別提示）                                |
| 範例 JSON 本機不存在        | `vscodeApi.window.showErrorMessage()`     | 模態保持開啟（Extension Host 不發送 `loadSampleWorkspace`） |
| schema 驗證失敗             | `vscodeApi.window.showErrorMessage()`     | 模態保持開啟                                                |
| 使用者取消確認對話框        | 不發送任何訊息                            | 模態保持開啟                                                |
