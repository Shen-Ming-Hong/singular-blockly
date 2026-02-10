# Research: 上傳錯誤分類與明確提示

**Feature**: 042-upload-error-clarity  
**Date**: 2026-02-10  
**Status**: Complete

## 研究任務與發現

### R1: 現有 Arduino 上傳流程分析

**問題**: 目前 `ArduinoUploader.upload()` 的上傳流程如何處理錯誤？

**發現**:

現有流程（`src/services/arduinoUploader.ts` 的 `upload()` 方法）：

1. `syncing` → 同步 PlatformIO 設定
2. `saving` → 儲存程式碼到 `src/main.cpp`
3. `checking_pio` → 檢查 PlatformIO CLI 是否安裝
4. **直接跳到** `compiling` → 呼叫 `compileAndUploadWithProgress('auto', ...)`

**關鍵觀察**:

- `detectDevices()` 方法**已存在**於 `ArduinoUploader` 中，但 `upload()` **完全沒有呼叫**它
- 現有流程使用 `pio run --target upload` 搭配 `'auto'` 連接埠，讓 PlatformIO 自動處理偵測
- 當沒有硬體時，整個編譯流程仍會完成（可能花費 1-2 分鐘），直到上傳階段才失敗
- `compileAndUploadWithProgress()` 透過 `isInUploadPhase` 旗標區分編譯/上傳階段的錯誤
- 錯誤最終以 `stage: 'compiling' | 'uploading'` 回傳，但沒有更細粒度的子分類

**結論**: 需要在 `checking_pio` 之後、`compiling` 之前插入 `detecting` 階段，呼叫既有的 `detectDevices()` 方法。

---

### R2: `detectDevices()` 現有實作分析

**問題**: 既有的 `detectDevices()` 是否滿足需求？

**發現**:

```typescript
// 現有方法簽名
async detectDevices(): Promise<{ hasDevice: boolean; port?: string; devices: ArduinoPortInfo[] }>
```

功能：

- 使用 `pio device list --json-output` 取得裝置清單
- 已過濾藍牙裝置（`description.includes('bluetooth')`）
- 已過濾無描述的虛擬裝置（`description === 'n/a'`）
- 偵測失敗時回傳 `{ hasDevice: false, devices: [] }`（不拋出例外）

**結論**: 既有方法完全可用。偵測失敗時的 graceful fallback（回傳 `hasDevice: false`）符合 FR-008 要求。需要額外處理的是：當偵測指令本身失敗時（如 `pio` 指令異常），應 fallback 繼續上傳而非阻斷。

---

### R3: 現有錯誤訊息映射機制分析

**問題**: WebView 端如何將錯誤階段映射到本地化訊息？

**發現**:

`blocklyEdit.js` 中的 `getLocalizedUploadError(stage, fallbackMessage)` 使用兩層查找：

```javascript
const errorKeyMap = {
  preparing: { ... },
  checking_pio: { default: 'ERROR_ARDUINO_PIO_NOT_FOUND' },
  detecting: { default: 'ERROR_ARDUINO_TIMEOUT' },  // 現有但語義不精確
  compiling: { default: 'ERROR_ARDUINO_COMPILE_FAILED' },
  // 注意：沒有 'uploading' 在 Arduino 區段的映射！
};
```

**問題點**:

1. `detecting` 階段映射到 `ERROR_ARDUINO_TIMEOUT`（語義不正確，此處應是「無硬體」）
2. Arduino 的 `uploading` 階段沒有獨立映射（會 fallthrough 到 MicroPython 的 `ERROR_UPLOAD_UPLOAD_FAILED`）
3. 沒有針對連接埠佔用、斷線、逾時的細分映射
4. 錯誤訊息不包含技術細節（`details`）

**結論**: 需要：

- 修正 `detecting` 階段的映射為「未偵測到硬體裝置」
- 新增 `uploading` 階段的 Arduino 專用映射
- 在 `handleUploadResult()` 中加入技術細節的顯示邏輯

---

### R4: 上傳錯誤訊息中的技術細節處理

**問題**: 如何在錯誤訊息中附帶技術細節？

**發現**:

現有的 `ArduinoUploadResult.error` 結構已支援 `details` 欄位：

```typescript
error?: {
  stage: ArduinoUploadStage;
  message: string;
  details?: string;  // 已存在！
}
```

`parseCompileError()` 和 `parseUploadError()` 方法已能提取具體錯誤：

- 編譯錯誤：提取 GCC 錯誤行（如 `undefined reference to 'ledPin'`）
- 上傳錯誤：偵測連接埠佔用、裝置斷線、逾時等

但 `handleUploadResult()` 在 WebView 端**沒有使用** `message.error.details`：

```javascript
// 現有程式碼只使用 stage 和 message
const errorMsg = getLocalizedUploadError(message.error?.stage, message.error?.message);
const failedMsg = failedTemplate.replace('{0}', errorMsg);
```

**結論**: 需要修改 `handleUploadResult()` 來：

1. 顯示本地化的錯誤類別描述
2. 追加 `details`（如有），格式為 `本地化描述 (技術細節)`
3. 截斷 `details` 至 200 字元

---

### R5: PlatformIO `pio device list` 效能分析

**問題**: `pio device list` 的執行時間是否會影響使用者體驗？

**發現**:

根據 PlatformIO 文件和現有程式碼的 `--json-output` 參數：

- 典型執行時間：0.5-2 秒（取決於 USB 裝置數量）
- 指令 timeout：未設定（使用預設 executor）
- 指令執行不需要網路連線

**結論**: 符合 SC-001 的 3 秒內完成要求。但應為 `detectDevices()` 呼叫設定合理的超時（建議 5 秒），避免異常情況下無限等待。若偵測超時，依 FR-008 fallback 繼續上傳。

---

### R6: CyberBrick 上傳流程隔離分析

**問題**: 改動是否可能影響 CyberBrick (MicroPython) 上傳？

**發現**:

上傳路由在 `messageHandler.ts` 的 `handleRequestUpload()` 中：

```typescript
const boardLanguage = getBoardLanguage(message.board);
if (boardLanguage === 'micropython') {
	await this.handleMicropythonUpload(workspaceRoot, message);
} else if (boardLanguage === 'arduino') {
	await this.handleArduinoUpload(workspaceRoot, message);
}
```

- CyberBrick 的上傳完全走 `MicropythonUploader` 路徑
- Arduino 的偵測前置檢查只在 `ArduinoUploader.upload()` 內部執行
- 兩個上傳器完全獨立，無共享狀態

**結論**: 改動完全隔離於 `ArduinoUploader`，不會影響 CyberBrick 上傳。符合 FR-007。

---

### R7: i18n 新增 key 的最佳實踐

**問題**: 應新增哪些 i18n key？格式為何？

**發現**:

現有命名模式：

- `ERROR_ARDUINO_*` — Arduino 專用錯誤
- `UPLOAD_STAGE_*` — 上傳階段名稱
- `ARDUINO_STAGE_*` — Arduino 階段名稱

需新增的 key：

| Key                               | 用途                 | 英文預設值                                       |
| --------------------------------- | -------------------- | ------------------------------------------------ |
| `ERROR_ARDUINO_NO_DEVICE`         | 未偵測到硬體裝置     | `No device detected. Please connect your board.` |
| `ERROR_ARDUINO_PORT_BUSY`         | 連接埠被佔用         | `Port is in use by another program.`             |
| `ERROR_ARDUINO_DEVICE_DISCONNECT` | 裝置已斷開連接       | `Device disconnected during upload.`             |
| `ERROR_ARDUINO_UPLOAD_TIMEOUT`    | 上傳逾時             | `Upload timed out. Check your connection.`       |
| `ERROR_ARDUINO_UPLOAD_CONNECTION` | 上傳連線問題（通用） | `Upload failed. Check device connection.`        |
| `ARDUINO_STAGE_DETECTING`         | 偵測裝置階段名稱     | `Detecting board`                                |

注意：`ARDUINO_STAGE_DETECTING` 已存在，只需確認所有語言都有翻譯。

**結論**: 新增 5 個錯誤 key + 確認 1 個階段 key 的翻譯完整性。

---

### R8: `parseUploadError()` 錯誤子分類映射

**問題**: 如何從 PlatformIO 的原始錯誤輸出中識別連接埠佔用、斷線、逾時？

**發現**:

`parseUploadError()` 已有以下 pattern 匹配：

```typescript
const errorPatterns = [
	/could not open port/i, // → PORT_BUSY
	/access denied/i, // → PORT_BUSY
	/device or resource busy/i, // → PORT_BUSY
	/device disconnected/i, // → DEVICE_DISCONNECT
	/timed out/i, // → UPLOAD_TIMEOUT
	/failed to connect/i, // → UPLOAD_CONNECTION
	/chip sync/i, // → UPLOAD_CONNECTION
];
```

**設計決策**: 將 `parseUploadError()` 改為回傳分類結果物件：

```typescript
interface UploadErrorClassification {
	category: 'port_busy' | 'device_disconnect' | 'timeout' | 'connection' | 'unknown';
	message: string; // 原始錯誤摘要（≤ 200 字元）
}
```

**替代方案（已採用）**: 不改變 `parseUploadError()` 的回傳值，而是在 `compileAndUploadWithProgress()` 中根據錯誤 pattern 設定不同的 `stage` 或 `message` 值，讓 WebView 端通過 message 內容匹配對應的 i18n key。

**最終決策**: 在 `upload()` 流程中新增上傳錯誤子分類函式 `classifyUploadError(stderr)`，回傳錯誤代碼字串。此字串作為 `error.message` 傳遞給 WebView，用於 `getLocalizedUploadError()` 的精確匹配。

---

## 設計決策摘要

| 項目          | 決策                                     | 理由                           | 替代方案                            |
| ------------- | ---------------------------------------- | ------------------------------ | ----------------------------------- |
| 偵測時機      | 在 `checking_pio` 之後、`compiling` 之前 | 避免無硬體時浪費編譯時間       | 在編譯後偵測（被拒：浪費時間）      |
| 偵測失敗處理  | Fallback 繼續上傳（使用 `auto` 埠）      | FR-008 要求不阻斷流程          | 阻斷（被拒：不符合 FR-008）         |
| 錯誤子分類    | 新增 `classifyUploadError()` 函式        | 將語義化的錯誤類型傳給 WebView | 改變 stage 值（被拒：破壞既有型別） |
| 技術細節顯示  | `本地化描述 (原始錯誤)` 格式             | 同時服務初學者和進階使用者     | 分開顯示（被拒：過度複雜）          |
| i18n 新增方式 | 先以英文填充所有語言，後續翻譯           | 符合專案慣例和假設             | 一次翻譯完成（被拒：阻斷開發進度）  |
