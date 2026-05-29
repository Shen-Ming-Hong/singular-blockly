# 實作計畫：CyberBrick 上傳模式設定

**分支**：`059-cyberbrick-upload-modes`｜**日期**：2026-05-27｜**規格**：`specs/059-cyberbrick-upload-modes/spec.md`
**輸入**：`specs/059-cyberbrick-upload-modes/spec.md` 的功能規格

## 摘要

本功能為 CyberBrick 新增明確的上傳模式設定：新專案預設 `USB`，使用者可在 Blockly 編輯畫面右上角 CyberBrick 專用齒輪中手動切換到 `OTA`。OTA 不作為學生可拖曳積木，也不把 Wi‑Fi provisioning、密碼或 token 寫入生成的 MicroPython 程式；因 CyberBrick 會自動進入 `/app/rc_main.py`，Extension Host 會在 `rc_main.py` 開頭維護不含秘密的 OTA agent 啟動呼叫。為維持官方出廠狀態與相容性，裝置端變更只允許新增 Singular Blockly 自有檔案（v1：`/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py`）與修改 `/app/rc_main.py`；不得修改 `/boot.py`、韌體/出廠設定、WebREPL 設定或其他官方 runtime 檔案。首次 OTA 配對必須透過 USB 完成，並由 CyberBrick 裝置本身掃描 SSID。多裝置情境以 `deviceId` 為主鍵，`friendlyName` 僅供顯示。Extension 端持久化的敏感資料（Wi‑Fi 密碼、OTA token、pairing secret）只存 VS Code `ExtensionContext.secrets`；非敏感模式與裝置 registry 以專案工作區範圍（workspace folder scoped）的 VS Code 設定保存。

技術上沿用既有上傳按鈕與 `MicropythonUploader` USB 流程，新增 mode-aware routing、CyberBrick 設定 modal、`CyberBrickUploadSettingsService`、USB-first provisioning service 與 `CyberBrickOtaUploader`。OTA v1 僅支援將目前產生的 MicroPython 單檔寫入 `/app/rc_main.py`；失敗時不自動 fallback 到 USB，只提供明確修正步驟。裝置端 OTA agent 需實作版本化 v1 LAN protocol，包含 health check、authenticated upload、`deviceId` 驗證、token proof、SHA-256 檢查與版本協商。

## 技術脈絡

**語言/版本**：TypeScript 5.9.3（Extension Host）、browser JavaScript/HTML/CSS（WebView）、MicroPython（CyberBrick device runtime/OTA agent）。
**主要依賴**：VS Code API `^1.105.0`、Blockly 12.3.1、既有 `mpremote` USB 工具、既有 `MicropythonUploader`、VS Code `SecretStorage` / workspace configuration、WebView `postMessage`、Mocha + Sinon + `@vscode/test-electron`。不新增 npm runtime dependency，除非後續任務證明 Node 內建 HTTP/fetch 不足。
**儲存**：非敏感設定使用專案工作區範圍（workspace folder scoped）的 VS Code configuration key `singular-blockly.cyberbrick.uploadSettings` 或等效設定；Extension 端敏感資料只使用 `ExtensionContext.secrets`；WebView `setState()` 僅保存未提交 UI 暫態；CyberBrick 裝置端可保存重新連線與 OTA agent 驗證所需的最小必要設定，但只能保存於 Singular Blockly 自有檔案，不得回寫到專案工作區設定、學生作品、WebView payload、日誌或官方出廠檔案。
**測試**：`npm run compile`、`npm run lint`、`npm test`；新增或修改 UI 字串時執行 `npm run validate:i18n`。核心 service 使用 mockable interfaces 測試；WebView 互動以 contract-style tests + quickstart manual/usability validation 覆蓋。
**目標平台**：VS Code desktop extension（macOS / Windows / Linux）；CyberBrick ESP32-C3 MicroPython 裝置；教室同一 Wi‑Fi 內可能存在多台 CyberBrick。
**專案類型**：VS Code extension + browser WebView + Blockly code generator ecosystem。
**效能目標**：不做背景輪詢；SSID scan、readiness check、OTA upload 只在使用者明確開啟設定、重新掃描或按上傳時執行；WebView UI 不因 scan/upload 阻塞。
**限制條件**：不新增 OTA Blockly 積木；不自動 OTA↔USB fallback；不把秘密寫入 project files/logs/WebView render payload 或 `rc_main.py` bootstrap；Extension Host 與 WebView 只能用 `postMessage` 溝通；WebView 不做檔案、程序或敏感網路操作；OTA v1 固定 `/app/rc_main.py` 單檔；OTA token 不得出現在 URL/query string；裝置端檔案變更白名單固定為新增 `/cyberbrick_ota_agent.py`、新增/更新 `/cyberbrick_ota_config.py`、修改 `/app/rc_main.py`，不得碰 `/boot.py` 或其他官方出廠檔案。
**規模/範圍**：v1 僅支援 CyberBrick `USB` / `OTA` 兩種明確模式；每個 workspace folder 可配對多台 CyberBrick；同名 `friendlyName` 必須可共存並以 `deviceId` 區分。

## 憲法檢查

*門檻：Phase 0 研究前必須通過，Phase 1 設計後需重新檢查。*

### 初始檢查（Phase 0 前）

| 原則 | 狀態 | 設計回應 |
|---|---|---|
| 原則 I：簡潔與可維護性 | 通過 | v1 僅處理 `USB` / `OTA` 明確模式與 `/app/rc_main.py` 單檔，不引入智慧模式或多檔同步。 |
| 原則 II：模組化與可擴充性 | 通過 | 將設定、provisioning、OTA upload 拆成獨立 service，WebView 只處理 UI/form。 |
| 原則 III：避免過度開發 | 通過 | 不做背景探索、不做自動 fallback、不做 WebREPL 全功能或檔案樹同步。 |
| 原則 IV：彈性與適應性 | 通過 | `deviceId` registry 與 uploader adapter 保留未來 OTA agent/firmware 協定替換空間。 |
| 原則 V：研究驅動開發 | 通過 | 已查閱 VS Code WebView/SecretStorage/Memento API 與 MicroPython `mpremote`/WebREPL 官方文件；研究紀錄在 `research.md`。 |
| 原則 VI：結構化日誌 | 通過 | 新增 Extension Host service 必須使用既有 `log()`，且遮罩 secrets。 |
| 原則 VII：完整測試覆蓋 | 通過 | `quickstart.md` 指定 service、message handler、contract、手動驗證與使用性驗證案例。 |
| 原則 VIII：純函式與模組化架構 | 通過 | readiness/error classification/settings migration 可設計為純函式並用 DI 測試 I/O。 |
| 原則 IX：繁體中文文件標準 | 通過 | 本 plan、research、data model、contracts、quickstart、tasks 皆使用繁體中文；必要技術名詞與檔案路徑保留英文。 |
| 原則 X：專業發布管理 | 通過 | 本階段不發布；後續若 release 需遵守既有語意化版本與雙語 release 流程。 |
| 原則 XI：Agent Skills 架構 | 通過 | 本次依 Speckit workflow 產出規格/計畫；未引入第三方 skill。 |

### Phase 1 後重新檢查

| 原則 | 狀態 | Phase 1 證據 |
|---|---|---|
| 簡潔 / 避免過度開發 | 通過 | `research.md` 決定 v1 單檔 OTA、無背景輪詢、無自動 fallback；`contracts/ota-upload.md` 固定 `/app/rc_main.py`。 |
| 模組化 / 純函式 | 通過 | `data-model.md` 將 settings、secrets、readiness、provisioning、upload run 分離；contracts 要求 Extension Host service 負責副作用。 |
| 安全 / 日誌 | 通過 | `contracts/storage-and-secrets.md` 明定 secret key、lifecycle、Extension 端與裝置端秘密邊界、禁止保存與 log 的欄位。 |
| 測試 | 通過 | `quickstart.md` 列出自動化測試檔、手動驗證矩陣與使用性驗證計畫。 |
| 繁體中文 | 通過 | Phase 0/1/2 文件皆為繁體中文。 |

**門檻結果**：無 constitution violation；不需要複雜度例外。

## Phase 0：研究輸出

**輸出**：`specs/059-cyberbrick-upload-modes/research.md`

主要決策：

1. OTA 是上傳模式，不新增 Blockly 積木。
2. 沿用既有上傳按鈕，新增 CyberBrick 專用齒輪/modal。
3. 非敏感設定使用專案工作區範圍；Extension 端敏感資料只存 SecretStorage；裝置端只保存重新連線與 OTA 驗證所需的最小必要設定。
4. 首次 OTA pairing/provisioning 必須透過 USB。
5. SSID 建議由 CyberBrick 裝置端掃描，且只在使用者要求時更新。
6. 多裝置身分以 `deviceId` 為主鍵，`friendlyName` 只做顯示。
7. OTA 失敗不自動 fallback 到 USB。
8. OTA transport 封裝於 `CyberBrickOtaUploader`，v1 單檔 `/app/rc_main.py`，並遵守 `ota-upload.md` 的 v1 LAN protocol。
9. WebView state 只保存暫時 UI；跨 session 狀態由 Extension Host 提供。
10. 裝置端 OTA 變更採白名單：只新增 Singular Blockly 自有檔案與修改 `/app/rc_main.py`，其餘官方出廠狀態保持不變。

## Phase 1：設計與契約輸出

**資料模型**：`specs/059-cyberbrick-upload-modes/data-model.md`

核心 entity：

- `CyberBrickUploadSettings`
- `PairedCyberBrickDevice`
- `CyberBrickSecretRef`
- `WifiNetworkSuggestion`
- `WifiScanSession`
- `OtaProvisioningRequest` / `OtaProvisioningResult`
- `OtaReadinessStatus` / `OtaReadinessCheck`
- `OtaUploadRequest` / `OtaUploadRun`
- `CyberBrickUploadPanelState`

**契約**：

- `specs/059-cyberbrick-upload-modes/contracts/webview-extension-messages.md`：WebView ↔ Extension Host message schema。
- `specs/059-cyberbrick-upload-modes/contracts/storage-and-secrets.md`：專案工作區設定、SecretStorage、Extension 端與裝置端秘密邊界。
- `specs/059-cyberbrick-upload-modes/contracts/ota-provisioning.md`：USB-first pairing/provisioning 流程。
- `specs/059-cyberbrick-upload-modes/contracts/ota-upload.md`：readiness gate、OTA upload、v2 raw binary streaming LAN protocol、自動 machine.reset()、錯誤分類與無 fallback 契約。
- `specs/059-cyberbrick-upload-modes/contracts/ui-settings-modal.md`：CyberBrick 齒輪/modal UX 契約。

**快速驗證**：`specs/059-cyberbrick-upload-modes/quickstart.md`

包含自動化驗證命令、建議測試檔、使用性驗證計畫與 10 組手動驗證情境。

**Agent context update**：`.github/copilot-instructions.md` 的 Speckit marker 已更新為 `specs/059-cyberbrick-upload-modes/plan.md`。

## 專案結構

### 本功能文件

```text
specs/059-cyberbrick-upload-modes/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── contracts/
    ├── webview-extension-messages.md
    ├── storage-and-secrets.md
    ├── ota-provisioning.md
    ├── ota-upload.md
    └── ui-settings-modal.md
```

### 原始碼位置

```text
src/
├── types/
│   └── cyberbrickUpload.ts              # 新增 CyberBrick upload settings / OTA types
├── services/
│   ├── micropythonUploader.ts           # 既有 USB 上傳；可抽出/重用 mpremote helper
│   ├── cyberbrickUploadSettingsService.ts
│   ├── cyberbrickOtaProvisioningService.ts
│   ├── cyberbrickOtaAgentSource.ts
│   └── cyberbrickOtaUploader.ts
├── webview/
│   └── messageHandler.ts                # 新增 CyberBrick settings/provisioning/OTA message routing
└── extension.ts                         # 必要時注入新增 services

media/
├── html/
│   └── blocklyEdit.html                 # 新增 CyberBrick 設定齒輪/modal markup
├── js/
│   └── blocklyEdit.js                   # 新增 modal state/render/message handling 與 upload mode branching
├── css/
│   └── blocklyEdit.css                  # 新增 CyberBrick modal styling，避免 TXT class 污染
└── locales/
    └── */messages.js                    # 新增使用者可見字串的 15 語系翻譯

package.json                             # 若新增 contributed configuration，補設定 schema/描述
package.nls*.json                        # 若 package contribution 有使用者可見描述，補對應語系
```

### 測試位置

```text
src/test/
├── helpers/
│   └── cyberbrickUploadMocks.ts
├── fixtures/
│   └── cyberbrickUploadFixtures.ts
├── services/
│   ├── cyberbrickUploadSettingsService.test.ts
│   ├── cyberbrickOtaProvisioningService.test.ts
│   └── cyberbrickOtaUploader.test.ts
├── webview/
│   ├── cyberbrickUploadTestUtils.ts
│   └── cyberbrickUploadSettings.contract.test.ts
└── messageHandler.test.ts
```

**結構決策**：採用既有單一 VS Code extension 專案結構。Extension Host service 放在 `src/services/`，型別放在 `src/types/`，WebView markup/script/style 放在 `media/`，測試鏡像 service/webview/message handler。不得跨 context import；`src/` 與 `media/` 只透過 `postMessage` 契約互動。

## 實作階段建議

1. **型別與純函式**：建立 `src/types/cyberbrickUpload.ts`、settings normalization、readiness/error classification，不碰硬體。
2. **設定與 secrets service**：實作專案工作區設定與 `context.secrets` lifecycle；先完成單元測試。
3. **WebView message routing**：在 `messageHandler.ts` 新增 load/save/settings/readiness/provisioning/upload cases，使用 mock service 驗證。
4. **UI modal**：新增 CyberBrick 齒輪/modal、mode selector、paired devices、SSID scan/provisioning form，補 i18n。
5. **USB-first provisioning**：重用/擴充 `MicropythonUploader` 的 mpremote 能力，完成 deviceId、Wi‑Fi scan、agent install/configure、secret store；裝置端寫入必須受白名單限制，只新增 OTA agent/config 檔並修改 `/app/rc_main.py`。
6. **OTA agent protocol**：依 `contracts/ota-upload.md` 實作 health check、authenticated upload、SHA-256 驗證、agent version negotiation 與錯誤分類。
7. **OTA uploader**：封裝 authenticated LAN upload，v1 寫入 `/app/rc_main.py`，分類 timeout/offline/token/device mismatch 等錯誤。
8. **回歸與手動驗證**：執行 quickstart 自動命令、manual matrix 與使用性驗證計畫，特別確認 USB 上傳、TXT UI、Arduino 上傳不受影響。

## 複雜度追蹤

無 constitution violation，無需額外複雜度例外。

## 實作後記（Phase 6 完成後更新）

### OTA LAN Protocol v2 升版（streaming binary）

**原因**：v1 以 JSON+base64 格式傳送檔案內容，MicroPython 端需在記憶體中持有 base64 解碼暫存區，但 CyberBrick ESP32-C3 heap 僅 ~59KB 且高度碎片化，導致 HTTP 500 write-failed。

**決策**：升版至 Protocol v2，改以 `Content-Type: application/octet-stream` 直接串流原始二進位資料，裝置端以 1024B chunks 逐段寫入並增量計算 SHA-256，peak memory 降至 ~1KB。TypeScript 端送出 `Buffer` body，SHA-256 放 header `X-Singular-Content-Sha256`，operation ID 放 header `X-Singular-Operation-Id`。

**Agent 版本歷史**：

| Agent 版本 | Protocol | 主要異動 |
|---|---|---|
| v1.0.0 | v1 | 初始 JSON+base64；health check、upload、SHA-256 驗證 |
| v1.1.0 | v2 | 改 raw binary streaming（HTTP 500 修正）；cleanup 串流清除演算法 |
| v1.2.0 | v2 | 寫入成功後自動 `machine.reset()`（`_reset_pending` 旗標，在 `client.close()` 後觸發） |

**當前版本**：`CYBERBRICK_OTA_AGENT_VERSION = '1.2.0'`，`CYBERBRICK_OTA_PROTOCOL_VERSION = 2`。

### OTA 上傳後自動 machine.reset()

**原因**：OTA 上傳後使用者需手動按 RST 按鈕才能執行新程式，體驗不佳。

**決策**：在 agent v1.2.0 導入 `_reset_pending = [False]` 旗標（MicroPython mutable list）。`_upload_raw` 成功路徑設旗標；`serve_forever` 主迴圈在 `client.close()` 後檢查旗標，確保 HTTP response 已送出且 socket 已關閉後再呼叫 `machine.reset()`。TypeScript 端已有 `written-restart-failed` 狀態處理，`validateUploadResponse()` 只驗 `operationId`、`deviceId`、`remotePath`、`contentSha256`，不驗 `restarted`。
