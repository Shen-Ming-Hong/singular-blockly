# WebView 訊息合約: loadWorkspace

**Version**: 1.1  
**Modified**: 2026-01-03

## 概述

定義 Extension → WebView 的 `loadWorkspace` 訊息格式，新增 `source` 欄位以支援拖曳期間的重載延遲機制。

---

## 訊息結構

```typescript
interface LoadWorkspaceMessage {
	/** 訊息類型 */
	command: 'loadWorkspace';

	/** 開發板類型 (optional) */
	board?: string;

	/** 主題設定 (optional) */
	theme?: string;

	/** Blockly 序列化狀態 */
	state?: BlocklyWorkspaceState;

	/**
	 * 訊息來源標記 (新增 v1.1)
	 * - 'fileWatcher': FileWatcher 偵測到檔案變更觸發
	 * - undefined: 其他來源 (初始載入、使用者操作等)
	 */
	source?: 'fileWatcher';
}
```

---

## Blockly 工作區狀態結構

```typescript
interface BlocklyWorkspaceState {
	/** 積木資料 */
	blocks?: {
		languageVersion: number;
		blocks: BlockState[];
	};

	/** 變數資料 */
	variables?: VariableState[];
}

interface BlockState {
	type: string;
	id: string;
	x?: number;
	y?: number;
	fields?: Record<string, unknown>;
	inputs?: Record<string, unknown>;
	next?: { block: BlockState };
}

interface VariableState {
	name: string;
	id: string;
	type?: string;
}
```

---

## 行為規範

### 當 `source === 'fileWatcher'` 時

1. WebView 必須檢查拖曳狀態
2. 若 `isCurrentlyDragging() === true`:
    - 暫存訊息至 `pendingReloadFromFileWatcher`
    - 不執行載入邏輯
    - 記錄日誌：「FileWatcher 重載請求已暫存」
3. 若 `isCurrentlyDragging() === false`:
    - 正常執行載入邏輯
    - 設置 `isLoadingFromFileWatcher = true`

### 當 `source` 為 undefined 時

-   行為不變，正常執行載入邏輯

---

## 範例

### Extension 側發送

```typescript
// messageHandler.ts
panel.webview.postMessage({
	command: 'loadWorkspace',
	board: 'esp32',
	theme: 'dark',
	state: workspaceState,
	source: 'fileWatcher', // 新增標記
});
```

### WebView 側接收

```javascript
// blocklyEdit.js
case 'loadWorkspace':
    const isFromFileWatcher = message.source === 'fileWatcher';

    if (isFromFileWatcher && isCurrentlyDragging()) {
        pendingReloadFromFileWatcher = message;
        log.info('FileWatcher 重載請求已暫存，等待拖曳結束');
        break;
    }

    // 正常載入邏輯...
    break;
```

---

## 向後相容性

-   `source` 欄位為 optional
-   現有不含 `source` 的訊息行為不變
-   新版 WebView 可處理舊版 Extension 發送的訊息
