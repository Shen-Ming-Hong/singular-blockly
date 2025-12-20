# Tasks: Ctrl+S 快速備份快捷鍵

**Input**: Design documents from `/specs/017-ctrl-s-quick-backup/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: 本功能根據 plan.md 採用手動 WebView 測試，不包含自動化測試任務（符合 UI 測試例外條款）。

**Organization**: 任務按 User Story 分組，每個 Story 可獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可並行執行（不同檔案、無依賴）
-   **[Story]**: 所屬 User Story（US1, US2, US3）
-   包含精確檔案路徑

## Path Conventions

-   **Extension 程式碼**: `src/`
-   **WebView 資源**: `media/`
-   **i18n 訊息**: `media/locales/{lang}/messages.js`

---

## Phase 1: Setup（基礎設施）

**Purpose**: Toast 通知系統和快速備份核心架構

-   [x] T001 建立 Toast 通知 CSS 樣式（.toast, .visible, .success, .warning, .error）於 `media/css/blocklyEdit.css`
-   [x] T002 [P] 建立 `toast` 物件（show, hide 方法，含 ARIA 屬性 role="status" 和 aria-live="polite"）於 `media/js/blocklyEdit.js`
-   [x] T003 [P] 建立 `quickBackup` 物件骨架（lastSaveTime, COOLDOWN_MS, init, canSave, recordSave）於 `media/js/blocklyEdit.js`

---

## Phase 2: Foundational（阻塞性前置作業）

**Purpose**: i18n 訊息鍵新增，所有 User Story 依賴此階段

**⚠️ 關鍵**: 此階段完成前，任何 User Story 都無法正確顯示 Toast 訊息

-   [x] T004 新增 3 個 i18n 鍵到 `media/locales/en/messages.js`（BACKUP_QUICK_SAVE_SUCCESS, BACKUP_QUICK_SAVE_EMPTY, BACKUP_QUICK_SAVE_COOLDOWN）
-   [x] T005 [P] 新增 3 個 i18n 鍵到 `media/locales/zh-hant/messages.js`
-   [x] T006 [P] 新增 3 個 i18n 鍵到 `media/locales/ja/messages.js`
-   [x] T007 [P] 新增 3 個 i18n 鍵到 `media/locales/ko/messages.js`
-   [x] T008 [P] 新增 3 個 i18n 鍵到 `media/locales/es/messages.js`
-   [x] T009 [P] 新增 3 個 i18n 鍵到 `media/locales/pt-br/messages.js`
-   [x] T010 [P] 新增 3 個 i18n 鍵到 `media/locales/fr/messages.js`
-   [x] T011 [P] 新增 3 個 i18n 鍵到 `media/locales/de/messages.js`
-   [x] T012 [P] 新增 3 個 i18n 鍵到 `media/locales/it/messages.js`
-   [x] T013 [P] 新增 3 個 i18n 鍵到 `media/locales/ru/messages.js`
-   [x] T014 [P] 新增 3 個 i18n 鍵到 `media/locales/pl/messages.js`
-   [x] T015 [P] 新增 3 個 i18n 鍵到 `media/locales/hu/messages.js`
-   [x] T016 [P] 新增 3 個 i18n 鍵到 `media/locales/tr/messages.js`
-   [x] T017 [P] 新增 3 個 i18n 鍵到 `media/locales/bg/messages.js`
-   [x] T018 [P] 新增 3 個 i18n 鍵到 `media/locales/cs/messages.js`

**Checkpoint**: i18n 完成 - User Story 實作可開始

---

## Phase 3: User Story 1 - 快速備份工作區 (Priority: P1) 🎯 MVP

**Goal**: 使用者按下 Ctrl+S/Cmd+S 成功建立備份並看到成功 Toast 通知

**Independent Test**: 在積木編輯區放置一個積木後按下 Ctrl+S，預期看到綠色 Toast 通知「備份已儲存：backup_YYYYMMDD_HHMMSS」

### Implementation for User Story 1

-   [x] T019 [US1] 實作 `quickBackup.generateBackupName()` 方法（backup_YYYYMMDD_HHMMSS 格式）於 `media/js/blocklyEdit.js`
-   [x] T020 [US1] 實作 `quickBackup.init()` 鍵盤事件監聽（Ctrl+S 和 Cmd+S，含 preventDefault）於 `media/js/blocklyEdit.js`
-   [x] T021 [US1] 實作 `quickBackup.performQuickSave()` 核心邏輯（發送 createBackup 訊息、顯示成功 Toast）於 `media/js/blocklyEdit.js`
-   [x] T022 [US1] 在 `initBlocklyEditor()` 中呼叫 `quickBackup.init()` 完成初始化於 `media/js/blocklyEdit.js`
-   [x] T023 [US1] 新增 console.log 日誌記錄快速備份操作於 `media/js/blocklyEdit.js`

**Checkpoint**: User Story 1 完成 - 可獨立測試基本備份功能

---

## Phase 4: User Story 2 - 空工作區保護 (Priority: P2)

**Goal**: 工作區為空時，顯示警告 Toast 並跳過備份

**Independent Test**: 開啟空的 Blockly 工作區後按下 Ctrl+S，預期看到橙色警告 Toast「工作區為空，不需要備份」

### Implementation for User Story 2

-   [x] T024 [US2] 在 `quickBackup.performQuickSave()` 新增空工作區檢查邏輯於 `media/js/blocklyEdit.js`
-   [x] T025 [US2] 空工作區時呼叫 `toast.show()` 顯示 BACKUP_QUICK_SAVE_EMPTY 警告訊息於 `media/js/blocklyEdit.js`

**Checkpoint**: User Story 2 完成 - 空工作區保護機制可獨立驗證

---

## Phase 5: User Story 3 - 防止重複備份（節流機制）(Priority: P2)

**Goal**: 3 秒內重複按下 Ctrl+S 時，顯示冷卻警告並阻止備份

**Independent Test**: 連續快速按下 Ctrl+S 兩次，第一次成功，第二次顯示「請稍候，上次備份剛完成」

### Implementation for User Story 3

-   [x] T026 [US3] 實作 `quickBackup.canSave()` 節流檢查方法於 `media/js/blocklyEdit.js`
-   [x] T027 [US3] 實作 `quickBackup.recordSave()` 更新時間戳方法於 `media/js/blocklyEdit.js`
-   [x] T028 [US3] 在 `quickBackup.performQuickSave()` 開頭新增節流檢查邏輯於 `media/js/blocklyEdit.js`
-   [x] T029 [US3] 節流觸發時呼叫 `toast.show()` 顯示 BACKUP_QUICK_SAVE_COOLDOWN 警告訊息於 `media/js/blocklyEdit.js`
-   [x] T030 [US3] 備份成功後呼叫 `quickBackup.recordSave()` 更新狀態於 `media/js/blocklyEdit.js`

**Checkpoint**: User Story 3 完成 - 節流機制可獨立驗證

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨 Story 優化和驗證

-   [x] T031 [P] 驗證深色主題下 Toast 樣式正確顯示於 `media/css/blocklyEdit.css`
-   [x] T032 [P] 執行 `npm run validate:i18n` 確認翻譯格式正確（包含 `{0}` 佔位符在 BACKUP_QUICK_SAVE_SUCCESS 中正確替換）
-   [x] T033 驗證 Ctrl+S 已正確攔截瀏覽器預設行為（確認「儲存網頁」對話框不會出現）
-   [x] T034 執行 quickstart.md 完整測試檢查清單驗證所有功能

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 User Stories**
-   **User Stories (Phase 3-5)**: 全部依賴 Foundational 完成
    -   User Story 1 → 2 → 3 建議按順序執行（共用 `performQuickSave` 方法）
-   **Polish (Phase 6)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他 Story 依賴
-   **User Story 2 (P2)**: 建議在 US1 後執行（修改 `performQuickSave` 方法）
-   **User Story 3 (P2)**: 建議在 US1 後執行（修改 `performQuickSave` 方法）

### Within Each User Story

-   核心方法實作優先
-   整合到 `performQuickSave()` 次之
-   日誌記錄最後

### Parallel Opportunities

-   T002, T003 可並行（Toast 和 quickBackup 為獨立物件）
-   T005-T018 全部可並行（不同語言檔案）
-   T031, T032 可並行（CSS 驗證和 i18n 驗證）

---

## Parallel Example: i18n 任務

```bash
# 同時執行所有 i18n 翻譯任務（T005-T018）：
Task: "新增 3 個 i18n 鍵到 media/locales/zh-hant/messages.js"
Task: "新增 3 個 i18n 鍵到 media/locales/ja/messages.js"
Task: "新增 3 個 i18n 鍵到 media/locales/ko/messages.js"
... (其餘 11 種語言)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（Toast 系統 + quickBackup 骨架）
2. 完成 Phase 2: Foundational（15 種語言 i18n）
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 測試 Ctrl+S 基本備份功能
5. 若 MVP 滿足需求可先發布

### Incremental Delivery

1. Setup + Foundational → 基礎完成
2. User Story 1 → 獨立測試 → **MVP 可發布！**
3. User Story 2 → 獨立測試 → 空工作區保護
4. User Story 3 → 獨立測試 → 節流機制
5. Polish → 最終驗證

### Single Developer Strategy

本功能規模適合單一開發者：

1. 依序完成 Setup → Foundational → US1 → US2 → US3 → Polish
2. 預估時間：2-3 小時

---

## Notes

-   [P] 任務 = 不同檔案、無依賴
-   [Story] 標籤對應 spec.md 中的 User Story
-   每個 User Story 應可獨立測試
-   Toast 通知立即顯示，不等待 Extension 回傳
-   i18n 翻譯內容參考 data-model.md 表格
-   避免：模糊任務、同檔案衝突、跨 Story 依賴破壞獨立性
