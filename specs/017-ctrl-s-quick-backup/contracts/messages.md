# WebView ↔ Extension 訊息介面

**Feature**: 017-ctrl-s-quick-backup  
**Date**: 2025-12-20

## 訊息類型定義

本功能**完全複用**現有的 `createBackup` 訊息處理機制，無需新增訊息類型。

---

## 1. WebView → Extension：createBackup

**方向**：WebView 發送到 Extension Host  
**觸發時機**：使用者按下 Ctrl+S 且通過節流檢查和空工作區檢查

### 請求格式

```typescript
interface CreateBackupMessage {
	command: 'createBackup';

	/** 備份名稱，格式：backup_YYYYMMDD_HHMMSS */
	name: string;

	/** Blockly 工作區序列化狀態 */
	state: {
		blocks?: {
			blocks: any[];
		};
		variables?: any[];
	};

	/** 當前選擇的開發板 */
	board: string;

	/** 當前主題 */
	theme: 'light' | 'dark';

	/** 是否為快速備份（可選，用於日誌區分） */
	isQuickBackup?: boolean;
}
```

### 範例

```javascript
vscode.postMessage({
    command: 'createBackup',
    name: 'backup_20251220_143052',
    state: {
        blocks: {
            blocks: [
                { type: 'arduino_setup', id: 'abc123', ... }
            ]
        }
    },
    board: 'arduino_uno',
    theme: 'light',
    isQuickBackup: true
});
```

---

## 2. Extension → WebView：backupCreated

**方向**：Extension Host 回傳到 WebView  
**觸發時機**：備份建立成功或失敗後

### 回應格式

```typescript
interface BackupCreatedMessage {
	command: 'backupCreated';

	/** 備份名稱 */
	name: string;

	/** 是否成功 */
	success: boolean;

	/** 錯誤訊息（僅當 success = false） */
	error?: string;
}
```

### 範例

**成功回應**：

```json
{
	"command": "backupCreated",
	"name": "backup_20251220_143052",
	"success": true
}
```

**失敗回應**：

```json
{
	"command": "backupCreated",
	"name": "backup_20251220_143052",
	"success": false,
	"error": "無法找到 main.json 檔案"
}
```

---

## 訊息處理位置

| 訊息            | 發送位置                                | 處理位置                                |
| --------------- | --------------------------------------- | --------------------------------------- |
| `createBackup`  | `media/js/blocklyEdit.js`               | `src/webview/messageHandler.ts:490-527` |
| `backupCreated` | `src/webview/messageHandler.ts:509-513` | `media/js/blocklyEdit.js`（目前未處理） |

---

## 備註

### Toast 通知機制

本功能的 Toast 通知**不依賴** `backupCreated` 回傳訊息。

**設計原因**：

1. 降低延遲：Toast 在發送備份請求後立即顯示，無需等待 I/O 完成
2. 簡化實作：WebView 內部自行管理 Toast 顯示邏輯
3. 使用者體驗：即時回饋比確認訊息更重要

**未來擴展**：
若需要在備份失敗時顯示錯誤 Toast，可監聽 `backupCreated` 訊息：

```javascript
window.addEventListener('message', event => {
	const message = event.data;
	if (message.command === 'backupCreated' && !message.success) {
		toast.show(`備份失敗: ${message.error}`, 'error');
	}
});
```

目前實作不包含此功能，依據 Constitution 原則 III（避免過度開發）。
