# Quickstart: 上傳錯誤分類與明確提示

**Feature**: 042-upload-error-clarity  
**Date**: 2026-02-10

## 快速了解

此功能改進 Arduino 上傳流程的錯誤回報機制，讓使用者能從錯誤訊息直接判斷失敗是因為「沒接硬體」、「程式碼有錯」還是「連線有問題」。

## 核心變更

### 1. ArduinoUploader — 新增偵測前置階段

**檔案**: `src/services/arduinoUploader.ts`

在 `upload()` 方法中，於 `checking_pio` 之後插入 `detecting` 階段：

```typescript
// 階段 4: 偵測裝置 (18%) — 新增
sendProgress('detecting', 18, 'Detecting device...');
const detection = await this.detectDevices();

if (detection.hasDevice) {
	sendProgress('detecting', 19, `Device found: ${detection.port}`);
	// 繼續上傳流程，使用偵測到的 port
} else {
	// 偵測指令成功但無裝置 → 立即失敗
	sendProgress('failed', 18, 'No device detected', undefined, 'NO_DEVICE');
	return this.createFailureResult(this.startTime, 'none', 'detecting', 'No device detected');
}
```

新增 `classifyUploadError()` 方法來細分上傳錯誤：

```typescript
classifyUploadError(stderr: string): string {
  if (/could not open port|access denied|device or resource busy/i.test(stderr)) return 'Port is busy';
  if (/device disconnected/i.test(stderr)) return 'Device disconnected';
  if (/timed out/i.test(stderr)) return 'Upload timed out';
  if (/failed to connect|chip sync/i.test(stderr)) return 'Connection failed';
  return 'Upload failed';
}
```

### 2. WebView — 擴展錯誤映射

**檔案**: `media/js/blocklyEdit.js`

擴展 `getLocalizedUploadError()` 的 `errorKeyMap`：

```javascript
detecting: {
  'No device detected': 'ERROR_ARDUINO_NO_DEVICE',
  default: 'ERROR_ARDUINO_NO_DEVICE',
},
uploading: {
  'Port is busy': 'ERROR_ARDUINO_PORT_BUSY',
  'Device disconnected': 'ERROR_ARDUINO_DEVICE_DISCONNECT',
  'Upload timed out': 'ERROR_ARDUINO_UPLOAD_TIMEOUT',
  'Connection failed': 'ERROR_ARDUINO_UPLOAD_CONNECTION',
  default: 'ERROR_ARDUINO_UPLOAD_FAILED',
},
```

修改 `handleUploadResult()` 以附加技術細節：

```javascript
if (message.error?.details?.trim()) {
	failedMsg += ` (${message.error.details.slice(0, 200)})`;
}
```

### 3. i18n — 新增錯誤訊息

**檔案**: `media/locales/*/messages.js`（全部 15 種語言）

新增 5 個 key：

- `ERROR_ARDUINO_NO_DEVICE`
- `ERROR_ARDUINO_PORT_BUSY`
- `ERROR_ARDUINO_DEVICE_DISCONNECT`（更新現有值）
- `ERROR_ARDUINO_UPLOAD_TIMEOUT`
- `ERROR_ARDUINO_UPLOAD_CONNECTION`

## 不影響的部分

- CyberBrick (MicroPython) 上傳流程完全不受影響
- 「僅編譯」模式不受影響（不經過 detecting 階段）
- 現有的編譯進度顯示和子進度不受影響
- 上傳成功的行為不受影響

## 測試要點

1. **無硬體上傳**: 不接板子 → 點上傳 → 應在 3 秒內看到「未偵測到硬體」
2. **編譯錯誤**: 缺少設定積木 → 點上傳 → 應看到「編譯失敗 (具體錯誤)」
3. **上傳中拔線**: 開始上傳後拔 USB → 應看到「裝置已斷開」而非「上傳失敗」
4. **CyberBrick 不受影響**: 用 CyberBrick 上傳 → 行為與之前完全一致
5. **偵測指令失敗 fallback**: 模擬 `pio device list` 失敗（如暫時移除 PlatformIO 的 device list 路徑，或在自動化測試中 mock `detectDevices()` 回傳 `commandFailed: true`）→ 應繼續上傳流程而非阻斷
