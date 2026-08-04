# Tasks: VSCodium / Open VSX 支援與引導安裝

**輸入**：`specs/063-vscodium-openvsx-guided-install/` 下的設計文件

**依賴文件**：
- `spec.md`（使用者故事：US1–US5，功能需求：FR-001–FR-014）
- `plan.md`（雙層偵測架構、`PenvProviderService` 設計）
- `data-model.md`（`PenvProviderServiceDeps`、`ProviderInstallResult`、`PlatformioInvocation` 型別與提示用 i18n key）
- `contracts/vs-code-api.md`（`installExtension` fallback 策略、`showInformationMessage` 用法）
- `research.md`（板子類型篩選邏輯、penv 自動建立機制確認）

## 格式：`[ID] [P?] [Story?] 描述 with file path`

- **[P]**：可平行執行（不同檔案且無未完成依賴）
- **[USx]**：對應使用者故事（US1–US5）

## 依賴關係圖

```
Phase 1 → Phase 2 → Phase 3 (US1/US2)
                  → Phase 4 (US3)
                  → Phase 5 (US4/US5)
Phase 2 (T009) → T018 (i18n key 名稱確認後即可執行，不依賴 Phase 3/4)
Phase 3 + Phase 4 + T018 → T019 → T020 → T021
```

**Phase 3、Phase 4、Phase 5、T018 可在 Phase 2 完成後平行執行**

---

## Phase 1：設置（共享基礎）

**目的**：建立 branch 基線，移除 manifest 硬性依賴，整合 PR #91 已有成果

- [X] T001 從 `package.json` 移除 `extensionDependencies` 區塊（含 `"platformio.platformio-ide"` 的 3 行）
- [X] T002 Rebase PR #91 的既有變更至本 branch：checkout `jo95017:fix/optional-platformio-dependency`，rebase 至 `origin/master`，確認 `settingsManager.ts` provider guard、`micropythonUploader.ts` 錯誤訊息更新、`settingsManager.test.ts` 測試均包含在內；**若有衝突以本 branch 版本為準，`settingsManager.ts` 的 provider guard 邏輯和 `settingsManager.test.ts` 的兩個新測試案例必須完整保留**

---

## Phase 2：基礎建設（阻擋所有使用者故事的前提）

**目的**：建立 `PenvProviderService`——集中管理 provider 偵測、直接安裝與 fallback 邏輯

**⚠️ 關鍵**：所有使用者故事的實作任務均依賴本階段完成

- [X] T003 在 `src/services/penvProviderService.ts` 定義 `PenvProviderServiceDeps` 與 `ProviderInstallResult`；provider 安裝狀態不再與固定 penv 路徑合併。
- [X] T004 在 `src/services/penvProviderService.ts` 實作 `isProviderInstalled(deps): boolean`——以 `deps.getExtension('platformio.platformio-ide')` 或 `deps.getExtension('pioarduino.pioarduino-ide')` 任一有值即回傳 `true`
- [X] T005（後續修正移除）不再以固定 `~/.platformio/penv` 路徑判斷 provider 或初始化狀態；provider 以 extension ID 判斷，Core 則由 invocation resolver 實際執行驗證。
- [X] T006（後續修正移除）移除以 Python 檔案存在推導 Core ready 的 `detectStatus()`，改由 invocation resolver 實際執行驗證。
- [X] T007 在 `src/services/penvProviderService.ts` 實作 `attemptInstall(deps): Promise<ProviderInstallResult>`——先嘗試 `installExtension('platformio.platformio-ide')`，再 fallback `pioarduino.pioarduino-ide`；兩者失敗回傳 `manual-required` 並開啟搜尋。呼叫端只有在 `installed` 時可顯示 reload。
- [X] T008（後續修正移除）不再以 `waitForPenvReady()` 輪詢固定 `~/.platformio` 路徑；Core 可用性改由 invocation resolver 實際執行驗證。
- [X] T009 在 `src/services/penvProviderService.ts` 實作 `showInstallNotification(deps): Promise<void>`——直接呼叫 VS Code `installExtension`，不顯示自訂的前置確認；成功才顯示 reload，失敗只顯示手動安裝訊息。
- [X] T010 在 `src/test/penvProviderService.test.ts` 撰寫單元測試：provider 有無、三態狀態、兩階 provider fallback、manual-required 與安裝失敗不得 reload。

**Checkpoint**：`PenvProviderService` 完成，可平行開始 Phase 3、4、5

---

## Phase 3：使用者故事 1 + 2 — 編輯器開啟時自動安裝（優先級 P1）🎯 MVP

**目標**：所有板子工作區開啟積木編輯器時若無 provider 則觸發安裝；VSCodium 環境自動 fallback pioarduino

**獨立測試標準**：以 mock provider 測試直接觸發安裝、pioarduino fallback 等情境，不需要真實 VS Code 執行

- [X] T011 [US1] [US2] 確認不做板子篩選，以維持舊版 `extensionDependencies` 對所有板子的共同前置行為。
- [X] T012 [US1] [US2] 在 `src/webview/webviewManager.ts` 的 `createAndShowWebView()` 建立新面板階段加入全板子 provider 偵測；未安裝則 fire-and-forget 呼叫 `showInstallNotification(penvDeps)`。
- [X] T013 [US1] [US2] 在 `src/test/penvProviderService.test.ts` 補充無 provider、已有 provider、pioarduino fallback 與兩者均失敗不得 reload 的測試。

---

## Phase 4：使用者故事 3 — 上傳路徑引導（優先級 P2）

**目標**：上傳時區分 provider 未安裝與 provider 已安裝但 penv 尚在初始化，不在上傳路徑重複安裝

**獨立測試標準**：mock checkPioInstalled/checkPythonEnvironment 失敗情境，驗證狀態提示與後端選擇

- [X] T014 [US3] 更新 `src/services/arduinoUploader.ts` 的 `checkPioInstalled()` 失敗路徑：顯示簡明提示訊息；不在上傳路徑重複觸發安裝流程（安裝已由積木編輯器開啟時處理）。
- [X] T015 [US3] 更新 `src/services/micropythonUploader.ts` 的 `checkPythonEnvironment()` 失敗路徑：以 provider extension 狀態區分「環境初始化中」或「請開啟積木編輯器」，不依賴固定 penv 路徑；同時更新 `installMpremote()` 失敗的 `details` 欄位文字，加入 pioarduino 說明。
- [X] T016 [US3] 在 `src/services/serialMonitorService.ts` 依實際裝置偵測後端啟動 Monitor：Python 偵測成功沿用 Python；mpremote fallback 偵測成功直接沿用 mpremote，不以固定 penv guard 排除自訂 Python。

---

## Phase 5：使用者故事 4 + 5 — 迴歸驗證（優先級 P1）

**目標**：現有使用者（已安裝 provider）行為不變；所有板子維持共同 provider 前置

**獨立測試標準**：以 mock provider 已安裝情境執行完整啟動流程，確認不重複觸發安裝

- [X] T017 [US4] [US5] 在 `src/test/penvProviderService.test.ts` 補充迴歸測試：已有任一 provider 時不重複安裝；無 provider 時不論板子類型皆觸發相同安裝流程。

---

## Phase 6：收尾（多語系 + 版本）

**目標**：完成全語系 i18n、驗證、版本標記

- [X] T018 [P] 在所有 15 個 `media/locales/*/messages.js` 檔案中加入安裝失敗、初始化中與重新載入所需的 i18n key；直接安裝流程不保留未使用的安裝前通知與按鈕 key。
- [X] T019 執行 `npm run validate:i18n` 確認全部 15 個語系驗證通過，修正任何缺漏 key
- [X] T020 執行 `npm test`：938 項通過、1 項略過；另有 1 項既有且與本 PR 無關的 MicroPython OTA 測試失敗，已明確記錄並交付測試 VSIX
- [X] T021 minor 版本升級：更新 `package.json` 的 `version` 欄位，在 `CHANGELOG.md` 的「未發布」區段新增本功能條目（繁體中文 + English，含新功能說明與 VSCodium 相容性說明）
- [ ] T022 手動驗收測試：依 `quickstart.md` Scenario 3 在 VSCodium + pioarduino 環境執行完整引導安裝流程（開啟積木編輯器 → 直接安裝 → reload → penv 自動建立 → CyberBrick 上傳成功），對應 SC-001；記錄測試結果

## Phase 7：Windows Core 啟動 fallback 與安裝狀態修正

- [X] T023 `attemptInstall()` 回傳明確結果；兩個 provider 都失敗時不得顯示 reload 或環境已就緒。
- [X] T024 新增 `PlatformioInvocationResolver`，支援 `platformio-ide.customPATH`、`PLATFORMIO_CORE_DIR`、Windows 系統磁碟、預設 Core 與 PATH。
- [X] T025 實際執行每個候選的 `--version`；direct launcher 失敗後繼續嘗試 penv Python 的 `-m platformio`。
- [X] T026 Arduino 編譯、上傳與 Serial Monitor 沿用 resolver 成功選出的啟動方式。
- [X] T027 移除 CyberBrick Serial Monitor 的固定 penv guard，改用實際成功偵測裝置的後端。
- [ ] T028 已產生 0.83.0 測試 VSIX；待在 Windows 非 ASCII 使用者路徑、`PLATFORMIO_CORE_DIR` 與被阻擋 `pio.exe` 情境完成手動驗收。

---

## 依賴關係摘要

| 任務 | 依賴 |
|------|------|
| T002 | T001 |
| T003–T010 | T001、T002 |
| T011–T013 | T003–T010（T013 另依賴 T010 完成，不可平行）|
| T014–T016 | T003–T010 |
| T017 | T011–T013、T014–T016 |
| T018 | T009（需要確認 i18n key 名稱）|
| T019 | T018 |
| T020 | T017、T019 |
| T021 | T020 |
| T022 | T020（需要可執行的 .vsix）|

## 平行執行範例

**Phase 2 完成後可平行執行**：
- 開發者 A：T011 → T012 → T013（編輯器開啟時自動安裝）
- 開發者 B：T014 → T015 → T016（Upload 路徑）
- 開發者 C：T017（迴歸測試）、T018（i18n）

## 實作策略（MVP 優先）

**MVP**（Phase 1 + Phase 2 + Phase 3）：完成後即可驗證核心使用者場景（VS Code 和 VSCodium 的一鍵引導安裝）。

**完整交付**（加上 Phase 4–7）：全板子 provider 前置、可執行 Core fallback、全語系翻譯、版本標記、VSIX 與 VSCodium/Windows 手動驗收。
