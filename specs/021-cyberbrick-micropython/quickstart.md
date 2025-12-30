# Quickstart: CyberBrick MicroPython 積木支援

**Feature Branch**: `021-cyberbrick-micropython`  
**建立日期**: 2025-12-29  
**更新日期**: 2025-12-30

本指南協助開發者快速了解並開始實作 CyberBrick MicroPython 功能。

---

## 🎯 功能概述

為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援：

-   MicroPython 程式碼生成器
-   使用 mpremote 一鍵上傳
-   工作區與裝置程式備份（使用現有 Ctrl+S 機制）
-   主板切換時的安全保護
-   **選擇 CyberBrick 時自動刪除 platformio.ini**（2025-12-30 新增）
-   **上傳按鈕與現有控制區樣式一致**（2025-12-30 新增）

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
│  ├─ 上傳按鈕 [新增]  │  ├─ handleDeletePlatformioIni() [新] │
│  └─ 程式碼顯示       │  └─ handleBoardSwitch() [新增]       │
│                      │                                       │
│  generators/         │  services/                            │
│  ├─ arduino/         │  ├─ fileService.ts                   │
│  └─ micropython/     │  ├─ settingsManager.ts               │
│      [新增目錄]      │  ├─ quickSaveManager.ts [重用]       │
│                      │  └─ micropythonUploader.ts [新增]    │
│                      │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

---

## 📝 開發步驟（更新後的優先順序）

### ⚠️ 實作順序（重要）

根據 spec.md FR-033，實作順序 **MUST** 遵循：

1. **Phase 1a**: UI/UX 互動正確性驗證
    - 工具箱切換（Arduino ↔ MicroPython）
    - 上傳按鈕顯示/隱藏
    - platformio.ini 自動刪除
2. **Phase 1b**: 程式碼生成功能

    - MicroPython 生成器
    - 核心積木（LED、GPIO、WiFi、時序）

3. **Phase 1c**: 上傳按鈕內部功能
    - mpremote 整合
    - 上傳流程
    - Toast 通知

---

### Step 1: 擴展主板配置

編輯 `media/blockly/blocks/board_configs.js`：

```javascript
window.BOARD_CONFIGS.cyberbrick = {
	name: 'CyberBrick',
	language: 'micropython', // 新增欄位
	toolbox: 'cyberbrick.json', // 新增欄位
	uploadMethod: 'mpremote', // 新增欄位
	devicePath: '/app/rc_main.py', // 新增欄位
	usbIdentifier: { vid: '303A', pid: '1001' }, // 新增欄位

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

### Step 2: 新增上傳按鈕（2025-12-30 新增）

編輯 `media/html/blocklyEdit.html`，在控制區新增上傳按鈕：

```html
<!-- 上傳按鈕（僅 CyberBrick 時可見） -->
<button id="uploadButton" title="上傳到 CyberBrick" style="display: none;">
	<svg viewBox="0 0 24 24" width="16" height="16">
		<path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" fill="currentColor" />
	</svg>
</button>
```

編輯 `media/js/blocklyEdit.js`，新增按鈕控制邏輯：

```javascript
// 上傳按鈕顯示/隱藏
function updateUploadButtonVisibility(board) {
	const uploadButton = document.getElementById('uploadButton');
	const boardConfig = window.BOARD_CONFIGS[board];

	if (boardConfig?.language === 'micropython') {
		uploadButton.style.display = 'block';
		console.log('[blockly] 上傳按鈕已顯示');
	} else {
		uploadButton.style.display = 'none';
		console.log('[blockly] 上傳按鈕已隱藏');
	}
}

// 上傳中狀態（同重新整理按鈕的旋轉動畫）
function setUploadingState(isUploading) {
	const uploadButton = document.getElementById('uploadButton');
	if (isUploading) {
		uploadButton.disabled = true;
		uploadButton.classList.add('spinning');
	} else {
		uploadButton.disabled = false;
		uploadButton.classList.remove('spinning');
	}
}
```

### Step 3: platformio.ini 清理（2025-12-30 新增）

編輯 `media/js/blocklyEdit.js`，在主板切換時請求刪除：

```javascript
async function handleBoardChange(newBoard) {
	const boardConfig = window.BOARD_CONFIGS[newBoard];

	// 如果切換到 MicroPython 主板，刪除 platformio.ini
	if (boardConfig?.language === 'micropython') {
		vscode.postMessage({ command: 'deletePlatformioIni' });
		console.log('[blockly] 已請求刪除 platformio.ini');
	}

	// 繼續現有邏輯...
}
```

編輯 `src/webview/messageHandler.ts`：

```typescript
case 'deletePlatformioIni':
  await this.handleDeletePlatformioIni();
  break;

private async handleDeletePlatformioIni(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) return;

  const platformioPath = vscode.Uri.joinPath(workspaceFolder.uri, 'platformio.ini');

  try {
    await vscode.workspace.fs.stat(platformioPath);
    await vscode.workspace.fs.delete(platformioPath);
    log.info('[blockly] 已刪除 platformio.ini');
  } catch {
    log.debug('[blockly] platformio.ini 不存在，跳過刪除');
  }
}
```

### Step 4: 建立 MicroPython 生成器

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

### Step 5: 實作上傳服務

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
		this.pythonPath = process.platform === 'win32' ? `${process.env.USERPROFILE}\\.platformio\\penv\\Scripts\\python.exe` : `${process.env.HOME}/.platformio/penv/bin/python`;
	}

	async upload(options: UploadOptions): Promise<UploadResult> {
		const { code, port, devicePath } = options;

		try {
			log.info(`[blockly] 上傳開始：${port}`);

			const tempFile = await this.writeTempFile(code);
			const cmd = `"${this.pythonPath}" -m mpremote connect ${port} reset + soft-reset + fs cp "${tempFile}" :${devicePath} + reset`;

			await execAsync(cmd);

			log.info('[blockly] 上傳完成');
			return { success: true };
		} catch (error) {
			log.error(`[blockly] 上傳失敗：${error}`);
			return { success: false, error: String(error) };
		}
	}

	private async writeTempFile(code: string): Promise<string> {
		// 實作暫存檔寫入...
	}
}
```

### Step 6: Toast 通知（2025-12-30 新增）

在 `media/js/blocklyEdit.js` 中新增 Toast 函數（或重用現有）：

```javascript
// 顯示 Toast 通知（同 Ctrl+S 備份通知樣式）
function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	document.body.appendChild(toast);

	setTimeout(() => {
		toast.classList.add('fade-out');
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

// 上傳結果通知
function handleUploadResult(result) {
	if (result.success) {
		showToast('上傳成功！', 'success');
	} else {
		showToast(`上傳失敗：${result.error || '未知錯誤'}`, 'error');
	}
	setUploadingState(false);
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

### 手動測試（2025-12-30 更新）

| 情境                | 步驟                      | 預期結果                                |
| ------------------- | ------------------------- | --------------------------------------- |
| 主板切換            | 選擇 CyberBrick           | 工具箱切換為 MicroPython 積木           |
| platformio.ini 刪除 | 選擇 CyberBrick（有 ini） | platformio.ini 被刪除，日誌顯示刪除訊息 |
| 上傳按鈕顯示        | 選擇 CyberBrick           | 上傳按鈕出現在控制區                    |
| 上傳按鈕隱藏        | 切換回 Arduino            | 上傳按鈕消失                            |
| 上傳中狀態          | 點擊上傳按鈕              | 按鈕禁用，圖示旋轉                      |
| 上傳成功            | 完成上傳                  | Toast 顯示「上傳成功！」                |
| 上傳失敗            | 上傳時拔除 USB            | Toast 顯示錯誤訊息                      |
| 程式碼生成          | 拖拉 LED 積木             | 顯示正確 MicroPython 程式碼             |
| 空工作區切換        | 空工作區時切換主板        | 跳過確認對話框，直接切換                |

---

## ⚠️ 注意事項

### 日誌標籤規範（2025-12-30 新增）

所有 CyberBrick 相關日誌必須使用 `[blockly]` 前綴：

```javascript
// ✅ 正確
console.log('[blockly] 已切換至 CyberBrick 主板');
log.info('[blockly] 上傳開始：COM3');

// ❌ 錯誤
console.log('切換至 CyberBrick');
log.info('Upload started');
```

### 翻譯鍵命名（2025-12-30 新增）

-   CyberBrick 專用分類：`CATEGORY_CYBERBRICK_*`
-   CyberBrick 專用積木：`CYBERBRICK_*`
-   MicroPython 通用積木：共用現有翻譯鍵

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

-   使用 `log.*` 方法記錄（不使用 `console.log`）- Extension 端
-   使用 `console.log('[blockly] ...')` - WebView 端
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
-   `specs/017-ctrl-s-quick-backup/` - 快速備份功能（重用）
