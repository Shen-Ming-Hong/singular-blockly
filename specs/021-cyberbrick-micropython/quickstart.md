# Quickstart: CyberBrick MicroPython 積木支援

**Feature Branch**: `021-cyberbrick-micropython`  
**建立日期**: 2025-12-29

本指南協助開發者快速了解並開始實作 CyberBrick MicroPython 功能。

---

## 🎯 功能概述

為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援：

-   MicroPython 程式碼生成器
-   使用 mpremote 一鍵上傳
-   工作區與裝置程式備份
-   主板切換時的安全保護

---

## 📂 相關文件

| 文件                                                             | 說明               |
| ---------------------------------------------------------------- | ------------------ |
| [spec.md](./spec.md)                                             | 功能規格與驗收條件 |
| [plan.md](./plan.md)                                             | 實作計畫與架構決策 |
| [research.md](./research.md)                                     | 技術研究結果       |
| [data-model.md](./data-model.md)                                 | 資料模型定義       |
| [contracts/webview-messages.md](./contracts/webview-messages.md) | WebView 訊息契約   |

---

## 🚀 快速開始

### 1. 環境準備

```powershell
# 確認 Node.js 版本
node --version  # 應為 22.16.0+

# 安裝依賴
npm install

# 編譯專案
npm run compile
```

### 2. 測試 mpremote

```powershell
# 使用 PlatformIO Python 環境
$PIO_PYTHON = "$env:USERPROFILE\.platformio\penv\Scripts\python.exe"

# 安裝 mpremote
& $PIO_PYTHON -m pip install mpremote

# 列出可用裝置
& $PIO_PYTHON -m mpremote connect list

# 測試連接（將 COM3 替換為實際埠）
& $PIO_PYTHON -m mpremote connect COM3 repl
```

### 3. 執行擴充功能

按 `F5` 啟動除錯模式，在新視窗中測試功能。

---

## 🏗️ 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code Extension                       │
├──────────────────────┬──────────────────────────────────────┤
│   WebView (Browser)  │         Extension Host (Node.js)     │
├──────────────────────┼──────────────────────────────────────┤
│                      │                                       │
│  blocklyEdit.js      │  messageHandler.ts                   │
│  ├─ 主板選擇         │  ├─ handleUpdateBoard()              │
│  ├─ 積木編輯         │  ├─ handleRequestUpload() [新增]     │
│  └─ 程式碼顯示       │  └─ handleBoardSwitch() [新增]       │
│                      │                                       │
│  generators/         │  services/                            │
│  ├─ arduino/         │  ├─ fileService.ts                   │
│  └─ micropython/     │  ├─ settingsManager.ts               │
│      [新增目錄]      │  └─ micropythonUploader.ts [新增]    │
│                      │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📝 開發步驟

### Step 1: 擴展主板配置

編輯 `media/blockly/blocks/board_configs.js`：

```javascript
window.BOARD_CONFIGS.cyberbrick = {
	name: 'CyberBrick',
	language: 'micropython', // 新增欄位
	toolbox: 'cyberbrick.json', // 新增欄位
	uploadMethod: 'mpremote', // 新增欄位
	devicePath: '/app/rc_main.py', // 新增欄位

	digitalPins: [
		['GPIO 0', '0'],
		['GPIO 1', '1'],
		// ... 完整清單見 data-model.md
	],

	analogPins: [
		['GPIO 0 (ADC1)', '0'],
		// ...
	],

	// ...其他配置
};
```

### Step 2: 建立 MicroPython 生成器

建立 `media/blockly/generators/micropython/index.js`：

```javascript
// MicroPython 生成器入口
window.micropythonGenerator = new Blockly.Generator('MicroPython');

// 設定縮排
window.micropythonGenerator.INDENT = '    '; // 4 空格

// Import 追蹤
window.micropythonGenerator.imports_ = new Set();

// 重置函數
window.micropythonGenerator.reset = function () {
	this.imports_.clear();
};

// 生成完整程式碼
window.micropythonGenerator.workspaceToCode = function (workspace) {
	this.reset();

	// 生成區塊程式碼
	const blockCode = this.blockToCode(workspace.getTopBlocks(true));

	// 組合 imports
	const imports = Array.from(this.imports_).sort().join('\n');

	// 組合完整程式碼
	return `# CyberBrick MicroPython
${imports}

${blockCode}
`;
};
```

### Step 3: 實作上傳服務

建立 `src/services/micropythonUploader.ts`：

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import { log } from './logging';

const execAsync = promisify(exec);

export interface UploadOptions {
	code: string;
	port: string;
	devicePath: string;
}

export interface UploadResult {
	success: boolean;
	error?: string;
}

export class MicropythonUploader {
	private pythonPath: string;

	constructor() {
		// PlatformIO Python 路徑
		this.pythonPath = process.platform === 'win32' ? `${process.env.USERPROFILE}\\.platformio\\penv\\Scripts\\python.exe` : `${process.env.HOME}/.platformio/penv/bin/python`;
	}

	async upload(options: UploadOptions): Promise<UploadResult> {
		const { code, port, devicePath } = options;

		try {
			// 1. 寫入暫存檔
			const tempFile = await this.writeTempFile(code);

			// 2. 執行 mpremote 上傳
			const cmd = `"${this.pythonPath}" -m mpremote connect ${port} reset + soft-reset + fs cp "${tempFile}" :${devicePath} + reset`;

			log(`執行上傳命令: ${cmd}`, 'info');
			await execAsync(cmd);

			return { success: true };
		} catch (error) {
			log(`上傳失敗: ${error}`, 'error');
			return { success: false, error: String(error) };
		}
	}

	private async writeTempFile(code: string): Promise<string> {
		// 實作暫存檔寫入...
	}
}
```

### Step 4: 擴展訊息處理

編輯 `src/webview/messageHandler.ts`：

```typescript
// 在 handleMessage switch 中新增
case 'requestUpload':
  await this.handleRequestUpload(message);
  break;

case 'boardSwitchConfirm':
  await this.handleBoardSwitchConfirm(message);
  break;

// 新增處理函數
private async handleRequestUpload(message: any): Promise<void> {
  const { code, board, port } = message;

  // 驗證主板
  const boardConfig = this.getBoardConfig(board);
  if (boardConfig?.language !== 'micropython') {
    this.sendProgress('failed', '不支援的主板類型');
    return;
  }

  // 執行上傳
  const uploader = new MicropythonUploader();
  // ...
}
```

---

## 🧪 測試要點

### 單元測試

```typescript
// src/test/micropythonUploader.test.ts
describe('MicropythonUploader', () => {
	it('should detect mpremote availability', async () => {
		const uploader = new MicropythonUploader();
		const available = await uploader.checkMpremote();
		expect(typeof available).toBe('boolean');
	});

	it('should generate correct upload command', () => {
		const cmd = uploader.buildUploadCommand({
			port: 'COM3',
			devicePath: '/app/rc_main.py',
			tempFile: '/tmp/code.py',
		});
		expect(cmd).toContain('mpremote');
		expect(cmd).toContain('COM3');
	});
});
```

### 手動測試

| 情境       | 步驟               | 預期結果                      |
| ---------- | ------------------ | ----------------------------- |
| 主板切換   | 選擇 CyberBrick    | 工具箱切換為 MicroPython 積木 |
| 程式碼生成 | 拖拉 LED 積木      | 顯示正確 MicroPython 程式碼   |
| 上傳程式   | 連接硬體後點擊上傳 | 程式成功執行                  |

---

## ⚠️ 注意事項

### 常見問題

1. **mpremote 找不到**

    - 確認 PlatformIO 已安裝
    - 手動執行 `pip install mpremote`

2. **連接埠存取被拒**

    - Windows: 確認 USB 驅動已安裝
    - Linux: 將使用者加入 `dialout` 群組

3. **上傳逾時**
    - 檢查 CyberBrick 是否正確連接
    - 嘗試按下 BOOT + RESET 按鈕重置

### 程式碼風格

-   使用 `log.*` 方法記錄（不使用 `console.log`）
-   TypeScript 服務使用依賴注入
-   WebView 程式碼使用 `window.` 全域變數

---

## 📚 參考資源

-   [mpremote 官方文件](https://docs.micropython.org/en/latest/reference/mpremote.html)
-   [ESP32-C3 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf)
-   [MicroPython ESP32 快速參考](https://docs.micropython.org/en/latest/esp32/quickref.html)
-   [Blockly 程式碼生成器指南](https://developers.google.com/blockly/guides/create-custom-blocks/generating-code)

---

## 🔗 相關 Specs

-   `specs/016-esp32-wifi-mqtt/` - ESP32 WiFi/MQTT 功能（Arduino）
-   `specs/017-ctrl-s-quick-backup/` - 快速備份功能
