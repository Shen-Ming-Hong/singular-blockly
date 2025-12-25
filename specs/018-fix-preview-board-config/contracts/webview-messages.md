# WebView Message Contract

**Feature**: 018-fix-preview-board-config
**Version**: 1.0.0
**Date**: 2025-12-25

## 概述

定義 Extension Host 與 Preview WebView 之間的訊息傳遞契約。

## 訊息類型

### Extension → WebView

#### 1. setBoard

設定預覽視窗的開發板類型。**必須**在 `loadWorkspaceState` 之前發送。

```typescript
interface SetBoardMessage {
	command: 'setBoard';
	board: string; // BOARD_CONFIGS 的 key: 'uno' | 'nano' | 'mega' | 'esp32' | 'supermini'
	warning?: string; // 可選警告訊息，當原始 board 值無效時
}
```

**範例**:

```json
{
	"command": "setBoard",
	"board": "esp32"
}
```

**帶警告範例**:

```json
{
	"command": "setBoard",
	"board": "uno",
	"warning": "無法識別的開發板類型 'esp32_c3'，已使用預設配置"
}
```

#### 2. loadWorkspaceState (現有)

載入 Blockly 工作區狀態。

```typescript
interface LoadWorkspaceStateMessage {
	command: 'loadWorkspaceState';
	workspaceState: object; // Blockly.serialization.workspaces.save() 輸出
}
```

#### 3. updateTheme (現有)

更新主題設定。

```typescript
interface UpdateThemeMessage {
	command: 'updateTheme';
	theme: 'light' | 'dark';
}
```

#### 4. loadError (現有)

通知載入錯誤。

```typescript
interface LoadErrorMessage {
	command: 'loadError';
	error: string;
}
```

### WebView → Extension

#### 1. loadBackupData (現有)

請求載入備份資料。

```typescript
interface LoadBackupDataMessage {
	command: 'loadBackupData';
	fileName: string;
}
```

#### 2. themeChanged (現有)

通知主題變更。

```typescript
interface ThemeChangedMessage {
	command: 'themeChanged';
	theme: 'light' | 'dark';
}
```

#### 3. log (現有)

日誌訊息。

```typescript
interface LogMessage {
	command: 'log';
	source: 'blocklyPreview';
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	args?: string[];
	timestamp: string;
}
```

## 訊息序列

### 正常載入流程

```
Extension                         WebView
    │                                │
    ├──── createWebviewPanel ────────▶
    │                                │
    │◀──── loadBackupData ───────────┤
    │                                │
    │     (讀取備份檔案)              │
    │                                │
    ├──── setBoard ──────────────────▶  ← 新增
    │                                │
    │                        setCurrentBoard()
    │                                │
    ├──── loadWorkspaceState ────────▶
    │                                │
    │                        Blockly.load()
    │                                │
```

### 錯誤流程

```
Extension                         WebView
    │                                │
    │◀──── loadBackupData ───────────┤
    │                                │
    │     (檔案不存在或無效)          │
    │                                │
    ├──── loadError ─────────────────▶
    │                                │
```

## 向後相容性

-   `loadWorkspaceState` 訊息格式維持不變
-   WebView 必須能處理未收到 `setBoard` 的情況（使用預設 board）
-   新增的 `setBoard` 訊息為可選，確保舊版 WebView 不會崩潰
