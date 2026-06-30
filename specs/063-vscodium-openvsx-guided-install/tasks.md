# Tasks: VSCodium / Open VSX 支援與引導安裝

**輸入**：`specs/063-vscodium-openvsx-guided-install/` 下的設計文件

**依賴文件**：
- `spec.md`（使用者故事：US1–US5，功能需求：FR-001–FR-014）
- `plan.md`（雙層偵測架構、`PenvProviderService` 設計）
- `data-model.md`（`PenvProviderStatus`、`PenvProviderServiceDeps` 型別、i18n key）
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

- [ ] T001 從 `package.json` 移除 `extensionDependencies` 區塊（含 `"platformio.platformio-ide"` 的 3 行）
- [ ] T002 Rebase PR #91 的既有變更至本 branch：checkout `jo95017:fix/optional-platformio-dependency`，rebase 至 `origin/master`，確認 `settingsManager.ts` provider guard、`micropythonUploader.ts` 錯誤訊息更新、`settingsManager.test.ts` 測試均包含在內；**若有衝突以本 branch 版本為準，`settingsManager.ts` 的 provider guard 邏輯和 `settingsManager.test.ts` 的兩個新測試案例必須完整保留**

---

## Phase 2：基礎建設（阻擋所有使用者故事的前提）

**目的**：建立 `PenvProviderService`——集中管理 provider 偵測、通知、安裝 fallback 與重試邏輯，供所有上傳路徑與 `extension.ts` 共用

**⚠️ 關鍵**：所有使用者故事的實作任務均依賴本階段完成

- [ ] T003 在 `src/services/penvProviderService.ts` 定義 `PenvProviderStatus` union type 與 `PenvProviderServiceDeps` 介面（含 `getExtension`、`executeCommand`、`showInformationMessage`、`checkPenvExists` 四個可注入欄位）
- [ ] T004 在 `src/services/penvProviderService.ts` 實作 `isProviderInstalled(deps): boolean`——以 `deps.getExtension('platformio.platformio-ide')` 或 `deps.getExtension('pioarduino.pioarduino-ide')` 任一有值即回傳 `true`
- [ ] T005 在 `src/services/penvProviderService.ts` 實作 `checkPenvExists(): boolean`——以 `fs.existsSync` 檢查 `~/.platformio/penv/bin/python`（macOS/Linux）或 `~/.platformio/penv/Scripts/python.exe`（Windows）
- [ ] T006 在 `src/services/penvProviderService.ts` 實作 `detectStatus(deps): PenvProviderStatus`——結合 `isProviderInstalled` 與 `checkPenvExists` 回傳三態值
- [ ] T007 在 `src/services/penvProviderService.ts` 實作 `attemptInstall(deps): Promise<void>`——先嘗試 `installExtension('platformio.platformio-ide')`（以 `log()` 記錄嘗試與結果），catch 後嘗試 `installExtension('pioarduino.pioarduino-ide')`（同樣 `log()`），再 catch 則執行 `workbench.extensions.search` 搜尋 `'platformio'` 並顯示 `PENV_PROVIDER_INSTALL_FAILED` 訊息，並以 `log('warn')` 記錄兩者均安裝失敗
- [ ] T008 在 `src/services/penvProviderService.ts` 實作 `waitForPenvReady(checkPenvExists, maxRetries = 3, intervalMs = 3000): Promise<boolean>`——每次重試前以 `log('info')` 記錄重試次數，每次間隔 `intervalMs` 重試，超過 `maxRetries` 回傳 `false`；**每次重試開始時需透過 `deps.showInformationMessage` 或呼叫方以 `PENV_PROVIDER_PENDING` 訊息讓使用者感知進度（即時回饋，不超過 3 秒無訊息）**
- [ ] T009 在 `src/services/penvProviderService.ts` 實作 `showInstallNotification(deps): Promise<void>`——以 `log('info')` 記錄通知觸發；呼叫 `deps.showInformationMessage(locale.getMessage('PENV_PROVIDER_NOT_INSTALLED'), locale.getMessage('PENV_PROVIDER_INSTALL_BUTTON'))`（使用與現有擴充功能相同的 locale 查找模式；實作前確認現有 `getMessage` 或同等函數的呼叫方式），使用者點擊按鈕後呼叫 `attemptInstall(deps)`
- [ ] T010 在 `src/test/penvProviderService.test.ts` 撰寫單元測試：(a) `isProviderInstalled` 有/無 provider 兩種情境；(b) `detectStatus` 三態回傳；(c) `attemptInstall` platformio 成功、platformio 失敗 pioarduino 成功、兩者均失敗三種情境；(d) `waitForPenvReady` 重試 1~3 次後成功及超出次數失敗；(e) `showInstallNotification` 使用者點擊與 dismiss 兩種情境——全部使用 Sinon stub，不依賴 VS Code 執行環境

**Checkpoint**：`PenvProviderService` 完成，可平行開始 Phase 3、4、5

---

## Phase 3：使用者故事 1 + 2 — Activation 通知（優先級 P1）🎯 MVP

**目標**：Arduino 工作區啟動時若無 penv provider 則顯示通知；VSCodium 環境自動安裝 pioarduino

**獨立測試標準**：以 mock provider 測試通知出現、按鈕觸發安裝、pioarduino fallback 等情境，不需要真實 VS Code 執行

- [ ] T011 [US1] [US2] 在 `src/services/penvProviderService.ts` 新增 `needsPenvAtActivation(board: string): boolean`——回傳 `board !== 'none' && board !== 'cyberbrick' && board !== 'txt'`
- [ ] T012 [US1] [US2] 更新 `src/extension.ts` 的 `activate()` 函數：在讀取 `mainJson.board` 後，若 `needsPenvAtActivation(board)` 且 `!isProviderInstalled(deps)` 則呼叫 `showInstallNotification(deps)`（非同步，不 await，不阻擋 activation 繼續執行）
- [ ] T013 [US1] [US2] 在 `src/test/penvProviderService.test.ts` 補充 activation 相關測試（**依賴 T010 完成**）：(a) Arduino board + 無 provider → 顯示通知；(b) Arduino board + PlatformIO 已安裝 → 不顯示；(c) board='txt' + 無 provider → 不顯示；(d) board='none' + 無 provider → 不顯示；(e) pioarduino fallback 觸發情境（mock installExtension reject for platformio）

---

## Phase 4：使用者故事 3 — 上傳路徑引導（優先級 P2）

**目標**：dismiss 啟動通知後嘗試上傳時，通知再次出現；provider 已安裝但 penv 初始化中時自動重試

**獨立測試標準**：mock checkPioInstalled/checkPythonEnvironment 失敗情境，驗證通知觸發與重試邏輯

- [ ] T014 [US3] 更新 `src/services/arduinoUploader.ts` 的 `checkPioInstalled()` 失敗路徑：若 `isProviderInstalled()` 為 false，呼叫 `showInstallNotification(deps)` 並回傳失敗；若 provider 已安裝則呼叫 `waitForPenvReady()`——**每次重試迴圈開始時立即以 `PENV_PROVIDER_PENDING` 訊息通知使用者（確保不超過 3 秒無回饋）**，最多重試 3 次，仍失敗才回傳失敗；更新 `'PlatformIO not found'` 錯誤訊息文字以提及 pioarduino
- [ ] T015 [US3] 更新 `src/services/micropythonUploader.ts` 的 `checkPythonEnvironment()` 失敗路徑：同 T014 邏輯（provider check → 通知或重試，含即時進度回饋）；同時更新 `installMpremote()` 失敗的 `details` 欄位文字，加入 pioarduino 說明
- [ ] T016 [US3] 在 `src/services/serialMonitorService.ts` 的 `getPlatformioPythonPath()` 呼叫前加入 penv guard：直接 import `PenvProviderService` 並以明確的 VS Code API deps 物件呼叫 `PenvProviderService.isProviderInstalled()` 和 `checkPenvExists()`；`checkPenvExists()` 為 false 時，依 `isProviderInstalled()` 結果顯示 `PENV_PROVIDER_NOT_INSTALLED`（無 provider）或 `PENV_PROVIDER_PENDING`（provider 已裝但 penv 未就緒）通知，並提早回傳取代現有靜默失敗行為

---

## Phase 5：使用者故事 4 + 5 — 迴歸驗證（優先級 P1）

**目標**：現有使用者（已安裝 provider）行為不變；TXT / CyberBrick OTA 工作區不顯示通知

**獨立測試標準**：以 mock provider 已安裝情境執行完整啟動流程，確認無額外通知或對話框

- [ ] T017 [US4] [US5] 在 `src/test/penvProviderService.test.ts` 補充迴歸測試：(a) PlatformIO 已安裝 + Arduino board → `detectStatus` 回傳 `installed-ready`，不呼叫 `showInstallNotification`；(b) pioarduino 已安裝 + Arduino board → 同上；(c) board='cyberbrick' + 無 provider → activation 時不顯示通知；(d) board='txt' + 無 provider → activation 時不顯示通知；執行 `npm test` 確認所有 908+ 測試通過

---

## Phase 6：收尾（多語系 + 版本）

**目標**：完成全語系 i18n、驗證、版本標記

- [ ] T018 [P] 在所有 15 個 `media/locales/*/messages.js` 檔案中加入 4 個新 i18n key：`PENV_PROVIDER_NOT_INSTALLED`、`PENV_PROVIDER_INSTALL_BUTTON`、`PENV_PROVIDER_INSTALL_FAILED`、`PENV_PROVIDER_PENDING`——以 `zh-hant`（繁體中文）為基準翻譯，其餘 14 個語系（`bg`、`cs`、`de`、`en`、`es`、`fr`、`hu`、`it`、`ja`、`ko`、`pl`、`pt-br`、`ru`、`tr`）以 AI 翻譯從 `zh-hant` 基準版本生成，翻譯風格應與各語系現有字串一致
- [ ] T019 執行 `npm run validate:i18n` 確認全部 15 個語系驗證通過，修正任何缺漏 key
- [ ] T020 執行 `npm test`，確認測試數量 ≥ 908（含本功能新增測試），零失敗；若有失敗逐一修正
- [ ] T021 minor 版本升級：更新 `package.json` 的 `version` 欄位，在 `CHANGELOG.md` 的「未發布」區段新增本功能條目（繁體中文 + English，含新功能說明與 VSCodium 相容性說明）
- [ ] T022 手動驗收測試：依 `quickstart.md` Scenario 3 在 VSCodium + pioarduino 環境執行完整引導安裝流程（通知出現 → 安裝 → reload → penv 自動建立 → CyberBrick 上傳成功），對應 SC-001；記錄測試結果

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
- 開發者 A：T011 → T012 → T013（Activation 通知）
- 開發者 B：T014 → T015 → T016（Upload 路徑）
- 開發者 C：T017（迴歸測試）、T018（i18n）

## 實作策略（MVP 優先）

**MVP**（Phase 1 + Phase 2 + Phase 3）：完成後即可驗證核心使用者場景（VS Code 和 VSCodium 的一鍵引導安裝）。

**完整交付**（加上 Phase 4–6 + T022）：上傳路徑的重試機制、非 penv 板子篩選、全語系翻譯、版本標記、VSCodium 手動驗收。
