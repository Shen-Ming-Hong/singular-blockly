# WebView Message Contracts: CyberBrick Output Monitor

**Date**: 2026-01-25  
**Feature**: 037-cyberbrick-output-monitor

## Overview

定義 WebView 與 Extension 之間的訊息通訊協定，遵循現有 `messageHandler.ts` 的設計模式。

---

## WebView → Extension Messages

### startMonitor

啟動 Serial Monitor，連接到 CyberBrick 裝置。

```typescript
interface StartMonitorMessage {
	command: 'startMonitor';
	board: string; // 當前板子類型，預期為 'cyberbrick'
}
```

**觸發時機**: 使用者點擊 Monitor 按鈕

**處理流程**:

1. 驗證 `board === 'cyberbrick'`
2. 檢查 mpremote 是否已安裝（複用 `MicropythonUploader.checkMpremoteInstalled()`）
3. 若未安裝，自動安裝 mpremote
4. 偵測 CyberBrick 裝置（複用 `MicropythonUploader.listPorts('cyberbrick')`）
5. 開啟 VSCode Terminal 並執行 `mpremote connect <port> repl`
6. 回傳 `monitorStarted` 或 `monitorError`

---

### stopMonitor

手動停止 Serial Monitor。

```typescript
interface StopMonitorMessage {
	command: 'stopMonitor';
}
```

**觸發時機**: 使用者點擊 Stop Monitor 按鈕或按下快捷鍵

**處理流程**:

1. 呼叫 `SerialMonitorService.stop()`
2. 終端機執行 `dispose()`
3. 回傳 `monitorStopped`

---

## Extension → WebView Messages

### monitorStarted

Monitor 成功啟動並連接到裝置。

```typescript
interface MonitorStartedMessage {
	command: 'monitorStarted';
	port: string; // 連接的 COM 埠，例如 'COM3' 或 '/dev/ttyACM0'
}
```

**WebView 處理**:

- 更新按鈕狀態為「運行中」
- 顯示連接成功的 Toast 訊息

---

### monitorStopped

Monitor 已停止（使用者手動關閉或系統自動關閉）。

```typescript
interface MonitorStoppedMessage {
	command: 'monitorStopped';
	reason?: 'user_closed' | 'upload_started' | 'device_disconnected';
}
```

**WebView 處理**:

- 還原按鈕狀態為「可點擊」
- 若 `reason === 'upload_started'`，顯示提示訊息

---

### monitorError

Monitor 操作失敗。

```typescript
interface MonitorErrorMessage {
	command: 'monitorError';
	error: {
		code: 'DEVICE_NOT_FOUND' | 'MPREMOTE_NOT_INSTALLED' | 'PORT_IN_USE' | 'CONNECTION_FAILED';
		message: string; // 已本地化的錯誤訊息
	};
}
```

**WebView 處理**:

- 顯示錯誤 Toast 訊息
- 還原按鈕狀態為「可點擊」

---

## Message Handler Switch Case

在 `messageHandler.ts` 中新增的處理分支：

```typescript
switch (message.command) {
	// ... existing cases ...

	case 'startMonitor':
		await this.handleStartMonitor(message);
		break;
	case 'stopMonitor':
		await this.handleStopMonitor();
		break;
}
```

---

## 完整訊息流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        正常啟動流程                               │
└─────────────────────────────────────────────────────────────────┘

 WebView                          Extension
    │                                 │
    │  { command: 'startMonitor',     │
    │    board: 'cyberbrick' }        │
    │ ─────────────────────────────►  │
    │                                 │ checkMpremoteInstalled()
    │                                 │ listPorts('cyberbrick')
    │                                 │ createTerminal()
    │                                 │ sendText('mpremote...')
    │  { command: 'monitorStarted',   │
    │    port: 'COM3' }               │
    │ ◄─────────────────────────────  │
    │                                 │

┌─────────────────────────────────────────────────────────────────┐
│                        上傳時自動關閉                              │
└─────────────────────────────────────────────────────────────────┘

 WebView                          Extension
    │                                 │
    │  { command: 'requestUpload',    │
    │    code: '...', board: '...' }  │
    │ ─────────────────────────────►  │
    │                                 │ serialMonitorService.stop()
    │                                 │ micropythonUploader.upload()
    │  { command: 'monitorStopped',   │
    │    reason: 'upload_started' }   │
    │ ◄─────────────────────────────  │
    │                                 │ (upload proceeds...)
    │                                 │

┌─────────────────────────────────────────────────────────────────┐
│                        錯誤處理流程                               │
└─────────────────────────────────────────────────────────────────┘

 WebView                          Extension
    │                                 │
    │  { command: 'startMonitor',     │
    │    board: 'cyberbrick' }        │
    │ ─────────────────────────────►  │
    │                                 │ listPorts('cyberbrick')
    │                                 │ → autoDetected: undefined
    │  { command: 'monitorError',     │
    │    error: { code: 'DEVICE_NOT_  │
    │    FOUND', message: '...' } }   │
    │ ◄─────────────────────────────  │
    │                                 │
```

---

## 向後相容性

此功能新增訊息類型，不影響現有訊息處理。所有新訊息皆為可選處理，舊版 WebView 忽略未知訊息。
