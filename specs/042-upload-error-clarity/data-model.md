# Data Model: 上傳錯誤分類與明確提示

**Feature**: 042-upload-error-clarity  
**Date**: 2026-02-10

## 實體定義

### 1. ArduinoUploadStage（修改）

現有型別，新增 `'detecting'` 階段（已存在於型別定義中，需確認實際使用）。

```typescript
// src/types/arduino.ts（無需修改型別定義，'detecting' 已存在）
export type ArduinoUploadStage =
	| 'syncing'
	| 'saving'
	| 'checking_pio'
	| 'detecting' // ← 此階段已定義但 upload() 未使用
	| 'compiling'
	| 'uploading'
	| 'completed'
	| 'failed';
```

### 1b. detectDevices() 回傳型別（修改 — T004 實作目標）

> ⚠️ 以下為 T004 完成後的目標型別。現有原始碼中 `detectDevices()` 尚未包含 `commandFailed` 旗標。

新增 `commandFailed` 旗標以區分「偵測成功但無裝置」與「偵測指令本身失敗」：

```typescript
// detectDevices() 回傳型別
async detectDevices(): Promise<{
	hasDevice: boolean;
	port?: string;
	devices: ArduinoPortInfo[];
	commandFailed: boolean; // 新增：偵測指令是否失敗
}>
// 正常無裝置: { hasDevice: false, devices: [], commandFailed: false }
// 指令異常:   { hasDevice: false, devices: [], commandFailed: true }
```

### 2. UploadErrorCategory（新增概念模型）

上傳錯誤的三種主要分類，不新增 TypeScript 型別，透過 `error.message` 字串值傳遞：

| 類別                | error.stage | error.message 值        | 說明                 |
| ------------------- | ----------- | ----------------------- | -------------------- |
| 無硬體              | `detecting` | `'No device detected'`  | 偵測階段完成但無裝置 |
| 編譯失敗            | `compiling` | `'Compilation failed'`  | 已有，不變           |
| 上傳失敗-連接埠佔用 | `uploading` | `'Port is busy'`        | 新子分類             |
| 上傳失敗-裝置斷線   | `uploading` | `'Device disconnected'` | 新子分類             |
| 上傳失敗-逾時       | `uploading` | `'Upload timed out'`    | 新子分類             |
| 上傳失敗-連線問題   | `uploading` | `'Connection failed'`   | 新子分類（通用）     |

### 3. 上傳流程階段順序（修改）

```
[syncing] → [saving] → [checking_pio] → [detecting] → [compiling] → [uploading] → [completed]
     5%         10%          15%            18%         20-55%         60-95%         100%
```

新增 `detecting` 階段（進度 18%），介於 `checking_pio` (15%) 和 `compiling` (20%) 之間。

### 4. 錯誤訊息映射表（WebView 端）

`getLocalizedUploadError()` 的 `errorKeyMap` 擴充：

```javascript
// blocklyEdit.js（擴展 errorKeyMap）
const errorKeyMap = {
	// ... 保留既有 MicroPython 映射 ...

	// Arduino 階段（修改）
	detecting: {
		'No device detected': 'ERROR_ARDUINO_NO_DEVICE', // 新增
		default: 'ERROR_ARDUINO_NO_DEVICE', // 修改：從 TIMEOUT 改為 NO_DEVICE
	},
	compiling: {
		default: 'ERROR_ARDUINO_COMPILE_FAILED', // 不變
	},
	uploading: {
		'Port is busy': 'ERROR_ARDUINO_PORT_BUSY', // 新增
		'Device disconnected': 'ERROR_ARDUINO_DEVICE_DISCONNECT', // 新增
		'Upload timed out': 'ERROR_ARDUINO_UPLOAD_TIMEOUT', // 新增
		'Connection failed': 'ERROR_ARDUINO_UPLOAD_CONNECTION', // 新增
		default: 'ERROR_ARDUINO_UPLOAD_FAILED', // 不變
	},
};
```

### 5. i18n Key 清單（新增）

| Key                               | 英文                                                              | 繁體中文                                       |
| --------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| `ERROR_ARDUINO_NO_DEVICE`         | `No device detected. Please connect your board.`                  | `未偵測到硬體裝置，請確認開發板已連接`         |
| `ERROR_ARDUINO_PORT_BUSY`         | `Port is in use by another program. Close other serial monitors.` | `連接埠被其他程式佔用，請關閉其他序列埠監視器` |
| `ERROR_ARDUINO_DEVICE_DISCONNECT` | `Device disconnected during upload.`                              | `上傳過程中裝置已斷開連接`                     |
| `ERROR_ARDUINO_UPLOAD_TIMEOUT`    | `Upload timed out. Check your connection.`                        | `上傳逾時，請檢查連接`                         |
| `ERROR_ARDUINO_UPLOAD_CONNECTION` | `Upload failed. Check device connection.`                         | `上傳失敗，請檢查裝置連接`                     |

注意：`ERROR_ARDUINO_DEVICE_DISCONNECT` 已存在但值為 `Device disconnected`（無後續提示），需要更新值以包含更明確的指引。

## 狀態轉換

### 上傳流程狀態機

```
[idle] → syncing → saving → checking_pio → detecting → compiling → uploading → completed
                                  ↓              ↓           ↓           ↓
                               failed         failed      failed      failed
                             (PIO未安裝)    (無硬體)    (編譯錯誤)  (上傳錯誤)
```

**偵測階段的特殊邏輯**:

- 有裝置：繼續 → `compiling`
- 無裝置且 `commandFailed: false`：**立即回傳失敗**，不進入 `compiling`（FR-001）
- `commandFailed: true`（指令異常）：**fallback 繼續上傳**，使用 `auto` 連接埠（FR-008）

## 驗證規則

1. `error.details` 長度 ≤ 200 字元（FR-009）
2. 偵測階段在 `checking_pio` 成功後才執行
3. 偵測結果 `hasDevice === false` 且 `commandFailed === false` → 立即 `failed`
4. 偵測結果 `hasDevice === false` 且 `commandFailed === true` → fallback 繼續
5. 錯誤訊息格式：`UPLOAD_FAILED: {本地化描述}` + 可選 `({技術細節})`
