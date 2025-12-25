# Tasks: 修復預覽模式開發板配置顯示錯誤

**Input**: Design documents from `/specs/018-fix-preview-board-config/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: 未明確要求 - 本功能以手動 WebView 測試為主（符合 constitution 例外條款）

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
-   Include exact file paths in descriptions

## Path Conventions

-   **Single project**: VSCode Extension structure
-   **Source**: `src/` (TypeScript), `media/` (WebView assets)
-   **Tests**: `src/test/` (Mocha tests)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 確認開發環境和理解現有程式碼

-   [ ] T001 確認開發環境就緒，執行 `npm run compile` 確保無編譯錯誤
-   [ ] T002 [P] 檢視現有 board 映射邏輯位於 media/blockly/blocks/board_configs.js
-   [ ] T003 [P] 檢視現有預覽載入流程位於 src/webview/webviewManager.ts 的 loadBackupContent() 方法

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 建立 board 映射常數和類型定義，為所有 User Story 提供基礎

**⚠️ CRITICAL**: 此階段完成後，各 User Story 才能獨立實作

-   [ ] T004 在 src/webview/webviewManager.ts 新增 BOARD_MAPPING 常數定義（對應 data-model.md 中的 BoardMapping）
-   [ ] T005 [P] 在 src/webview/webviewManager.ts 新增 mapBoardValue() 輔助函數，處理備份檔案 board 值到 BOARD_CONFIGS key 的映射
-   [ ] T006 [P] 在 src/types/previewMessages.ts 新增 PreviewMessage 類型定義（SetBoardMessage interface），對應 contracts/webview-messages.md

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - ESP32 備份檔案預覽顯示正確腳位 (Priority: P1) 🎯 MVP

**Goal**: 修復核心問題 - 預覽模式載入 ESP32 備份時，腳位下拉選單應顯示 ESP32 GPIO 格式

**Independent Test**: 建立 ESP32 專案備份，開啟預覽，確認數位輸出積木顯示 GPIO0, GPIO2 等腳位

### Implementation for User Story 1

-   [ ] T007 [US1] 修改 src/webview/webviewManager.ts 的 loadBackupContent() 方法，讀取 backupData.board 並使用 mapBoardValue() 映射
-   [ ] T008 [US1] 在 loadBackupContent() 中，於發送 loadWorkspaceState 訊息前先發送 setBoard 訊息（依照 contracts/webview-messages.md 順序）
-   [ ] T009 [US1] 處理 board 缺失或無效的情況：預設使用 'uno' 並記錄警告日誌
-   [ ] T010 [US1] 修改 media/js/blocklyPreview.js，新增 'setBoard' case 處理，呼叫 window.setCurrentBoard(message.board)
-   [ ] T011 [US1] 在 blocklyPreview.js 的 setBoard 處理中，若收到 warning 訊息則呼叫 showBoardWarning() 顯示警告
-   [ ] T012 [P] [US1] 在 media/js/blocklyPreview.js 新增 showBoardWarning(message) 函數，於預覽視窗顯示警告提示（警告訊息由 Extension 端透過 localeService 產生並傳送，WebView 端直接顯示）
-   [ ] T013 [US1] 手動測試：建立 ESP32 專案備份並開啟預覽，驗證 GPIO 腳位正確顯示

**Checkpoint**: ESP32 備份檔案預覽時，腳位應正確顯示為 GPIO 格式

---

## Phase 4: User Story 2 - ESP32 WiFi/MQTT 積木正確顯示於預覽 (Priority: P1)

**Goal**: 確保 ESP32 專屬積木（WiFi/MQTT）在預覽模式正確顯示，而非「未知積木」

**Independent Test**: 建立包含 ESP32 WiFi 連線積木的專案備份，開啟預覽，確認 WiFi 積木正確顯示

### Implementation for User Story 2

-   [ ] T014 [US2] 修改 media/html/blocklyPreview.html，新增 ESP32 WiFi/MQTT 積木定義腳本載入 `<script src="{esp32WifiMqttBlocksUri}"></script>`
-   [ ] T015 [US2] 修改 src/webview/webviewManager.ts 的 getPreviewContent() 方法，新增 esp32WifiMqttBlocksUri 的 URI 生成和替換邏輯
-   [ ] T016 [US2] 確保 ESP32 積木的 generator 檔案也被載入（如需要），檢查 media/blockly/generators/arduino/esp32-wifi-mqtt.js
-   [ ] T017 [US2] 手動測試：建立包含 WiFi 連線積木和 MQTT 積木的備份，開啟預覽，驗證積木正確顯示

**Checkpoint**: ESP32 WiFi/MQTT 積木應在預覽模式正確顯示，無「未知積木」警告

---

## Phase 5: User Story 3 - 不同開發板備份檔案預覽正確切換 (Priority: P2)

**Goal**: 確保連續開啟不同開發板類型的備份時，各預覽視窗獨立顯示正確腳位

**Independent Test**: 依序開啟 ESP32 備份、Arduino Uno 備份，確認每個預覽視窗的腳位配置正確

### Implementation for User Story 3

-   [ ] T018 [US3] 驗證 blocklyPreview.js 中的 setCurrentBoard() 呼叫不會影響其他預覽視窗（WebView 隔離性）
-   [ ] T019 [US3] 手動測試：依序開啟 ESP32 備份預覽、Arduino Uno 備份預覽，確認各自腳位正確
-   [ ] T020 [US3] 手動測試：同時開啟多個不同開發板的預覽視窗，確認各視窗獨立正確

**Checkpoint**: 所有支援的開發板類型（Uno/Nano/Mega/ESP32/Super Mini）備份檔案均能正確預覽

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 程式碼品質、文件更新和最終驗證

-   [ ] T021 [P] 執行 `npm run lint` 確保無 lint 錯誤
-   [ ] T022 [P] 更新 CHANGELOG.md 記錄本次修復（Bug Fixes 區塊）
-   [ ] T023 執行 quickstart.md 中的所有驗證步驟，確認完整功能運作
-   [ ] T024 [P] 檢查向後相容性：開啟舊版無 board 欄位的備份，確認使用預設 Arduino Uno 配置
-   [ ] T025 [P] 驗證效能：確認預覽視窗載入時間增加 < 500ms（SC-003 成功指標）

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻擋所有 User Story**
-   **User Stories (Phase 3-5)**: 全部依賴 Foundational 完成
    -   US1 和 US2 優先級相同 (P1)，可並行開發
    -   US3 (P2) 可在 US1/US2 完成後進行，或與它們並行
-   **Polish (Phase 6)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: 核心修復 - 需 Phase 2 完成後開始
-   **User Story 2 (P1)**: 積木載入修復 - 可與 US1 並行（修改不同檔案）
-   **User Story 3 (P2)**: 整合驗證 - 建議在 US1/US2 完成後進行

### Within Each User Story

-   Extension 端修改優先於 WebView 端修改
-   訊息發送邏輯優先於訊息處理邏輯（T008 → T010 有測試依賴）
-   核心功能優先於警告顯示
-   手動測試在該 Story 實作完成後進行

### Parallel Opportunities

-   T002, T003 可並行（閱讀不同檔案）
-   T005, T006 可並行（新增不同功能）
-   T012 與 T011 可並行（警告顯示功能，不同函數）
-   US1 (T007-T013) 和 US2 (T014-T017) 大部分可並行（注意：T010 需等待 T008 完成才能測試）
-   T021, T022, T024, T025 可並行（獨立驗證任務）

---

## Parallel Example: User Story 1 & 2

```bash
# US1 和 US2 可以並行開發 (不同檔案)：

# 開發者 A - User Story 1:
# T007-T009: 修改 webviewManager.ts (Extension 端)
# T010-T012: 修改 blocklyPreview.js (WebView 端)

# 開發者 B - User Story 2:
# T014: 修改 blocklyPreview.html (HTML)
# T015: 修改 webviewManager.ts getPreviewContent() (不同方法)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup ✓
2. Complete Phase 2: Foundational (CRITICAL) ✓
3. Complete Phase 3: User Story 1 ✓
4. **STOP and VALIDATE**: 手動測試 ESP32 備份預覽腳位顯示
5. 此時核心問題已修復，可部署/Demo

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. User Story 1 → ESP32 腳位顯示修復 → 測試 → **MVP 完成！**
3. User Story 2 → WiFi/MQTT 積木顯示 → 測試 → 擴展功能
4. User Story 3 → 多開發板切換 → 測試 → 完整功能
5. Polish → 文件/品質 → 發布就緒

### Single Developer Strategy

建議執行順序：

1. Phase 1 + Phase 2 (T001-T006)
2. Phase 3 完整 (T007-T013) - MVP
3. Phase 4 完整 (T014-T017)
4. Phase 5 完整 (T018-T020)
5. Phase 6 完整 (T021-T025)

---

## Notes

-   **[P] tasks** = 修改不同檔案，無依賴關係
-   **[Story] label** 用於追蹤任務所屬 User Story
-   每個 User Story 應可獨立完成和測試
-   手動 WebView 測試是本功能的主要驗證方式（符合 constitution 例外條款）
-   完成每個任務或邏輯群組後進行 commit
-   任何 checkpoint 都可以暫停驗證 Story 獨立性
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 依賴
