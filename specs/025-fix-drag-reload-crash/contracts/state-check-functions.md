# 內部合約: 狀態檢查函數

**Version**: 1.0  
**Created**: 2026-01-03

## 概述

定義 WebView 內部的狀態檢查函數介面，用於統一拖曳和剪貼簿操作狀態的判斷邏輯。

---

## isCurrentlyDragging()

```typescript
/**
 * 檢查是否正在拖曳中
 * 採用 OR 邏輯雙重檢查以涵蓋邊緣情況
 *
 * @returns {boolean} true 表示正在拖曳中
 */
function isCurrentlyDragging(): boolean;
```

### 實作

```javascript
const isCurrentlyDragging = () => {
	return isDraggingBlock || workspace.isDragging();
};
```

### 使用場景

| 場景                     | 行為                                                  |
| ------------------------ | ----------------------------------------------------- |
| `saveWorkspaceState()`   | 若返回 `true`，跳過儲存                               |
| `loadWorkspace` 訊息處理 | 若返回 `true` 且 `source === 'fileWatcher'`，暫存請求 |

---

## shouldSkipSave()

```typescript
/**
 * 檢查是否應該跳過自動儲存
 * 整合所有儲存守衛條件
 *
 * @returns {boolean} true 表示應該跳過儲存
 */
function shouldSkipSave(): boolean;
```

### 實作

```javascript
const shouldSkipSave = () => {
	if (isDraggingBlock) {
		log.info('跳過保存：正在拖曳');
		return true;
	}
	if (isClipboardOperationInProgress) {
		log.info('跳過保存：剪貼簿操作鎖定中');
		return true;
	}
	if (isLoadingFromFileWatcher) {
		log.info('跳過保存：正在從 FileWatcher 載入');
		return true;
	}
	return false;
};
```

### 守衛條件優先順序

1. `isDraggingBlock` - 拖曳保護
2. `isClipboardOperationInProgress` - 剪貼簿鎖定
3. `isLoadingFromFileWatcher` - 載入鎖定

---

## processPendingReload()

```typescript
/**
 * 執行待處理的 FileWatcher 重載請求
 *
 * @pre pendingReloadFromFileWatcher !== null
 * @pre isCurrentlyDragging() === false
 */
function processPendingReload(): void;
```

### 實作

```javascript
const processPendingReload = () => {
	if (!pendingReloadFromFileWatcher) {
		return;
	}

	if (isCurrentlyDragging()) {
		log.warn('processPendingReload 呼叫時仍在拖曳中，跳過');
		return;
	}

	log.info('執行待處理的 FileWatcher 重載');
	const message = pendingReloadFromFileWatcher;
	pendingReloadFromFileWatcher = null;

	// 執行原本的 loadWorkspace 邏輯
	handleLoadWorkspace(message);
};
```

### 呼叫時機

-   `BLOCK_DRAG` 事件且 `event.isStart === false` 後
-   延遲 100ms 以確保 Blockly 內部狀態更新完成

---

## 事件處理流程

```
keydown (Ctrl+C/V/X)
        │
        ▼
┌───────────────────────────────┐
│ isClipboardOperationInProgress│
│ = true                        │
│ clipboardLockStartTime =      │
│   Date.now()                  │
│ clipboardLockTimer 設置       │
└───────────────┬───────────────┘
                │
                │ BLOCK_CREATE 事件
                ▼
┌───────────────────────────────┐
│ 檢查已過時間:                  │
│ Date.now() - clipboardLock-   │
│ StartTime < CLIPBOARD_MAX_    │
│ LOCK_TIME (5000ms)?           │
├───────────────┬───────────────┤
│     YES       │      NO       │
│     │         │      │        │
│     ▼         │      ▼        │
│ 延長 timer    │ 不延長，      │
│ (重設為 300ms)│ 維持現有超時  │
└───────────────┴───────────────┘
                │
                │ 計時器超時
                ▼
┌───────────────────────────────┐
│ isClipboardOperationInProgress│
│ = false                       │
│ clipboardLockStartTime = null │
│ 允許自動儲存                  │
└───────────────────────────────┘
```
