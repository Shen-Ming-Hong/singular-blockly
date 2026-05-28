# 任務：CyberBrick 上傳模式設定

**輸入**：`specs/059-cyberbrick-upload-modes/` 的設計文件
**前置文件**：`plan.md`、`spec.md`、`research.md`、`data-model.md`、`contracts/`、`quickstart.md`
**測試**：本功能的 `quickstart.md` 與 `plan.md` 已明確要求 service、message handler、WebView contract、i18n 與使用性驗證，因此各使用者故事皆包含先寫測試的任務。
**組織方式**：任務依使用者故事分組，確保每個故事都能獨立完成與驗證。

## Phase 1：準備工作（共享結構）

**目的**：建立 CyberBrick 上傳設定所需的共用型別、測試替身與 fixtures，避免後續故事各自重複定義資料結構。

- [ ] T001 建立 CyberBrick upload 共用型別與 message payload 介面於 `src/types/cyberbrickUpload.ts`
- [ ] T002 [P] 建立 workspace configuration 與 SecretStorage 測試替身於 `src/test/helpers/cyberbrickUploadMocks.ts`
- [ ] T003 [P] 建立可重用的 CyberBrick upload 測試 fixtures 於 `src/test/fixtures/cyberbrickUploadFixtures.ts`
- [ ] T004 [P] 建立 WebView contract 測試工具，用於 HTML/JS 結構斷言於 `src/test/webview/cyberbrickUploadTestUtils.ts`

---

## Phase 2：基礎建設（所有故事的阻塞前置）

**目的**：實作跨故事共用的 settings normalization、secret key、sanitized state、錯誤分類與 service 注入骨架。

**⚠️ 重要**：這個階段完成前，不應開始任何使用者故事的 UI、provisioning 或 OTA upload 實作。

- [ ] T005 新增 CyberBrick upload settings service 測試，涵蓋預設值、schema migration、重複 `friendlyName`、secret key 產生與 sanitized state 於 `src/test/services/cyberbrickUploadSettingsService.test.ts`
- [ ] T006 實作 `CyberBrickUploadSettingsService`，支援專案工作區範圍非敏感設定、SecretStorage lifecycle、schema migration、重複裝置處理與 sanitized panel state 於 `src/services/cyberbrickUploadSettingsService.ts`
- [ ] T007 [P] 實作 CyberBrick upload 錯誤分類與 user-facing next-action helper 於 `src/services/cyberbrickUploadErrors.ts`
- [ ] T008 在 extension message layer 註冊 CyberBrick upload service dependencies 於 `src/extension.ts` 與 `src/webview/messageHandler.ts`

**檢查點**：基礎建設完成後，使用者故事可依優先級或由不同貢獻者平行開始。

---

## Phase 3：使用者故事 1 - 先選好上傳模式，不要每次都被打擾（優先級：P1）🎯 MVP

**目標**：在 CyberBrick 編輯體驗中提供固定設定齒輪，預設 `USB`，可保存 `USB` / `OTA` 模式；按上傳時直接依目前模式執行，不重複詢問。

**獨立測試**：新 CyberBrick 專案開啟設定時顯示 `USB` 預設；USB 模式按上傳仍走既有 MicroPython USB 流程；切到 OTA 後連續按上傳不再跳出模式選擇詢問，而是直接走 OTA readiness/upload 入口或顯示缺少設定的明確提示。

### 使用者故事 1 測試

> **注意**：先寫測試並確認在實作前失敗。

- [ ] T009 [US1] 新增 message handler 測試，涵蓋 `cyberbrickUploadSettingsLoad`、`cyberbrickUploadSettingsSave`、預設 USB mode 與 USB flow preservation 於 `src/test/messageHandler.test.ts`
- [ ] T010 [P] [US1] 新增 WebView contract 測試，涵蓋 CyberBrick settings gear visibility、modal structure、mode selector 與 mode-aware upload branching 於 `src/test/webview/cyberbrickUploadSettings.contract.test.ts`

### 使用者故事 1 實作

- [ ] T011 [US1] 實作 `cyberbrickUploadSettingsLoad` 與 `cyberbrickUploadSettingsSave` handlers 於 `src/webview/messageHandler.ts`
- [ ] T012 [P] [US1] 新增 CyberBrick upload settings gear button 與 base modal markup 於 `media/html/blocklyEdit.html`
- [ ] T013 [US1] 實作 CyberBrick upload settings modal state loading、saving、rendering 與 mode-aware `handleUploadClick()` branching 於 `media/js/blocklyEdit.js`
- [ ] T014 [P] [US1] 新增 CyberBrick upload modal 與 toolbar styles，避免使用 TXT-specific classes 於 `media/css/blocklyEdit.css`
- [ ] T015 [US1] 對非 CyberBrick boards 隱藏或停用 CyberBrick upload settings entry 於 `media/js/blocklyEdit.js`
- [ ] T016 [US1] 新增 upload mode、gear、modal、USB default、save 與 basic readiness i18n keys 到 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js`

**檢查點**：使用者故事 1 完成後，MVP 可驗證「預設 USB、保存模式、按上傳不重複詢問」。

---

## Phase 4：使用者故事 2 - 第一次設定 OTA 時有清楚引導與 Wi‑Fi 協助（優先級：P2）

**目標**：透過 USB-first provisioning 完成可信任配對、裝置命名、裝置端 SSID 掃描、Wi‑Fi 設定與 secret 儲存；完成後仍保持 `USB` 模式，等待使用者明確切換。

**獨立測試**：尚未完成 OTA 設定時，系統引導使用者接 USB；可透過 CyberBrick 裝置本身掃描 SSID、手動輸入隱藏或未列出的 SSID，並完成 provisioning；Wi‑Fi 密碼與 token 不出現在專案工作區設定、WebView response 或 log payload。

### 使用者故事 2 測試

> **注意**：先寫測試並確認在實作前失敗。

- [ ] T017 [P] [US2] 新增 provisioning service 測試，涵蓋 USB port missing/multiple devices、deviceId creation、Wi‑Fi scan success/empty/timeout/failure、manual SSID fallback、secret storage 與 `nextUploadMode = 'usb'` 於 `src/test/services/cyberbrickOtaProvisioningService.test.ts`
- [ ] T018 [US2] 新增 message handler 測試，涵蓋 `cyberbrickUsbPortsRequest`、`cyberbrickWifiScanRequest`、`cyberbrickOtaProvisionRequest`、provisioning progress 與 responses 不含 secret values 於 `src/test/messageHandler.test.ts`

### 使用者故事 2 實作

- [ ] T019 [US2] 新增可重用 mpremote helper methods，用於 CyberBrick deviceId read/write、device-side Wi‑Fi scan 與 OTA agent deployment hooks 於 `src/services/micropythonUploader.ts`
- [ ] T020 [P] [US2] 建立最小 CyberBrick OTA agent MicroPython source/template，支援 deviceId/token proof、health check、v1 LAN protocol 與 `/app/rc_main.py` write support 於 `src/services/cyberbrickOtaAgentSource.ts`
- [ ] T021 [US2] 實作 `CyberBrickOtaProvisioningService`，支援 USB detection、deviceId provisioning、Wi‑Fi scan、agent install/configure、Extension 端 SecretStorage、裝置端最小必要設定、sanitized progress 與 no automatic OTA mode switch 於 `src/services/cyberbrickOtaProvisioningService.ts`
- [ ] T022 [US2] 實作 USB port list、Wi‑Fi scan、provisioning progress 與 provisioning result message handlers 於 `src/webview/messageHandler.ts`
- [ ] T023 [US2] 新增 provisioning form controls，包含 USB port、friendly name、SSID combobox、rescan button、password field 與 provisioning progress 於 `media/html/blocklyEdit.html`
- [ ] T024 [US2] 實作 provisioning form behavior、device-side SSID rescan、manual SSID fallback、password one-way submit 與 no password re-rendering 於 `media/js/blocklyEdit.js`
- [ ] T025 [US2] 新增 provisioning、USB setup、SSID scan、manual SSID、secret presence 與 provisioning error i18n keys 到 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js`

**檢查點**：使用者故事 2 完成後，第一次 OTA 設定可透過 USB 完成，且不污染學生作品或專案 secrets。

---

## Phase 5：使用者故事 3 - 同一個教室有多台裝置時，仍能選對目標（優先級：P3）

**目標**：在同一專案中管理多台已配對 CyberBrick，以 `deviceId` 區分同名裝置，指定主要 OTA 目標，並在 OTA 上傳前做 readiness validation；失敗時不自動 fallback。

**獨立測試**：兩台同名 CyberBrick 可同時顯示並以 `deviceId` 摘要區分；選定主要目標後 OTA 上傳只送到該 `deviceId`；目標離線、token 缺失、identity mismatch 或 timeout 時顯示下一步但不呼叫 USB uploader。

### 使用者故事 3 測試

> **注意**：先寫測試並確認在實作前失敗。

- [ ] T026 [P] [US3] 新增 OTA uploader 測試，涵蓋 readiness failure、offline target、token rejected、identity mismatch、timeout、v1 `/health`、v1 `/upload`、successful `/app/rc_main.py` upload、metadata update 與 no USB fallback 於 `src/test/services/cyberbrickOtaUploader.test.ts`
- [ ] T027 [US3] 新增 message handler 測試，涵蓋 `cyberbrickOtaReadinessRequest`、`cyberbrickOtaUploadRequest`、progress/result forwarding、primary device lookup 與 no fallback to existing USB upload 於 `src/test/messageHandler.test.ts`
- [ ] T028 [P] [US3] 新增 WebView contract 測試，涵蓋 duplicate `friendlyName`、`deviceId` summary display、primary target selection、offline readiness message 與 OTA progress/result UI 於 `src/test/webview/cyberbrickUploadSettings.contract.test.ts`

### 使用者故事 3 實作

- [ ] T029 [US3] 實作 OTA readiness builder，涵蓋 selected `primaryDeviceId`、secret presence、last-known address、agent health、identity match、blocking reasons 與 recommended actions 於 `src/services/cyberbrickUploadSettingsService.ts`
- [ ] T030 [US3] 實作 `CyberBrickOtaUploader`，支援 authenticated v1 LAN upload、`/health` validation、`/upload` request/response validation、`/app/rc_main.py` remote path enforcement、progress stages、timeout handling、identity/token validation、SHA-256 比對、agent version negotiation 與 sanitized errors 於 `src/services/cyberbrickOtaUploader.ts`
- [ ] T031 [US3] 實作 OTA readiness 與 OTA upload message handlers，包含 progress/result forwarding 與 explicit no-USB-fallback behavior 於 `src/webview/messageHandler.ts`
- [ ] T032 [US3] 新增 paired-device list、duplicate-name `deviceId` labels、status badges、delete confirmation 與 primary target selection markup 於 `media/html/blocklyEdit.html`
- [ ] T033 [US3] 實作 paired-device rendering、target selection save、duplicate-name disambiguation、offline readiness display、OTA progress/result handling 與 no-fallback next-action UI 於 `media/js/blocklyEdit.js`
- [ ] T034 [US3] 更新 successful OTA upload metadata，包含 `lastSeenAt`、`lastSuccessfulUploadAt`、`lastKnownIp` 與 `statusSummary` 於 `src/services/cyberbrickUploadSettingsService.ts` 與 `src/services/cyberbrickOtaUploader.ts`
- [ ] T035 [US3] 新增 paired-device list、duplicate-name、status badge、readiness、OTA progress、OTA error 與 no-fallback i18n keys 到 `media/locales/bg/messages.js`、`media/locales/cs/messages.js`、`media/locales/de/messages.js`、`media/locales/en/messages.js`、`media/locales/es/messages.js`、`media/locales/fr/messages.js`、`media/locales/hu/messages.js`、`media/locales/it/messages.js`、`media/locales/ja/messages.js`、`media/locales/ko/messages.js`、`media/locales/pl/messages.js`、`media/locales/pt-br/messages.js`、`media/locales/ru/messages.js`、`media/locales/tr/messages.js` 與 `media/locales/zh-hant/messages.js`

**檢查點**：使用者故事 3 完成後，多裝置 OTA 目標選擇、readiness、上傳與失敗處理都可獨立驗證。

---

## Phase 6：修整與橫切關注點

**目的**：完成跨故事文件、驗證、安全檢查、i18n 與回歸清理。

- [ ] T036 [P] 更新 CyberBrick MicroPython 文件，補充 USB/OTA mode behavior、`/app/rc_main.py`、USB-first provisioning、v1 OTA protocol 與 no-fallback guidance 於 `docs/specifications/03-hardware-support/cyberbrick-micropython.md`
- [ ] T037 [P] 依 `quickstart.md` 的 manual matrix 與使用性驗證計畫記錄驗證證據，包含 SC-001/SC-003/SC-004/SC-005 的樣本數、通過數與失敗原因於 `specs/059-cyberbrick-upload-modes/quickstart.md`
- [ ] T038 執行 `specs/059-cyberbrick-upload-modes/quickstart.md` 列出的 compile、lint、unit tests 與 i18n validation
- [ ] T039 檢查並強化 secret redaction、postMessage payload sanitization 與 no `console.log` usage 於 `src/services/cyberbrickUploadSettingsService.ts`、`src/services/cyberbrickOtaProvisioningService.ts`、`src/services/cyberbrickOtaUploader.ts`、`src/webview/messageHandler.ts` 與 `media/js/blocklyEdit.js`
- [ ] T040 重構重複的 modal/render helper code，同時保留既有 upload button 與 TXT UI behavior 於 `media/js/blocklyEdit.js`、`media/html/blocklyEdit.html` 與 `media/css/blocklyEdit.css`

---

## 相依性與執行順序

### 階段相依性

- **Phase 1 準備工作**：無前置依賴，可立即開始。
- **Phase 2 基礎建設**：依賴 Phase 1；完成前會阻塞所有 user stories。
- **Phase 3 US1 (P1)**：依賴 Phase 2；MVP 範圍。
- **Phase 4 US2 (P2)**：依賴 Phase 2；可在 US1 完成基礎 UI 後整合 provisioning UI，若多人開發可與 US1 部分並行但需協調 `media/html/blocklyEdit.html`、`media/js/blocklyEdit.js`。
- **Phase 5 US3 (P3)**：依賴 Phase 2；建議在 US1/US2 後整合完整 OTA target 與 upload UX。
- **Phase 6 修整**：依賴欲交付的 user stories 完成。

### 使用者故事相依性

- **US1 (P1)**：可在 Foundation 後獨立完成；不依賴 US2/US3。
- **US2 (P2)**：依賴 Foundation；會擴充 US1 modal，但 provisioning service 與 message contracts 可獨立測試。
- **US3 (P3)**：依賴 Foundation；會使用 US2 建立的 paired devices/secrets，但 readiness 與 OTA uploader 可用 fixtures/mock 獨立測試。

### 需求覆蓋

| 需求 | 覆蓋任務 |
|---|---|
| FR-001–FR-006 | T009–T016 |
| FR-007–FR-013 | T017–T025 |
| FR-014–FR-018, FR-022 | T026–T035 |
| FR-019 | T017, T021, T024 |
| FR-020 | T021, T026, T030, T039 |
| FR-021 | T009, T013, T038, T040 |
| SC-001 | T017–T025, T037 |
| SC-002 | T009, T013, T038 |
| SC-003 | T028, T032, T033, T037 |
| SC-004 | T010, T013, T037 |
| SC-005 | T017, T024, T037 |
| SC-006 | T026–T031, T037 |

---

## 平行執行範例

### 使用者故事 1

可平行執行：

- `T010`：`src/test/webview/cyberbrickUploadSettings.contract.test.ts`
- `T012`：`media/html/blocklyEdit.html`
- `T014`：`media/css/blocklyEdit.css`

需序列化或協調：

- `T013` 依賴 `T011` 的 message contract 與 `T012` 的 modal ids。
- `T016` 需等 UI 文字 key 穩定後補齊 15 語系。

### 使用者故事 2

可平行執行：

- `T017`：`src/test/services/cyberbrickOtaProvisioningService.test.ts`
- `T020`：`src/services/cyberbrickOtaAgentSource.ts`
- `T023`：`media/html/blocklyEdit.html`（需與 US1 markup 協調）

需序列化或協調：

- `T021` 依賴 `T019` 與 `T020`。
- `T024` 依賴 `T023` 的 form ids。
- `T025` 需等 UI/error key 穩定後補齊 15 語系。

### 使用者故事 3

可平行執行：

- `T026`：`src/test/services/cyberbrickOtaUploader.test.ts`
- `T028`：`src/test/webview/cyberbrickUploadSettings.contract.test.ts`
- `T032`：`media/html/blocklyEdit.html`（需與 US1/US2 markup 協調）

需序列化或協調：

- `T030` 依賴 `T029` readiness contract。
- `T031` 依賴 `T030` uploader interface。
- `T033` 依賴 `T031` progress/result message shape。
- `T035` 需等 UI/error key 穩定後補齊 15 語系。

---

## 實作策略

### MVP First（只交付使用者故事 1）

1. 完成 Phase 1 準備工作。
2. 完成 Phase 2 基礎建設。
3. 完成 Phase 3 US1。
4. 停下來驗證：新專案預設 USB、USB 上傳流程無新增負擔、模式保存、OTA 模式不重複詢問。
5. 若 MVP 穩定，再進入 US2。

### 漸進交付

1. Setup + Foundation → 型別、settings、secrets、sanitized state 可測。
2. US1 → 固定齒輪入口、模式保存與既有 USB 回歸。
3. US2 → USB-first provisioning、SSID 掃描、SecretStorage 與裝置端最小必要設定。
4. US3 → 多裝置目標選擇、readiness、v1 OTA protocol upload 與無 fallback。
5. Polish → 文件、manual/usability validation、compile/lint/test/i18n/security hardening。

### 平行團隊策略

- Developer A：US1 WebView/modal 與 message handler。
- Developer B：US2 provisioning service 與 mpremote helper。
- Developer C：US3 OTA uploader/readiness 與 multi-device target UI。
- 共同協調檔案：`media/html/blocklyEdit.html`、`media/js/blocklyEdit.js`、`src/webview/messageHandler.ts`、15 個 `media/locales/*/messages.js`。

## 注意事項

- `[P]` 表示不同檔案、無未完成依賴，可平行處理。
- `[US1]`、`[US2]`、`[US3]` 對應 `spec.md` 中的三個使用者故事。
- 每個 user story 的測試任務都應先完成並確認失敗，再進行實作。
- 不得新增 OTA Blockly 積木，也不得修改 MicroPython generator 讓作品自動注入 Wi‑Fi/OTA 上傳邏輯。
- OTA 失敗只能提供下一步，不得自動 fallback 到 USB。
- 敏感資料不得出現在專案工作區設定、WebView render payload、log、diagnostics 或測試 fixture snapshot 中。
