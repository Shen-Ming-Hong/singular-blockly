# 契約：CyberBrick 上傳設定 WebView ↔ Extension Host 訊息

## 目的

定義 Blockly WebView 與 Extension Host 之間新增的 CyberBrick 上傳設定訊息。WebView 只負責呈現表單、發送使用者意圖與顯示結果；所有 persistence、SecretStorage、USB/OTA I/O、readiness validation 與 logging 都必須在 Extension Host 執行。

## 通用訊息格式

### WebView → Extension Host

```ts
interface CyberBrickWebviewRequest<TPayload = unknown> {
  command: string;
  requestId?: string;
  payload?: TPayload;
}
```

### Extension Host → WebView

```ts
interface CyberBrickWebviewResponse<TPayload = unknown> {
  command: string;
  requestId?: string;
  success: boolean;
  payload?: TPayload;
  error?: CyberBrickUserFacingError;
}

interface CyberBrickUserFacingError {
  code: string;
  message: string;
  nextActions: Array<'open-settings' | 'select-device' | 'run-usb-provisioning' | 'rescan-wifi' | 'retry' | 'switch-to-usb-manually'>;
  details?: Record<string, string | number | boolean | null>;
}
```

**契約規則**

- 所有 request/response payload 必須 JSON-serializable。
- WebView 不可收到 Wi‑Fi 密碼、OTA token 或 pairing secret 的明文。
- 所有錯誤必須有 `code` 與使用者可理解 `message`。
- OTA 相關失敗不可自動觸發 USB fallback；只能在 `nextActions` 中建議使用者手動切換。
- Extension Host 必須使用既有 `log()` structured logging；WebView 不以 console 作為診斷來源。

## 訊息：載入設定

### Request

```ts
{
  command: 'cyberbrickUploadSettingsLoad',
  requestId: string,
  payload: {
    board: 'cyberbrick'
  }
}
```

### Response

```ts
{
  command: 'cyberbrickUploadSettingsLoaded',
  requestId: string,
  success: true,
  payload: CyberBrickUploadPanelState
}
```

**驗收規則**

- 新專案或缺少設定時，`payload.settings.uploadMode` 必須為 `usb`。
- `secretPresence` 只包含 `hasValue` 與 metadata，不包含秘密值。
- 若目前不是 CyberBrick board，Extension Host 可回傳 `success: false`、`code: 'board-not-cyberbrick'`，WebView 應隱藏 CyberBrick 專用設定。

## 訊息：保存非敏感設定

### Request

```ts
{
  command: 'cyberbrickUploadSettingsSave',
  requestId: string,
  payload: {
    uploadMode: 'usb' | 'ota',
    primaryDeviceId: string | null,
    pairedDeviceUpdates?: Array<{
      deviceId: string,
      friendlyName?: string
    }>
  }
}
```

### Response

```ts
{
  command: 'cyberbrickUploadSettingsSaved',
  requestId: string,
  success: true,
  payload: CyberBrickUploadPanelState
}
```

**驗收規則**

- 儲存 `uploadMode: 'ota'` 前不必強制連線成功，但回傳 state 必須清楚顯示 readiness；真正 upload 前仍要阻擋不完整設定。
- `friendlyName` 可重複；不得以 `friendlyName` 去重。
- 保存設定不得碰觸 secrets，除非同一流程是 provisioning request。

## 訊息：取得 CyberBrick USB 連接埠

### Request

```ts
{
  command: 'cyberbrickUsbPortsRequest',
  requestId: string,
  payload: {
    filter: 'cyberbrick'
  }
}
```

### Response

```ts
{
  command: 'cyberbrickUsbPortsResult',
  requestId: string,
  success: true,
  payload: {
    ports: Array<{
      path: string,
      displayName: string,
      manufacturer?: string,
      serialNumber?: string
    }>
  }
}
```

**驗收規則**

- 實作可重用 `MicropythonUploader.listPorts('cyberbrick')`。
- 顯示用欄位不得包含未遮罩的敏感資訊；serial number 若顯示需只作辨識用途。

## 訊息：裝置端 Wi‑Fi 掃描

### Request

```ts
{
  command: 'cyberbrickWifiScanRequest',
  requestId: string,
  payload: {
    usbPort: string,
    deviceId?: string
  }
}
```

### Progress / Response

```ts
{
  command: 'cyberbrickWifiScanProgress',
  requestId: string,
  success: true,
  payload: WifiScanSession
}

{
  command: 'cyberbrickWifiScanResult',
  requestId: string,
  success: true,
  payload: WifiScanSession
}
```

**驗收規則**

- 掃描必須由指定 USB 連線中的 CyberBrick 執行，不使用 host 電腦 Wi‑Fi scan。
- 掃描逾時或失敗時仍保留手動 SSID 輸入。
- WebView 不做背景輪詢；只有開啟設定或按重新掃描才送出 request。

## 訊息：首次 OTA provisioning

### Request

```ts
{
  command: 'cyberbrickOtaProvisionRequest',
  requestId: string,
  payload: {
    usbPort: string,
    friendlyName: string,
    ssid: string,
    wifiPassword?: string,
    reuseExistingWifiSecret?: boolean,
    targetDeviceId?: string
  }
}
```

### Progress / Response

```ts
{
  command: 'cyberbrickOtaProvisionProgress',
  requestId: string,
  success: true,
  payload: {
    stepId: string,
    status: 'running' | 'succeeded' | 'failed' | 'skipped' | 'timed-out',
    message: string
  }
}

{
  command: 'cyberbrickOtaProvisionResult',
  requestId: string,
  success: true,
  payload: OtaProvisioningResult
}
```

**驗收規則**

- `wifiPassword` 只可出現在 WebView → Extension Host 的 request；不得出現在任何 response。
- Provisioning 成功後 `nextUploadMode` 必須為 `usb`；不得自動切成 OTA。
- 完成後回傳 updated panel state，讓使用者明確選擇是否切換到 OTA。

## 訊息：OTA readiness 檢查

### Request

```ts
{
  command: 'cyberbrickOtaReadinessRequest',
  requestId: string,
  payload: {
    deviceId?: string
  }
}
```

### Response

```ts
{
  command: 'cyberbrickOtaReadinessResult',
  requestId: string,
  success: true,
  payload: OtaReadinessStatus
}
```

**驗收規則**

- 上傳前必須執行 readiness check。
- `ready = false` 時必須提供 `blockingReason` 與 `recommendedActions`。
- 不可把 USB fallback 當成自動修復；只能提示使用者手動切換。

## 訊息：OTA 上傳

### Request

`handleUploadClick()` 在目前 board 為 CyberBrick 且已保存模式為 `ota` 時，送出：

```ts
{
  command: 'cyberbrickOtaUploadRequest',
  requestId: string,
  payload: {
    code: string,
    board: 'cyberbrick'
  }
}
```

### Progress / Response

```ts
{
  command: 'cyberbrickOtaUploadProgress',
  requestId: string,
  success: true,
  payload: OtaUploadRun
}

{
  command: 'cyberbrickOtaUploadResult',
  requestId: string,
  success: true,
  payload: OtaUploadRun
}
```

**驗收規則**

- Extension Host 必須從專案工作區設定讀取 `primaryDeviceId`，WebView 不應直接指定任意裝置覆蓋主要目標。
- `code` 寫入路徑 v1 固定 `/app/rc_main.py`。
- 失敗 response 不得觸發 `requestUpload` USB 流程；WebView 只顯示錯誤與下一步。

## 與既有 `requestUpload` 的相容契約

- `USB` 模式：CyberBrick 仍走既有 `requestUpload` → `handleMicropythonUpload()` → `MicropythonUploader` 流程。
- `OTA` 模式：CyberBrick 不走既有 USB port selection，也不呼叫 USB uploader。
- Arduino / TXT / 非 CyberBrick board：不得顯示 CyberBrick OTA 設定，不得改變現有上傳行為。
