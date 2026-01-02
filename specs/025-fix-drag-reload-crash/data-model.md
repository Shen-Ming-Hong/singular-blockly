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
