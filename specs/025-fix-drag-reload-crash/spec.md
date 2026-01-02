# Feature Specification: 修復拖曳時 FileWatcher 重載崩潰問題

**Feature Branch**: `025-fix-drag-reload-crash`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: 修復 FileWatcher 在拖曳期間觸發 loadWorkspace 導致積木消失和 UI 鎖定的競態條件問題，同時更新棄用的 Blockly Variable API 為 v13 做準備

## 問題背景

當使用者在積木編輯器中進行以下操作時，會觸發嚴重的 UI 崩潰：

1. 複製貼上大量積木
2. 開始拖曳貼上的積木準備連接到其他區塊
3. **在連接預覽（InsertionMarker）顯示的瞬間**，如果 FileWatcher 偵測到 `main.json` 變更並觸發 `loadWorkspace`
4. `Blockly.serialization.workspaces.load()` 清空所有積木（包括正在被拖曳的）
5. Blockly 的 `InsertionMarkerPreviewer` 仍持有對已刪除積木的引用
6. 發生崩潰：`Error: Block not present in workspace's list of top-most blocks`
7. 滑鼠被鎖定在「抓著積木」狀態，無法放開
8. 只能關閉編輯器重開，但 Undo Stack 已被清空
9. 使用者只能透過 `.bak` 備份檔案手動恢復

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 拖曳積木時不受 FileWatcher 干擾 (Priority: P1)

使用者正在積木編輯器中拖曳積木準備連接到其他區塊，即使此時 FileWatcher 偵測到檔案變更，也不應該中斷使用者的操作或導致 UI 崩潰。

**Why this priority**: 這是核心問題，目前會導致使用者工作丟失和需要重開編輯器，嚴重影響使用體驗。

**Independent Test**: 可透過「複製大量積木 → 拖曳連接 → 同時觸發 FileWatcher」的操作流程獨立測試，預期結果是拖曳操作正常完成，不發生崩潰。

**Acceptance Scenarios**:

1. **Given** 使用者正在拖曳積木且連接預覽已顯示, **When** FileWatcher 偵測到 main.json 變更並嘗試觸發 loadWorkspace, **Then** 系統延遲重載直到拖曳結束，不發生崩潰
2. **Given** 使用者正在拖曳積木, **When** 拖曳結束後有待處理的 FileWatcher 重載請求, **Then** 系統自動執行延遲的重載，工作區狀態正確同步
3. **Given** 使用者正在拖曳積木, **When** 發生任何重載嘗試, **Then** 滑鼠不會被鎖定，使用者可正常完成或取消拖曳操作

---

### User Story 2 - 剪貼簿操作期間不觸發不完整儲存 (Priority: P2)

使用者在按下 Ctrl+C/V/X 進行剪貼簿操作時，自動儲存不應該在 Blockly 處理貼上操作的中間狀態時觸發，避免儲存不完整的工作區狀態。

**Why this priority**: 剪貼簿操作是觸發此問題的常見前置條件，防止不完整儲存可減少後續 FileWatcher 重載的問題。

**Independent Test**: 可透過「快速複製貼上大量積木並觀察是否儲存空狀態」獨立測試。

**Acceptance Scenarios**:

1. **Given** 使用者按下 Ctrl+V 貼上積木, **When** 自動儲存 debounce 計時器到期, **Then** 系統等待剪貼簿操作完成後才執行儲存
2. **Given** 使用者連續貼上多次積木, **When** BLOCK_CREATE 事件持續觸發, **Then** 剪貼簿操作鎖定時間動態延長，確保所有積木建立完成
3. **Given** 剪貼簿操作完成, **When** 鎖定解除, **Then** 自動儲存正常執行，儲存完整的工作區狀態

---

### User Story 3 - Blockly v13 API 相容性 (Priority: P3)

系統使用的 Blockly Variable API 應更新為新版 API，消除棄用警告並為 Blockly v13 升級做準備。

**Why this priority**: 目前是警告不影響功能，但為未來升級做準備是良好實踐。

**Independent Test**: 可透過「檢查 Console 是否有棄用警告」獨立測試。

**Acceptance Scenarios**:

1. **Given** 系統載入工作區, **When** 執行涉及變數的操作, **Then** Console 不顯示 `getAllVariables was deprecated` 或 `getVariableById was deprecated` 警告
2. **Given** 專案程式碼, **When** 搜尋 `workspace.getAllVariables()` 或 `workspace.getVariableById()`, **Then** 應找不到這些已棄用的 API 呼叫

---

### Edge Cases

-   如果使用者在拖曳結束前關閉編輯器，待處理的重載請求應被丟棄
-   如果待處理重載期間又有新的 FileWatcher 變更，應該用新的狀態取代舊的
-   如果剪貼簿操作失敗或被取消，鎖定應在超時後自動解除
-   如果 `workspace.isDragging()` 和自訂 `isDraggingBlock` 旗標不一致，應採用 OR 邏輯（任一為 true 即視為拖曳中）

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統在執行 `loadWorkspace` 前必須檢查拖曳狀態（`isDraggingBlock` 和 `workspace.isDragging()` 雙重檢查，採用 OR 邏輯）
-   **FR-002**: 當拖曳進行中收到 FileWatcher 觸發的 `loadWorkspace` 請求時，系統必須暫存該請求而非立即執行
-   **FR-003**: 當拖曳結束（`BLOCK_DRAG` 事件 `isStart === false`）時，系統必須檢查並執行任何待處理的重載請求
-   **FR-004**: 系統在偵測到 Ctrl+C/V/X 鍵盤事件時，必須設置剪貼簿操作鎖定旗標
-   **FR-005**: 剪貼簿操作鎖定期間，`saveWorkspaceState()` 必須跳過儲存操作
-   **FR-006**: 當 `BLOCK_CREATE` 事件觸發時，如果剪貼簿操作鎖定中，系統必須動態延長鎖定時間
-   **FR-007**: 自動儲存的 debounce 時間必須從 150ms 增加到 300ms
-   **FR-008**: 所有使用 `workspace.getAllVariables()` 的程式碼必須更新為 `workspace.getVariableMap().getAllVariables()`
-   **FR-009**: 所有使用 `workspace.getVariableById()` 的程式碼必須更新為 `workspace.getVariableMap().getVariableById()`

### Key Entities

-   **isDraggingBlock**: WebView 端自訂旗標，追蹤拖曳狀態
-   **isClipboardOperationInProgress**: 新增旗標，追蹤剪貼簿操作狀態
-   **pendingReloadFromFileWatcher**: 新增變數，暫存待處理的重載請求訊息
-   **clipboardLockTimer**: 新增計時器，管理剪貼簿操作鎖定的動態延長

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者可在任何時機執行「複製大量積木 → 拖曳連接」操作，成功率達 100%，不發生 UI 崩潰
-   **SC-002**: 拖曳操作期間即使 FileWatcher 觸發，滑鼠不會被鎖定，使用者可正常完成或取消操作
-   **SC-003**: Console 不再顯示 Blockly Variable API 棄用警告
-   **SC-004**: 現有的 `.bak` 備份機制不受影響，使用者仍可透過備份檔案恢復
-   **SC-005**: debounce 時間調整後，自動儲存仍能正常運作，延遲增加對使用體驗影響可忽略

## Assumptions

-   Blockly 的 `workspace.isDragging()` API 在所有拖曳場景（包括 InsertionMarker 預覽期間）都能正確返回 `true`
-   300ms 的 debounce 時間足以涵蓋大多數 Blockly 內部狀態更新
-   剪貼簿操作初始鎖定 300ms 加上動態延長機制足以處理大量積木貼上
-   待處理重載請求只需保留最新一筆，舊的可被覆蓋
