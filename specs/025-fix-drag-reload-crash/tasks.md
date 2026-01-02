````markdown
# Tasks: 修復拖曳時 FileWatcher 重載崩潰問題

**Input**: Design documents from `/specs/025-fix-drag-reload-crash/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 無需自動化測試（WebView UI Testing Exception，將使用手動測試驗證）

**Organization**: 任務按用戶故事組織，每個故事可獨立實作和測試

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可並行執行（不同檔案，無依賴）
-   **[Story]**: 所屬用戶故事（US1, US2, US3）
-   描述中包含確切檔案路徑

## Path Conventions

-   **WebView 層**: `media/js/`, `media/blockly/blocks/`
-   **Extension 層**: `src/webview/`

---

## Phase 1: Setup (共享基礎設施)

**Purpose**: 專案初始化，無需額外設定

-   [ ] T001 驗證 Blockly 12.3.1 BLOCK_DRAG 事件和 isDragging() API 支援

---

## Phase 2: Foundational (阻塞性前置任務)

**Purpose**: 核心狀態變數和輔助函數，所有用戶故事都依賴這些

**⚠️ CRITICAL**: 必須先完成此階段，才能開始用戶故事實作

-   [ ] T002 新增 `isClipboardOperationInProgress` 狀態旗標在 `media/js/blocklyEdit.js` 頂層變數區
-   [ ] T003 [P] 新增 `pendingReloadFromFileWatcher` 暫存變數在 `media/js/blocklyEdit.js` 頂層變數區
-   [ ] T004 [P] 新增 `clipboardLockTimer` 計時器變數在 `media/js/blocklyEdit.js` 頂層變數區
-   [ ] T004a [P] 新增 `CLIPBOARD_MAX_LOCK_TIME` 常數（5000ms）和 `clipboardLockStartTime` 變數在 `media/js/blocklyEdit.js` 頂層變數區
-   [ ] T005 實作 `isCurrentlyDragging()` 輔助函數在 `media/js/blocklyEdit.js`（採用 OR 邏輯雙重檢查 `isDraggingBlock || workspace.isDragging()`）
-   [ ] T006 [P] 實作 `shouldSkipSave()` 輔助函數在 `media/js/blocklyEdit.js`（整合所有儲存守衛條件：拖曳、剪貼簿鎖定、FileWatcher 載入）
-   [ ] T007 [P] 實作 `processPendingReload()` 輔助函數在 `media/js/blocklyEdit.js`（執行待處理的 FileWatcher 重載請求）

**Checkpoint**: 基礎設施就緒 - 可開始用戶故事實作

---

## Phase 3: User Story 1 - 拖曳積木時不受 FileWatcher 干擾 (Priority: P1) 🎯 MVP

**Goal**: 使用者拖曳積木時，FileWatcher 觸發的重載請求被延遲到拖曳結束後執行，避免 UI 崩潰

**Independent Test**: 複製大量積木 → 拖曳連接 → 同時修改 main.json 觸發 FileWatcher → 拖曳正常完成，無崩潰

### Implementation for User Story 1

-   [ ] T008 [US1] 修改 `loadWorkspace` 訊息處理器在 `media/js/blocklyEdit.js`：新增 `source === 'fileWatcher'` 檢查，若 `isCurrentlyDragging()` 為 true 則暫存訊息
-   [ ] T009 [US1] 修改 `BLOCK_DRAG` 事件處理器在 `media/js/blocklyEdit.js`：當 `event.isStart === false` 時呼叫 `processPendingReload()`（延遲 100ms 確保狀態穩定）
-   [ ] T010 [US1] 修改 Extension 側 `messageHandler.ts`：檢查現有程式碼是否已有 `source` 標記，若無則在 FileWatcher 觸發的 `loadWorkspace` 訊息中加入 `source: 'fileWatcher'` 標記（先執行 `grep_search` 確認現狀）
-   [ ] T011 [US1] 新增日誌記錄：「FileWatcher 重載請求已暫存，等待拖曳結束」和「拖曳結束，執行待處理的 FileWatcher 重載」在 `media/js/blocklyEdit.js`

**Checkpoint**: 此時 User Story 1 應可獨立測試 - 拖曳期間 FileWatcher 重載被延遲

---

## Phase 4: User Story 2 - 剪貼簿操作期間不觸發不完整儲存 (Priority: P2)

**Goal**: Ctrl+C/V/X 操作期間自動儲存被暫停，確保不會儲存不完整的工作區狀態

**Independent Test**: 快速連續貼上大量積木 → 觀察 Console 顯示「剪貼簿操作鎖定中，跳過保存」→ 操作完成後自動儲存觸發

### Implementation for User Story 2

-   [ ] T012 [US2] 新增 `keydown` 事件監聽器在 `media/js/blocklyEdit.js`：偵測 Ctrl+C/V/X 時設置 `isClipboardOperationInProgress = true` 並啟動 `clipboardLockTimer`（300ms）
-   [ ] T013 [US2] 修改 `BLOCK_CREATE` 事件處理器在 `media/js/blocklyEdit.js`：若 `isClipboardOperationInProgress` 為 true 且未超過 `CLIPBOARD_MAX_LOCK_TIME`（5000ms），重設 `clipboardLockTimer` 動態延長鎖定
-   [ ] T014 [US2] 修改 `saveWorkspaceState()` 函數在 `media/js/blocklyEdit.js`：使用 `shouldSkipSave()` 整合所有守衛條件
-   [ ] T015 [US2] 修改自動儲存 debounce 時間從 150ms 到 300ms 在 `media/js/blocklyEdit.js` 的 `codeUpdateDebounceTimer` 相關程式碼
-   [ ] T016 [US2] 新增日誌記錄：「剪貼簿操作開始，鎖定自動儲存」和「剪貼簿操作結束，解除鎖定」在 `media/js/blocklyEdit.js`

**Checkpoint**: 此時 User Stories 1 和 2 都應可獨立運作

---

## Phase 5: User Story 3 - Blockly v13 API 相容性 (Priority: P3)

**Goal**: 更新棄用的 Blockly Variable API，消除 Console 警告並為 v13 升級做準備

**Independent Test**: 執行涉及變數的操作 → Console 無「getAllVariables was deprecated」或「getVariableById was deprecated」警告

### Implementation for User Story 3

-   [ ] T017 [US3] 搜尋並更新 `workspace.getVariableById()` 為 `workspace.getVariableMap().getVariableById()` 在 `media/blockly/blocks/functions.js`
-   [ ] T018 [US3] 搜尋專案根目錄下所有 `.js` 檔案中的 `workspace.getAllVariables()` 並更新為 `workspace.getVariableMap().getAllVariables()`（搜尋範圍：`media/`、`src/`、排除 `node_modules/`）
-   [ ] T019 [US3] 搜尋專案根目錄下所有 `.js` 檔案中的其他棄用 Blockly Variable API（如 `workspace.deleteVariable`、`workspace.renameVariable`）並更新（搜尋範圍：`media/`、`src/`、排除 `node_modules/`）

**Checkpoint**: 所有用戶故事都應可獨立運作

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 整體改進和驗證

-   [ ] T020 [P] 執行 `quickstart.md` 中的所有手動測試案例驗證修復
-   [ ] T021 [P] 檢查 WebView DevTools Console 確認無任何新增錯誤或警告
-   [ ] T022 更新 CHANGELOG.md 記錄此修復（025-fix-drag-reload-crash）
-   [ ] T023 程式碼清理：移除任何除錯用的 console.log，確保使用 log.\* API

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有用戶故事**
-   **User Stories (Phase 3-5)**: 都依賴 Foundational 階段完成
    -   可依優先順序 P1 → P2 → P3 順序執行
    -   或在團隊允許時並行執行
-   **Polish (Phase 6)**: 依賴所有用戶故事完成

### User Story Dependencies

-   **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事依賴
-   **User Story 2 (P2)**: Foundational 完成後可開始 - 無其他故事依賴（但與 US1 共用 `shouldSkipSave()`）
-   **User Story 3 (P3)**: Foundational 完成後可開始 - 完全獨立，不依賴其他故事

### Within Each User Story

-   核心邏輯實作 → 事件處理器修改 → 日誌記錄
-   每個故事完成後可獨立測試

### Parallel Opportunities

**Phase 2 (Foundational):**

```
T002, T003, T004 可並行執行（不同變數宣告）
T005, T006, T007 部分可並行（T005 須先完成才能實作 T006）
```

**User Stories 並行可能性:**

```
US1, US2, US3 理論上可並行，但建議按優先順序執行以確保 MVP 先完成
```

**Phase 6 (Polish):**

```
T020, T021 可並行執行
```

---

## Parallel Example: Foundational Phase

```bash
# 並行新增狀態變數：
Task: T002 新增 isClipboardOperationInProgress 在 media/js/blocklyEdit.js
Task: T003 新增 pendingReloadFromFileWatcher 在 media/js/blocklyEdit.js
Task: T004 新增 clipboardLockTimer 在 media/js/blocklyEdit.js

# 接著實作輔助函數（T005 優先）：
Task: T005 實作 isCurrentlyDragging() 在 media/js/blocklyEdit.js

# T005 完成後可並行：
Task: T006 實作 shouldSkipSave() 在 media/js/blocklyEdit.js
Task: T007 實作 processPendingReload() 在 media/js/blocklyEdit.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup（驗證 API 支援）
2. 完成 Phase 2: Foundational（狀態變數和輔助函數）
3. 完成 Phase 3: User Story 1（拖曳保護）
4. **STOP and VALIDATE**: 使用 quickstart.md 測試案例 #1 驗證
5. 部署/演示 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署（MVP！解決核心崩潰問題）
3. 新增 User Story 2 → 獨立測試 → 部署（增強穩定性）
4. 新增 User Story 3 → 獨立測試 → 部署（API 現代化）
5. 每個故事增加價值且不破壞之前的故事

---

## Notes

-   [P] 任務 = 不同檔案或無依賴
-   [Story] 標籤將任務映射到特定用戶故事以便追蹤
-   每個用戶故事應可獨立完成和測試
-   每個任務或邏輯群組完成後提交
-   在任何檢查點停下來以獨立驗證故事
-   避免：模糊的任務、同一檔案衝突、破壞獨立性的跨故事依賴
-   所有日誌使用 `log.*` API（不使用 `console.log`）
-   主要修改檔案：`media/js/blocklyEdit.js`、`media/blockly/blocks/functions.js`、`src/webview/messageHandler.ts`
````
