---
description: "Task list for CyberBrick WiFi Monitor + OTA Agent 自動升級"
---

# Tasks: CyberBrick WiFi Monitor + OTA Agent 自動升級

**Input**: `/specs/061-cyberbrick-wifi-monitor-ota-upgrade/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案，無未完成的依賴）
- **[Story]**: 對應的 User Story（US1、US2、US3）
- 描述包含精確檔案路徑

---

## Phase 1: Setup（共用型別定義）

**Purpose**: 新增所有 User Story 共用的型別定義，在任何實作開始前完成

- [X] T001 Add `'upgrading_agent' | 'agent_upgraded' | 'agent_upgrade_needed'` to `CyberBrickUploadProgressStage` union and `'agent-upgrade-failed' | 'wifi-monitor-failed'` to `CyberBrickUploadErrorCode` union in `src/types/cyberbrickUpload.ts`

---

## Phase 2: Foundational（阻斷性前置任務）

**Purpose**: 所有 User Story 共用的 i18n 字串與版本比較純函式，必須在 US1/US2/US3 實作前完成

**⚠️ CRITICAL**: 任何 User Story 的實作均依賴此階段完成

- [X] T002 [P] Add 9 new i18n keys（後續擴充含 `WIFI_MONITOR_CONNECTING`）
- [X] T003 [P] Add exported `CYBERBRICK_OTA_AGENT_TARGET_VERSION` / `CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION` constants in `src/types/cyberbrickUpload.ts`, plus `parseAgentVersion()` and `compareAgentVersion()` in `src/services/cyberbrickOtaUploader.ts`（目前 target 已演進為 `1.5.8`，min 維持 `1.4.0`）

**Checkpoint**: 型別與工具函式就緒，US1 / US2 / US3 可平行開始

---

## Phase 3: User Story 1 - WiFi 串流監控（Priority: P1）🎯 MVP

**Goal**: 按下 Monitor 按鈕後，VS Code 開啟 PTY Terminal 並透過 WiFi 即時顯示裝置 `print()` 輸出；Terminal 關閉或再按按鈕時自動停止

**Independent Test**: 配對一台 CyberBrick（agentVersion ≥ 1.4.0），按 Monitor 按鈕，Terminal 開啟並即時顯示裝置 print() 輸出；關閉 Terminal，按鈕自動重設

### Tests for User Story 1

- [X] T004 [US1] Create `src/test/suite/cyberbrickWifiMonitorService.test.ts`

### Implementation for User Story 1

- [X] T005 [P] [US1] Add `_LogCapture` class, `_install_log_capture()` bootstrap, and `GET /api/v1/logs?since={seq}` handler to `src/services/cyberbrickOtaAgentSource.ts`
- [X] T006 [US1] Create `src/services/cyberbrickWifiMonitorService.ts`
- [X] T007 [US1] Update `handleStartMonitor()` in `src/webview/messageHandler.ts`
- [X] T008 [P] [US1] Update Monitor button in `media/js/blocklyEdit.js`

**Checkpoint**: User Story 1 可完整獨立測試，WiFi Monitor 正常開關、重試、Terminal 關閉偵測均通過

---

## Phase 4: User Story 2 - OTA 上傳自動升級 Agent（Priority: P2）

**Goal**: OTA 上傳時若 agentVersion ≥ MIN 且 < TARGET，靜默無線升級 agent（含進度提示），升級失敗仍繼續上傳

**Independent Test**: 準備 agentVersion ≥ 1.4.0 但 < TARGET 的裝置，執行 OTA 上傳，確認出現升級進度提示，裝置重啟後繼續完成程式碼上傳

### FR-012 Cross-Cutting（WiFi Monitor 讓出連線）

- [X] T022 [US1][US2] Implement FR-012 互斥連線：In `src/services/cyberbrickOtaUploader.ts` OTA upload entry point, accept `ICyberBrickWifiMonitorService` as an optional injected dependency; if `wifiMonitorService.isRunning()` returns `true`, call `await wifiMonitorService.stop()` before proceeding with the upload pipeline; in `src/webview/messageHandler.ts`, pass the active `cyberbrickWifiMonitorService` instance when invoking the uploader, and send a `monitorStopped` postMessage to the WebView after auto-stop so the Monitor button resets to idle state (FR-012)

### Tests for User Story 2

- [X] T020 [P] [US2] Create `src/test/suite/cyberbrickOtaUploader.test.ts` with test cases for: `parseAgentVersion()` (undefined → [0,0,0], valid semver, invalid format → [0,0,0]); `compareAgentVersion()` (all four outcomes: < MIN, = MIN, between MIN and TARGET, > TARGET); `upgradeAgentOverWifi()` (success—SHA-256 computed and sent as `X-Singular-Content-Sha256`, `waitForAgentReady()` called—and failure → returns `'failed'`); `waitForAgentReady()` (responds within timeout → `true`, ECONNREFUSED treated as expected, timeout → `false`); upload pipeline branches (agentVersion undefined/< MIN → FR-008 skip+notice; agentVersion ≥ MIN < TARGET → FR-005 upgrade—use `CYBERBRICK_OTA_AGENT_TARGET_VERSION = '1.5.0'` override in test; agentVersion ≥ TARGET → FR-004 skip silently; upgrade failure → FR-007a warning+continue); FR-012 (WiFi Monitor running when upload starts → `wifiMonitorService.stop()` called before upload proceeds)

### Implementation for User Story 2

- [X] T009 [P] [US2] Add `POST /api/v1/upload-agent` endpoint handler to `src/services/cyberbrickOtaAgentSource.ts`
- [X] T010 [US2] Add `waitForAgentReady(device, token, timeoutMs=30000, intervalMs=1000): Promise<boolean>` (1s initial delay, poll `GET /api/v1/health`, catch ECONNREFUSED as expected, return `false` on timeout) and `upgradeAgentOverWifi(device, token, config): Promise<'upgraded'|'failed'>` (build agent source via `buildCyberBrickOtaAgentSource(config)`, compute SHA-256 via Node.js `crypto.createHash('sha256')`, POST to `/api/v1/upload-agent` with `X-Singular-Content-Sha256` header, call `waitForAgentReady`, **never log body**) in `src/services/cyberbrickOtaUploader.ts`
- [X] T011 [US2] Integrate agent version check into OTA upload pipeline in `src/services/cyberbrickOtaUploader.ts`: after health check updates `agentVersion`, if `compareAgentVersion(agentVersion, CYBERBRICK_OTA_AGENT_TARGET_VERSION) < 0` and `compareAgentVersion(agentVersion, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) >= 0` → emit `upgrading_agent` stage, call `upgradeAgentOverWifi()`, on success emit `agent_upgraded` stage; on failure emit `agent-upgrade-failed` error code as warning then **continue** upload (FR-007a); if already `>= TARGET` skip silently
- [X] T012 [P] [US2] Add `upgrading_agent` and `agent_upgraded` progress stage rendering in `media/js/blocklyEdit.js` progress UI: `upgrading_agent` shows `OTA_AGENT_UPGRADING` message with `{0}=currentVersion`, `{1}=targetVersion`; `agent_upgraded` shows `OTA_AGENT_UPGRADED` message with `{0}=targetVersion`

**Checkpoint**: User Story 2 可完整獨立測試，升級流程、失敗繼續上傳、進度 UI 均通過

---

## Phase 5: User Story 3 - 舊版 Agent 優雅降級（Priority: P3）

**Goal**: agentVersion < MIN（1.4.0）時，OTA 上傳仍正常完成並顯示重配對提示；Monitor 按鈕顯示升級說明且不啟動 Terminal

**Independent Test**: 準備 agentVersion < 1.4.0 的裝置，OTA 上傳成功且顯示重配對提示；按 Monitor 按鈕顯示 `WIFI_MONITOR_AGENT_UPGRADE_NEEDED` 提示且無 Terminal 開啟

### Tests for User Story 3 & Cross-Story Routing

- [X] T021 [P] [US1][US2][US3] Create or extend `src/test/suite/messageHandler.test.ts` with test cases for `handleStartMonitor()` routing: no OTA paired device → falls back to USB serial monitor (SC-006); OTA device with agentVersion ≥ MIN → calls `wifiMonitorService.start(device, token)`; OTA device with agentVersion < MIN → shows `WIFI_MONITOR_AGENT_UPGRADE_NEEDED` VS Code notification without opening Terminal; WiFi Monitor already running (isRunning = true) → calls `wifiMonitorService.stop()` on second press; `monitorStopped` event received from service → sends `monitorStopped` postMessage to WebView to reset button; FR-012 auto-stop → after OTA upload begins, `monitorStopped` postMessage sent to WebView

### Implementation for User Story 3

- [X] T013 [US3] Add graceful degradation branch in `src/services/cyberbrickOtaUploader.ts` upload pipeline: when `compareAgentVersion(agentVersion, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0`, emit `agent_upgrade_needed` stage with `OTA_AGENT_UPGRADE_NEEDED` message (`{0}=agentVersion`), skip upgrade, continue upload (not blocked, SC-005)
- [X] T014 [P] [US3] Add version gate at top of `CyberBrickWifiMonitorService.start()` in `src/services/cyberbrickWifiMonitorService.ts`: if `compareAgentVersion(device.agentVersion, CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION) < 0`, return `{ success: false, error: { code: 'AGENT_VERSION_TOO_OLD', message: ... } }` immediately without opening Terminal
- [X] T015 [P] [US3] Add `agent_upgrade_needed` progress stage rendering in `media/js/blocklyEdit.js`: show `OTA_AGENT_UPGRADE_NEEDED` message as informational badge (non-error styling) after upload completes successfully
- [X] T016 [US3] Handle `AGENT_VERSION_TOO_OLD` result from `CyberBrickWifiMonitorService.start()` in `src/webview/messageHandler.ts`: show `WIFI_MONITOR_AGENT_UPGRADE_NEEDED` VS Code information message, do not open Terminal, reset Monitor button state

**Checkpoint**: User Story 3 可完整獨立測試，舊版裝置上傳零阻擋、Monitor 提示清楚

---

## Final Phase: Polish & 橫切關注點

- [X] T017 Update `src/services/cyberbrickOtaProvisioningService.ts` to use `CYBERBRICK_OTA_AGENT_TARGET_VERSION` constant when building agent source for USB provisioning flow, ensuring newly-paired devices receive the current target agent out-of-the-box (FR-011)
- [X] T018 Run `npm run validate:i18n` and confirm all 15 locale files contain all 9 new i18n keys with non-empty values; fill in missing translations for non-English locales in `media/locales/`
- [X] T019 Run `npm test` and confirm all tests pass including `src/test/suite/cyberbrickWifiMonitorService.test.ts`; run `npm run lint` and fix any ESLint errors in modified files under `src/`
- [X] T023 [US1] Add WiFi Monitor diagnostic output (retry reason, cursor state, reset state, Output channel hint) in `src/services/cyberbrickWifiMonitorService.ts` and cover it in `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T024 [US1] Prevent WiFi Monitor startup from hanging on `POST /api/v1/reset` by adding reset timeout/abort handling and a regression test in `src/services/cyberbrickWifiMonitorService.ts` / `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T025 [US1] Capture `sys.stderr` in the CyberBrick OTA agent and bump `CYBERBRICK_OTA_AGENT_TARGET_VERSION` so startup exceptions surface in WiFi Monitor logs after OTA upgrade
- [X] T026 [US2] Refresh CyberBrick panel state after generic `requestUpload` OTA fallback, and show explicit `current → target` OTA agent version progress in `src/webview/messageHandler.ts`, `src/services/cyberbrickOtaUploader.ts`, and `src/test/suite/messageHandler.test.ts`
- [X] T027 [US1] Clear CyberBrick OTA agent log buffer on `/api/v1/reset`, require WiFi Monitor to observe a real reboot signal before showing `Device ready`, and bump `CYBERBRICK_OTA_AGENT_TARGET_VERSION` so the reset/logging fix rolls out via OTA
- [X] T028 [US1] Add an `rc_main.py` OTA bootstrap marker plus no-log-after-reboot diagnostics so Monitor can distinguish agent reboot success from student code failing before the first `print()`
- [X] T029 [US1] Make the `rc_main.py` OTA bootstrap write markers directly into the agent log buffer and wrap user code with startup-exception logging so pre-`print()` failures surface in WiFi Monitor
- [X] T030 [US1] Stop prefixing every WiFi Monitor log entry with an extra CRLF so consecutive `print()` output such as `abc`/`abc` renders as two normal lines, and add regression coverage in `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T031 [US1] Guard Blockly text-field IME composition and WebView global keyboard shortcuts so `print` text inputs accept Traditional Chinese, and add WebView contract coverage in `media/js/blocklyEdit.js`, `media/js/shadowKeyboardHandler.js`, and `src/test/suite/blocklyImeCompatibility.contract.test.ts`
- [X] T032 [US1] Send `/api/v1/logs` JSON responses with byte-accurate `Content-Length` and full-buffer socket writes so WiFi Monitor no longer receives truncated or malformed JSON after reset / larger output, and add regression coverage in `src/services/cyberbrickOtaAgentSource.ts` and `src/test/services/micropythonUploaderCyberBrickHelpers.test.ts`
- [X] T033 [US1] Prefer CyberBrick USB serial monitor over Wi-Fi when hardware is connected, and only fall back to Wi-Fi after the USB route reports `DEVICE_NOT_FOUND`; cover the routing in `src/webview/messageHandler.ts` and `src/test/suite/messageHandler.test.ts`
- [X] T034 [US1] Decouple CyberBrick USB monitor detection from `mpremote` and keep Wi-Fi fallback available when the preferred USB route reports `MPREMOTE_NOT_INSTALLED`, with coverage in `src/services/micropythonUploader.ts`, `src/services/serialMonitorService.ts`, `src/webview/messageHandler.ts`, and `src/test/suite/messageHandler.test.ts`
- [X] T035 [US2][US3] Change OTA upload policy to always attempt OTA agent upgrade before Wi-Fi code upload and continue the upload even when upgrade fails for `< MIN` agents in `src/services/cyberbrickOtaUploader.ts` and `src/test/suite/cyberbrickOtaUploader.test.ts`
- [X] T036 [US1] Make OTA agent startup idempotent/retry bind after reset, replay buffered logs after unexpected cursor rollback, bump `CYBERBRICK_OTA_AGENT_TARGET_VERSION`, and cover it in `src/services/cyberbrickOtaAgentSource.ts`, `src/services/cyberbrickWifiMonitorService.ts`, `src/types/cyberbrickUpload.ts`, `src/test/services/micropythonUploaderCyberBrickHelpers.test.ts`, and `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T037 [US1] Treat the OTA bootstrap marker as a valid reboot signal for Wi-Fi Monitor so the first one-shot initialization prints are not discarded when reset completes too quickly to observe a disconnect, with coverage in `src/services/cyberbrickOtaAgentSource.ts`, `src/services/cyberbrickWifiMonitorService.ts`, and `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T038 [US1] Make CyberBrick Wi-Fi Monitor internal diagnostics and OTA bootstrap markers switchable via a VS Code setting / command toggle while preserving normal student `print()` output, in `package.json`, `src/extension.ts`, `src/webview/messageHandler.ts`, `src/services/cyberbrickWifiMonitorService.ts`, `src/test/helpers/mocks.ts`, `src/test/extension.activate.test.ts`, and `src/test/suite/cyberbrickWifiMonitorService.test.ts`
- [X] T039 [US1] Narrow Wi-Fi Monitor hidden-marker filtering to known OTA diagnostics so student output like `[Singular Blockly] hello` stays visible, and add a WebView connecting-state hint before Wi-Fi Monitor startup resolves, in `src/services/cyberbrickWifiMonitorService.ts`, `src/webview/messageHandler.ts`, `media/js/blocklyEdit.js`, `media/css/blocklyEdit.css`, `media/locales/*/messages.js`, `src/test/suite/cyberbrickWifiMonitorService.test.ts`, and `src/test/suite/messageHandler.test.ts`
- [X] T040 [Docs] Refresh `specs/061-cyberbrick-wifi-monitor-ota-upgrade/` so spec, plan, research, data model, quickstart, and HTTP contracts match the shipped implementation (target `1.5.8`, reset-capable Monitor startup from `1.5.0`, `WIFI_MONITOR_CONNECTING`, and actual API payloads) before PR publication
- [X] T041 [US1] Replace the CyberBrick OTA agent log buffer `append + pop(0)` hot path with a fixed-size ring buffer, keep stdout/stderr capture compact enough for low-memory devices, and cover the behavior in `src/services/cyberbrickOtaAgentSource.ts` and `src/test/services/micropythonUploaderCyberBrickHelpers.test.ts`

---

## Dependencies

```
T001 ──→ T006 ──→ T007 ──→ T016
          │
          └──→ T022 ──→ T007

T003 ──→ T006
T003 ──→ T010 ──→ T011 ──→ T013
T003 ──→ T014

T005 ──→ T006 (device endpoint referenced in tests)
T009 ──→ T010

T004 ──→ T006 (TDD: tests written before implementation)
T001 ──→ T011 (uses new stage values)
T001 ──→ T013

T002 ──→ T007 (i18n keys used in notifications)
T002 ──→ T011, T013, T016

T010 ──→ T011
T011 ──→ T013 (all modify cyberbrickOtaUploader.ts, sequential)

T006 ──→ T014 (modifies existing service)
T006 ──→ T022 (FR-012 depends on WifiMonitorService.stop() interface)
T007 ──→ T016 (modifies existing handler)
T007 ──→ T022 (FR-012 injection point in messageHandler)

T010 ──→ T022 (FR-012 inserted into OTA upload pipeline)
T003, T009, T010, T011, T013 ──→ T020 (tests after uploader code implemented)
T007, T016, T022 ──→ T021 (tests after messageHandler routing implemented)

T017 ──→ T018 ──→ T019
T020 ──→ T019 (all tests pass before final validation)
T021 ──→ T019
```

---

## Parallel Execution Examples

### Phase 2（Foundational 完全平行）

```
T002 (15 locale files)
T003 (cyberbrickOtaUploader.ts constants + pure functions)
```

### Phase 3 (US1) 平行機會

```
T004 (test file, 新增)
T005 (cyberbrickOtaAgentSource.ts, 不同 function block)
→ T006 (cyberbrickWifiMonitorService.ts, 依賴 T004+T005 完成)
→ T007 (messageHandler.ts, 依賴 T006)
T008 (blocklyEdit.js, 可與 T006/T007 平行)
```

### Phase 4 (US2) 平行機會

```
T022 (cyberbrickOtaUploader.ts 上傳入口 FR-012)
T009 (cyberbrickOtaAgentSource.ts)
T012 (blocklyEdit.js)
→ T010 (cyberbrickOtaUploader.ts, 依賴 T009)
→ T011 (cyberbrickOtaUploader.ts, 依賴 T010)
T020 (cyberbrickOtaUploader.test.ts, 可與 T009/T012 平行開寫，依賴 T010+T011 完成測試)
```

### Phase 5 (US3) 平行機會

```
T014 (cyberbrickWifiMonitorService.ts)
T015 (blocklyEdit.js)
T021 (messageHandler.test.ts, 可與 T014/T015 平行，依賴 T007+T016+T022 完成）
→ T013 (cyberbrickOtaUploader.ts, 依賴 T011 完成)
→ T016 (messageHandler.ts, 依賴 T014)
```

---

## Implementation Strategy

### MVP Scope（建議先完成 Phase 1 + Phase 2 + Phase 3）

Phase 3（US1）即可交付核心價值：使用者能透過 WiFi 即時看到 print() 輸出，無需 USB 線。US2 和 US3 可作為後續迭代。

### 執行順序建議

1. **T001**（型別定義，5 min）→ 解除所有 TypeScript 型別依賴
2. **T002 + T003 平行**（i18n + 純函式，各 15-20 min）
3. **T004 + T005 平行**（測試 + agentSource，各 30-40 min）→ 完成後 **T006**（60-90 min）
4. **T007 + T008 平行**（messageHandler + blocklyEdit，各 20-30 min）
5. US1 Checkpoint：手動測試情境 A + B（見 quickstart.md）
6. **T009 + T012 平行** → **T010** → **T011**（US2 pipeline）
7. **T013 + T014 + T015 部分平行** → **T016**（US3 graceful degradation）
8. **T017 → T018 → T019**（Polish + 驗證）
