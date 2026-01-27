# Research: CyberBrick Output Monitor

**Date**: 2026-01-25  
**Feature**: 037-cyberbrick-output-monitor

## 研究任務

1. VSCode Terminal API 的建立與管理方式
2. mpremote 命令用於監控串口輸出的最佳方案
3. 處理埠衝突的最佳實踐

---

## Decision 1: VSCode Terminal API 使用方式

### 決策

使用 `vscode.window.createTerminal(options)` 建立專用終端機，搭配 `TerminalOptions` 配置終端機名稱與環境變數。

### 理由

VSCode Terminal API 提供成熟的終端機管理功能，支援：

- 命名終端機（易於識別 Monitor 終端機）
- 程序執行（透過 `sendText()` 執行 mpremote 命令）
- 生命週期管理（`show()`, `hide()`, `dispose()`）
- 關閉事件監聽（`onDidCloseTerminal`）

### 相關 API

```typescript
// 建立終端機
const terminal = vscode.window.createTerminal({
	name: 'CyberBrick Monitor',
	cwd: workspacePath,
	hideFromUser: false, // 立即顯示
});

// 執行命令
terminal.sendText('mpremote connect COM3 repl', true);

// 顯示終端機
terminal.show(false); // preserveFocus = false

// 監聽關閉事件
vscode.window.onDidCloseTerminal(closedTerminal => {
	if (closedTerminal === terminal) {
		// 清理資源
	}
});

// 關閉終端機
terminal.dispose();
```

### 替代方案考量

- **Pseudoterminal**: 提供更細粒度的控制，但實作複雜度高，且 mpremote 已處理好 ANSI 輸出
- **Output Channel**: 僅適合唯讀日誌輸出，無法提供互動式操作（未來 REPL 擴展需求）

---

## Decision 2: mpremote 監控串口輸出的方式

### 決策

使用 `mpremote connect <port> repl` 命令進入 REPL 模式，作為 Serial Monitor 功能。

### 理由

根據 [mpremote 官方文件](https://docs.micropython.org/en/latest/reference/mpremote.html)：

> The name "REPL" here reflects that the common usage of this command to access the Read Eval Print Loop that is running on the MicroPython device. Strictly, the `repl` command is just functioning as a **terminal (or "serial monitor")** to access the device.

`repl` 命令的特性：

1. **即時串流**: 顯示裝置所有 stdout 輸出（包含 `print()` 呼叫）
2. **不觸發 soft-reset**: 搭配 `resume` 可保持程式執行狀態
3. **互動式支援**: 可接收使用者輸入（未來 REPL 功能擴展）
4. **自動處理 ANSI**: mpremote 已處理好終端機 escape 序列

### 命令格式

```bash
# 基本監控（會觸發 soft-reset）
mpremote connect COM3 repl

# 保持程式執行狀態的監控（推薦）
mpremote connect COM3 resume repl
```

### 替代方案考量

- **`mpremote run <file>`**: 適合執行腳本並顯示輸出，但我們需要監控已上傳並執行中的程式
- **`mpremote exec`**: 執行單一表達式，不適合持續監控
- **直接 pyserial**: 需要處理低階串口通訊細節，mpremote 已封裝好

---

## Decision 3: 埠衝突處理策略

### 決策

在上傳前自動關閉 Monitor 終端機，釋放 COM 埠。上傳完成後提示使用者可重新開啟 Monitor。

### 理由

1. **單一埠限制**: 大多數 USB CDC 裝置（包含 CyberBrick）同一時間只允許一個程式佔用 COM 埠
2. **使用者體驗**: 自動處理衝突比顯示錯誤訊息更友善
3. **現有模式**: 此模式符合 Arduino IDE 和 PlatformIO 的行為

### 實作方式

```typescript
// SerialMonitorService
class SerialMonitorService {
    private activeTerminal: vscode.Terminal | null = null;
    private currentPort: string | null = null;

    async stopForUpload(): Promise<void> {
        if (this.activeTerminal) {
            this.activeTerminal.dispose();
            this.activeTerminal = null;
            // 等待 COM 埠釋放
            await this.delay(500);
        }
    }

    isRunning(): boolean {
        return this.activeTerminal !== null;
    }
}

// 在 messageHandler.ts 的 upload 流程中
async handleRequestUpload(message: UploadRequestMessage) {
    // 上傳前關閉 Monitor
    await this.serialMonitorService.stopForUpload();

    // 執行上傳...
    const result = await uploader.upload(request, onProgress);

    // 上傳成功後提示可重新開啟 Monitor
    if (result.success) {
        this.panel.webview.postMessage({
            command: 'uploadComplete',
            canMonitor: true
        });
    }
}
```

### 替代方案考量

- **雙埠模式**: 某些裝置支援多個 USB 端點，但 CyberBrick 只有單一 CDC 埠
- **提示使用者手動關閉**: 增加操作步驟，降低使用體驗

---

## Decision 4: WebView UI 整合方式

### 決策

在 WebView 工具列新增 Monitor SVG 按鈕，僅當選擇 CyberBrick 板時顯示。

### 理由

1. **一致性**: 與現有的上傳按鈕設計風格一致
2. **條件顯示**: 透過 `getBoardLanguage(board)` 判斷，Arduino 板使用 PlatformIO Serial Monitor
3. **i18n 支援**: 使用現有的翻譯機制

### SVG 圖示設計參考

使用終端機/監控圖示，建議採用 VSCode 內建的 `terminal` 圖示風格或自訂 SVG：

```html
<!-- Monitor 按鈕 (僅 CyberBrick 時顯示) -->
<button id="monitor-btn" title="${MONITOR_BUTTON_TITLE}" style="display: ${isCyberBrick ? 'block' : 'none'}">
	<svg><!-- terminal icon --></svg>
</button>
```

### 訊息協定

```typescript
// WebView → Extension
{ command: 'startMonitor', board: 'cyberbrick' }
{ command: 'stopMonitor' }

// Extension → WebView
{ command: 'monitorStarted', port: 'COM3' }
{ command: 'monitorStopped' }
{ command: 'monitorError', message: '找不到裝置' }
```

---

## Decision 5: CyberBrick 裝置偵測邏輯

### 決策

複用 `MicropythonUploader.listPorts('cyberbrick')` 方法，透過 USB VID/PID 自動偵測。

### 理由

1. **程式碼複用**: 現有 `MicropythonUploader` 已實作完整的 mpremote 埠偵測邏輯
2. **準確識別**: 使用 VID: 303A, PID: 1001 精確識別 CyberBrick
3. **錯誤處理**: 現有的錯誤訊息和裝置未連接處理邏輯可直接套用

### 偵測流程

```typescript
async startMonitor(): Promise<void> {
    const { autoDetected } = await this.uploader.listPorts('cyberbrick');
    if (!autoDetected) {
        throw new Error('CyberBrick 裝置未連接');
    }
    await this.openTerminal(autoDetected);
}
```

---

## 技術風險與緩解措施

| 風險                 | 可能性 | 影響 | 緩解措施                                   |
| -------------------- | ------ | ---- | ------------------------------------------ |
| mpremote 版本不相容  | 低     | 中   | 記錄測試過的版本，安裝時指定版本           |
| COM 埠釋放延遲       | 中     | 低   | 關閉終端機後等待 500ms                     |
| 裝置斷線未偵測       | 中     | 中   | 監聽 `onDidCloseTerminal` 事件處理         |
| 多個 CyberBrick 連接 | 低     | 低   | 使用首個偵測到的裝置（與現有上傳行為一致） |

---

## 參考資料

1. [VSCode Terminal API](https://code.visualstudio.com/api/references/vscode-api#Terminal)
2. [mpremote Documentation](https://docs.micropython.org/en/latest/reference/mpremote.html)
3. [現有 MicropythonUploader 實作](../src/services/micropythonUploader.ts)
