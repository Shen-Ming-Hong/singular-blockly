# Tasks: 空 Workspace 防護機制

**Input**: Design documents from `/specs/019-empty-workspace-guard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 根據 spec.md 要求，本功能需要新增單元測試（plan.md 中 Constitution Check 第 VII 項標記為「⚠️ 待驗證」）。

**Organization**: 任務按 User Story 分組，支援獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案、無相依性）
-   **[Story]**: 所屬 User Story（例如 US1, US2, US3, US4）
-   描述中包含精確檔案路徑

## Path Conventions

本功能涉及的檔案：

-   WebView 端：`media/js/blocklyEdit.js`
-   Extension 端：`src/webview/messageHandler.ts`
-   測試：`src/test/messageHandler.test.ts`

---

## Phase 1: Setup (共用基礎建設)

**Purpose**: 程式碼閱讀與分析，確認修改位置

-   [ ] T001 閱讀現有 `saveWorkspaceState()` 實作於 media/js/blocklyEdit.js
-   [ ] T002 [P] 閱讀現有 `handleSaveWorkspace()` 實作於 src/webview/messageHandler.ts
-   [ ] T003 [P] 確認 `isDraggingBlock` 變數位置與用法於 media/js/blocklyEdit.js

---

## Phase 2: Foundational (必要前置作業)

**Purpose**: 新增工具函數與基礎架構，所有 User Story 皆依賴此階段

**⚠️ 重要**: 此階段必須完成後才能開始 User Story 實作

-   [ ] T004 在 messageHandler.ts 新增 `isEmptyWorkspaceState()` 私有方法於 src/webview/messageHandler.ts
-   [ ] T005 [P] 在 blocklyEdit.js 新增 `isWorkspaceStateEmpty()` 輔助函數於 media/js/blocklyEdit.js

**Checkpoint**: 基礎函數就緒，可開始 User Story 實作

---

## Phase 3: User Story 1 - 正常編輯方塊時自動儲存 (Priority: P1) 🎯 MVP

**Goal**: 確保現有儲存機制正常運作，作為其他防護機制的基準

**Independent Test**: 新增方塊 → 關閉編輯器 → 重新開啟 → 方塊應存在

### Tests for User Story 1

-   [ ] T006 [US1] 新增測試案例 "should save valid workspace state" 於 src/test/messageHandler.test.ts

### Implementation for User Story 1

-   [ ] T007 [US1] 驗證現有 `saveWorkspaceState()` 正常運作於 media/js/blocklyEdit.js
    -   **驗收標準**：手動新增一個方塊 → 等待 2 秒自動儲存 → 關閉編輯器 → 重新開啟 → 方塊仍存在
-   [ ] T008 [US1] 驗證現有 `handleSaveWorkspace()` 正常運作於 src/webview/messageHandler.ts
    -   **驗收標準**：檢查 Output Channel 有顯示儲存相關日誌，且 `blockly/main.json` 檔案內容包含新增的方塊資料

**Checkpoint**: User Story 1 驗證完成，確認現有儲存流程正常

---

## Phase 4: User Story 2 - 拖曳方塊時不會遺失資料 (Priority: P1)

**Goal**: 實作拖曳狀態檢查與空狀態驗證，防止資料遺失

**Independent Test**:

1. 拖曳方塊時觀察 Output Channel 無儲存日誌
2. 模擬空 Workspace 儲存請求，驗證系統拒絕儲存

### Tests for User Story 2

-   [ ] T009 [P] [US2] 新增測試案例 "should reject empty workspace state" 於 src/test/messageHandler.test.ts
-   [ ] T010 [P] [US2] 新增測試案例 "should reject workspace with empty blocks array" 於 src/test/messageHandler.test.ts
-   [ ] T011 [P] [US2] 新增測試案例 "should reject workspace with missing blocks property" 於 src/test/messageHandler.test.ts

### Implementation for User Story 2

-   [ ] T012 [US2] 修改 `saveWorkspaceState()` 加入拖曳狀態檢查於 media/js/blocklyEdit.js
-   [ ] T013 [US2] 修改 `saveWorkspaceState()` 加入空狀態檢查（使用 T005 的函數）於 media/js/blocklyEdit.js
-   [ ] T014 [US2] 修改 `handleSaveWorkspace()` 開頭加入空狀態驗證（使用 T004 的方法）於 src/webview/messageHandler.ts

**Checkpoint**: User Story 2 完成，拖曳與空狀態皆被正確攔截

---

## Phase 5: User Story 3 - 覆寫前自動備份 (Priority: P2)

**Goal**: 每次覆寫 `main.json` 前備份到 `.bak`，作為最後防線

**Independent Test**: 有方塊狀態下觸發儲存 → 檢查 `main.json.bak` 存在且內容正確

### Tests for User Story 3

-   [ ] T015 [P] [US3] 新增測試案例 "should create backup before save when file exists" 於 src/test/messageHandler.test.ts
-   [ ] T016 [P] [US3] 新增測試案例 "should skip backup when main.json does not exist" 於 src/test/messageHandler.test.ts
-   [ ] T017 [P] [US3] 新增測試案例 "should continue save when backup fails" 於 src/test/messageHandler.test.ts

### Implementation for User Story 3

-   [ ] T018 [US3] 新增 `createBackupBeforeSave()` 私有方法於 src/webview/messageHandler.ts
-   [ ] T019 [US3] 在 `handleSaveWorkspace()` 中呼叫備份方法（驗證通過後、寫入前）於 src/webview/messageHandler.ts

**Checkpoint**: User Story 3 完成，覆寫前自動備份機制就緒

---

## Phase 6: User Story 4 - 問題追蹤日誌 (Priority: P3)

**Goal**: 記錄防護機制觸發時的日誌，供除錯使用

**Independent Test**: 觸發空 Workspace 情況 → 檢查 Output Channel 有對應警告訊息

### Implementation for User Story 4

-   [ ] T020 [US4] 在 blocklyEdit.js 的拖曳跳過處加入 `log.info('跳過保存：正在拖曳')` 於 media/js/blocklyEdit.js
-   [ ] T021 [P] [US4] 在 blocklyEdit.js 的空狀態跳過處加入 `log.warn('跳過保存：工作區為空')` 於 media/js/blocklyEdit.js
-   [ ] T022 [P] [US4] 在 messageHandler.ts 的拒絕處加入 `log('Rejected empty workspace save request', 'warn')` 於 src/webview/messageHandler.ts
-   [ ] T023 [P] [US4] 在 messageHandler.ts 的備份成功處加入 `log('Created backup: main.json.bak', 'debug')` 於 src/webview/messageHandler.ts
-   [ ] T024 [US4] 在 messageHandler.ts 的備份失敗處加入警告日誌於 src/webview/messageHandler.ts

**Checkpoint**: User Story 4 完成，所有防護機制皆有日誌記錄

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 整體驗證與文件更新

-   [ ] T025 執行 `npm run compile` 確認編譯通過
-   [ ] T026 [P] 執行 `npm run test` 確認所有測試通過
-   [ ] T027 [P] 執行 `npm run lint` 確認無 lint 錯誤
-   [ ] T028 執行 quickstart.md 手動測試檢查清單驗證
-   [ ] T029 [P] 更新 CHANGELOG.md 加入本功能說明

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無相依性 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻擋所有 User Stories**
-   **User Stories (Phase 3-6)**: 皆依賴 Foundational 階段完成
    -   US1 (Phase 3) → 基準驗證
    -   US2 (Phase 4) → 核心防護（依賴 US1 驗證）
    -   US3 (Phase 5) → 備份機制（可與 US2 平行）
    -   US4 (Phase 6) → 日誌功能（依賴 US2, US3 完成）
-   **Polish (Phase 7)**: 依賴所有 User Stories 完成

### User Story Dependencies

-   **User Story 1 (P1)**: Foundational 後可開始 - 驗證現有功能
-   **User Story 2 (P1)**: 依賴 US1 驗證完成 - 核心防護實作
-   **User Story 3 (P2)**: 可與 US2 平行開始 - 獨立的備份機制
-   **User Story 4 (P3)**: 依賴 US2, US3 程式碼就位 - 在現有程式碼加入日誌

### Within Each User Story

-   測試先於實作（TDD）
-   實作完成後驗證 checkpoint

### Parallel Opportunities

-   T002, T003 可平行執行
-   T004, T005 可平行執行
-   T009, T010, T011 可平行執行
-   T015, T016, T017 可平行執行
-   T021, T022, T023 可平行執行
-   T026, T027, T029 可平行執行

---

## Parallel Example: User Story 2

```bash
# 啟動所有 User Story 2 的測試（平行）：
Task: T009 "should reject empty workspace state"
Task: T010 "should reject workspace with empty blocks array"
Task: T011 "should reject workspace with missing blocks property"

# 測試完成後，依序實作：
Task: T012 → T013 → T014
```

---

## Parallel Example: User Story 3

```bash
# 啟動所有 User Story 3 的測試（平行）：
Task: T015 "should create backup before save when file exists"
Task: T016 "should skip backup when main.json does not exist"
Task: T017 "should continue save when backup fails"

# 測試完成後，依序實作：
Task: T018 → T019
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵 - 阻擋所有 stories**）
3. 完成 Phase 3: User Story 1（驗證基準）
4. 完成 Phase 4: User Story 2（核心防護）
5. **停止並驗證**：測試拖曳與空狀態攔截
6. 可部署/展示 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. 加入 User Story 1 → 驗證現有功能 → 基準確立
3. 加入 User Story 2 → 獨立測試 → MVP 部署！
4. 加入 User Story 3 → 獨立測試 → 備份保護
5. 加入 User Story 4 → 獨立測試 → 完整日誌
6. 每個 story 皆獨立增值，不影響前一個 story

### Single Developer Strategy

1. 依序完成 Setup → Foundational
2. US1 → US2 → US3 → US4 依序完成
3. 每個 story 完成後執行 checkpoint 驗證
4. 最後執行 Polish phase

---

## Notes

-   [P] 任務 = 不同檔案，無相依性
-   [Story] 標籤對應 spec.md 中的 User Story
-   本功能修改範圍小（約 50 行程式碼）
-   每個任務完成後 commit
-   在任何 checkpoint 停止以獨立驗證 story
-   避免：模糊任務、同檔案衝突、跨 story 相依性

---

## Summary

| Metric                     | Value                                 |
| -------------------------- | ------------------------------------- |
| **Total Tasks**            | 29                                    |
| **Setup Tasks**            | 3                                     |
| **Foundational Tasks**     | 2                                     |
| **User Story 1 Tasks**     | 3                                     |
| **User Story 2 Tasks**     | 6                                     |
| **User Story 3 Tasks**     | 5                                     |
| **User Story 4 Tasks**     | 5                                     |
| **Polish Tasks**           | 5                                     |
| **Parallel Opportunities** | 19 tasks marked [P]                   |
| **Files Modified**         | 2 (blocklyEdit.js, messageHandler.ts) |
| **Test File**              | 1 (messageHandler.test.ts)            |
