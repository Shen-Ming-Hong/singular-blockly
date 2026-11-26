---
description: "Singular Core 的 Windows 短路徑工作區任務清單"
---

# 任務：Singular Core 的 Windows 短路徑工作區

**輸入**：`specs/074-windows-core-short-paths/` 的 spec、plan、research、data-model、quickstart

**測試**：憲章 VII 要求以測試覆蓋，因此每個使用者故事都包含測試任務。

## 格式：`[ID] [P?] [Story] 說明`

- **[P]**：可以平行進行（不同檔案、沒有相依）
- **[Story]**：所屬的使用者故事

## Phase 1：準備

- [x] T001 在 `src/types/coreEnvironment.ts` 的 `CoreFailureClass` 加入 `'path-too-long'`，並在 `src/types/managedRuntime.ts` 加入 `PlatformioWorkRootKind`、`PlatformioWorkRootRecord` 型別（data-model）

## Phase 2：基礎（所有故事都依賴）

- [x] T002 在 `src/services/managedRuntimeWorkRoot.ts` 實作純函式 `listWorkRootCandidates`、`checkWorkRootBudget`、`createProjectKey`（16 hex），以及候選產生時的 ASCII、本機與 UNC 檢查（FR-002 到 FR-005）
- [x] T003 [P] 在 `src/test/services/managedRuntimeWorkRoot.test.ts` 測試候選順序、custom 不退回其他候選、名稱長度 1 到 45 與網域後綴的預算邊界、非 ASCII 被排除（SC-002）

## Phase 3：使用者故事 1－Windows 上用 Singular Core 編譯 ESP32（P1）🎯 MVP

**目標**：Windows 的 arduino 工作負載使用短工作位置。

**獨立測試**：注入 `platform: 'win32'` 與假的 env，確認 `getCoreEnvironment` 的 PlatformIO 環境變數指向工作位置；非 Windows 不變。

- [x] T004 [US1] 在 `src/services/managedRuntimeWorkRoot.ts` 實作 `PlatformioWorkRootService.resolve()`：讀取並驗證紀錄、依序建立候選、寫入標記與紀錄、在安裝鎖內處理並行（plan 設計重點 1）
- [x] T005 [US1] 修改 `src/services/managedRuntimeService.ts` 的 `getCoreEnvironment(workspaceUri, { workload })`：只在 win32 的 arduino 工作負載套用工作位置的 6 個環境變數（FR-001、FR-012）
- [x] T006 [US1] 修改 `src/services/coreEnvironmentProviders.ts` 與 `src/services/coreEnvironmentManager.ts`：把工作負載傳給 managed provider，並在環境快取鍵加入工作負載
- [x] T007 [P] [US1] 在 `src/test/services/managedRuntimeWorkRoot.test.ts` 與 `src/test/services/managedRuntimeService.test.ts` 測試：local-app-data 優先、非 ASCII 時改用 system-drive、紀錄有效時直接沿用、資料夾消失時重新建立、macOS／Linux 與 python 工作負載路徑不變（SC-007）
- [x] T008 [P] [US1] 更新 `src/test/services/coreEnvironmentManager.test.ts`：同一專案的 arduino 與 python 環境分開快取

## Phase 4：使用者故事 2－放不下時提早而清楚地失敗（P1）

**目標**：預算不足時在啟動 PlatformIO 前回報；編譯期的長路徑錯誤歸類為 path-too-long 並顯示既有通知。

**獨立測試**：模擬過深的自訂資料夾，以及含長路徑錯誤的 PlatformIO 輸出。

- [x] T009 [US2] 在 `src/services/coreFailureClassifier.ts` 新增 path-too-long 判斷（research R6），排在 compile 與 missing-executable 之前，並加入允許退回另一個 Core 的本機失敗清單
- [x] T010 [P] [US2] 在 `src/test/services/coreFailureClassifier.test.ts` 測試：明確的長路徑訊息、248 字元以上路徑加上 ENOENT、短路徑的 include 錯誤仍是 compile、pip 的 long path support 訊息（SC-004）
- [x] T011 [US2] 修改 `src/services/arduinoUploader.ts`：失敗符合 path-too-long 時，結果加上 `code: 'path-too-long'`；`src/types/arduino.ts` 的錯誤型別加入 `code`
- [x] T012 [US2] 修改 `src/services/managedRuntimeProgressPresenter.ts`，公開 `showPathTooLong()`；在 `src/extension.ts` 與 `src/webview/messageHandler.ts` 注入，Arduino 上傳結果帶有 path-too-long 時呼叫
- [x] T013 [US2] 在 `media/js/blocklyEdit.js` 的上傳結果顯示加入 `ARDUINO_PATH_TOO_LONG_DETAILS`；15 個 `media/locales/*/messages.js` 加入新字串
- [x] T014 [P] [US2] 在 `src/test/services/arduinoUploader.test.ts`、`src/test/services/managedRuntimeProgressPresenter.test.ts` 與 `src/test/messageHandler.test.ts` 測試錯誤碼傳遞與通知動作；`managedRuntimeService.test.ts` 測試全部候選不符時拋出 path-too-long 且不建立資料夾

## Phase 5：使用者故事 4－短工作位置只屬於這位使用者（P1）

**目標**：system-drive 候選移除繼承權限；只採用帶有正確標記的位置。

**獨立測試**：注入假的 `whoami`、`icacls` 執行器與檔案系統。

- [x] T015 [US4] 在 `src/services/managedRuntimeWorkRoot.ts` 實作 `WindowsAclHardener`：以 `execFile` 呼叫 `whoami /user /fo csv /nh` 取得 SID，再以 `icacls` 移除繼承、只授權 SID、S-1-5-18、S-1-5-32-544；任一步失敗就刪除空資料夾並跳過候選（FR-006）
- [x] T016 [P] [US4] 在 `src/test/services/managedRuntimeWorkRoot.test.ts` 測試：已存在但沒有標記的資料夾不被採用也不被修改、標記不符時改試下一個候選、`icacls` 失敗時清除空資料夾、指令以引數陣列呼叫（不經過 shell）、SID 格式驗證

## Phase 6：使用者故事 3－既有使用者不必重裝（P2）

**目標**：Core 原地沿用；清理可以移除舊位置的套件。

- [x] T017 [US3] 修改 `src/services/managedRuntimeService.ts` 的 `cleanup()`：在 Windows 且工作位置已建立時，刪除使用中版本的 `core\packages`、`core\platforms` 與版本根目錄下的 `cache`；在工作位置的 `w` 底下，刪除 30 天沒有修改的專案資料夾；回傳計數加上 `packages`、`projects`（FR-010）
- [x] T018 [P] [US3] 在 `src/test/services/managedRuntimeCleanup.test.ts` 測試：penv 與 Core 不受影響、沒有標記的工作位置不被觸碰、python 工作負載的舊環境沿用不重新下載（SC-003）
- [x] T019 [US3] 更新呼叫 `cleanup()` 並顯示計數的地方（`src/webview/platformioDiagnosticPanel.ts`），以及對應的 i18n 字串

## Phase 7：使用者故事 5－看得到、測得到（P3）

- [x] T020 [US5] 在 `src/services/platformioDiagnosticService.ts` 與 `src/types/platformioDiagnostic.ts` 加入 `workRoot`（隱私化）、`workRootKind`、`windowsLongPaths`；以 `reg query` 讀取，只讀不寫（FR-011、FR-014）
- [x] T021 [US5] 在 `src/services/privacyRedactor.ts` 加入工作位置路徑的隱私化；`src/webview/platformioDiagnosticPanel.ts` 與 `media/js/platformioDiagnostic.js` 顯示新欄位；15 語系加入新字串
- [x] T022 [P] [US5] 測試診斷輸出、repair packet 與日誌不含完整工作位置或使用者名稱（SC-005）
- [x] T023 [US5] 在 `scripts/managed-runtime/test-real-installation.js` 加入 `--esp32-packages`；在 `scripts/managed-runtime/collect-evidence.js` 與 `verify-evidence.js` 收錄 `workRootKind`、`longestPathLength`；在 `.github/workflows/runtime-installation.yml` 的 Windows x64 job 啟用（FR-013）
- [x] T024 [P] [US5] 更新 `scripts/managed-runtime/evidence.test.js`，涵蓋新欄位與 260 字元判定

## Phase 8：收尾

- [x] T025 更新 `docs/specifications/04-quality-testing/managed-runtime-environment.md` 與 `docs/specifications/06-features/platformio-diagnostics.md`，並在 `CHANGELOG.md` 的 Unreleased 加入雙語條目
- [x] T026 執行 `npm run validate:i18n`、`npm run test:i18n`，並依 `i18n-maintenance` 審查新字串
- [x] T027 執行 quickstart 第 1 節（雲端容器）全部檢查，並截取診斷面板 managed 卡片的亮色與深色截圖
- [x] T028 依 `local-code-review-loop` 做本地審查；依 `security-checker` 審查 ACL 與子行程呼叫

## 相依與順序

- T001 → T002 → 各故事。
- US1（T004 到 T008）是 MVP，先完成。
- US2 依賴 T001；T011 到 T013 可以在 US1 之後進行。
- US4 的 T015 被 T004 呼叫，可以與 T004 一起完成。
- US3 與 US5 依賴 US1。
- T023 需要 US1 與 US4 完成。

## 實作策略

先完成 Phase 1 到 Phase 5（全部 P1 故事），再做 US3、US5 與收尾。完成後開 PR，請維護者加上 `runtime-e2e-approved` 執行 Windows CI，並請 Ray 依 quickstart 第 3 節做 Windows 實機測試。這是發布門檻，通過後才能合併。
