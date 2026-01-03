# Quickstart: 統一 Arduino C++ 與 MicroPython 上傳 UI

**Feature**: 026-unified-upload-ui  
**Date**: 2026-01-03

---

## 📋 功能概述

將 Arduino C++ 的編譯/上傳流程整合到現有的 MicroPython 上傳 UI 框架中。Arduino 模式透過 PlatformIO CLI 執行：有偵測到板子時完整上傳，無板子時僅編譯驗證語法。

---

## 🏗️ 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                     WebView (Browser)                        │
│  ┌─────────────┐  ┌──────────────────┐                      │
│  │uploadButton │──│handleUploadClick │                      │
│  └─────────────┘  └────────┬─────────┘                      │
│                            │ postMessage({command:           │
│                            │   'requestUpload', ...})        │
└────────────────────────────┼────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Extension Host (Node.js)                    │
│  ┌────────────────────┐                                     │
│  │messageHandler.ts   │                                     │
│  │handleRequestUpload │                                     │
│  └─────────┬──────────┘                                     │
│            │ 判斷 board 類型                                 │
│            ▼                                                 │
│  ┌─────────────────────────────────────────────┐            │
│  │           board === 'cyberbrick'?           │            │
│  └─────────────────────────────────────────────┘            │
│        │ Yes                         │ No                    │
│        ▼                             ▼                       │
│  ┌──────────────────┐      ┌────────────────────┐           │
│  │MicropythonUploader│     │ArduinoUploader     │           │
│  │(現有，無變更)      │     │(新增)               │           │
│  └──────────────────┘      └─────────┬──────────┘           │
│                                      │                       │
│                                      ▼                       │
│                            ┌─────────────────────┐          │
│                            │PlatformIO CLI       │          │
│                            │pio run [--target    │          │
│                            │upload]              │          │
│                            └─────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 開發步驟

### Step 1: 新增 ArduinoUploader 服務

建立 `src/services/arduinoUploader.ts`：

```typescript
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { log } from './logging';

/**
 * Arduino 上傳階段類型
 */
export type ArduinoUploadStage = 'syncing' | 'saving' | 'checking_pio' | 'detecting' | 'compiling' | 'uploading' | 'completed' | 'failed';

/**
 * 上傳進度介面
 */
export interface UploadProgress {
	stage: ArduinoUploadStage;
	progress: number;
	message: string;
	error?: string;
}

/**
 * 上傳結果介面
 */
export interface UploadResult {
	success: boolean;
	timestamp: string;
	port: string;
	duration: number;
	mode?: 'compile-only' | 'upload';
	error?: {
		stage: ArduinoUploadStage;
		message: string;
		details?: string;
	};
}

/**
 * 上傳請求介面
 */
export interface UploadRequest {
	code: string;
	board: string;
	port?: string;
	lib_deps?: string[];
	build_flags?: string[];
	lib_ldf_mode?: string;
}

/**
 * 進度回調類型
 */
export type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Arduino 上傳服務
 * 負責 Arduino C++ 程式碼的編譯與上傳
 */
export class ArduinoUploader {
	private pioPath: string;

	constructor(private workspacePath: string) {
		this.pioPath = this.getPioPath();
	}

	/**
	 * 取得 PlatformIO CLI 路徑
	 */
	private getPioPath(): string {
		const home = os.homedir();
		if (process.platform === 'win32') {
			return path.join(home, '.platformio', 'penv', 'Scripts', 'pio.exe');
		}
		return path.join(home, '.platformio', 'penv', 'bin', 'pio');
	}

	/**
	 * 檢查 PlatformIO 是否已安裝
	 */
	async checkPioInstalled(): Promise<boolean> {
		const fs = require('fs');
		return fs.existsSync(this.pioPath);
	}

	/**
	 * 偵測連接的 Arduino 裝置
	 */
	async detectDevices(): Promise<{ hasDevice: boolean; port?: string }> {
		// 使用 PlatformIO device list 偵測
		// 實作細節見 research.md R2
		// ...
	}

	/**
	 * 執行編譯/上傳
	 */
	async upload(request: UploadRequest, onProgress?: ProgressCallback): Promise<UploadResult> {
		const startTime = Date.now();

		try {
			// 階段 1: 同步設定
			onProgress?.({ stage: 'syncing', progress: 5, message: 'Syncing settings...' });
			// await this.syncSettings(request);

			// 階段 2: 儲存工作區
			onProgress?.({ stage: 'saving', progress: 15, message: 'Saving workspace...' });
			// await this.saveWorkspace();

			// 階段 3: 檢查 PlatformIO
			onProgress?.({ stage: 'checking_pio', progress: 25, message: 'Checking compiler...' });
			const hasPio = await this.checkPioInstalled();
			if (!hasPio) {
				return this.createFailureResult(startTime, 'none', 'checking_pio', 'PlatformIO not found');
			}

			// 階段 4: 偵測裝置
			onProgress?.({ stage: 'detecting', progress: 35, message: 'Detecting board...' });
			const { hasDevice, port } = await this.detectDevices();

			// 階段 5: 編譯
			onProgress?.({ stage: 'compiling', progress: 50, message: 'Compiling...' });
			// await this.compile();

			if (hasDevice && port) {
				// 階段 6: 上傳（僅當偵測到裝置時）
				onProgress?.({ stage: 'uploading', progress: 80, message: 'Uploading...' });
				// await this.uploadToDevice(port);

				onProgress?.({ stage: 'completed', progress: 100, message: 'Upload successful!' });
				return {
					success: true,
					timestamp: new Date().toISOString(),
					port: port,
					duration: Date.now() - startTime,
					mode: 'upload',
				};
			} else {
				// 僅編譯模式
				onProgress?.({ stage: 'completed', progress: 100, message: 'Compile successful!' });
				return {
					success: true,
					timestamp: new Date().toISOString(),
					port: 'none',
					duration: Date.now() - startTime,
					mode: 'compile-only',
				};
			}
		} catch (error) {
			return this.createFailureResult(startTime, 'unknown', 'failed', error instanceof Error ? error.message : String(error));
		}
	}

	private createFailureResult(startTime: number, port: string, stage: ArduinoUploadStage, message: string, details?: string): UploadResult {
		return {
			success: false,
			timestamp: new Date().toISOString(),
			port,
			duration: Date.now() - startTime,
			error: { stage, message, details },
		};
	}
}
```

---

### Step 2: 修改 messageHandler.ts

更新 `handleRequestUpload` 方法：

```typescript
/**
 * 處理上傳請求
 * 根據板子類型路由到對應的上傳服務
 */
private async handleRequestUpload(message: UploadRequest): Promise<void> {
  const { board } = message;

  // 判斷板子語言類型
  const isMicroPython = board === 'cyberbrick';

  if (isMicroPython) {
    // 現有 MicroPython 流程（無變更）
    const uploader = new MicropythonUploader(workspaceRoot);
    const result = await uploader.upload(message, this.sendUploadProgress.bind(this));
    this.sendUploadResult(result);
  } else {
    // 新增 Arduino 流程
    const uploader = new ArduinoUploader(workspaceRoot);
    const result = await uploader.upload(message, this.sendUploadProgress.bind(this));
    this.sendUploadResult(result);
  }
}
```

---

### Step 3: 修改 WebView UI (blocklyEdit.js)

#### 3.1 修改 `updateUIForBoard` 函式

```javascript
/**
 * 根據開發板更新 UI 元素
 */
function updateUIForBoard(boardId, isCyberBrick) {
	const uploadContainer = document.getElementById('uploadContainer');
	const uploadButton = document.getElementById('uploadButton');

	// 變更：所有板子都顯示上傳按鈕（不再隱藏）
	if (uploadContainer) {
		uploadContainer.style.display = 'block';
	}

	// 更新 tooltip（根據板子類型）
	if (uploadButton && window.languageManager) {
		const titleKey = isCyberBrick ? 'UPLOAD_BUTTON_TITLE' : 'UPLOAD_BUTTON_TITLE_ARDUINO';
		const defaultTitle = isCyberBrick ? 'Upload to CyberBrick' : 'Compile & Upload';
		uploadButton.title = window.languageManager.getMessage(titleKey, defaultTitle);
	}

	// 記錄當前使用的程式語言
	window.currentProgrammingLanguage = isCyberBrick ? 'micropython' : 'arduino';

	// 初始化上傳按鈕事件
	initUploadButton();
}
```

#### 3.2 修改 `handleUploadClick` 函式

```javascript
/**
 * 處理上傳按鈕點擊
 */
async function handleUploadClick() {
	if (uploadState.isUploading) return;

	const workspace = Blockly.getMainWorkspace();
	if (!workspace) {
		toast.show('Workspace not initialized', 'error');
		return;
	}

	// 檢查工作區是否有積木
	const blocks = workspace.getAllBlocks(false);
	if (blocks.length === 0) {
		const msg = window.languageManager?.getMessage('UPLOAD_EMPTY_WORKSPACE', 'Workspace is empty');
		toast.show(msg, 'warning');
		return;
	}

	// 生成程式碼
	const code = generateCode(workspace);
	if (!code || code.trim().length === 0) {
		const msg = window.languageManager?.getMessage('UPLOAD_NO_CODE', 'Cannot generate code');
		toast.show(msg, 'error');
		return;
	}

	// 設置上傳狀態
	setUploadButtonState('uploading');

	// 取得當前板子和相關設定
	const currentBoard = window.currentBoard || 'none';
	const isMicroPython = currentBoard === 'cyberbrick';

	// 發送上傳請求
	const uploadRequest = {
		command: 'requestUpload',
		code: code,
		board: currentBoard,
		port: uploadState.selectedPort,
	};

	// Arduino 模式：附加函式庫依賴
	if (!isMicroPython) {
		const generator = window.arduinoGenerator;
		if (generator) {
			uploadRequest.lib_deps = generator.lib_deps_ ? Object.values(generator.lib_deps_) : [];
			uploadRequest.build_flags = generator.build_flags_ ? Object.values(generator.build_flags_) : [];
			uploadRequest.lib_ldf_mode = generator.lib_ldf_mode_ || null;
		}
	}

	vscode.postMessage(uploadRequest);
}
```

#### 3.3 修改 `handleUploadProgress` 函式

```javascript
/**
 * 處理上傳進度訊息
 */
function handleUploadProgress(message) {
	const isMicroPython = window.currentProgrammingLanguage === 'micropython';

	// Arduino 階段訊息對應
	const arduinoStageMessages = {
		syncing: window.languageManager?.getMessage('ARDUINO_STAGE_SYNCING', 'Syncing settings'),
		saving: window.languageManager?.getMessage('ARDUINO_STAGE_SAVING', 'Saving workspace'),
		checking_pio: window.languageManager?.getMessage('ARDUINO_STAGE_CHECKING', 'Checking compiler'),
		detecting: window.languageManager?.getMessage('ARDUINO_STAGE_DETECTING', 'Detecting board'),
		compiling: window.languageManager?.getMessage('ARDUINO_STAGE_COMPILING', 'Compiling'),
		uploading: window.languageManager?.getMessage('ARDUINO_STAGE_UPLOADING', 'Uploading'),
		completed: window.languageManager?.getMessage('UPLOAD_STAGE_COMPLETED', 'Completed'),
	};

	// MicroPython 階段訊息對應（現有）
	const micropythonStageMessages = {
		preparing: window.languageManager?.getMessage('UPLOAD_STAGE_PREPARING', 'Preparing'),
		checking_tool: window.languageManager?.getMessage('UPLOAD_STAGE_CHECKING', 'Checking tool'),
		// ... 其餘現有階段
	};

	const stageMessages = isMicroPython ? micropythonStageMessages : arduinoStageMessages;
	const stageText = stageMessages[message.stage] || message.message;
	const progressText = `${stageText} (${message.progress}%)`;

	toast.show(progressText, 'info', 10000);
}
```

#### 3.4 修改 `handleUploadResult` 函式

```javascript
/**
 * 處理上傳結果訊息
 */
function handleUploadResult(message) {
	setUploadButtonState(message.success ? 'success' : 'error');

	if (message.success) {
		// 區分「編譯成功」與「上傳成功」
		const isCompileOnly = message.mode === 'compile-only';
		const successKey = isCompileOnly ? 'ARDUINO_COMPILE_SUCCESS' : 'ARDUINO_UPLOAD_SUCCESS';
		const defaultMsg = isCompileOnly ? 'Compile successful!' : 'Upload successful!';

		// MicroPython 使用原有訊息
		const isMicroPython = window.currentProgrammingLanguage === 'micropython';
		const finalKey = isMicroPython ? 'UPLOAD_SUCCESS' : successKey;
		const finalDefault = isMicroPython ? 'Upload successful!' : defaultMsg;

		const successMsg = window.languageManager?.getMessage(finalKey, finalDefault);
		toast.show(successMsg, 'success');
	} else {
		const errorMsg = getLocalizedUploadError(message.error?.stage, message.error?.message);
		const failedMsg = window.languageManager?.getMessage('UPLOAD_FAILED', 'Upload failed');
		toast.show(`${failedMsg}: ${errorMsg}`, 'error', 5000);
	}
}
```

---

### Step 4: 新增 i18n 鍵名

更新所有 15 個語系的 `messages.js` 檔案。以 `zh-hant` 為例：

```javascript
// media/locales/zh-hant/messages.js

// Arduino 上傳功能
UPLOAD_BUTTON_TITLE_ARDUINO: '編譯並上傳',
ARDUINO_STAGE_SYNCING: '同步設定',
ARDUINO_STAGE_SAVING: '儲存工作區',
ARDUINO_STAGE_CHECKING: '檢查編譯工具',
ARDUINO_STAGE_DETECTING: '偵測開發板',
ARDUINO_STAGE_COMPILING: '編譯中',
ARDUINO_STAGE_UPLOADING: '上傳中',
ARDUINO_COMPILE_SUCCESS: '編譯成功',
ARDUINO_UPLOAD_SUCCESS: '上傳成功',

// Arduino 錯誤訊息
ERROR_ARDUINO_PIO_NOT_FOUND: '找不到 PlatformIO CLI，請先安裝 PlatformIO',
ERROR_ARDUINO_COMPILE_FAILED: '編譯失敗',
ERROR_ARDUINO_UPLOAD_FAILED: '上傳失敗',
ERROR_ARDUINO_NO_WORKSPACE: '請先開啟專案資料夾',
ERROR_ARDUINO_TIMEOUT: '操作逾時',
```

---

## ✅ 驗收檢查清單

### 功能性測試

-   [ ] Arduino Uno 板子：點擊上傳按鈕顯示上傳按鈕
-   [ ] ESP32 板子：點擊上傳按鈕顯示上傳按鈕
-   [ ] CyberBrick 板子：上傳流程維持現有行為
-   [ ] 無板子連接：顯示「編譯成功」而非「上傳成功」
-   [ ] 有板子連接：顯示「上傳成功」
-   [ ] Toast 訊息正確顯示各階段

### UI 測試

-   [ ] 切換板子時，上傳按鈕 tooltip 正確更新
-   [ ] 上傳中按鈕顯示旋轉動畫
-   [ ] 上傳完成後按鈕恢復可點擊狀態

### 錯誤處理測試

-   [ ] PlatformIO 未安裝：顯示友善提示
-   [ ] 編譯錯誤：顯示錯誤摘要
-   [ ] 上傳失敗：顯示裝置連線錯誤

### i18n 測試

-   [ ] 切換語言後，所有新增訊息正確翻譯
-   [ ] 15 個語系都有對應的翻譯鍵名

---

## 📁 檔案清單

| 檔案                              | 操作        | 說明                     |
| --------------------------------- | ----------- | ------------------------ |
| `src/services/arduinoUploader.ts` | 新增        | Arduino 上傳服務         |
| `src/webview/messageHandler.ts`   | 修改        | 擴展 handleRequestUpload |
| `media/js/blocklyEdit.js`         | 修改        | UI 邏輯調整              |
| `media/locales/*/messages.js`     | 修改        | 新增 i18n 鍵名 (15 檔案) |
| `src/types/arduino.ts`            | 新增 (可選) | Arduino 類型定義         |

---

## 🔗 相關文件

-   [spec.md](spec.md) - 功能規格書
-   [research.md](research.md) - 技術研究
-   [data-model.md](data-model.md) - 資料模型
-   [contracts/webview-message-protocol.md](contracts/webview-message-protocol.md) - 訊息協定
