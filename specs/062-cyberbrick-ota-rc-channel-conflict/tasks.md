# Tasks: 修正 CyberBrick OTA 與 RC 遙控的 Wi-Fi Channel 衝突

**Input**: `specs/062-cyberbrick-ota-rc-channel-conflict/`  
**Branch**: `feature/062-cyberbrick-ota-rc-channel-conflict`

## Phase 2: Foundational (US1 — Core Channel Fix)

**Story goal**: 在 OTA config 存在但 AP 不在線時，RC 能正確退回積木設定 channel（~5 秒內）  
**Independent test**: 生成的 MicroPython 包含 `isconnected()` 判斷；bootstrap 包含 5 秒等待與 Wi-Fi cleanup 段落

- [X] T002 [US1] 修改 `_buildOtaWifiGuard()` 使生成程式碼同時確認 OTA config 與 `isconnected()`，例外時回傳 `False`，位於 `media/blockly/generators/micropython/rc.js` 第 38–45 行（提示：現有 `assert.match(source, /if not _rc_keep_wifi_for_ota:.../)` 等斷言在修改後仍應通過；isconnected() 加入 guard 函式本體，不影響呼叫端的 `if not _rc_keep_wifi_for_ota:` 結構）

- [X] T003 [P] [US1] 在 `buildCyberBrickRcMainOtaBootstrap()` 的現有 Y>1 等待迴圈之後，追加 50 × 100ms 雙重條件等待（`isconnected()` 提早退出 OR `Y[0] > 1`）及超時後的 `disconnect()` + `reconnects=0` Wi-Fi cleanup，位於 `src/services/cyberbrickOtaAgentSource.ts`

---

## Phase 3: Tests (US1)

**Story goal**: 既有 RC OTA coexistence 測試繼續通過，並新增 `isconnected()` 覆蓋

- [X] T004 [US1] 在 `src/test/suite/cyberbrick-rc-ota-generation.test.ts` 新增兩條 assertion：(1) 生成的 guard 字串包含 `isconnected()`；(2) bootstrap 字串包含 `_singular_blockly_ota_yield(100)` 的 5 秒等待迴圈與 `reconnects=0` cleanup（提示：先閱讀現有 test 的六條 assertions，確認新 assertions 不與現有斷言衝突後再新增）

---

## Phase 4: i18n (US5 — RC Tooltip & OTA Note)

**Story goal**: 學生閱讀 RC 積木 tooltip 時看到 channel 配對說明；OTA provisioning 完成後看到 RC channel 規則提示  
**Independent test**: `npm run validate:i18n` 通過；RC slave/master tooltip 包含 channel 說明；provision 成功時顯示 OTA_RC_CHANNEL_NOTE

- [X] T005 [P] [US5] 更新 `media/locales/zh-hant/messages.js`：修改 `RC_SLAVE_INIT_TOOLTIP`（line 1124）與 `RC_MASTER_INIT_TOOLTIP`（line 1116）加入 channel 配對說明；於 `CYBERBRICK_PROVISION_SUCCEEDED`（line 73）之後新增 `CYBERBRICK_OTA_RC_CHANNEL_NOTE`

- [X] T006 [P] [US5] 更新 `media/locales/en/messages.js`：同 T005（英文文案）

- [X] T007 [P] [US5] 更新 `media/locales/bg/messages.js`：同 T005（保加利亞文文案）

- [X] T008 [P] [US5] 更新 `media/locales/cs/messages.js`：同 T005（捷克文文案）

- [X] T009 [P] [US5] 更新 `media/locales/de/messages.js`：同 T005（德文文案）

- [X] T010 [P] [US5] 更新 `media/locales/es/messages.js`：同 T005（西班牙文文案）

- [X] T011 [P] [US5] 更新 `media/locales/fr/messages.js`：同 T005（法文文案）

- [X] T012 [P] [US5] 更新 `media/locales/hu/messages.js`：同 T005（匈牙利文文案）

- [X] T013 [P] [US5] 更新 `media/locales/it/messages.js`：同 T005（義大利文文案）

- [X] T014 [P] [US5] 更新 `media/locales/ja/messages.js`：同 T005（日文文案）

- [X] T015 [P] [US5] 更新 `media/locales/ko/messages.js`：同 T005（韓文文案）

- [X] T016 [P] [US5] 更新 `media/locales/pl/messages.js`：同 T005（波蘭文文案）

- [X] T017 [P] [US5] 更新 `media/locales/pt-br/messages.js`：同 T005（葡萄牙文巴西文案）

- [X] T018 [P] [US5] 更新 `media/locales/ru/messages.js`：同 T005（俄文文案）

- [X] T019 [P] [US5] 更新 `media/locales/tr/messages.js`：同 T005（土耳其文文案）

- [X] T020 [US5] 在 `media/js/blocklyEdit.js` 第 6723 行附近的 `cyberbrickOtaProvisionResult` success 處理區塊，於 `CYBERBRICK_PROVISION_SUCCEEDED` toast 顯示後，**以獨立的次要 info toast 呼叫顯示 `CYBERBRICK_OTA_RC_CHANNEL_NOTE`**（不修改 `CYBERBRICK_PROVISION_SUCCEEDED` 的訊息字串本身，保持 `successMessage` 不變，避免影響 `src/test/webview/cyberbrickUploadSettings.contract.test.ts` 的既有斷言）

- [X] T020a [US5] 執行 `src/test/webview/cyberbrickUploadSettings.contract.test.ts` 確認 T020 的 toast 修改未破壞現有 `toast.show(successMessage` 與 `CYBERBRICK_PROVISION_SUCCEEDED` 斷言；若測試失敗則更新對應 assertion 以反映新的 info toast 呼叫

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: 驗證所有變更、確認不違反非目標限制

- [X] T021 執行 `npm run validate:i18n` 確認 15 個 locale 均已新增 `CYBERBRICK_OTA_RC_CHANNEL_NOTE` 且格式正確

- [X] T022 執行 `npm test` 確認無 regression；確認 `buildCyberBrickOtaAgentSource()` body 未被修改、`CYBERBRICK_OTA_AGENT_TARGET_VERSION` 未被變更、`src/services/cyberbrickOtaUploader.ts` 未被修改

---

## Dependencies

```
T002 ──────────────────────────── T004 ──┐
T003 ──────────────────────────────────── ┤
                                          │
T005–T019 (parallel) ─────────────────── ┤
                                          │
T020 ─→ T020a ─────────────────────────── ┤
                                          │
                                     T021 ─→ T022
```

## Parallel Execution

T002 和 T003 可同時執行（不同檔案）。T005–T019 及 T020/T020a 可與 T002/T003/T004 同時並行執行。T021、T022 須在所有前置任務完成後依序執行。

## Implementation Strategy

**MVP scope**: T002 + T003 + T004 — 核心 channel 修正立即生效，學生可用 RC + OTA 共存。  
**Full delivery**: 再加 T005–T020（i18n），然後 T021 + T022（驗證）。

---

## i18n 文案參考（T005–T019）

### RC_SLAVE_INIT_TOOLTIP / RC_MASTER_INIT_TOOLTIP 補充說明
在現有「設定配對 ID (1-255) 和頻道 (1-11)」之後加入（各語系自行翻譯）：

> 頻道說明：兩台都連上同一個 Wi-Fi，RC 會用 Wi-Fi 的頻道；兩台都沒有 Wi-Fi，RC 會用積木設定的頻道。

### CYBERBRICK_OTA_RC_CHANNEL_NOTE（新增 key）
顯示於 OTA provisioning 成功後，說明三種情境（各語系自行翻譯）：

> RC 遙控頻道說明：
> ✅ 兩台都連上同一個 Wi-Fi → 用 Wi-Fi 頻道，RC 與 OTA 同時可用
> ✅ 兩台都沒有 Wi-Fi → 用積木設定的頻道，RC 正常使用
> ⚠️ 一台有 Wi-Fi、一台沒有 → RC 可能無法配對
