# 快速入門：Arduino Serial Monitor 實作指南

**功能分支**: `038-arduino-serial-monitor`  
**建立日期**: 2026-01-27

## 開發環境設置

### 前置需求

- Node.js 22.16.0+
- VS Code 1.105.0+
- PlatformIO Core CLI（隨 PlatformIO IDE 擴展安裝）

### 驗證 PlatformIO CLI

```powershell
# 確認 PlatformIO CLI 可用
pio --version
# 預期輸出: PlatformIO Core, version X.X.X

# 測試 device monitor 命令
pio device list  # 列出可用裝置
```

### 開發模式

```powershell
cd e:\singular-blockly
npm run watch  # 啟動 webpack watch mode
# 按 F5 啟動 Extension Development Host
```

---

## 實作步驟

### Step 1: 建立 ArduinoMonitorService

**檔案**: `src/services/arduinoMonitorService.ts`

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { log } from './logging';
import { MonitorStartResult, MonitorStopReason, ArduinoMonitorConfig } from '../types/arduino';

export class ArduinoMonitorService {
	private terminal: vscode.Terminal | null = null;
	private isRunningFlag = false;
	private currentPort: string | null = null;
	private wasRunningBeforeUpload = false;
	private onStoppedCallback: ((reason: MonitorStopReason) => void) | null = null;

	constructor() {
		// 監聽終端機關閉事件
		vscode.window.onDidCloseTerminal(closedTerminal => {
			if (closedTerminal === this.terminal) {
				this.handleTerminalClosed();
			}
		});
	}

	async start(board: string, workspacePath: string): Promise<MonitorStartResult> {
		// 實作細節見 Step 3
	}

	async stop(): Promise<void> {
		if (this.terminal) {
			this.terminal.dispose();
			this.terminal = null;
		}
		this.isRunningFlag = false;
		this.currentPort = null;
	}

	// ... 其他方法
}
```

### Step 2: 實作 platformio.ini 解析

**在 ArduinoMonitorService 中加入**:

```typescript
private getBaudRate(workspacePath: string): number {
  const DEFAULT_BAUD = 115200;
  const iniPath = path.join(workspacePath, 'platformio.ini');

  try {
    if (!fs.existsSync(iniPath)) {
      return DEFAULT_BAUD;
    }

    const content = fs.readFileSync(iniPath, 'utf-8');
    const match = content.match(/monitor_speed\s*=\s*(\d+)/);

    if (match) {
      const baud = parseInt(match[1], 10);
      log(`從 platformio.ini 讀取 baud rate: ${baud}`, 'info');
      return baud;
    }
  } catch (error) {
    log(`解析 platformio.ini 失敗: ${error}`, 'warn');
  }

  return DEFAULT_BAUD;
}
```

### Step 3: 實作 start() 方法

```typescript
async start(board: string, workspacePath: string): Promise<MonitorStartResult> {
  if (this.isRunningFlag) {
    return { success: true, port: this.currentPort! };
  }

  try {
    // 1. 取得 baud rate
    const baudRate = this.getBaudRate(workspacePath);

    // 2. 偵測連接埠 (由 PlatformIO 自動處理)

    // 3. 建構命令
    const args = [
      'pio', 'device', 'monitor',
      '--baud', String(baudRate),
      '--project-dir', workspacePath
    ];

    // 4. ESP32 系列自動啟用 exception decoder
    if (this.isEsp32Board(board)) {
      args.push('--filter', 'esp32_exception_decoder');
    }

    // 5. 建立終端機
    this.terminal = vscode.window.createTerminal({
      name: 'Serial Monitor',
      cwd: workspacePath
    });

    this.terminal.sendText(args.join(' '));
    this.terminal.show(true);

    this.isRunningFlag = true;
    log(`Arduino Serial Monitor 已啟動 (baud: ${baudRate})`, 'info');

    return { success: true, port: 'auto' };

  } catch (error) {
    log(`啟動 Serial Monitor 失敗: ${error}`, 'error');
    return {
      success: false,
      port: '',
      error: { code: 'UNKNOWN', message: String(error) }
    };
  }
}

private isEsp32Board(board: string): boolean {
  return ['esp32', 'supermini'].includes(board);
}
```

### Step 4: 更新 messageHandler.ts

**在 `handleStartMonitor()` 中加入路由邏輯**:

```typescript
import { getBoardLanguage } from '../types/arduino';
import { ArduinoMonitorService } from '../services/arduinoMonitorService';

// 類別成員
private arduinoMonitorService: ArduinoMonitorService;

// 初始化
constructor(...) {
  this.arduinoMonitorService = new ArduinoMonitorService();
}

private async handleStartMonitor(message: any): Promise<void> {
  const board = message.board;
  const language = getBoardLanguage(board);

  if (language === 'arduino') {
    // 使用 Arduino Monitor Service
    const result = await this.arduinoMonitorService.start(board, this.workspacePath);
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
  } else {
    // 使用現有的 MicroPython SerialMonitorService
    await this.serialMonitorService.start(...);
  }
}
```

### Step 5: 更新 WebView 按鈕可見性

**檔案**: `media/js/blocklyEdit.js`

**修改 `updateMonitorButtonVisibility()` 函式**:

```javascript
function updateMonitorButtonVisibility() {
	const monitorContainer = document.getElementById('monitorContainer');
	if (!monitorContainer) return;

	const currentBoard = window.currentBoard || 'none';

	// 新邏輯：對所有開發板顯示（MicroPython + Arduino 語言）
	const shouldShow = currentBoard !== 'none';

	monitorContainer.style.display = shouldShow ? 'flex' : 'none';

	log.info('[Monitor] Button visibility updated:', {
		board: currentBoard,
		visible: shouldShow,
	});
}
```

### Step 6: 整合上傳流程

**檔案**: `src/services/arduinoUploader.ts`

```typescript
// 在上傳方法開頭
async upload(...) {
  // 上傳前關閉 Monitor 並記錄狀態
  await this.arduinoMonitorService.stopForUpload();

  try {
    // ... 執行上傳 ...

    if (uploadSuccess) {
      // 上傳成功，根據先前狀態重啟 Monitor
      await this.arduinoMonitorService.restartAfterUpload(board, workspacePath);
    }
    // 上傳失敗時不重啟 Monitor

  } catch (error) {
    // 錯誤處理 - Monitor 保持關閉
  }
}
```

---

## 測試指南

### 手動測試檢查表

- [ ] **P1-1**: ESP32 開發板可以開啟 Serial Monitor
- [ ] **P1-2**: Arduino UNO 開發板可以開啟 Serial Monitor
- [ ] **P1-3**: 點擊 Monitor 按鈕可以關閉 Monitor
- [ ] **P1-4**: 手動關閉終端機時按鈕狀態同步
- [ ] **P1-5**: 上傳前 Monitor 開啟 → 上傳成功 → Monitor 自動重啟
- [ ] **P1-6**: 上傳前 Monitor 關閉 → 上傳成功 → Monitor 保持關閉
- [ ] **P1-7**: 上傳前 Monitor 開啟 → 上傳失敗 → Monitor 保持關閉
- [ ] **P2-1**: platformio.ini 有 monitor_speed=9600 時使用正確速率
- [ ] **P2-2**: ESP32 崩潰時顯示解碼後的錯誤訊息

### 單元測試

```powershell
# 執行測試
npm test

# 帶覆蓋率
npm run test:coverage
```

---

## 常見問題

### Q: PlatformIO CLI 找不到

```powershell
# 確認 PlatformIO 已安裝
pio --version

# 如果找不到，可能需要重新載入 VS Code 或重啟終端機
```

### Q: Serial Monitor 顯示亂碼

1. 檢查 platformio.ini 中的 `monitor_speed` 是否與程式碼中的 `Serial.begin()` 相符
2. 若無設定，預設使用 115200

### Q: ESP32 exception decoder 不生效

1. 確認專案已編譯（存在 `.pio/build/*/firmware.elf`）
2. 若 .elf 不存在，先執行一次編譯
