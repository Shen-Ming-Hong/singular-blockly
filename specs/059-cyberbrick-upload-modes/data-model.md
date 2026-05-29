# 資料模型：CyberBrick 上傳模式設定

## 概觀

本功能新增 CyberBrick 專用上傳模式、OTA pairing/provisioning、裝置 registry、Wi‑Fi scan suggestion、readiness validation 與 OTA upload run 的資料模型。資料模型需清楚分離三種範圍：

1. **專案工作區範圍非敏感設定**：目前上傳模式、主要 OTA 目標、已配對裝置非敏感描述。
2. **本機安全儲存敏感資料**：Wi‑Fi 密碼、OTA token、pairing secret。
3. **WebView 暫態 UI**：modal 表單輸入、目前掃描中的狀態、尚未保存的欄位。
4. **CyberBrick 裝置端自有檔案**：只允許新增/更新 Singular Blockly 自有 OTA 檔案，以及修改 `/app/rc_main.py` 的不含秘密 bootstrap；其他官方出廠檔案不屬於本功能資料模型。
5. **OTA 清除作業**：透過 USB 移除 Singular Blockly OTA 自有檔案、移除 `/app/rc_main.py` bootstrap，並清除本機 pairing/secrets 與上傳模式。

## Entity：CyberBrickUploadSettings

**用途**：描述某個專案工作區目前的 CyberBrick 上傳模式與 OTA 非敏感設定。

**欄位**

- `schemaVersion`: number；v1 固定為 `1`。
- `uploadMode`: `'usb' | 'ota'`；新專案預設 `usb`。
- `primaryDeviceId`: string 或 `null`；目前主要 OTA 目標。
- `pairedDevices`: `PairedCyberBrickDevice[]`；以 `deviceId` 去重。
- `lastOpenedAt`: ISO timestamp；用於除錯與排序，不作安全判斷。
- `updatedAt`: ISO timestamp。

**儲存位置**

- 使用專案工作區範圍（workspace folder scoped）的 VS Code configuration key `singular-blockly.cyberbrick.uploadSettings` 或等效的 workspace-folder scoped 設定。
- 不得包含 Wi‑Fi 密碼、OTA token、pairing secret 或可直接冒用裝置的完整憑證。

**驗證規則**

- `uploadMode` 缺失或非法時 fallback 為 `usb`。
- `uploadMode = 'ota'` 時，`primaryDeviceId` 必須指向 `pairedDevices` 中存在且 readiness 可檢查的裝置，否則上傳前回報 `missing-primary-device` 或 `device-not-paired`。
- 儲存 OTA provisioning 成功結果後不得自動把 `uploadMode` 改成 `ota`；只有使用者明確切換才可改變。

## Entity：PairedCyberBrickDevice

**用途**：代表一台已透過 USB 建立信任關係的 CyberBrick。

**欄位**

- `deviceId`: string；真正主鍵，來自裝置既有唯一值或首次 pairing 產生並寫入裝置的穩定 ID。
- `friendlyName`: string；顯示名稱，可重複，可由使用者修改。
- `shortDeviceLabel`: string；由 `deviceId` 產生的短識別，例如後 6–8 碼，用於 UI 區分同名裝置。
- `lastKnownIp`: string 或 `null`；最近成功 OTA/readiness check 得到的 IP。
- `otaPort`: number；v1 預設由 OTA agent 回報，若缺失使用預設 port。
- `lastSeenAt`: ISO timestamp 或 `null`。
- `lastSuccessfulUploadAt`: ISO timestamp 或 `null`。
- `wifiSsidHint`: string 或 `null`；最後選定/成功連線的 SSID 名稱，非密碼。
- `agentVersion`: string 或 `null`；裝置端 OTA agent 版本。
- `statusSummary`: `'unknown' | 'paired' | 'ready' | 'offline' | 'needs-provisioning' | 'token-missing' | 'agent-outdated'`。

**驗證規則**

- `deviceId` 必須唯一；新增同 `deviceId` 裝置時更新既有紀錄，不新增重複項。
- `friendlyName` 不可作為主鍵；UI 發現名稱重複時必須顯示 `shortDeviceLabel`、`lastKnownIp` 或 `lastSeenAt` 等額外資訊。
- `lastKnownIp` 只是候選位置，不可作為身分驗證依據；上傳前仍需 token/deviceId 驗證。

## Entity：CyberBrickSecretRef

**用途**：描述敏感資料在 `ExtensionContext.secrets` 中的 key 命名與 presence，不暴露秘密值。

**欄位**

- `workspaceHash`: string；workspace path 或 workspace identity 的不可逆 hash。
- `deviceId`: string。
- `kind`: `'wifi-password' | 'ota-token' | 'pairing-secret'`。
- `secretKey`: string；格式建議 `singular-blockly.cyberbrick.${workspaceHash}.${deviceId}.${kind}`。
- `hasValue`: boolean；只回傳是否已存在，不回傳實際值。
- `updatedAt`: ISO timestamp 或 `null`。

**驗證規則**

- WebView render payload 只能取得 `hasValue` / `updatedAt`，不得取得 secret value。
- 刪除裝置 pairing 時必須同步刪除該 `deviceId` 相關 secrets。
- 匯出、log、diagnostics、錯誤訊息不得印出 secret value 或完整 token。

## Entity：WifiNetworkSuggestion

**用途**：表示 CyberBrick 裝置本身掃描並回傳的 Wi‑Fi 名稱建議。

**欄位**

- `ssid`: string；可為空字串代表 hidden network placeholder，UI 需處理。
- `rssi`: number 或 `null`；訊號強度。
- `channel`: number 或 `null`。
- `security`: `'open' | 'secured' | 'unknown'`。
- `seenAt`: ISO timestamp。
- `sourceDeviceId`: string；掃描來源裝置。

**驗證規則**

- `ssid` 顯示前需 HTML escape；不可把 SSID 當作 trusted HTML。
- 同一 scan session 中可依 `ssid` + `security` 去重，但不得刪除手動輸入能力。
- 掃描結果只作為建議；使用者可輸入清單外 SSID。

## Entity：WifiScanSession

**用途**：描述一次由 USB pairing/provisioning 流程觸發的裝置端 Wi‑Fi 掃描。

**欄位**

- `scanId`: string；一次掃描的 correlation id。
- `deviceId`: string 或 `null`；尚未完成 pairing 時可為 `null`，但需有 USB port。
- `usbPort`: string；執行掃描的 USB port path 或 masked label。
- `startedAt` / `finishedAt`: ISO timestamp。
- `status`: `'running' | 'succeeded' | 'failed' | 'timed-out' | 'cancelled'`。
- `networks`: `WifiNetworkSuggestion[]`。
- `errorCode`: string 或 `null`。
- `userFacingMessage`: string。

**狀態轉換**

```text
running -> succeeded
running -> failed
running -> timed-out
running -> cancelled
```

**驗證規則**

- 同一 modal 同時間最多一個 active scan。
- timeout 必須有可理解下一步，例如重新插拔 USB 或手動輸入 SSID。
- 掃描失敗不得清除使用者已手動輸入的 SSID。

## Entity：OtaProvisioningRequest

**用途**：WebView 要求 Extension Host 透過 USB 完成首次 OTA 配對與網路設定。

**欄位**

- `requestId`: string。
- `usbPort`: string 或 `null`；若為 `null`，Extension Host 可要求選擇 CyberBrick USB port。
- `friendlyName`: string。
- `ssid`: string。
- `passwordProvided`: boolean；WebView submit 時包含密碼值，但不得回寫至 render payload。
- `reuseExistingWifiSecret`: boolean；使用已存在 secret 時為 true。
- `targetDeviceId`: string 或 `null`；更新既有裝置時使用。

**驗證規則**

- `friendlyName` trim 後不可為空；若空白則使用安全預設顯示名稱。
- `ssid` 可為手動輸入，trim 後不可為空。
- 開放網路可允許空密碼；加密網路若沒有既有 secret 則需 password。
- WebView submit 後 Extension Host 應立即將密碼轉存 `context.secrets`，不把值放入專案工作區設定；若需讓 CyberBrick 離線後重新連線，只能透過 USB trusted channel 寫入裝置端最小必要設定。

## Entity：CyberBrickDeviceSideOtaArtifacts

**用途**：描述 OTA provisioning 允許在 CyberBrick 裝置端新增或修改的檔案集合，作為相容性白名單。

**允許項目**

- `/cyberbrick_ota_agent.py`：Singular Blockly 自有 OTA agent 檔案，可新增或更新。
- `/cyberbrick_ota_config.py`：Singular Blockly 自有 OTA config 檔案，可新增或更新；可包含裝置端重新連線與 token 驗證所需的最小必要設定。
- `/app/rc_main.py`：CyberBrick app 入口，可加入或更新不含秘密的 OTA bootstrap，且後續 USB/OTA 上傳會重寫目前學生程式內容。

**禁止項目**

- `/boot.py`。
- WebREPL、韌體、系統網路、官方 runtime 或出廠設定檔。
- 任意刪除、重新命名或覆蓋非 Singular Blockly 管理的既有檔案。

**驗證規則**

- provisioning helper 的 write/open path 必須可用測試鎖定在允許項目內。
- OTA agent 的 `REMOTE_PATH` 必須固定為 `/app/rc_main.py`。
- `rc_main.py` bootstrap 不得包含 Wi‑Fi 密碼、OTA token 或 pairing secret。

## Entity：CyberBrickOtaCleanupRequest

**用途**：WebView 要求 Extension Host 透過 USB 完整停用目前 USB 連線 CyberBrick 的 OTA 支援；若該裝置同時是本機 paired device，則同步清除本機 pairing/secrets。

**欄位**

- `usbPort`: string；執行 cleanup 的 USB port，必填。
- `deviceId`: string 或 `null`；選填。若 UI 目前有選定 paired device，應附上其穩定身分供 Extension Host 做 mismatch 防呆；若未提供，cleanup 仍可針對 USB 連線裝置執行。

**驗證規則**

- 沒有 USB port 時不得執行，需回報 `usb-port-missing`。
- 提供 `deviceId` 時，USB 連線裝置讀不到身分需回報 `device-id-read-failed`；讀到但不相符需回報 `identity-mismatch`。
- 未提供 `deviceId` 時，Extension Host 可 best-effort 讀取裝置端身分；若讀不到，仍可清除 USB 連線裝置上的 Singular Blockly OTA 檔案，但不得刪除任何本機 pairing/secrets。
- Cleanup 必須走 USB；不得透過 OTA 刪除 OTA agent 本身。

## Entity：CyberBrickOtaCleanupResult

**用途**：描述一次 OTA cleanup 的安全結果，供 WebView 顯示與更新 modal state。

**欄位**

- `success`: boolean。
- `deviceId`: string 或 `null`。
- `removedAgent`: boolean；是否刪除 `/cyberbrick_ota_agent.py`。
- `removedConfig`: boolean；是否刪除 `/cyberbrick_ota_config.py`。
- `rcMainPatched`: boolean；是否寫回已移除 bootstrap 的 `/app/rc_main.py`。
- `rcMainHadBootstrap`: boolean；清除前是否找到 Singular Blockly OTA bootstrap marker。
- `localPairingRemoved`: boolean；是否找到並刪除相符的本機 paired device 或相關 secrets。
- `uploadMode`: `'usb'`；成功或失敗回報都應明確讓 UI 顯示 USB-only cleanup 的目標模式。
- `error`: `CyberBrickUploadUserError` 或 `null`。

**允許移除項目**

- `/cyberbrick_ota_agent.py`。
- `/cyberbrick_ota_config.py`。
- `/app/rc_main.py` 中由 `CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START` 與 `CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_END` 包住的區塊。
- Extension Host 本機該 `deviceId` 對應的 paired device 與 SecretStorage secrets（僅在可判定相符時）。

**禁止項目**

- `/boot.py`、WebREPL、韌體、系統網路、官方 runtime 或任何非 Singular Blockly 管理的檔案。
- 使用 `friendlyName` 作為 cleanup 身分判斷。

**驗證規則**

- 裝置端 helper 的 write path 必須只包含 `/app/rc_main.py`，delete path 必須只包含 `/cyberbrick_ota_agent.py` 與 `/cyberbrick_ota_config.py`。
- 若 `/app/rc_main.py` bootstrap 無法移除，cleanup 必須回報失敗，避免半清除被誤認為成功。
- 成功後 Extension Host 必須把專案 `uploadMode` 設為 `usb`。

## Entity：OtaProvisioningResult

**用途**：描述一次 USB-first OTA provisioning 的結果。

**欄位**

- `requestId`: string。
- `device`: `PairedCyberBrickDevice`。
- `status`: `'succeeded' | 'failed' | 'partial' | 'cancelled'`。
- `steps`: `OtaProvisioningStepResult[]`。
- `secretsStored`: `CyberBrickSecretRef[]`；只含 presence，不含值。
- `nextUploadMode`: `'usb'`；v1 provisioning 成功後仍維持 USB，除非使用者另行切換。
- `userFacingSummary`: string。

**驗證規則**

- `status = 'succeeded'` 時必須至少有 `deviceId`、OTA token secret presence、Wi‑Fi secret presence 或明確 open-network marker、agent version。
- provisioning 成功不得自動切換為 OTA。
- `partial` 必須列出缺失條件，readiness 不可回報 ready。

## Entity：OtaProvisioningStepResult

**用途**：描述 provisioning 內部每個步驟。

**欄位**

- `stepId`: `'detect-usb' | 'read-device-id' | 'install-agent' | 'scan-wifi' | 'configure-wifi' | 'verify-agent' | 'store-secrets'`。
- `status`: `'pending' | 'running' | 'succeeded' | 'failed' | 'skipped' | 'timed-out'`。
- `startedAt` / `finishedAt`: ISO timestamp。
- `sanitizedOutput`: string；已遮罩、已截斷。
- `errorCode`: string 或 `null`。
- `nextAction`: string 或 `null`。

**驗證規則**

- 任何 `sanitizedOutput` 都不得包含 Wi‑Fi 密碼或完整 token。
- `install-agent` 與 `configure-wifi` 需經 USB trusted channel 執行。
- `verify-agent` 必須以 `deviceId` + token/secret proof 判斷，不只看 IP 可連。

## Entity：OtaReadinessStatus

**用途**：在真正開始 OTA 上傳前判斷設定是否完整、目標是否可用。

**欄位**

- `ready`: boolean。
- `deviceId`: string 或 `null`。
- `mode`: `'usb' | 'ota'`。
- `checks`: `OtaReadinessCheck[]`。
- `blockingReason`: `'mode-usb' | 'missing-primary-device' | 'device-not-paired' | 'token-missing' | 'wifi-secret-missing' | 'agent-not-found' | 'device-offline' | 'ip-stale' | 'agent-outdated' | 'unknown' | null`。
- `recommendedActions`: Array of `'open-settings' | 'select-device' | 'run-usb-provisioning' | 'rescan-wifi' | 'retry' | 'switch-to-usb-manually'`。

**驗證規則**

- `mode = 'usb'` 不需 OTA readiness，且不得要求 OTA 欄位。
- `mode = 'ota'` 且 `ready = false` 時，`blockingReason` 與至少一個 `recommendedActions` 必填。
- `switch-to-usb-manually` 只能作為建議，不可自動執行。

## Entity：OtaReadinessCheck

**用途**：readiness status 中的單一檢查結果。

**欄位**

- `id`: `'settings-present' | 'device-selected' | 'secrets-present' | 'last-known-address' | 'agent-health' | 'identity-match'`。
- `status`: `'ok' | 'warning' | 'error' | 'skipped'`。
- `message`: string。
- `evidence`: Record<string, string | number | boolean | null>；只放非敏感摘要。

**驗證規則**

- `identity-match` 必須比較遠端回報的 `deviceId` 與設定目標。
- `secrets-present` 只能回報 presence，不得回報 secret 內容。
- `agent-health` timeout 時必須分類為 user-facing offline/agent issue。

## Entity：OtaUploadRequest

**用途**：Extension Host 啟動 OTA 上傳的內部 request。

**欄位**

- `operationId`: string。
- `deviceId`: string。
- `code`: string；要寫入 `/app/rc_main.py` 的 generated MicroPython。
- `remotePath`: string；v1 固定 `/app/rc_main.py`。
- `expectedAgentVersion`: string 或 `null`。
- `timeoutMs`: number。
- `createdAt`: ISO timestamp。

**驗證規則**

- `code` 來自現有 WebView code generation/save flow；Extension Host 寫入 `/app/rc_main.py` 前可加入不含秘密的 OTA agent bootstrap，以符合 CyberBrick 自動進入 `rc_main.py` 的執行模型。
- `remotePath` v1 固定，不允許任意使用者輸入 remote path。
- 啟動前必須有 `OtaReadinessStatus.ready = true`。

## Entity：OtaUploadRun

**用途**：描述一次 OTA 上傳的進度與結果，供 WebView 顯示。

**欄位**

- `operationId`: string。
- `deviceId`: string。
- `friendlyName`: string。
- `startedAt` / `finishedAt`: ISO timestamp。
- `status`: `'pending' | 'validating' | 'connecting' | 'transferring' | 'verifying' | 'restarting' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out'`。
- `progress`: number；0–100。
- `stageMessage`: string。
- `errorCode`: string 或 `null`。
- `userFacingSummary`: string。

**狀態轉換**

```text
pending -> validating -> connecting -> transferring -> verifying -> restarting -> succeeded
pending -> validating -> failed
connecting -> failed | timed-out | cancelled
transferring -> failed | timed-out | cancelled
verifying -> failed | timed-out | cancelled
restarting -> failed | timed-out | cancelled
```

**驗證規則**

- `failed` 不得觸發 USB fallback。
- 成功後更新 `PairedCyberBrickDevice.lastSuccessfulUploadAt` 與 `lastSeenAt`。
- 失敗摘要需包含下一步建議，但不得包含 token 或密碼。

## Entity：CyberBrickUploadPanelState

**用途**：WebView modal render payload；包含使用者可安全看到的設定與狀態。

**欄位**

- `settings`: `CyberBrickUploadSettings` 的安全顯示版。
- `selectedDevice`: `PairedCyberBrickDevice` 或 `null`。
- `secretPresence`: `CyberBrickSecretRef[]` 的安全摘要。
- `readiness`: `OtaReadinessStatus`。
- `wifiScan`: `WifiScanSession` 或 `null`。
- `activeProvisioning`: `OtaProvisioningResult` 的進行中摘要或 `null`。
- `activeUpload`: `OtaUploadRun` 或 `null`。
- `availableUsbPorts`: 安全顯示版 CyberBrick USB port list。

**驗證規則**

- 不包含 secret value。
- 不包含 raw stdout/stderr。
- 所有使用者可見文字由 i18n key 或 Extension Host localized message 提供。
- 沒有 CyberBrick board 時，UI 不應顯示 CyberBrick OTA 設定入口。
