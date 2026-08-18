# 任務：主程式積木停用保護

**輸入**：`specs/068-main-block-disable-guard/` 下的 spec、plan、research、data model、contracts 與 quickstart

**測試要求**：本功能明確要求七種板型、全部停用原因、事件／undo、程式產生、資料競態與交易 rollback 驗收；每個使用者故事都必須先建立會失敗的自動化或契約測試，再進行對應實作。

## Phase 1：設定與測試資料

**目的**：建立可重現的必要主程式、普通積木與交易失敗輸入，避免各層測試各自手寫不一致資料。

- [X] T001 建立 Arduino、CyberBrick、TXT 的單一／重複必要主程式、`MANUALLY_DISABLED`／複數／未知原因，以及普通積木、函式、`txt_process` 停用文件 fixtures 於 `src/test/fixtures/main-block-disable-guard/` [FR-001] [FR-002] [FR-004] [FR-012] [FR-013] [SC-001] [SC-002]

---

## Phase 2：共同測試基礎（阻擋所有使用者故事）

**目的**：以目前專案慣用的 Node `vm` 方式載入 WebView runtime，提供 registry、Blockly events、block 與 workspace 的可觀察測試替身。

**⚠️ 關鍵**：本階段完成前不得開始任何使用者故事實作。

- [X] T002 建立可重複初始化 `media/js/blocklyRuntime.js`、重設 context-menu registry、記錄 event enable/disable 與 disabled reason mutation 的測試 harness 於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-003] [FR-005] [FR-018] [SC-001] [SC-006]

**Checkpoint**：後續 runtime 與 editor 政策可在不啟動完整 WebView 的情況下決定性驗證。

---

## Phase 3：使用者故事 1－必要主程式無法被停用（優先級：P1）🎯 MVP

**目標**：三種必要主程式沒有停用選單，任何途徑加入的停用原因都立即清除且不污染事件或 undo。

**獨立測試**：以三種必要類型及一個普通積木開啟 context menu 並注入停用原因；必要主程式全部保持啟用，普通積木仍完整使用 Blockly 原始 item。

### 測試（先寫並確認失敗）

- [X] T003 [US1] 先新增 `arduino_setup_loop`、`micropython_main`、`txt_setup` 的 `blockDisable` precondition 為 `hidden`，普通積木原始 precondition／文字／callback／metadata 完整委派、缺少核心 item 時回傳 false 且 registry 不變，以及重複安裝與 registry reset 後重包裝測試於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-001] [FR-003] [FR-018] [SC-001]
- [X] T004 [US1] 先新增 `MANUALLY_DISABLED`、複數及未知原因全部移除、已啟用重複呼叫回傳 false、普通積木原因不變、事件狀態於成功／例外後恢復且零額外 undo／change event 測試於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-004] [FR-005] [SC-002] [SC-006]
- [X] T005 [US1] 先新增 `BLOCK_CREATE`、`BLOCK_DELETE`、`BLOCK_CHANGE` 且 `element === 'disabled'` 會執行統一保護、其他 change 不誤觸發，初次／FileWatcher／備份正式載入、板型切換與語言重建都在序列化前執行保護，且原始 disabled event 仍只進入一次既有保存路徑的 editor 契約測試於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-005] [FR-006] [SC-005] [SC-006]

### 實作

- [X] T006 [US1] 在 `media/js/blocklyRuntime.js` 建立唯讀必要主程式類型集合、冪等 `blockDisable` 包裝器與清除所有 runtime 停用原因的修復函式，並在 `finally` 精確恢復 Blockly events 狀態 [FR-001] [FR-003] [FR-004] [FR-005] [FR-018]
- [X] T007 [US1] 在 `media/js/blocklyEdit.js` 將 `updateMainBlockDeletable()` 擴充為先修復啟用狀態的統一主程式保護，加入 disabled change listener，並讓 create/delete、初載、正式 reload、板型切換與語言重建呼叫同一入口 [FR-005] [FR-006] [FR-018]
- [X] T008 [US1] 以七種板型 fixture 執行 `src/test/suite/mainBlockDisableGuard.contract.test.ts`，確認三種入口無法停用、普通積木仍可停用／啟用且事件計數穩定 [SC-001] [SC-005] [SC-006]

**Checkpoint**：所有支援板型的必要主程式在 live editor 中都無法保持停用；此時可獨立展示 MVP。

---

## Phase 4：使用者故事 2－既有與外部停用狀態安全自動修復（優先級：P1）

**目標**：初次、備份與外部候選工作區都以正式 runtime 修復必要主程式；只有實際修復才成對寫回，競態或失敗不遺失資料。

**獨立測試**：載入含多種停用原因的既有 CyberBrick 與外部候選文件，確認不需編輯 JSON 即恢復；再注入來源改變及每個寫入失敗點，確認主檔、備份與 memory 符合交易契約。

### 測試（先寫並確認失敗）

- [X] T009 [P] [US2] 先新增 `WorkspaceInitialLoadResultMessage.mainBlockStateRepaired` optional boolean、成功文件驗證及省略欄位相容性契約測試於 `src/test/suite/workspaceValidation.contract.test.ts` [FR-007] [FR-010]
- [X] T010 [US2] 先新增正常初載沒有修復旗標時主檔 bytes 不變、`.bak` 建立，以及修復旗標 true 時主檔／備份同時更新且 CyberBrick 子積木內容保持的整合測試於 `src/test/initialWorkspaceGate.test.ts` [FR-007] [FR-008] [FR-009] [FR-010] [FR-012] [SC-003] [SC-004] [SC-008]
- [X] T011 [US2] 先新增初載來源已外部變更時舊修復回傳 false 且零寫入、錯誤型別旗標不升級提交、stale request ID 被忽略的測試於 `src/test/initialWorkspaceGate.test.ts` [FR-007] [FR-008] [SC-004]
- [X] T012 [US2] 先新增初載修復成功成對更新、主檔寫入失敗、備份寫入失敗、備份原先不存在及交易中斷時主檔／備份／memory 完整 rollback 的服務測試於 `src/test/services/workspaceCandidateService.test.ts` [FR-008] [FR-009] [SC-004]
- [X] T013 [US2] 先新增外部候選的停用必要主程式可通過 preflight、在 formal live load 清除全部原因，並以修復後 `normalizedDocument` 成對提交的測試於 `src/test/services/workspaceCandidateService.test.ts`、`src/test/suite/workspaceValidation.contract.test.ts` [FR-011] [FR-012] [SC-002] [SC-005]
- [X] T014 [US2] 先新增候選 live load 期間發生較新 watcher revision、deadline、提交寫入失敗時不得覆寫新資料且必須 restore live workspace 的回歸測試於 `src/test/services/workspaceCandidateService.test.ts` [FR-008] [FR-009] [FR-011] [SC-004]

### 實作

- [X] T015 [P] [US2] 在 `src/types/workspaceValidation.ts` 擴充 `WorkspaceInitialLoadResultMessage` 與其 runtime validation，只有嚴格布林 true 表示確實修復，並保持舊訊息相容 [FR-007] [FR-010]
- [X] T016 [US2] 在 `media/js/blocklyEdit.js` 累積正式載入的修復結果，在初次成功 acknowledgement 附上 `mainBlockStateRepaired`，並確保初載、FileWatcher、validated candidate、備份及其他 load 路徑都在修復後才序列化 [FR-006] [FR-007] [FR-011] [FR-012]
- [X] T017 [US2] 在 `src/webview/messageHandler.ts` 驗證初載修復旗標並將它與原始 source bytes 交給 candidate service；無旗標維持 recovery seed，失敗與無效文件維持既有 reject/recovery [FR-007] [FR-008] [FR-010]
- [X] T018 [US2] 在 `src/services/workspaceCandidateService.ts` 擴充初載交易，使實際修復在同一 queue 內 exact-byte 比對、保存三份快照、原子更新主檔與備份、最後更新 memory，任一步驟失敗完整 rollback；無修復維持只寫備份 [FR-008] [FR-009] [FR-010]
- [X] T019 [US2] 在 `media/js/blocklyEdit.js` 與 `src/services/workspaceCandidateService.ts` 確認外部候選只於 formal live load 套用修復，並沿用 generation／revision／deadline／source-byte guard 提交 live normalized document [FR-011] [FR-012]
- [X] T020 [US2] 執行 `src/test/initialWorkspaceGate.test.ts`、`src/test/services/workspaceCandidateService.test.ts` 與 `src/test/suite/workspaceValidation.contract.test.ts`，確認成功、無修復、stale、寫入失敗、交易中斷及外部候選案例全數通過 [SC-002] [SC-003] [SC-004] [SC-005] [SC-008]

**Checkpoint**：既有及外部停用狀態可靜默修復，且所有持久化結果具來源新鮮度與成對 rollback 保護。

---

## Phase 5：使用者故事 3－普通停用與主程式結構保護不退步（優先級：P2）

**目標**：普通積木、函式與 `txt_process` 保持可停用；單一／重複主程式、TXT 驗證與三套 generator 輸出不退步。

**獨立測試**：停用非必要積木並建立單一／重複主程式，再由修復後工作區產生 Arduino、CyberBrick、TXT 程式，確認停用集合、deletable、警告與執行骨架全符合既有契約。

### 測試（先寫並確認失敗）

- [X] T021 [US3] 先新增普通積木、`arduino_function`、Blockly procedure 與 `txt_process` 的原始選單 callback 可停用／啟用，且統一保護不清除其單一、複數或未知原因的測試於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-003] [FR-013] [FR-015] [SC-001]
- [X] T022 [US3] 先新增三種單一主程式不可刪除、重複時可刪除且只顯示既有警告、刪回單一後恢復不可刪除、`maxInstances: 1` 與 TXT setup/process 完整性不變的契約測試於 `src/test/suite/mainBlockDisableGuard.contract.test.ts` [FR-014] [FR-015] [SC-007]
- [X] T023 [P] [US3] 先新增修復後 Arduino 仍產生 `setup()`／`loop()`、CyberBrick 保留原主程式內容、TXT 保留初始化與已啟用 process 啟動，以及停用非必要頂層積木仍被跳過的測試於 `src/test/suite/code-generation.test.ts`、`src/test/suite/txt-multi-flow-generation.test.ts` [FR-013] [FR-016] [SC-007]

### 實作

- [X] T024 [US3] 在 `media/js/blocklyEdit.js` 保留目前板型映射、數量簽章、最後一個不可刪除、重複可刪除／既有警告與 TXT setup/process 驗證，並固定在啟用修復之後執行 [FR-014] [FR-015]
- [X] T025 [US3] 依回歸測試校正 `media/js/blocklyRuntime.js` 的類型邊界，確保只處理三種必要主程式且不改動 generator 對普通停用積木的既有跳過規則 [FR-001] [FR-013] [FR-016]
- [X] T026 [US3] 執行 `src/test/suite/mainBlockDisableGuard.contract.test.ts`、`src/test/suite/code-generation.test.ts`、`src/test/suite/txt-multi-flow-generation.test.ts` 及既有 toolbox／TXT fixtures 測試，確認結構與產生結果無退步 [SC-001] [SC-007]

**Checkpoint**：三個故事均可獨立驗收；必要主程式受到保護，但其他 Blockly 編輯與產生語意維持不變。

---

## Phase 6：收尾與跨領域品質

**目的**：完成發布說明、安全檢查、無 UI／i18n 擴張驗證及完整建置證據。

- [X] T027 [P] 更新未發布版本的繁中／英文 `CHANGELOG.md`，說明七種板型主程式不可停用、既有專案靜默修復、普通積木行為不變及資料交易保護 [FR-017] [SC-008]
- [X] T028 執行 security-checker 檢查 `media/js/blocklyRuntime.js`、`media/js/blocklyEdit.js`、`src/types/workspaceValidation.ts`、`src/webview/messageHandler.ts`、`src/services/workspaceCandidateService.ts` 的 postMessage 型別收窄、來源競態、原子寫入、rollback、日誌內容、XSS 與事件恢復，記錄結果於 `specs/068-main-block-disable-guard/validation/security.md` [FR-005] [FR-008] [FR-009]
- [X] T029 [P] 掃描 `package.json`、`package.nls*.json`、`media/locales/` 與 `media/js/blocklyEdit.js`，確認本功能沒有新增設定、Toast 或翻譯字串，並記錄於 `specs/068-main-block-disable-guard/validation/scope.md` [FR-017]
- [X] T030 依 `specs/068-main-block-disable-guard/quickstart.md` 執行七種板型、CyberBrick 卡住案例、外部候選、語言／板型重建、備份與失敗注入驗收，記錄每項結果於 `specs/068-main-block-disable-guard/validation/quickstart.md` [SC-001] [SC-002] [SC-003] [SC-004] [SC-005] [SC-006] [SC-007] [SC-008]
- [X] T031 執行 `npm run compile-tests`、`npm run lint`、`npm run validate:i18n`、`npm run test:i18n`、`npm run compile`、`npm test`、`npm run test:integration`、`npm run test:coverage` 與 `npm run package`，確認新增 business logic 完整覆蓋並記錄於 `specs/068-main-block-disable-guard/validation/automated.md` [SC-001] [SC-004] [SC-007]
- [X] T032 執行 `git diff --check`、搜尋 `.only`／placeholder／新增 `console.log`，逐項核對 `specs/068-main-block-disable-guard/checklists/requirements.md` 與 FR-001～FR-018、SC-001～SC-008，記錄最終證據於 `specs/068-main-block-disable-guard/validation/final.md` [FR-001] [FR-018] [SC-001] [SC-008]

---

## 相依關係與執行順序

### Phase 相依

- **Phase 1**：無前置條件，先固定跨層 fixtures。
- **Phase 2**：依賴 Phase 1，阻擋所有故事。
- **US1（Phase 3）**：依賴共同 harness，提供無法停用及即時修復的 MVP。
- **US2（Phase 4）**：依賴 US1 的 runtime 修復結果，加入初載／候選訊息與持久化交易。
- **US3（Phase 5）**：可在 US1 後開始非持久化回歸測試；最終 checkpoint 依賴 US2 的正式載入修復。
- **Phase 6**：依賴三個故事完成。

### 使用者故事圖

```text
Setup → Foundation → US1 (MVP) ─┬→ US2 ─┐
                                └→ US3 ─┴→ Polish
```

### 使用者故事獨立性

- **US1**：以 runtime／editor harness 即可證明三種必要入口沒有停用選單且任何原因立即清除，不依賴磁碟交易。
- **US2**：以既有／外部文件及可注入 FileService 單獨證明自動修復、source freshness 與 rollback，不依賴普通積木回歸案例。
- **US3**：以普通積木、結構及 generator fixtures 單獨證明保護範圍未擴張，不依賴 UI 新功能。

### Story 內順序

- 每一組「先新增」測試都必須先執行並因缺少功能而失敗。
- Runtime 政策完成後才接 editor lifecycle。
- 訊息型別完成後才接 Host handler；交易服務完成後才驗證端到端初載與候選。
- 精準測試通過後才執行 story checkpoint 及完整測試。

## 平行執行機會

- T009 與 T010～T014 位於不同測試檔，可在 T002 後平行撰寫；同一檔內任務維持順序。
- T015 可與 T016 的 WebView 工作平行；T017 必須等 T015，T018 可在測試先完成後獨立實作。
- T023 的 generator 測試可與 T021～T022 的 runtime／editor 測試平行。
- T027 與 T029 可在三個 story 穩定後平行進行；安全與完整驗證依賴最終程式碼。

## 實作策略

### MVP 優先

1. 完成 fixtures 與 VM harness。
2. 寫下並確認 US1 測試失敗。
3. 完成 runtime 選單／原因清除與 editor disabled listener。
4. 以七種板型驗證必要主程式始終啟用後停止並展示 MVP。

### 增量交付

1. **互動保護增量**：US1 隱藏選單與即時修復。
2. **資料修復增量**：US2 初次及外部工作區的安全持久化。
3. **相容性增量**：US3 普通積木、deletable、TXT 與 generator 回歸。
4. **發布前增量**：Phase 6 CHANGELOG、安全、quickstart 與完整建置證據。

## 格式與覆蓋驗證

- 任務總數：32
- Setup：1
- Foundational：1
- US1：6
- US2：12
- US3：6
- Polish：6
- 所有任務均使用未完成 checkbox、連續 ID、story 階段必要的 `[USx]` 標籤及明確檔案路徑。
- FR-001～FR-018 與 SC-001～SC-008 均至少由一項測試、實作或驗收任務明確對應。
