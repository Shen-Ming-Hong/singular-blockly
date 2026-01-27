# Quickstart: CyberBrick Output Monitor

**Date**: 2026-01-25  
**Feature**: 037-cyberbrick-output-monitor

## 快速開始實作

### 1. 建立 SerialMonitorService

```typescript
// src/services/serialMonitorService.ts
import * as vscode from 'vscode';
import { log } from './logging';
import { MicropythonUploader, ComPortInfo } from './micropythonUploader';

export interface MonitorError {
	code: 'DEVICE_NOT_FOUND' | 'MPREMOTE_NOT_INSTALLED' | 'PORT_IN_USE' | 'CONNECTION_FAILED';
	message: string;
}

export interface MonitorStartResult {
	success: boolean;
	port: string;
	error?: MonitorError;
}

export class SerialMonitorService {
	private terminal: vscode.Terminal | null = null;
	private currentPort: string | null = null;
	private disposables: vscode.Disposable[] = [];
	private uploader: MicropythonUploader;

	private onStoppedCallback?: (reason: string) => void;

	constructor(workspacePath: string) {
		this.uploader = new MicropythonUploader(workspacePath);

		// 監聽終端機關閉事件
		this.disposables.push(
			vscode.window.onDidCloseTerminal(closedTerminal => {
				if (closedTerminal === this.terminal) {
					this.handleTerminalClosed();
				}
			})
		);
	}

	async start(): Promise<MonitorStartResult> {
		// 若已在運行，返回成功
		if (this.terminal) {
			return { success: true, port: this.currentPort! };
		}

		// 檢查 mpremote
		const hasMpremote = await this.uploader.checkMpremoteInstalled();
		if (!hasMpremote) {
			const installed = await this.uploader.installMpremote();
			if (!installed) {
				return {
					success: false,
					port: '',
					error: {
						code: 'MPREMOTE_NOT_INSTALLED',
						message: 'mpremote 工具安裝失敗',
					},
				};
			}
		}

		// 偵測裝置
		const { autoDetected } = await this.uploader.listPorts('cyberbrick');
		if (!autoDetected) {
			return {
				success: false,
				port: '',
				error: {
					code: 'DEVICE_NOT_FOUND',
					message: '找不到 CyberBrick 裝置',
				},
			};
		}

		// 建立終端機
		const mpremotePath = this.uploader.getMpremotePath();
		this.terminal = vscode.window.createTerminal({
			name: 'CyberBrick Monitor',
			hideFromUser: false,
		});

		this.currentPort = autoDetected;
		this.terminal.show(false);
		this.terminal.sendText(`"${mpremotePath}" connect ${autoDetected} repl`, true);

		log('[blockly] Monitor 已啟動', 'info', { port: autoDetected });

		return { success: true, port: autoDetected };
	}

	async stop(): Promise<void> {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
			this.currentPort = null;
			log('[blockly] Monitor 已停止', 'info');
		}
	}

	async stopForUpload(): Promise<void> {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
			this.currentPort = null;
			this.onStoppedCallback?.('upload_started');
			// 等待 COM 埠釋放
			await new Promise(resolve => setTimeout(resolve, 500));
		}
	}

	isRunning(): boolean {
		return this.terminal !== null;
	}

	getCurrentPort(): string | null {
		return this.currentPort;
	}

	onStopped(callback: (reason: string) => void): void {
		this.onStoppedCallback = callback;
	}

	private handleTerminalClosed(): void {
		this.terminal = null;
		const port = this.currentPort;
		this.currentPort = null;
		log('[blockly] Monitor 終端機已關閉', 'info', { port });
		this.onStoppedCallback?.('user_closed');
	}

	dispose(): void {
		this.stop();
		this.disposables.forEach(d => d.dispose());
	}
}
```

### 2. 更新 messageHandler.ts

```typescript
// 在 constructor 中初始化
private serialMonitorService: SerialMonitorService;

constructor(...) {
    // ...existing code...
    this.serialMonitorService = new SerialMonitorService(workspaceRoot);
    this.serialMonitorService.onStopped((reason) => {
        this.panel.webview.postMessage({
            command: 'monitorStopped',
            reason
        });
    });
}

// 新增處理方法
private async handleStartMonitor(message: any): Promise<void> {
    if (message.board !== 'cyberbrick') {
        log('[blockly] Monitor 僅支援 CyberBrick', 'warn');
        return;
    }

    const result = await this.serialMonitorService.start();

    if (result.success) {
        this.panel.webview.postMessage({
            command: 'monitorStarted',
            port: result.port
        });
    } else {
        this.panel.webview.postMessage({
            command: 'monitorError',
            error: result.error
        });
    }
}

private async handleStopMonitor(): Promise<void> {
    await this.serialMonitorService.stop();
    this.panel.webview.postMessage({
        command: 'monitorStopped',
        reason: 'user_closed'
    });
}

// 修改 handleRequestUpload
private async handleRequestUpload(message: any): Promise<void> {
    // 上傳前關閉 Monitor
    await this.serialMonitorService.stopForUpload();

    // ...existing upload code...
}
```

### 3. 更新 WebView (blocklyEdit.js)

```javascript
// 新增 Monitor 按鈕變數
let monitorBtn = null;
let isMonitorRunning = false;

// 初始化時建立按鈕
function initMonitorButton() {
	monitorBtn = document.getElementById('monitor-btn');
	if (monitorBtn) {
		monitorBtn.addEventListener('click', toggleMonitor);
		updateMonitorButtonVisibility();
	}
}

// 根據板子類型顯示/隱藏按鈕
function updateMonitorButtonVisibility() {
	if (!monitorBtn) return;
	const isCyberBrick = currentBoard === 'cyberbrick';
	monitorBtn.style.display = isCyberBrick ? 'flex' : 'none';
}

// 切換 Monitor 狀態
function toggleMonitor() {
	if (isMonitorRunning) {
		vscode.postMessage({ command: 'stopMonitor' });
	} else {
		vscode.postMessage({ command: 'startMonitor', board: currentBoard });
	}
}

// 處理來自 Extension 的訊息
window.addEventListener('message', event => {
	const message = event.data;
	switch (message.command) {
		case 'monitorStarted':
			isMonitorRunning = true;
			updateMonitorButtonState();
			showToast(MSG.MONITOR_CONNECTED.replace('{0}', message.port), 'success');
			break;
		case 'monitorStopped':
			isMonitorRunning = false;
			updateMonitorButtonState();
			if (message.reason === 'upload_started') {
				showToast(MSG.MONITOR_CLOSED_FOR_UPLOAD, 'info');
			}
			break;
		case 'monitorError':
			isMonitorRunning = false;
			updateMonitorButtonState();
			showToast(message.error.message, 'error');
			break;
	}
});

function updateMonitorButtonState() {
	if (!monitorBtn) return;
	monitorBtn.classList.toggle('active', isMonitorRunning);
	monitorBtn.title = isMonitorRunning ? MSG.MONITOR_BUTTON_DISABLED_TITLE : MSG.MONITOR_BUTTON_TITLE;
}
```

### 4. 新增 i18n 翻譯

在 `media/locales/zh-hant/messages.js` 新增：

```javascript
// CyberBrick Monitor
MONITOR_BUTTON_TITLE: '開啟 Monitor',
MONITOR_BUTTON_DISABLED_TITLE: 'Monitor 運行中',
MONITOR_STARTING: '正在連接裝置...',
MONITOR_CONNECTED: '已連接到 {0}',
MONITOR_STOPPED: 'Monitor 已關閉',
MONITOR_DEVICE_NOT_FOUND: '找不到 CyberBrick 裝置',
MONITOR_CONNECTION_FAILED: '無法連接到裝置',
MONITOR_CLOSED_FOR_UPLOAD: 'Monitor 已為上傳作業暫停',
```

---

## 驗證步驟

1. 選擇 CyberBrick 板，確認 Monitor 按鈕顯示
2. 連接 CyberBrick，點擊 Monitor 按鈕
3. 上傳包含 `print()` 的程式，確認終端機顯示輸出
4. 在 Monitor 運行中點擊上傳，確認 Monitor 自動關閉
5. 切換到 Arduino 板，確認 Monitor 按鈕隱藏
