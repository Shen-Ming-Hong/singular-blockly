# Tasks: CyberBrick MicroPython 積木支援

**Input**: Design documents from `/specs/021-cyberbrick-micropython/`  
**Prerequisites**: plan.md ✅, spec.md ✅ (Updated 2025-12-30), research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

---

## Format: `[ID] [P?] [Story?] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5, US6)
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

**⚠️ 實作順序**: 先確保 UI/UX 互動正確（工具箱切換、上傳按鈕顯示/隱藏），再實作程式碼生成功能

### Phase 3a: UI/UX 互動（優先）

-   [ ] T015a [US1] 實作主板選單加入 CyberBrick 選項（只加選項，不含完整切換邏輯）in `media/js/blocklyEdit.js`
-   [ ] T015b [US1] 實作 CyberBrick 專用工具箱載入邏輯（參考 `updateToolboxForBoard` 函數）in `media/js/blocklyEdit.js`
-   [ ] T015c [US1] 實作 Arduino 積木隱藏、MicroPython 積木顯示的過濾邏輯 in `media/js/blocklyEdit.js`
-   [ ] T015d [US1] 新增上傳按鈕 UI（與現有控制區按鈕樣式一致），僅在 CyberBrick 時顯示 in `media/html/blocklyEdit.html` 和 `media/css/blocklyEdit.css`
-   [ ] T015e [P] [US1] 新增 CyberBrick 工具箱分類的 i18n 翻譯鍵（使用 `CATEGORY_CYBERBRICK_*` 格式）in `media/locales/en/messages.js` 和 `media/locales/zh-hant/messages.js`

**UI Checkpoint**: 選擇 CyberBrick 時工具箱正確切換，上傳按鈕正確顯示/隱藏

### Phase 3b: 積木定義與程式碼生成

-   [ ] T016 [P] [US1] 建立 CyberBrick 專用積木定義（LED、GPIO、時序），使用 `CYBERBRICK_*` 翻譯鍵 in `media/blockly/blocks/cyberbrick.js`
-   [ ] T017 [P] [US1] 建立 CyberBrick 工具箱分類配置（核心、控制、LED、GPIO）in `media/toolbox/categories/cyberbrick_core.json`
-   [ ] T018 [US1] 實作 CyberBrick 硬體積木生成器（LED、GPIO、時序）in `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T019 [US1] 實作生成器切換邏輯（Arduino ↔ MicroPython）in `media/js/blocklyEdit.js`
-   [ ] T020 [US1] 實作 loadToolbox 訊息處理（Extension → WebView）in `src/webview/messageHandler.ts`
-   [ ] T021 [US1] 實作 toolboxLoaded 訊息處理（WebView → Extension）in `src/webview/messageHandler.ts`

### Phase 3c: 日誌與完善

-   [ ] T022 [US1] 新增所有 CyberBrick 相關日誌（使用 `[blockly]` 標籤），包含主板切換、工具箱更新事件 in `media/js/blocklyEdit.js`

**Checkpoint**: User Story 1 完成 - 使用者可選擇 CyberBrick 並生成 MicroPython 程式碼

---

## Phase 4: User Story 2 - 一鍵上傳程式到 CyberBrick (Priority: P1)

**Goal**: 使用者點擊上傳按鈕即可將程式上傳到 CyberBrick，無需手動中斷

**Independent Test**: 連接 CyberBrick 硬體，編寫簡單程式後點擊上傳，確認程式成功寫入並執行

**⚠️ 實作順序**: UI 互動已在 Phase 3a 完成，本階段專注於上傳功能內部邏輯

### Implementation for User Story 2

-   [ ] T023 [P] [US2] 實作 MicropythonUploader 服務基本架構 in `src/services/micropythonUploader.ts`
-   [ ] T024 [P] [US2] 實作 PlatformIO Python 環境偵測邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T025 [US2] 實作 mpremote 工具檢查與自動安裝邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T026 [US2] 實作連接埠偵測與 CyberBrick VID/PID 篩選邏輯 in `src/services/micropythonUploader.ts`
-   [ ] T027 [US2] 實作 reset + soft-reset + upload + reset 完整上傳序列 in `src/services/micropythonUploader.ts`
-   [ ] T028 [US2] 實作 requestUpload 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T029 [US2] 實作 uploadProgress 與 uploadResult 訊息發送 in `src/webview/messageHandler.ts`
-   [ ] T030 [US2] 實作上傳按鈕點擊處理與進度顯示 UI（按鈕已在 Phase 3a 建立）in `media/js/blocklyEdit.js`
-   [ ] T031 [P] [US2] 實作 requestPortList 與 portListResponse 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T032 [US2] 實作連接埠選擇 UI（自動偵測 + 手動選擇）in `media/js/blocklyEdit.js`
-   [ ] T033 [P] [US2] 新增 MicropythonUploader 單元測試 in `src/test/micropythonUploader.test.ts`
-   [ ] T033a [US2] 實作上傳失敗錯誤處理與診斷訊息顯示（對應 NFR-004）in `src/services/micropythonUploader.ts`
-   [ ] T033b [US2] 實作 mpremote 安裝失敗錯誤處理與手動安裝指引（對應 NFR-003）in `src/services/micropythonUploader.ts`
-   [ ] T033c [US2] 新增上傳相關日誌（使用 `[blockly]` 標籤），包含上傳開始/進度/完成/失敗 in `src/services/micropythonUploader.ts`

**Checkpoint**: User Story 2 完成 - 使用者可一鍵上傳程式到 CyberBrick

---

## Phase 5: User Story 3 - 自動備份原有程式 (Priority: P2)

**Goal**: 首次上傳前自動備份 CyberBrick 中的原有程式

**Independent Test**: 首次上傳時確認備份檔案被建立在工作區的 `blockly/backups/` 目錄

### Implementation for User Story 3

-   [ ] T034 [P] [US3] 實作備份清單 manifest.json 管理邏輯 in `src/services/backupService.ts`
-   [ ] T035 [P] [US3] 實作裝置程式讀取邏輯（mpremote fs cat）in `src/services/micropythonUploader.ts`
-   [ ] T036 [US3] 實作 DeviceBackup 建立與儲存邏輯 in `src/services/backupService.ts`
-   [ ] T037 [US3] 整合首次上傳前的自動備份流程 in `src/services/micropythonUploader.ts`
-   [ ] T038 [US3] 實作備份內容比對（避免重複備份相同內容）in `src/services/backupService.ts`
-   [ ] T039 [US3] 實作 requestBackupList 與 backupListResponse 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T040 [US3] 實作 restoreBackup 與 restoreResult 訊息處理（還原到裝置）in `src/webview/messageHandler.ts`
-   [ ] T041 [US3] 實作備份清單 UI 與還原功能 in `media/js/blocklyEdit.js`
-   [ ] T042 [P] [US3] 新增 BackupService 單元測試 in `src/test/backupService.test.ts`
-   [ ] T042a [US3] 新增備份相關日誌（使用 `[blockly]` 標籤）in `src/services/backupService.ts`

**Checkpoint**: User Story 3 完成 - 系統自動備份裝置原有程式

---

## Phase 6: User Story 4 - 主板切換時的工作區保護 (Priority: P2)

**Goal**: 切換主板時使用現有 Ctrl+S 備份機制自動備份，然後清空工作區並切換工具箱

**Independent Test**: 切換主板時確認工作區被自動備份（backup_YYYYMMDD_HHMMSS 格式），工作區清空後工具箱正確切換

### Implementation for User Story 4

-   [ ] T043 [P] [US4] 實作語言類型變更偵測邏輯（arduino ↔ micropython）in `media/js/blocklyEdit.js`
-   [ ] T044 [US4] 實作主板切換時自動呼叫 `quickSaveManager.performQuickSave()` in `media/js/blocklyEdit.js`
-   [ ] T045 [US4] 實作 boardSwitchWarning 訊息發送（當偵測到語言變更）in `src/webview/messageHandler.ts`
-   [ ] T046 [US4] 實作 boardSwitchConfirm 訊息處理 in `src/webview/messageHandler.ts`
-   [ ] T047 [US4] 實作主板切換確認對話框 UI in `media/js/blocklyEdit.js`
-   [ ] T048 [US4] 實作 boardSwitchComplete 訊息處理與工作區清空邏輯 in `src/webview/messageHandler.ts`
-   [ ] T049 [US4] 實作工具箱切換邏輯（參考 `updateToolboxForBoard` 的過濾模式）in `media/js/blocklyEdit.js`
-   [ ] T050 [US4] 新增主板切換相關日誌（使用 `[blockly]` 標籤），包含備份觸發、工具箱更新 in `media/js/blocklyEdit.js`

**Checkpoint**: User Story 4 完成 - 主板切換時自動保護工作區並正確切換工具箱

---

## Phase 6a: User Story 6 - CyberBrick 主板選擇時自動清理 PlatformIO 設定 (Priority: P1)

**Goal**: 選擇 CyberBrick 時自動刪除 `platformio.ini`，避免與 MicroPython 流程衝突

**Independent Test**: 選擇 CyberBrick 主板後，確認 `platformio.ini` 被刪除（若存在）

### Implementation for User Story 6

-   [ ] T051 [US6] 實作 platformio.ini 檔案存在檢查邏輯 in `src/webview/messageHandler.ts`
-   [ ] T052 [US6] 實作 platformio.ini 自動刪除邏輯（選擇 CyberBrick 時觸發）in `src/webview/messageHandler.ts`
-   [ ] T053 [US6] 實作 deletePlatformioConfig 訊息處理（WebView → Extension）in `src/webview/messageHandler.ts`
-   [ ] T054 [US6] 新增 platformio.ini 刪除相關日誌（使用 `[blockly]` 標籤）in `src/webview/messageHandler.ts`

**Checkpoint**: User Story 6 完成 - 選擇 CyberBrick 時自動清理 PlatformIO 設定

---

## Phase 7: User Story 5 - WiFi 連線功能 (Priority: P3)

**Goal**: 使用者可使用 WiFi 積木讓 CyberBrick 連接無線網路

**Independent Test**: 使用 WiFi 連線積木連接網路後，確認連線狀態積木回傳成功

### Implementation for User Story 5

-   [ ] T055 [P] [US5] 建立 WiFi 相關積木定義（連線、斷線、狀態、取得 IP），使用 `CYBERBRICK_WIFI_*` 翻譯鍵 in `media/blockly/blocks/cyberbrick.js`
-   [ ] T056 [US5] 實作 WiFi 積木的 MicroPython 生成器 in `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T057 [US5] 新增 WiFi 積木到 CyberBrick 工具箱 in `media/toolbox/categories/cyberbrick_wifi.json`
-   [ ] T058 [US5] 更新 CyberBrick 工具箱包含 WiFi 分類 in `media/toolbox/cyberbrick.json`
-   [ ] T059 [US5] 新增 WiFi 積木的 i18n 訊息 in `media/locales/en/messages.js` 和 `media/locales/zh-hant/messages.js`

**Checkpoint**: User Story 5 完成 - 使用者可使用 WiFi 功能

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨功能改進與文件更新

-   [ ] T060 [P] 補充其他語言的 i18n 訊息（至少 8 種語言）in `media/locales/*/messages.js`
-   [ ] T061 [P] 新增 UART 讀寫積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T062 [P] 新增類比讀取（ADC）積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T063 [P] 新增 PWM 輸出積木定義與生成器 in `media/blockly/blocks/cyberbrick.js` 和 `media/blockly/generators/micropython/cyberbrick.js`
-   [ ] T064 更新 README.md 新增 CyberBrick 支援說明 in `README.md`
-   [ ] T065 更新 CHANGELOG.md 記錄新功能 in `CHANGELOG.md`
-   [ ] T066 執行 quickstart.md 驗證所有測試情境 in `specs/021-cyberbrick-micropython/quickstart.md`
-   [ ] T067 程式碼清理與重構（移除未使用的 import、統一命名風格）
-   [ ] T068 執行 npm run lint 確保程式碼品質
-   [ ] T069 執行 npm run validate:i18n 確保翻譯品質
-   [ ] T070 驗證所有 `[blockly]` 標籤日誌正確輸出

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: No dependencies - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 User Story**
-   **User Stories (Phase 3-7)**: 全部依賴 Foundational 完成
    -   User Story 1 (P1) 必須先完成 Phase 3a (UI/UX) 才能開始 Phase 3b (程式碼生成)
    -   User Story 2 (P1) 依賴 User Story 1 的 Phase 3a（上傳按鈕 UI）
    -   User Story 3 (P2) 依賴 User Story 2 的上傳服務
    -   User Story 4 (P2) 可與 User Story 3 平行進行
    -   User Story 5 (P3) 可獨立進行
    -   User Story 6 (P1) 可與 User Story 1 的 Phase 3b 平行進行
-   **Polish (Phase 8)**: 依賴所有 User Story 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 依賴 Foundational - **Phase 3a (UI/UX) 必須先完成**
-   **User Story 2 (P1)**: 依賴 User Story 1 Phase 3a（上傳按鈕 UI 已建立）
-   **User Story 3 (P2)**: 依賴 User Story 2 的 MicropythonUploader 服務
-   **User Story 4 (P2)**: 依賴 Foundational - 使用現有 `quickSaveManager`
-   **User Story 5 (P3)**: 依賴 User Story 1 的積木架構 - 其餘獨立
-   **User Story 6 (P1)**: 依賴 Foundational - 可與 US1 Phase 3b 平行

### Within Each User Story

-   **UI/UX 優先**：先確認互動正確，再實作功能邏輯
-   積木定義（blocks/）先於生成器（generators/）
-   服務層先於訊息處理
-   訊息處理先於 UI 實作
-   所有實作完成後才執行測試
-   所有日誌必須使用 `[blockly]` 標籤

### Parallel Opportunities

**Phase 1 (Setup)**:

-   T002, T003, T004 可平行執行

**Phase 2 (Foundational)**:

-   T006, T007, T008, T009, T010, T011, T012 可平行執行（所有基礎生成器）

**Phase 3 (US1)**:

-   Phase 3a 完成後，T016, T017 可平行執行
-   Phase 3b 可與 Phase 6a (US6) 平行執行

**Phase 4 (US2)**:

-   T023, T024, T031, T033 可平行執行

**Phase 5 (US3)**:

-   T034, T035, T042 可平行執行

**Phase 6 (US4)**:

-   T043 可與其他 Story 的非依賴任務平行

**Phase 6a (US6)**:

-   可與 Phase 3b 平行執行

**Phase 7 (US5)**:

-   T055 可與其他 Story 平行

**Phase 8 (Polish)**:

-   T060, T061, T062, T063 可平行執行

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

## Parallel Example: User Story 1 UI/UX 優先

```bash
# Phase 3a (UI/UX) 必須先完成：
Task T015a: "實作主板選單加入 CyberBrick 選項"
Task T015b: "實作 CyberBrick 專用工具箱載入邏輯"
Task T015c: "實作 Arduino 積木隱藏、MicroPython 積木顯示"
Task T015d: "新增上傳按鈕 UI（與現有按鈕樣式一致）"

# UI Checkpoint 確認後，才能開始 Phase 3b：
Task T016: "建立 CyberBrick 專用積木定義"
Task T017: "建立 CyberBrick 工具箱分類配置"
Task T018: "實作 CyberBrick 硬體積木生成器"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 + User Story 6)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (**CRITICAL** - 阻塞所有 Story)
3. 完成 Phase 3a: User Story 1 UI/UX（主板選擇、工具箱切換、上傳按鈕顯示）
4. **UI CHECKPOINT**: 驗證 UI 互動正確
5. 平行進行：
    - Phase 3b: User Story 1 程式碼生成
    - Phase 6a: User Story 6 platformio.ini 清理
6. 完成 Phase 4: User Story 2（上傳功能內部邏輯）
7. **STOP and VALIDATE**: 測試 MVP - 使用者可選擇 CyberBrick、編寫積木、上傳執行
8. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 基礎架構就緒
2. User Story 1 Phase 3a → 測試 UI 互動 → **可 Demo UI**
3. User Story 1 Phase 3b + User Story 6 → 測試程式碼生成 → **可 Demo 程式碼**
4. User Story 2 → 測試上傳功能 → **完整 MVP!**
5. User Story 3 → 測試自動備份 → 增強功能
6. User Story 4 → 測試工作區保護 → 增強功能
7. User Story 5 → 測試 WiFi 功能 → 完整功能
8. Polish → 品質提升

### Parallel Team Strategy

With 2 developers:

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
    - Developer A: User Story 1 Phase 3a (UI/UX) → Phase 3b (程式碼生成)
    - Developer B: 等待 Phase 3a 完成後 → User Story 2 + User Story 6
3. 兩人同步完成後：
    - Developer A: User Story 4
    - Developer B: User Story 3
4. 共同處理 User Story 5 和 Polish

---

## Notes

-   [P] tasks = 不同檔案、無依賴關係
-   [Story] 標籤將任務對應到特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成和測試
-   每個任務或邏輯群組完成後執行 commit
-   在任何 checkpoint 停下驗證 Story 是否獨立運作
-   避免：模糊任務、同一檔案衝突、破壞獨立性的跨 Story 依賴
-   **新增規則**：
    -   UI/UX 互動必須先驗證正確，才能開始功能邏輯實作
    -   所有日誌必須使用 `[blockly]` 標籤
    -   所有翻譯鍵必須使用 `CATEGORY_CYBERBRICK_*` 或 `CYBERBRICK_*` 格式
    -   上傳按鈕必須與現有控制區按鈕樣式一致

---

## Task Summary

| Phase                  | 任務數量 | 平行任務 |
| ---------------------- | -------- | -------- |
| Phase 1: Setup         | 4        | 3        |
| Phase 2: Foundational  | 11       | 8        |
| Phase 3a: US1 UI/UX    | 5        | 1        |
| Phase 3b: US1 程式碼   | 7        | 2        |
| Phase 4: User Story 2  | 14       | 4        |
| Phase 5: User Story 3  | 10       | 3        |
| Phase 6: User Story 4  | 8        | 1        |
| Phase 6a: User Story 6 | 4        | 0        |
| Phase 7: User Story 5  | 5        | 1        |
| Phase 8: Polish        | 11       | 4        |
| **Total**              | **79**   | **27**   |
