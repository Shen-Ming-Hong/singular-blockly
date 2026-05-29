# Quickstart：CyberBrick 上傳模式設定驗證指南

## 目標

本指南用於實作完成後驗證 CyberBrick `USB` / `OTA` 上傳模式設定：右上角設定齒輪、USB-first provisioning、裝置端 Wi‑Fi 掃描、多裝置選擇、SecretStorage、OTA 上傳與 USB 回歸。

## 自動化驗證

實作完成後執行：

```bash
npm run compile
npm run lint
npm test
```

若新增或修改任何使用者可見字串，執行：

```bash
npm run validate:i18n
```

建議新增/更新的測試檔：

- `src/test/services/cyberbrickUploadSettingsService.test.ts`
  - 新專案預設 `USB`。
  - 非敏感 settings 保存/載入。
  - `friendlyName` 重複但 `deviceId` 不同可共存。
  - 刪除裝置會清除 SecretStorage 對應 keys。
- `src/test/services/cyberbrickOtaProvisioningService.test.ts`
  - USB port 缺失、多台 CyberBrick、scan timeout、manual SSID fallback。
  - provisioning 成功後不自動切換到 OTA。
  - Wi‑Fi 密碼/token 不進專案工作區設定或 response payload。
- `src/test/services/micropythonUploaderCyberBrickHelpers.test.ts`
  - device-side helper 只允許新增 `/cyberbrick_ota_agent.py`、新增/更新 `/cyberbrick_ota_config.py`，以及修改 `/app/rc_main.py`。
  - helper/agent source 不得包含 `/boot.py` 或其他非白名單寫入路徑。
  - OTA cleanup helper 只可刪除 `/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py`，並只可寫回 `/app/rc_main.py` 以移除 bootstrap marker。
- `src/test/services/cyberbrickOtaUploader.test.ts`
  - readiness failed 時不送出 OTA。
  - `deviceId` mismatch / token rejected / offline / timeout 分類正確。
  - 成功寫入含 OTA agent bootstrap 的 `/app/rc_main.py` 後更新裝置 metadata。
  - 失敗不呼叫 USB uploader。
- `src/test/suite/cyberbrick-rc-ota-generation.test.ts`
  - RC/ESP‑NOW generated code 在裝置已有 OTA 設定時不得無條件斷開 STA Wi‑Fi，避免 `/health` timeout。
- `src/test/messageHandler.test.ts`
  - 新增 WebView message cases：load/save settings、USB ports、Wi‑Fi scan、provisioning、readiness、OTA upload、OTA cleanup。
  - `USB` 模式維持既有 `handleMicropythonUpload()`。
- `src/test/suite/cyberbrickUploadSettingsUiContract.test.ts`
  - HTML/JS contract：CyberBrick 設定齒輪、modal ids、不可使用 TXT 狀態 class、password 欄位不回填。
  - i18n key contract：新增 key 在 15 語系存在。

## 使用性驗證計畫

下列驗證用於支持 SC-001、SC-003、SC-004、SC-005 的比例型成功標準。若實作階段無法立即招募完整樣本，至少需記錄目前樣本數、通過數、失敗原因與後續補測計畫，不得把單人 manual smoke test 當成百分比驗證。

| 成功標準 | 建議樣本與量測方式 | 通過門檻 | 記錄內容 |
|---|---|---|---|
| SC-001 首次 OTA 5 分鐘內完成 | 至少 10 位目標使用者或等效教學現場 trial；從開啟設定齒輪開始計時，到第一次 OTA 上傳成功停止 | ≥9/10 在 5 分鐘內完成 | 使用者角色、耗時、是否需協助、卡關步驟 |
| SC-003 多裝置選對目標 | 至少 20 次含兩台以上已配對裝置的選擇任務；其中至少一半包含重複 `friendlyName` | ≥19/20 第一次選中正確 `deviceId` | 裝置數量、是否同名、選擇結果、誤選原因 |
| SC-004 連續上傳不再被詢問 | 至少 10 位已完成模式設定的使用者，各連續上傳 3 次 | ≥9/10 第二次以後未遇到模式選擇對話 | 模式、上傳次數、是否出現打斷對話 |
| SC-005 SSID 清單空白或不完整仍可完成 | 至少 10 次隱藏 SSID 或掃描缺漏情境 | ≥9/10 可透過手動輸入完成設定 | 掃描結果、手動 SSID 是否成功、錯誤訊息是否足夠 |

使用性驗證證據應回填到本文件的手動驗證紀錄區，或連結到同一 feature folder 內的驗證附件；不得記錄 Wi‑Fi 密碼、OTA token 或完整授權 header。

## 手動驗證矩陣

### 1. 新專案預設 USB

1. 開啟 CyberBrick 專案。
2. 點右上角 CyberBrick 上傳設定齒輪。
3. 確認模式顯示 `USB` 為預設。
4. 不填任何 OTA 欄位，按保存。
5. 按既有上傳按鈕。
6. 確認走原本 USB 上傳流程，沒有 OTA 詢問或 OTA 欄位阻擋。

### 2. 非 CyberBrick board 不受影響

1. 切換到 Arduino Uno/ESP32 或 TXT 相關流程。
2. 確認 CyberBrick OTA 設定齒輪不顯示或 disabled。
3. 按上傳，確認既有 Arduino/TXT 行為不變。

### 3. 第一次 OTA 設定：USB-first pairing

1. 使用 USB 連接一台 CyberBrick。
2. 開啟 CyberBrick 上傳設定。
3. 切到 OTA，確認畫面提示需先透過 USB 完成設定。
4. 選擇 USB port。
5. 輸入裝置顯示名稱。
6. 執行 Wi‑Fi 掃描。
7. 從 CyberBrick 裝置回傳的 SSID 清單選擇網路，或手動輸入 SSID。
8. 輸入 Wi‑Fi 密碼並開始設定。
9. 確認 provisioning 成功後仍維持 `USB` 模式，畫面提示可手動切換到 OTA。

### 4. SSID 建議空白或不完整

1. 使用隱藏 SSID 或讓 CyberBrick 掃描結果為空的測試環境。
2. 開啟 OTA 設定並執行掃描。
3. 確認畫面顯示友善說明。
4. 手動輸入 SSID 與密碼。
5. 確認仍可完成 provisioning 或取得明確錯誤。

### 5. 切換到 OTA 並連續上傳

1. 完成 provisioning 後，在 modal 中手動選擇 `OTA` 並保存。
2. 按既有上傳按鈕。
3. 確認直接以目前主要裝置 OTA 上傳，不再次詢問是否 OTA。
4. 修改積木後再次上傳。
5. 確認第二次也直接 OTA，不彈出模式選擇對話。

### 6. OTA 目標離線，不自動 fallback

1. 切到 OTA 並選定已配對裝置。
2. 關閉 CyberBrick、換網路或阻擋其 IP。
3. 按上傳。
4. 確認上傳在真正傳送前或連線階段失敗，顯示是哪台裝置不可連線。
5. 確認沒有自動開啟 USB port picker，也沒有呼叫 USB uploader。
6. 手動切回 USB 後，再按上傳，確認才走 USB。

### 7. 多台裝置與重複名稱

1. 透過 USB provisioning 兩台 CyberBrick。
2. 將兩台 `friendlyName` 都設為相同名稱，例如「小車」。
3. 開啟裝置清單。
4. 確認 UI 同時顯示兩台，且用 `deviceId` 摘要、最近 IP 或 last seen 區分。
5. 指定其中一台為主要目標並保存。
6. 按 OTA 上傳，確認送到指定 `deviceId`，不改送最近發現的另一台。

### 8. SecretStorage / 專案分享檢查

1. 完成 OTA provisioning。
2. 檢查 workspace `.vscode/settings.json` 或對應的 VS Code 專案工作區設定。
3. 確認只有 `uploadMode`、`deviceId`、`friendlyName`、`lastKnownIp` 等非敏感資料。
4. 確認沒有 Wi‑Fi 密碼、完整 OTA token、Authorization header。
5. 複製專案到另一台機器或清除 SecretStorage 後開啟。
6. 確認裝置 registry 可見，但 readiness 顯示 `token-missing` 或需要重新 USB provisioning。

### 9. 從 OTA 切回 USB 的回歸

1. 在已完成 OTA 的專案中切回 `USB` 並保存。
2. 關閉並重新開啟 Blockly 編輯器。
3. 按上傳。
4. 確認只走 USB 流程，不顯示 OTA 失敗、不嘗試連線 OTA 目標。
5. 再次開啟設定，確認已配對裝置仍保留，可日後手動切回 OTA。

### 10. WebView 安全與可用性

1. 建立含特殊字元的 SSID，例如 `<script>alert(1)</script>`。
2. 讓 CyberBrick scan 回傳該 SSID 或手動輸入。
3. 確認 UI 以文字顯示，不執行 HTML/JS。
4. 切換深色/淺色主題，確認 modal 可讀。
5. 關閉/reopen modal，確認密碼不以明文回填。

### 11. 裝置端出廠狀態相容性

1. 使用 USB-first provisioning 設定一台 CyberBrick。
2. 檢查裝置端檔案變更僅包含新增/更新 `/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py`，以及修改 `/app/rc_main.py`。
3. 確認沒有修改 `/boot.py`、WebREPL 設定、韌體/出廠設定或其他官方 runtime 檔案。
4. 進行一次 OTA 上傳。
5. 確認 OTA 上傳只更新 `/app/rc_main.py`，不新增或修改其他官方檔案。

### 12. 一鍵完整清除 OTA

1. 使用 USB 連接已完成 OTA provisioning 的 CyberBrick。
2. 開啟 CyberBrick 上傳設定，選擇目前 USB 連線的 CyberBrick；此裝置不一定要已經在本機 paired devices 清單中。
3. 在進階 OTA 清除區按「從裝置移除 OTA」。
4. 確認對話應清楚說明會移除 `/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py`、`/app/rc_main.py` 中的 OTA bootstrap、本機 secrets 與 pairing，且不會碰 `/boot.py` 或出廠檔案。
5. 確認後等待 cleanup 完成。
6. 檢查裝置端：`/cyberbrick_ota_agent.py` 與 `/cyberbrick_ota_config.py` 不存在，`/app/rc_main.py` 不再包含 Singular Blockly OTA bootstrap marker。
7. 檢查本機設定：若 USB 裝置的 `deviceId` 對應本機 paired device，該 paired device 與 SecretStorage secrets 被移除；若沒有對應本機 paired device，則本機清單不被誤刪。兩種情況下上傳模式都應為 `USB`。
8. 重新按上傳，確認只走 USB 流程。
9. 若 UI 已選定某個 paired device，但 USB 連到不同 `deviceId` 的 CyberBrick，確認 cleanup 被拒絕並顯示 identity mismatch，不刪除原 paired device；若 UI 未選定 paired device，則允許清除目前 USB 連線裝置上的 Singular Blockly OTA 檔案。

## 回歸檢查

- 既有 CyberBrick USB 上傳仍寫入 `/app/rc_main.py`，且開頭包含不重複的 OTA agent bootstrap。
- 既有 MicroPython Wi‑Fi 積木的 generated code 不因 OTA 模式被修改；bootstrap 由 Extension Host 在寫入 `rc_main.py` 前包裝。
- 裝置端變更只限新增/更新 `/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py` 與修改 `/app/rc_main.py`；不得碰 `/boot.py` 或其他官方出廠檔案。
- OTA cleanup 只限刪除 `/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py` 與移除 `/app/rc_main.py` marker bootstrap；不得刪除或重命名非 Singular Blockly 管理的檔案。
- RC/ESP‑NOW 範例若已完成 OTA 配對，generated code 必須保留 STA Wi‑Fi；可用無 token `GET http://<ip>:8266/api/v1/health` 預期回傳 `401 token-rejected` 作為 agent reachable 的安全檢查。
- `media/blockly/generators/micropython/*` 不注入 OTA provisioning、Wi‑Fi 密碼或 token。
- `uploadButton` spinner/loading 狀態不被 TXT/CyberBrick class 混用破壞。
- Extension Host 無新增 `console.log`。
- WebView 新字串通過 15 語系 i18n validation。
- 沒有持續背景 Wi‑Fi scan 或 device polling。

## 手動驗證紀錄（實作階段）

> 目前紀錄為本功能實作完成前的可追蹤驗證狀態；尚未在真實教室或完整實機樣本上宣稱達成比例型成功標準。

| 成功標準 | 樣本數 | 通過數 | 目前狀態 | 失敗原因 / 後續補測 |
|---|---:|---:|---|---|
| SC-001 首次 OTA 5 分鐘內完成 | 0 | 0 | 待實機驗證 | 需要至少 10 位目標使用者或等效教學現場 trial；實作已提供 USB-first provisioning UI 與 service 測試。 |
| SC-003 多裝置選對目標 | 0 | 0 | 待實機驗證 | 需要至少 20 次多裝置選擇任務；實作已以 `deviceId` 摘要顯示同名裝置並保存 `primaryDeviceId`。 |
| SC-004 連續上傳不再被詢問 | 0 | 0 | 待實機驗證 | 需要至少 10 位使用者各連續上傳 3 次；實作已改為保存模式後由 `handleUploadClick()` 直接分流 USB/OTA。 |
| SC-005 SSID 清單空白或不完整仍可完成 | 0 | 0 | 待實機驗證 | 需要至少 10 次隱藏 SSID 或掃描缺漏情境；實作保留手動 SSID input，scan 失敗不回填密碼。 |

### 本次自動化/靜態驗證證據

- 已新增 service/message/WebView contract 測試檔，涵蓋 settings、USB ports、Wi‑Fi scan、provisioning、readiness、OTA upload 與 no-secret response。
- 已新增 OTA cleanup service/message/WebView/helper contract 測試，涵蓋 USB identity validation、白名單刪除、本機 pairing/secrets 清除、upload mode 回 USB 與 no-secret response。
- **2026-06-XX（本 session 驗證）**：`npm test` 全部 850 tests passing，0 failing，1 pending；執行環境 Node.js 22.16.0 / macOS。涵蓋 `cyberbrickOtaUploader.test.ts`、`micropythonUploaderCyberBrickHelpers.test.ts`、`cyberbrickOtaProvisioningService.test.ts`、`cyberbrickUploadSettingsService.test.ts`、`messageHandler.test.ts`、`cyberbrickUploadSettings.contract.test.ts`。
- **實機端對端驗證（CyberBrick device IP 192.168.50.204，OTA port 8266）**：
  - OTA 上傳 `/app/rc_main.py` 成功（HTTP 200，SHA-256 相符，bytesWritten 正確）。
  - v2 raw binary streaming protocol（`Content-Type: application/octet-stream`，1024B chunks）正常運作，無 HTTP 500 / MemoryError。
  - 裝置端 cleanup（移除 OTA agent/config、還原 `rc_main.py` bootstrap）成功。
  - Agent v1.2.0 OTA 上傳後自動 `machine.reset()`，裝置立即重啟執行新程式，無需手動按 RST。
- 已以 TypeScript diagnostics 檢查新增/修改的 TypeScript 測試與服務檔案，未發現編譯診斷錯誤。
- 最終仍需執行 `npm run compile`、`npm run lint`、`npm test` 與 `npm run validate:i18n` 作為交付前驗證。
