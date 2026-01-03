# Data Model: 修復拖曳時 FileWatcher 重載崩潰問題

**Date**: 2026-01-03  
**Feature**: 025-fix-drag-reload-crash

## 概述

本文件定義此功能所需的狀態變數、旗標和計時器。所有實體皆位於 WebView 端 (`blocklyEdit.js`)，無需修改資料庫或持久化儲存。

---

## 1. 狀態旗標

### 1.1 isDraggingBlock (現有)

| 屬性   | 值                        |
| ------ | ------------------------- |
| 類型   | `boolean`                 |
| 預設值 | `false`                   |
| 位置   | `media/js/blocklyEdit.js` |
| 用途   | 追蹤積木是否正在被拖曳    |

**狀態轉換**:

-   `false` → `true`: 收到 `BLOCK_DRAG` 事件且 `event.isStart === true`
-   `true` → `false`: 收到 `BLOCK_DRAG` 事件且 `event.isStart === false`

---

### 1.2 isClipboardOperationInProgress (新增)

| 屬性   | 值                                         |
| ------ | ------------------------------------------ |
| 類型   | `boolean`                                  |
| 預設值 | `false`                                    |
| 位置   | `media/js/blocklyEdit.js`                  |
| 用途   | 追蹤剪貼簿操作（Ctrl+C/V/X）是否正在進行中 |

**狀態轉換**:

-   `false` → `true`: 收到 `keydown` 事件，偵測到 `Ctrl+C`、`Ctrl+V` 或 `Ctrl+X`
-   `true` → `false`:
    -   `clipboardLockTimer` 超時
    -   或編輯器關閉

**驗證規則**:

-   當 `isClipboardOperationInProgress === true` 時，`saveWorkspaceState()` 必須跳過儲存

---

### 1.3 isLoadingFromFileWatcher (現有)

| 屬性   | 值                                    |
| ------ | ------------------------------------- |
| 類型   | `boolean`                             |
| 預設值 | `false`                               |
| 位置   | `media/js/blocklyEdit.js`             |
| 用途   | 追蹤是否正在從 FileWatcher 載入工作區 |

**狀態轉換**:

-   無變更，維持現有邏輯

---

## 2. 暫存變數

### 2.1 pendingReloadFromFileWatcher (新增)

| 屬性   | 值                                            |
| ------ | --------------------------------------------- | ----- |
| 類型   | `Object                                       | null` |
| 預設值 | `null`                                        |
| 位置   | `media/js/blocklyEdit.js`                     |
| 用途   | 暫存因拖曳進行中而延遲的 FileWatcher 重載請求 |

**資料結構**:

```javascript
{
    board: string,          // 開發板類型
    theme: string,          // 主題設定
    state: Object,          // Blockly 序列化狀態
    source: 'fileWatcher'   // 訊息來源標記
}
```

**狀態轉換**:

-   `null` → `Object`: 收到 `loadWorkspace` 訊息，`source === 'fileWatcher'`，且正在拖曳中
-   `Object` → `null`: 拖曳結束後執行重載，或新的重載請求覆蓋舊的
-   永不持久化，編輯器關閉時自動丟棄

---

## 3. 計時器

### 3.1 clipboardLockTimer (新增)

| 屬性   | 值                        |
| ------ | ------------------------- | --------------------- |
| 類型   | `number                   | null` (setTimeout ID) |
| 預設值 | `null`                    |
| 位置   | `media/js/blocklyEdit.js` |
| 用途   | 管理剪貼簿操作鎖定的超時  |

**行為**:

-   初始設定：300ms 超時
-   動態延長：每次 `BLOCK_CREATE` 事件重設為 300ms
-   超時時：設置 `isClipboardOperationInProgress = false`
-   **最大鎖定時間**：5000ms（由 `CLIPBOARD_MAX_LOCK_TIME` 常數定義）

**清理**:

-   新的剪貼簿操作時 `clearTimeout(clipboardLockTimer)`
-   編輯器關閉時自動清理

---

### 3.2 CLIPBOARD_MAX_LOCK_TIME (新增常數)

| 屬性 | 值                        |
| ---- | ------------------------- |
| 類型 | `number`                  |
| 值   | `5000`                    |
| 位置 | `media/js/blocklyEdit.js` |
| 用途 | 剪貼簿操作鎖定的最大時間  |

---

### 3.3 clipboardLockStartTime (新增)

| 屬性   | 值                        |
| ------ | ------------------------- | ----- |
| 類型   | `number                   | null` |
| 預設值 | `null`                    |
| 位置   | `media/js/blocklyEdit.js` |
| 用途   | 記錄剪貼簿操作開始時間戳  |

**行為**:

-   `null` → `Date.now()`: 收到 `keydown` 事件，偵測到 `Ctrl+C/V/X`
-   `Date.now()` → `null`: 鎖定結束時清除

---

### 3.4 codeUpdateDebounceTimer (現有，需修改)

| 屬性   | 值                               |
| ------ | -------------------------------- | --------------------- |
| 類型   | `number                          | null` (setTimeout ID) |
| 預設值 | `null`                           |
| 位置   | `media/js/blocklyEdit.js`        |
| 用途   | 延遲執行程式碼更新，避免頻繁更新 |

**變更**:

-   超時時間從 `150ms` 調整為 `300ms`

---

## 4. 輔助函數

### 4.1 isCurrentlyDragging() (新增)

| 屬性     | 值                             |
| -------- | ------------------------------ |
| 返回類型 | `boolean`                      |
| 用途     | 檢查是否正在拖曳中（雙重檢查） |

**實作**:

```javascript
const isCurrentlyDragging = () => {
	return isDraggingBlock || workspace.isDragging();
};
```

---

### 4.2 processPendingReload() (新增)

| 屬性     | 值                                |
| -------- | --------------------------------- |
| 返回類型 | `void`                            |
| 用途     | 執行待處理的 FileWatcher 重載請求 |

**前置條件**:

-   `pendingReloadFromFileWatcher !== null`
-   `isCurrentlyDragging() === false`

**行為**:

1. 取出 `pendingReloadFromFileWatcher`
2. 設置 `pendingReloadFromFileWatcher = null`
3. 執行原本的 `loadWorkspace` 邏輯

---

## 5. 實體關係圖

```
┌─────────────────────────────────────────────────────────────────┐
│                     WebView (blocklyEdit.js)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌────────────────────────────────┐   │
│  │  拖曳狀態追蹤     │     │     剪貼簿操作追蹤              │   │
│  ├──────────────────┤     ├────────────────────────────────┤   │
│  │ isDraggingBlock  │     │ isClipboardOperationInProgress │   │
│  │ (boolean)        │     │ (boolean)                      │   │
│  └────────┬─────────┘     │ clipboardLockTimer             │   │
│           │               │ (timeout ID)                    │   │
│           │               └───────────────┬────────────────┘   │
│           │                               │                     │
│           ▼                               ▼                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              saveWorkspaceState() 守衛條件               │  │
│  │  - isDraggingBlock === false                             │  │
│  │  - isClipboardOperationInProgress === false              │  │
│  │  - isLoadingFromFileWatcher === false                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 FileWatcher 重載延遲                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  pendingReloadFromFileWatcher (Object | null)            │  │
│  │                                                          │  │
│  │  流程:                                                    │  │
│  │  1. 收到 loadWorkspace (source: fileWatcher)             │  │
│  │  2. 檢查 isCurrentlyDragging()                           │  │
│  │     - true: 暫存到 pendingReloadFromFileWatcher          │  │
│  │     - false: 立即執行重載                                 │  │
│  │  3. BLOCK_DRAG (isStart: false) 觸發時                   │  │
│  │     - 呼叫 processPendingReload()                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 狀態機：FileWatcher 重載

```
                    ┌─────────────────┐
                    │   初始狀態       │
                    │ pending = null  │
                    └────────┬────────┘
                             │
              收到 loadWorkspace (source: fileWatcher)
                             │
                             ▼
                    ┌────────────────┐
                    │ 檢查拖曳狀態   │
                    └───────┬────────┘
                            │
           ┌────────────────┴────────────────┐
           │                                 │
    isCurrentlyDragging()            isCurrentlyDragging()
        === true                         === false
           │                                 │
           ▼                                 ▼
    ┌──────────────┐                ┌──────────────────┐
    │ 暫存請求      │                │ 立即執行重載      │
    │ pending = msg│                │ 正常流程          │
    └──────┬───────┘                └──────────────────┘
           │
           │ BLOCK_DRAG (isStart: false)
           ▼
    ┌──────────────────┐
    │ 檢查 pending     │
    └────────┬─────────┘
             │
    pending !== null?
             │
      ┌──────┴──────┐
      │             │
     YES           NO
      │             │
      ▼             ▼
┌────────────┐  ┌─────────┐
│執行重載     │  │ 無動作  │
│pending=null│  └─────────┘
└────────────┘
```

---

## 7. 變更摘要

| 檔案                                | 新增/修改 | 說明                                         |
| ----------------------------------- | --------- | -------------------------------------------- |
| `media/js/blocklyEdit.js`           | 新增      | `isClipboardOperationInProgress`             |
| `media/js/blocklyEdit.js`           | 新增      | `pendingReloadFromFileWatcher`               |
| `media/js/blocklyEdit.js`           | 新增      | `clipboardLockTimer`                         |
| `media/js/blocklyEdit.js`           | 新增      | `CLIPBOARD_MAX_LOCK_TIME` (常數 5000ms)      |
| `media/js/blocklyEdit.js`           | 新增      | `clipboardLockStartTime`                     |
| `media/js/blocklyEdit.js`           | 新增      | `isCurrentlyDragging()`                      |
| `media/js/blocklyEdit.js`           | 新增      | `processPendingReload()`                     |
| `media/js/blocklyEdit.js`           | 修改      | `codeUpdateDebounceTimer` 超時 150ms → 300ms |
| `media/js/blocklyEdit.js`           | 修改      | `saveWorkspaceState()` 新增剪貼簿鎖定檢查    |
| `media/js/blocklyEdit.js`           | 修改      | `loadWorkspace` 處理器新增拖曳狀態檢查       |
| `media/blockly/blocks/functions.js` | 修改      | 更新棄用的 Variable API                      |
| `src/webview/webviewManager.ts`     | 修改      | `isInternalUpdate` → `internalUpdateCount`   |
| `src/webview/webviewManager.ts`     | 新增      | `internalUpdateTimer`                        |
| `src/webview/webviewManager.ts`     | 修改      | `markInternalUpdateStart()` 遞增計數器邏輯   |
| `src/webview/webviewManager.ts`     | 修改      | `markInternalUpdateEnd()` 2000ms 延遲遞減    |
| `src/webview/webviewManager.ts`     | 修改      | `handleFileChange()` 檢查 `count > 0`        |

---

## 8. Extension 端內部更新保護機制

此節定義 Extension 端（`webviewManager.ts`）用於防止內部儲存操作觸發 FileWatcher 的機制。

### 8.1 internalUpdateCount (替代原有 isInternalUpdate)

| 屬性   | 值                              |
| ------ | ------------------------------- |
| 類型   | `number`                        |
| 預設值 | `0`                             |
| 位置   | `src/webview/webviewManager.ts` |
| 用途   | 追蹤進行中的內部更新操作數量    |

**為什麼用計數器而非布林旗標**:

-   連續快速儲存時，新的儲存可能在前一個的保護視窗過期前開始
-   計數器確保所有進行中的操作都被追蹤，不會過早重置

**狀態轉換**:

-   `0` → `N`: `markInternalUpdateStart()` 被呼叫（遞增）
-   `N` → `N-1`: `markInternalUpdateEnd()` 的 2000ms 延遲後遞減
-   `N` → `0`: 最後一個操作的保護視窗過期

---

### 8.2 internalUpdateTimer (新增)

| 屬性   | 值                              |
| ------ | ------------------------------- |
| 類型   | `NodeJS.Timeout \| undefined`   |
| 預設值 | `undefined`                     |
| 位置   | `src/webview/webviewManager.ts` |
| 用途   | 管理延遲遞減計數器的計時器      |

**行為**:

-   每次 `markInternalUpdateStart()` 清除現有計時器
-   每次 `markInternalUpdateEnd()` 設定新的 2000ms 延遲計時器
-   計時器觸發時遞減 `internalUpdateCount`

---

### 8.3 INTERNAL_UPDATE_PROTECTION_MS (常數)

| 屬性 | 值                              |
| ---- | ------------------------------- |
| 類型 | `number`                        |
| 值   | `2000`                          |
| 位置 | `src/webview/webviewManager.ts` |
| 用途 | 內部更新保護視窗的持續時間      |

**為什麼是 2000ms**:

-   FileWatcher 的 debounce 是 500ms
-   檔案系統事件可能有額外延遲（特別是網路磁礙或防毒軟體掃描）
-   2000ms 提供足夠的安全間隔，涵蓋大多數延遲情況

---

### 8.4 狀態機：內部更新保護

```
                    ┌─────────────────┐
                    │   count = 0      │
                    │   (無保護)       │
                    └────────┬────────┘
                             │
              markInternalUpdateStart()
                             │
                             ▼
                    ┌─────────────────┐
                    │   count = 1      │
                    │   (保護中)        │◀─── markInternalUpdateStart()
                    └────────┬────────┘     (count++, 重設計時器)
                             │
              markInternalUpdateEnd()
              (設定 2000ms 計時器)
                             │
                             ▼
                    ┌─────────────────┐
                    │   2000ms 延遲     │
                    │   (繼續保護)     │
                    └────────┬────────┘
                             │
                 計時器觸發 (count--)
                             │
           ┌────────────────┼────────────────┐
           │                                 │
    count > 0?                          count === 0?
           │                                 │
           ▼                                 ▼
  ┌───────────────┐               ┌─────────────────┐
  │ 繼續保護       │               │   保護解除       │
  │ FileWatcher   │               │   FileWatcher   │
  │ 跳過重載       │               │   正常處理       │
  └───────────────┘               └─────────────────┘
```

---

### 8.5 競態條件案例

**案例 1: 連續快速儲存**

```
t=0ms:    儲存 A 開始, count = 1
t=50ms:   儲存 A 完成, markInternalUpdateEnd() 設定 2000ms 計時器
t=100ms:  儲存 B 開始, count = 2, 清除舊計時器
t=150ms:  儲存 B 完成, markInternalUpdateEnd() 設定新 2000ms 計時器
t=600ms:  FileWatcher 偵測到儲存 A 的變更, count=2 > 0, 跳過重載 ✅
t=700ms:  FileWatcher 偵測到儲存 B 的變更, count=2 > 0, 跳過重載 ✅
t=2150ms: 計時器觸發, count = 1
t=4150ms: 計時器觸發, count = 0, 保護解除
```

**案例 2: 檔案系統延遲**

```
t=0ms:    儲存 A 開始, count = 1
t=50ms:   儲存 A 完成, markInternalUpdateEnd() 設定 2000ms 計時器
t=1500ms: FileWatcher 偵測到變更 (延遲 1450ms), count=1 > 0, 跳過重載 ✅
t=2050ms: 計時器觸發, count = 0, 保護解除
```
