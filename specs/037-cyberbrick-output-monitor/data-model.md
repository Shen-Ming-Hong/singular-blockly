# Data Model: CyberBrick Output Monitor

**Date**: 2026-01-25  
**Feature**: 037-cyberbrick-output-monitor

## Entities

### SerialMonitorState

| 欄位        | 類型                      | 說明                 |
| ----------- | ------------------------- | -------------------- |
| `isRunning` | `boolean`                 | Monitor 是否正在運行 |
| `port`      | `string \| null`          | 當前連接的 COM 埠    |
| `terminal`  | `vscode.Terminal \| null` | VSCode 終端機實例    |

```typescript
interface SerialMonitorState {
	isRunning: boolean;
	port: string | null;
	terminal: vscode.Terminal | null;
}
```

---

### MonitorStartResult

| 欄位      | 類型                        | 說明          |
| --------- | --------------------------- | ------------- |
| `success` | `boolean`                   | 是否成功啟動  |
| `port`    | `string`                    | 連接的 COM 埠 |
| `error`   | `MonitorError \| undefined` | 錯誤資訊      |

```typescript
interface MonitorStartResult {
	success: boolean;
	port: string;
	error?: MonitorError;
}
```

---

### MonitorError

| 欄位      | 類型               | 說明     |
| --------- | ------------------ | -------- |
| `code`    | `MonitorErrorCode` | 錯誤代碼 |
| `message` | `string`           | 錯誤訊息 |

```typescript
type MonitorErrorCode =
	| 'DEVICE_NOT_FOUND' // 找不到 CyberBrick 裝置
	| 'MPREMOTE_NOT_INSTALLED' // mpremote 工具未安裝
	| 'PORT_IN_USE' // COM 埠被佔用
	| 'CONNECTION_FAILED'; // 連接失敗

interface MonitorError {
	code: MonitorErrorCode;
	message: string;
}
```

---

## State Transitions

```
┌─────────────────┐
│     IDLE        │◄──────────────────────────────┐
│ (isRunning:     │                               │
│  false)         │                               │
└────────┬────────┘                               │
         │                                        │
         │ startMonitor()                         │
         ▼                                        │
┌─────────────────┐                               │
│   CONNECTING    │                               │
│ (detecting &    │                               │
│  opening term)  │                               │
└────────┬────────┘                               │
         │                                        │
    ┌────┴────┐                                   │
    │         │                                   │
    ▼         ▼                                   │
┌────────┐ ┌────────┐                             │
│SUCCESS │ │ ERROR  │─────────────────────────────┘
└────┬───┘ └────────┘
     │
     ▼
┌─────────────────┐
│    RUNNING      │
│ (isRunning:     │
│  true, port:    │
│  'COMx')        │
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐    ┌─────────────────┐
│stopMonitor() │    │Terminal closed  │
│              │    │by user          │
└──────┬───────┘    └────────┬────────┘
       │                      │
       └──────────┬───────────┘
                  │
                  ▼
            ┌───────────┐
            │   IDLE    │
            └───────────┘
```

---

## WebView Message Types

### WebView → Extension

```typescript
// 開始監控
interface StartMonitorMessage {
	command: 'startMonitor';
	board: string; // 應為 'cyberbrick'
}

// 停止監控
interface StopMonitorMessage {
	command: 'stopMonitor';
}
```

### Extension → WebView

```typescript
// Monitor 已啟動
interface MonitorStartedMessage {
	command: 'monitorStarted';
	port: string;
}

// Monitor 已停止
interface MonitorStoppedMessage {
	command: 'monitorStopped';
	reason?: 'user_closed' | 'upload_started' | 'device_disconnected';
}

// Monitor 錯誤
interface MonitorErrorMessage {
	command: 'monitorError';
	error: MonitorError;
}
```

---

## Validation Rules

1. **板子類型驗證**: `board` 必須為 `'cyberbrick'`，其他板子應使用 PlatformIO Serial Monitor
2. **重複啟動防護**: 若 Monitor 已在運行中，忽略重複的 `startMonitor` 請求
3. **裝置連接驗證**: 啟動前必須偵測到 CyberBrick (VID: 303A, PID: 1001)

---

## i18n Keys

需新增的翻譯鍵：

| Key                             | 說明               | 範例 (zh-TW)             |
| ------------------------------- | ------------------ | ------------------------ |
| `MONITOR_BUTTON_TITLE`          | Monitor 按鈕標題   | 開啟 Monitor             |
| `MONITOR_BUTTON_DISABLED_TITLE` | 已開啟時的按鈕標題 | Monitor 運行中           |
| `MONITOR_STARTING`              | 啟動中訊息         | 正在連接裝置...          |
| `MONITOR_CONNECTED`             | 已連接訊息         | 已連接到 {0}             |
| `MONITOR_STOPPED`               | 已停止訊息         | Monitor 已關閉           |
| `MONITOR_DEVICE_NOT_FOUND`      | 裝置未找到錯誤     | 找不到 CyberBrick 裝置   |
| `MONITOR_DEVICE_DISCONNECTED`   | 裝置斷線訊息       | CyberBrick 裝置已斷線    |
| `MONITOR_CONNECTION_FAILED`     | 連接失敗錯誤       | 無法連接到裝置           |
| `MONITOR_CLOSED_FOR_UPLOAD`     | 上傳時關閉提示     | Monitor 已為上傳作業暫停 |
