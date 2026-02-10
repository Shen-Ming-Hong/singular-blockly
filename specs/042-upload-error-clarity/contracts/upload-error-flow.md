# Contract: 上傳錯誤流程

**Feature**: 042-upload-error-clarity  
**Date**: 2026-02-10

## 概述

定義 Extension Host（`ArduinoUploader`）與 WebView（`blocklyEdit.js`）之間的上傳錯誤通訊契約。

## 訊息協定

### 1. 上傳進度訊息（Extension → WebView）

```typescript
// command: 'uploadProgress'
interface UploadProgressMessage {
	command: 'uploadProgress';
	stage: ArduinoUploadStage; // 'syncing' | 'saving' | 'checking_pio' | 'detecting' | 'compiling' | 'uploading' | 'completed' | 'failed'
	progress: number; // 0-100
	message: string; // 英文進度訊息
	subProgress?: number; // 0-100，編譯/上傳子進度
	elapsed?: number; // 已耗時（毫秒）
	error?: string; // 錯誤詳情（僅 failed 階段）
}
```

**新增的 `detecting` 階段進度訊息**:

```typescript
// 偵測開始
{ stage: 'detecting', progress: 18, message: 'Detecting device...' }

// 偵測到裝置
{ stage: 'detecting', progress: 19, message: 'Device found: COM3' }

// 未偵測到裝置 → 立即轉為 failed
{ stage: 'failed', progress: 18, message: 'No device detected', error: 'NO_DEVICE' }
```

### 2. 上傳結果訊息（Extension → WebView）

```typescript
// command: 'uploadResult'
interface UploadResultMessage {
	command: 'uploadResult';
	success: boolean;
	timestamp: string;
	port: string;
	duration: number;
	mode?: 'compile-only' | 'upload';
	error?: {
		stage: ArduinoUploadStage;
		message: string; // 錯誤分類代碼（用於 i18n 映射）
		details?: string; // 技術細節（≤ 200 字元）
	};
}
```

**錯誤分類代碼** (`error.message` 值)：

| 代碼                    | 階段        | 觸發條件                                                                          |
| ----------------------- | ----------- | --------------------------------------------------------------------------------- |
| `'No device detected'`  | `detecting` | `detectDevices()` 回傳 `hasDevice: false` 且指令成功                              |
| `'Compilation failed'`  | `compiling` | 編譯返回非零 exit code                                                            |
| `'Port is busy'`        | `uploading` | stderr 匹配 `could not open port` 或 `access denied` 或 `device or resource busy` |
| `'Device disconnected'` | `uploading` | stderr 匹配 `device disconnected`                                                 |
| `'Upload timed out'`    | `uploading` | stderr 匹配 `timed out`                                                           |
| `'Connection failed'`   | `uploading` | stderr 匹配 `failed to connect` 或 `chip sync`                                    |
| `'Upload failed'`       | `uploading` | 其他未分類的上傳錯誤                                                              |

### 3. WebView 錯誤訊息顯示格式

```
// 無技術細節時
UPLOAD_FAILED: {本地化錯誤描述}

// 有技術細節時
UPLOAD_FAILED: {本地化錯誤描述} ({技術細節, ≤200字元})

// 範例
上傳失敗: 未偵測到硬體裝置，請確認開發板已連接
上傳失敗: 編譯失敗 (undefined reference to 'ledPin')
上傳失敗: 連接埠被其他程式佔用，請關閉其他序列埠監視器
```

## ArduinoUploader.upload() 流程契約

### 修改後的上傳流程

```
upload(request, onProgress)
│
├─ [Stage 1: syncing, 5%] 同步設定
├─ [Stage 2: saving, 10%] 儲存程式碼
├─ [Stage 3: checking_pio, 15%] 檢查 PlatformIO
│   └─ 失敗 → return { stage: 'checking_pio', message: 'PlatformIO CLI not found' }
│
├─ [Stage 4: compiling, 20-55%] 編譯
│   └─ 失敗 → return { stage: 'compiling', message: 'Compilation failed', details: parseCompileError() }
│
├─ [Stage 5: uploading, 60-95%] 上傳
│   └─ 失敗 → return { stage: 'uploading', message: classifyUploadError(), details: parseUploadError() }
│       ├─ 無裝置 → message: 'No device detected'
│       ├─ 連接埠佔用 → message: 'Port is busy'
│       ├─ 裝置斷線 → message: 'Device disconnected'
│       ├─ 連線逾時 → message: 'Upload timed out'
│       ├─ 連線失敗 → message: 'Connection failed'
│       └─ 其他 → message: 'Upload failed'
│
└─ [Stage 6: completed, 100%] 完成
```

### classifyUploadError() 函式契約（新增）

```typescript
/**
 * 根據 stderr 內容分類上傳錯誤
 * @param stderr PlatformIO 的錯誤輸出
 * @returns 語義化的錯誤分類字串
 */
classifyUploadError(stderr: string): string
```

**輸入→輸出映射**:

| stderr 包含               | 回傳值                  |
| ------------------------- | ----------------------- |
| `could not open port`     | `'Port is busy'`        |
| `access denied`           | `'Port is busy'`        |
| `device or resource busy` | `'Port is busy'`        |
| `device disconnected`     | `'Device disconnected'` |
| `timed out`               | `'Upload timed out'`    |
| `failed to connect`       | `'Connection failed'`   |
| `chip sync`               | `'Connection failed'`   |
| `upload_port`             | `'No device detected'`  |
| `no serial port`          | `'No device detected'`  |
| `no boards found`         | `'No device detected'`  |
| `looking for upload port` | `'No device detected'`  |
| 其他                      | `'Upload failed'`       |

## WebView getLocalizedUploadError() 契約

### 輸入

```javascript
getLocalizedUploadError(stage, fallbackMessage);
// stage: string — 錯誤發生的階段
// fallbackMessage: string — 錯誤分類代碼（如 'No device detected'）
```

### 輸出

```javascript
// 回傳本地化的錯誤描述字串
// 查找順序：
// 1. errorKeyMap[stage][fallbackMessage] → 精確匹配
// 2. errorKeyMap[stage].default → 階段預設
// 3. fallbackMessage → 原始訊息
```

### handleUploadResult() 技術細節處理

```javascript
// 修改後的邏輯
if (!message.success && message.error) {
	const errorMsg = getLocalizedUploadError(message.error.stage, message.error.message);
	let failedMsg = failedTemplate.replace('{0}', errorMsg);

	// 新增：附加技術細節與耗時資訊（合併為同一組括號）
	const infoParts = [];
	if (message.error.details && message.error.details.trim()) {
		infoParts.push(message.error.details.slice(0, 200));
	}
	if (elapsed) {
		infoParts.push(`${elapsed}s`);
	}
	if (infoParts.length > 0) {
		failedMsg += ` (${infoParts.join(' | ')})`;
	}

	toast.show(failedMsg, 'error', 5000);
}
```
