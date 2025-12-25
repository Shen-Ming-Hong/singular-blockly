# Data Model: 修復預覽模式開發板配置顯示錯誤

**Feature Branch**: `018-fix-preview-board-config`
**Date**: 2025-12-25

## 實體定義

### 1. BackupFile (備份檔案)

JSON 格式的專案備份檔案。

```typescript
interface BackupFile {
	workspace: BlocklyWorkspaceState; // Blockly 工作區序列化狀態
	board?: BoardType; // 開發板類型 (可選，向後相容)
	theme?: 'light' | 'dark'; // 主題設定 (可選)
}
```

**儲存位置**: `{workspace}/blockly/backup_*.json`

### 2. BoardType (開發板類型)

```typescript
type BoardType = 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'esp32_super_mini';
```

### 3. BoardConfigKey (開發板配置鍵值)

`BOARD_CONFIGS` 物件使用的內部鍵值。

```typescript
type BoardConfigKey = 'uno' | 'nano' | 'mega' | 'esp32' | 'supermini';
```

### 4. BoardMapping (開發板映射)

備份檔案 board 值到 BOARD_CONFIGS key 的映射。

```typescript
const BOARD_MAPPING: Record<string, BoardConfigKey> = {
	// 標準格式
	arduino_uno: 'uno',
	arduino_nano: 'nano',
	arduino_mega: 'mega',
	esp32: 'esp32',
	esp32_super_mini: 'supermini',
	// 相容簡短格式
	uno: 'uno',
	nano: 'nano',
	mega: 'mega',
	supermini: 'supermini',
};
```

### 5. PreviewMessage (預覽訊息)

Extension 與 WebView 之間的訊息格式。

```typescript
// 設定開發板訊息
interface SetBoardMessage {
	command: 'setBoard';
	board: BoardConfigKey;
	originalBoard?: string; // 原始備份中的 board 值 (用於除錯)
	isDefault?: boolean; // 是否為預設值 (用於警告顯示)
	warning?: string; // 警告訊息 (當 board 無效時)
}

// 載入工作區狀態訊息 (現有)
interface LoadWorkspaceStateMessage {
	command: 'loadWorkspaceState';
	workspaceState: BlocklyWorkspaceState;
}
```

## 狀態轉換

### 預覽載入狀態機

```
[初始]
    │
    ▼ 建立預覽視窗
[HTML 載入中]
    │
    ▼ DOMContentLoaded
[Blockly 初始化]
    │
    ▼ requestBackupData
[等待資料]
    │
    ├──▶ 接收 setBoard ──▶ [板子已設定]
    │                           │
    │                           ▼
    └──▶ 接收 loadWorkspaceState (無 setBoard)
                │
                ▼
          [載入完成 - 使用預設板子]

[板子已設定]
    │
    ▼ 接收 loadWorkspaceState
[載入完成 - 使用指定板子]
```

### 開發板驗證流程

```
輸入: backupBoard (string | undefined)
    │
    ├── undefined ──▶ 使用預設 'uno' ──▶ isDefault: true
    │
    ├── 在 BOARD_MAPPING 中 ──▶ 映射到 BoardConfigKey ──▶ isDefault: false
    │
    └── 不在 BOARD_MAPPING 中 ──▶ 使用預設 'uno' + 警告 ──▶ warning: "無法識別..."
```

## 關聯關係

```
┌─────────────────┐      載入      ┌──────────────────┐
│   BackupFile    │ ────────────▶ │  WebviewManager  │
│ (JSON on disk)  │               │   (Extension)    │
└─────────────────┘               └────────┬─────────┘
                                           │
                              postMessage  │
                                           ▼
                                  ┌─────────────────┐
                                  │ blocklyPreview  │
                                  │   (WebView)     │
                                  └────────┬────────┘
                                           │
                              setCurrentBoard
                                           ▼
                                  ┌─────────────────┐
                                  │  BOARD_CONFIGS  │
                                  │ (window global) │
                                  └─────────────────┘
```

## 驗證規則

### BackupFile 驗證

| 欄位        | 必要  | 驗證規則                       |
| ----------- | ----- | ------------------------------ |
| `workspace` | ✅ 是 | 必須包含 `blocks` 屬性         |
| `board`     | ❌ 否 | 若存在，應為有效 BoardType     |
| `theme`     | ❌ 否 | 若存在，應為 'light' 或 'dark' |

### Board 值驗證

```typescript
function isValidBoard(value: unknown): value is BoardType {
	if (typeof value !== 'string') return false;
	return Object.keys(BOARD_MAPPING).includes(value);
}
```

## 預設值

| 欄位    | 預設值          | 說明             |
| ------- | --------------- | ---------------- |
| `board` | `'arduino_uno'` | 向後相容舊版備份 |
| `theme` | `'light'`       | 跟隨系統預設     |
