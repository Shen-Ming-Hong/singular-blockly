# Tasks: CyberBrick MicroPython 積木支援

**Input**: Design documents from `/specs/021-cyberbrick-micropython/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

---

## Format: `[ID] [P?] [Story?] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
-   Include exact file paths in descriptions

---

## Phase 1: Setup (專案基礎設施)

**Purpose**: 建立 MicroPython 支援所需的基本目錄結構和類型定義

-   [ ] T001 建立 MicroPython 生成器目錄結構 in `media/blockly/generators/micropython/`
-   [ ] T002 [P] 建立 CyberBrick 工具箱檔案 in `media/toolbox/cyberbrick.json`
-   [ ] T003 [P] 新增 MicroPython 上傳相關類型定義 in `src/types/micropython.ts`
-   [ ] T004 [P] 擴展 Board 類型定義支援 language 屬性 in `src/types/board.ts`

---

## Phase 2: Foundational (基礎元件 - 阻塞所有 User Story)

**Purpose**: 必須完成才能開始任何 User Story 實作的核心基礎設施

**⚠️ CRITICAL**: 此階段未完成前，所有 User Story 工作無法開始

-   [ ] T005 擴展 BoardConfig 介面新增 language、toolbox、uploadMethod、devicePath 屬性 in `media/blockly/blocks/board_configs.js`
-   [ ] T006 [P] 建立 MicroPython 生成器入口與基礎設定 in `media/blockly/generators/micropython/index.js`
-   [ ] T007 [P] 實作 MicroPython 變數積木生成器 in `media/blockly/generators/micropython/variables.js`
-   [ ] T008 [P] 實作 MicroPython 邏輯積木生成器 in `media/blockly/generators/micropython/logic.js`
-   [ ] T009 [P] 實作 MicroPython 迴圈積木生成器 in `media/blockly/generators/micropython/loops.js`
-   [ ] T010 [P] 實作 MicroPython 數學積木生成器 in `media/blockly/generators/micropython/math.js`
-   [ ] T011 [P] 實作 MicroPython 文字積木生成器 in `media/blockly/generators/micropython/text.js`
-   [ ] T012 [P] 實作 MicroPython 函數積木生成器 in `media/blockly/generators/micropython/functions.js`
-   [ ] T013 新增 CyberBrick 主板完整配置（GPIO、ADC、hardware 對應表）in `media/blockly/blocks/board_configs.js`
-   [ ] T014 擴展 webviewManager.ts 載入 MicroPython 生成器模組 in `src/webview/webviewManager.ts`
-   [ ] T014a [P] 撰寫 MicroPython 程式碼生成器單元測試（覆蓋率目標 ≥80%，涵蓋所有 FR 需求至少一個測試案例）in `src/test/micropythonGenerator.test.ts`

**Checkpoint**: 基礎架構就緒 - User Story 實作可以開始

---

## Phase 3: User Story 1 - 選擇 CyberBrick 主板並使用積木編程 (Priority: P1) 🎯 MVP

**Goal**: 使用者選擇 CyberBrick 後，工具箱自動切換為 MicroPython 積木，可生成正確程式碼

**Independent Test**: 選擇 CyberBrick 主板後，確認工具箱顯示 MicroPython 積木，拖拉積木後能生成正確的 MicroPython 程式碼

### Implementation for User Story 1

-   [ ] T015 [P] [US1] 建立 CyberBrick 專用積木定義（LED、GPIO、時序）in `media/blockly/blocks/cyberbrick.js`
-   [ ] T016 [P] [US1] 建立 CyberBrick 工具箱分類配置（核心、控制、LED、GPIO）in `media/toolbox/categories/cyberbrick_core.json`
-   [ ] T017 [US1] 實作 CyberBrick 硬體積木生成器（LED、GPIO、時序）in `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T018 [US1] 實作工具箱切換邏輯（根據 board.language 載入對應 toolbox）in `media/js/blocklyEdit.js`
-   [ ] T019 [US1] 擴展主板選單加入 CyberBrick 選項 in `media/js/blocklyEdit.js`
-   [ ] T020 [US1] 實作生成器切換邏輯（Arduino ↔ MicroPython）in `media/js/blocklyEdit.js`
-   [ ] T021 [US1] 新增 CyberBrick 積木的 i18n 訊息（EN + ZH-HANT 最低要求）in `media/locales/en/messages.js` 和 `media/locales/zh-hant/messages.js`
-   [ ] T022 [US1] 實作 loadToolbox 訊息處理（Extension → WebView）in `src/webview/messageHandler.ts`
-   [ ] T023 [US1] 實作 toolboxLoaded 訊息處理（WebView → Extension）in `src/webview/messageHandler.ts`

**Checkpoint**: User Story 1 完成 - 使用者可選擇 CyberBrick 並生成 MicroPython 程式碼

---

## Phase 4: User Story 2 - 一鍵上傳程式到 CyberBrick (Priority: P1)

**Goal**: 使用者點擊上傳按鈕即可將程式上傳到 CyberBrick，無需手動中斷

**Independent Test**: 連接 CyberBrick 硬體，編寫簡單程式後點擊上傳，確認程式成功寫入並執行

### Implementation for User Story 2

-   [ ] T024 [P] [US2] 實作 MicropythonUploader 服務基本架構 in `src/services/micropythonUploader.ts`
-   [ ] T025 [P] [US2] 實作 PlatformIO Python 環境偵測邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T026 [US2] 實作 mpremote 工具檢查與自動安裝邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T027 [US2] 實作連接埠偵測與 CyberBrick VID/PID 篩選邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T028 [US2] 實作 reset + soft-reset + upload + reset 完整上傳序列 in `src/services/micropythonUploader.ts`
-   [ ] T029 [US2] 實作 requestUpload 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T030 [US2] 實作 uploadProgress 與 uploadResult 訊息發送 in `src/webview/messageHandler.ts`
-   [ ] T031 [US2] 實作 WebView 上傳按鈕與進度顯示 UI in `media/js/blocklyEdit.js`
-   [ ] T032 [P] [US2] 實作 requestPortList 與 portListResponse 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T033 [US2] 實作連接埠選擇 UI（自動偵測 + 手動選擇）in `media/js/blocklyEdit.js`
-   [ ] T034 [P] [US2] 新增 MicropythonUploader 單元測試 in `src/test/micropythonUploader.test.ts`
-   [ ] T034a [US2] 實作上傳失敗錯誤處理與診斷訊息顯示（對應 NFR-004）in `src/services/micropythonUploader.ts`
-   [ ] T034b [US2] 實作 mpremote 安裝失敗錯誤處理與手動安裝指引（對應 NFR-003）in `src/services/micropythonUploader.ts`

**Checkpoint**: User Story 2 完成 - 使用者可一鍵上傳程式到 CyberBrick

---

## Phase 5: User Story 3 - 自動備份原有程式 (Priority: P2)

**Goal**: 首次上傳前自動備份 CyberBrick 中的原有程式

**Independent Test**: 首次上傳時確認備份檔案被建立在工作區的 `blockly/backups/` 目錄

### Implementation for User Story 3

-   [ ] T035 [P] [US3] 實作備份清單 manifest.json 管理邏輯 in `src/services/backupService.ts`
-   [ ] T036 [P] [US3] 實作裝置程式讀取邏輯（mpremote fs cat）in `src/services/micropythonUploader.ts`
-   [ ] T037 [US3] 實作 DeviceBackup 建立與儲存邏輯 in `src/services/backupService.ts`
-   [ ] T038 [US3] 整合首次上傳前的自動備份流程 in `src/services/micropythonUploader.ts`
-   [ ] T039 [US3] 實作備份內容比對（避免重複備份相同內容）in `src/services/backupService.ts`
-   [ ] T040 [US3] 實作 requestBackupList 與 backupListResponse 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T041 [US3] 實作 restoreBackup 與 restoreResult 訊息處理（還原到裝置）in `src/webview/messageHandler.ts`
-   [ ] T042 [US3] 實作備份清單 UI 與還原功能 in `media/js/blocklyEdit.js`
-   [ ] T043 [P] [US3] 新增 BackupService 單元測試 in `src/test/backupService.test.ts`

**Checkpoint**: User Story 3 完成 - 系統自動備份裝置原有程式

---

## Phase 6: User Story 4 - 主板切換時的工作區保護 (Priority: P2)

**Goal**: 切換主板時提示警告並自動備份當前工作區

**Independent Test**: 切換主板時確認出現警告對話框，確認後備份被建立且工作區被清空

### Implementation for User Story 4

-   [ ] T044 [P] [US4] 實作語言類型變更偵測邏輯（arduino ↔ micropython）in `media/js/blocklyEdit.js`
-   [ ] T045 [US4] 實作 boardSwitchWarning 訊息發送（當偵測到語言變更）in `src/webview/messageHandler.ts`
-   [ ] T046 [US4] 實作 boardSwitchConfirm 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T047 [US4] 實作 WorkspaceBackup 建立與儲存邏輯 in `src/services/backupService.ts`
-   [ ] T048 [US4] 實作主板切換確認對話框 UI in `media/js/blocklyEdit.js`
-   [ ] T049 [US4] 實作 boardSwitchComplete 訊息處理與工作區清空邏輯 in `src/webview/messageHandler.ts`
-   [ ] T050 [US4] 實作從工作區備份還原功能 in `src/services/backupService.ts`
-   [ ] T051 [US4] 更新備份清單 UI 支援工作區備份類型 in `media/js/blocklyEdit.js`

**Checkpoint**: User Story 4 完成 - 主板切換時自動保護工作區

---

## Phase 7: User Story 5 - WiFi 連線功能 (Priority: P3)

**Goal**: 使用者可使用 WiFi 積木讓 CyberBrick 連接無線網路

**Independent Test**: 使用 WiFi 連線積木連接網路後，確認連線狀態積木回傳成功

### Implementation for User Story 5

-   [ ] T052 [P] [US5] 建立 WiFi 相關積木定義（連線、斷線、狀態、取得 IP）in `media/blockly/blocks/cyberbrick.js`
-   [ ] T053 [US5] 實作 WiFi 積木的 MicroPython 生成器 in `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T054 [US5] 新增 WiFi 積木到 CyberBrick 工具箱 in `media/toolbox/categories/cyberbrick_wifi.json`
-   [ ] T055 [US5] 更新 CyberBrick 工具箱包含 WiFi 分類 in `media/toolbox/cyberbrick.json`
-   [ ] T056 [US5] 新增 WiFi 積木的 i18n 訊息 in `media/locales/en/messages.js` 和 `media/locales/zh-hant/messages.js`

**Checkpoint**: User Story 5 完成 - 使用者可使用 WiFi 功能

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨功能改進與文件更新

-   [ ] T057 [P] 補充其他語言的 i18n 訊息（至少 8 種語言）in `media/locales/*/messages.js`
-   [ ] T058 [P] 新增 UART 讀寫積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T059 [P] 新增類比讀取（ADC）積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T060 [P] 新增 PWM 輸出積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T061 更新 README.md 新增 CyberBrick 支援說明 in `README.md`
-   [ ] T062 更新 CHANGELOG.md 記錄新功能 in `CHANGELOG.md`
-   [ ] T063 執行 quickstart.md 驗證所有測試情境 in `specs/021-cyberbrick-micropython/quickstart.md`
-   [ ] T064 程式碼清理與重構（移除未使用的 import、統一命名風格）
-   [ ] T065 執行 npm run lint 確保程式碼品質
-   [ ] T066 執行 npm run validate:i18n 確保翻譯品質

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: No dependencies - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 User Story**
-   **User Stories (Phase 3-7)**: 全部依賴 Foundational 完成
    -   User Story 1 (P1) 可與 User Story 2 (P1) 平行進行
    -   User Story 3 (P2) 依賴 User Story 2 的上傳服務
    -   User Story 4 (P2) 可與 User Story 3 平行進行
    -   User Story 5 (P3) 可獨立進行
-   **Polish (Phase 8)**: 依賴所有 User Story 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 依賴 Foundational - 無其他 Story 依賴
-   **User Story 2 (P1)**: 依賴 Foundational - 無其他 Story 依賴
-   **User Story 3 (P2)**: 依賴 User Story 2 的 MicropythonUploader 服務
-   **User Story 4 (P2)**: 依賴 Foundational - 使用 BackupService（可與 US3 共用）
-   **User Story 5 (P3)**: 依賴 User Story 1 的積木架構 - 其餘獨立

### Within Each User Story

-   積木定義（blocks/）先於生成器（generators/）
-   服務層先於訊息處理
-   訊息處理先於 UI 實作
-   所有實作完成後才執行測試

### Parallel Opportunities

**Phase 1 (Setup)**:

-   T002, T003, T004 可平行執行

**Phase 2 (Foundational)**:

-   T006, T007, T008, T009, T010, T011, T012 可平行執行（所有基礎生成器）

**Phase 3 (US1)**:

-   T015, T016 可平行執行

**Phase 4 (US2)**:

-   T024, T025, T032, T034 可平行執行

**Phase 5 (US3)**:

-   T035, T036, T043 可平行執行

**Phase 6 (US4)**:

-   T044 可與其他 Story 的非依賴任務平行

**Phase 7 (US5)**:

-   T052 可與其他 Story 平行

**Phase 8 (Polish)**:

-   T057, T058, T059, T060 可平行執行

---

## Parallel Example: Phase 2 Foundational

```bash
# 所有基礎生成器可同時開發：
Task T006: "建立 MicroPython 生成器入口"
Task T007: "實作 MicroPython 變數積木生成器"
Task T008: "實作 MicroPython 邏輯積木生成器"
Task T009: "實作 MicroPython 迴圈積木生成器"
Task T010: "實作 MicroPython 數學積木生成器"
Task T011: "實作 MicroPython 文字積木生成器"
Task T012: "實作 MicroPython 函數積木生成器"
```

---

## Parallel Example: User Story 1 + User Story 2

```bash
# P1 優先級的兩個 Story 可平行進行：

# Developer A: User Story 1
Task T015: "建立 CyberBrick 專用積木定義"
Task T017: "實作 CyberBrick 硬體積木生成器"
Task T018: "實作工具箱切換邏輯"

# Developer B: User Story 2
Task T024: "實作 MicropythonUploader 服務基本架構"
Task T025: "實作 PlatformIO Python 環境偵測邏輯"
Task T027: "實作連接埠偵測與 CyberBrick VID/PID 篩選邏輯"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (**CRITICAL** - 阻塞所有 Story)
3. 完成 Phase 3: User Story 1（主板選擇與程式碼生成）
4. 完成 Phase 4: User Story 2（一鍵上傳）
5. **STOP and VALIDATE**: 測試 MVP - 使用者可選擇 CyberBrick、編寫積木、上傳執行
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基礎架構就緒
2. User Story 1 → 測試主板切換與程式碼生成 → **可 Demo**
3. User Story 2 → 測試上傳功能 → **完整 MVP!**
4. User Story 3 → 測試自動備份 → 增強功能
5. User Story 4 → 測試工作區保護 → 增強功能
6. User Story 5 → 測試 WiFi 功能 → 完整功能
7. Polish → 品質提升

### Parallel Team Strategy

With 2 developers:

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
    - Developer A: User Story 1 → User Story 4
    - Developer B: User Story 2 → User Story 3
3. 兩人同步完成後共同處理 User Story 5 和 Polish

---

## Notes

-   [P] tasks = 不同檔案、無依賴關係
-   [Story] 標籤將任務對應到特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成和測試
-   每個任務或邏輯群組完成後執行 commit
-   在任何 checkpoint 停下驗證 Story 是否獨立運作
-   避免：模糊任務、同一檔案衝突、破壞獨立性的跨 Story 依賴

---

## Task Summary

| Phase                 | 任務數量 | 平行任務 |
| --------------------- | -------- | -------- |
| Phase 1: Setup        | 4        | 3        |
| Phase 2: Foundational | 10       | 7        |
| Phase 3: User Story 1 | 9        | 2        |
| Phase 4: User Story 2 | 11       | 4        |
| Phase 5: User Story 3 | 9        | 3        |
| Phase 6: User Story 4 | 8        | 1        |
| Phase 7: User Story 5 | 5        | 1        |
| Phase 8: Polish       | 10       | 4        |
| **Total**             | **66**   | **25**   |
