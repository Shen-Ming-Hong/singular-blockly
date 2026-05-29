# 契約：CyberBrick 上傳設定儲存與秘密資料

## 目的

定義 CyberBrick 上傳模式設定在專案工作區範圍與本機安全儲存中的邊界。此契約確保老師分享專案時不會夾帶 Wi‑Fi 密碼或 OTA token，同時同一 workspace folder 重新開啟後仍能保留上傳模式與已配對裝置資訊。

## 非敏感專案工作區設定

### 儲存模型

```ts
interface CyberBrickUploadSettingsSnapshot {
  schemaVersion: 1;
  uploadMode: 'usb' | 'ota';
  primaryDeviceId: string | null;
  pairedDevices: PairedCyberBrickDevice[];
  updatedAt: string;
}
```

### 建議設定鍵

- `singular-blockly.cyberbrick.uploadSettings`
  - 儲存 `CyberBrickUploadSettingsSnapshot`。
  - 專案工作區範圍（workspace folder scoped）的 VS Code configuration。
  - 不含密碼、token、pairing secret。

### 可保存欄位

- `uploadMode`
- `primaryDeviceId`
- `deviceId`
- `friendlyName`
- `shortDeviceLabel`
- `lastKnownIp`
- `otaPort`
- `lastSeenAt`
- `lastSuccessfulUploadAt`
- `wifiSsidHint`
- `agentVersion`
- `statusSummary`

### 禁止保存欄位

- Wi‑Fi 密碼。
- OTA token 明文。
- pairing secret 明文。
- 可直接授權上傳的完整 Authorization header。
- raw stdout/stderr 中可能含有秘密的片段。

## SecretStorage key 契約

### Key 格式

```text
singular-blockly.cyberbrick.${workspaceHash}.${deviceId}.${kind}
```

`kind` 允許值：

- `wifi-password`
- `ota-token`
- `pairing-secret`

### Workspace hash

```ts
workspaceHash = sha256(workspaceFolderUri.toString()).slice(0, 16)
```

**規則**

- hash 只用於 key namespace，不作密碼學安全承諾。
- 同一裝置在不同 workspace folder 可有不同 secrets，避免教室專案互相污染。
- 如果 workspace 不存在，設定服務必須回報 `no-workspace`，不得落到 global secret namespace。

## Extension 端與裝置端秘密邊界

- Extension 端持久化的 Wi‑Fi 密碼、OTA token、pairing secret 只能存在 `context.secrets`。
- 首次 USB provisioning 可透過可信任 USB 通道把 CyberBrick 重新連線與 OTA agent 驗證所需的最小必要設定寫入裝置端，但只能寫入 Singular Blockly 自有檔案（v1：`/cyberbrick_ota_config.py`）。
- 裝置端秘密設定屬於 CyberBrick runtime/agent state，不得被序列化到 `singular-blockly.cyberbrick.uploadSettings`、`rc_main.py` bootstrap、WebView render payload、diagnostics 或 log；`rc_main.py` 只可包含不含秘密的 agent 啟動呼叫。
- Secret/config 寫入不得修改 `/boot.py`、WebREPL 設定、韌體/出廠設定或官方 runtime 檔案；其他官方出廠狀態必須保持不變。
- 若未來改為不在裝置端保存 Wi‑Fi/OTA 設定，必須同步更新 provisioning 與 reconnect 流程；目前 v1 以「裝置端可保存最小必要設定」為實作前提。

## Secret lifecycle

### 建立 / 更新

1. WebView 送出 provisioning request，payload 可包含 `wifiPassword`。
2. Extension Host 立即驗證 request。
3. Extension Host 將 `wifiPassword` 與新產生/裝置回報的 OTA token 寫入 `context.secrets`。
4. Extension Host 回傳 panel state，只包含 `hasValue: true`，不得回傳明文。
5. 若 provisioning 需要裝置端保存連線設定，寫入必須只經 USB trusted channel 執行、只落在 `/cyberbrick_ota_config.py`，且所有 stdout/stderr 都要遮罩後才能進 UI 或 log。

### 讀取

- 只有 `CyberBrickOtaProvisioningService`、`CyberBrickOtaUploader` 或 `CyberBrickUploadSettingsService` 內部可讀取 secret value。
- WebView load/settings response 僅提供 presence。

### 刪除

- 使用者刪除 paired device 時，必須刪除該 `deviceId` 的所有 secret keys。
- 使用者清除 OTA 設定時，必須清除專案工作區設定中對應裝置，並刪除 SecretStorage 中同 namespace secrets。
- 若只從 `ota` 切回 `usb`，不得自動刪除 secrets；使用者可能稍後再切回 OTA。

## Migration / schema version

- `schemaVersion` 缺失時視為 v0，fallback 到：`uploadMode = 'usb'`、`pairedDevices = []`、`primaryDeviceId = null`。
- 不認識的 `schemaVersion` 必須保守 fallback 到 USB，並保留原始資料直到使用者保存，避免破壞未來版本。
- migration 不可把任何 secret 寫進專案工作區設定。

## Logging 與匯出遮罩

- Extension Host logging 使用 `log()`。
- log 可包含 `deviceId` 的短摘要、error code、步驟名稱。
- log 不可包含 Wi‑Fi 密碼、完整 token、完整 Authorization header。
- 若需顯示 SSID，需以一般使用者資料處理，不可當作 HTML。

## 測試契約

實作時需以 mockable interface 測試：

- `WorkspaceConfigurationLike` 或 `SettingsManager` 注入，驗證保存非敏感設定。
- `SecretStorageLike` 注入，驗證 store/get/delete lifecycle。
- 刪除 paired device 會刪除 secrets。
- 保存設定時即使 payload 內含 password 欄位也不得進入專案工作區設定。
- 同一 `friendlyName` 的兩台裝置可共存，因為 key 使用 `deviceId`。
- 裝置端 secret/config helper 不得包含 `/boot.py` 或其他非白名單寫入路徑。
