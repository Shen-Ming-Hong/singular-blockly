# Feature Specification: Ctrl+S 快速備份快捷鍵

**Feature Branch**: `017-ctrl-s-quick-backup`  
**Created**: 2025-12-20  
**Status**: Draft  
**Input**: User description: "當使用者在積木編輯區按下 Ctrl+S 時觸發手動備份，使用 backup_YYYYMMDD_HHMMSS 命名格式，包含 3 秒節流機制防止重複備份，空工作區時跳過並顯示 Toast 通知"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 快速備份工作區 (Priority: P1)

使用者正在編輯 Blockly 積木程式，想要快速儲存當前工作進度作為備份。使用者按下 Ctrl+S（macOS 為 Cmd+S）快捷鍵，系統立即建立備份並透過 Toast 通知確認成功。

**Why this priority**: 這是核心功能，讓使用者能夠以最少的操作步驟保護工作進度，是功能的主要價值所在。

**Independent Test**: 可以透過在積木編輯區放置一個積木後按下 Ctrl+S 來獨立測試，預期看到 Toast 通知顯示「備份已儲存：backup_YYYYMMDD_HHMMSS」。

**Acceptance Scenarios**:

1. **Given** 使用者在積木編輯區且工作區有至少一個積木, **When** 使用者按下 Ctrl+S, **Then** 系統建立備份並顯示成功 Toast 通知，通知內容包含備份檔案名稱
2. **Given** 使用者在 macOS 系統上, **When** 使用者按下 Cmd+S, **Then** 系統行為與 Ctrl+S 相同
3. **Given** 備份正在進行中, **When** 備份成功完成, **Then** Toast 通知顯示 2.5 秒後自動消失

---

### User Story 2 - 空工作區保護 (Priority: P2)

使用者習慣性地按下 Ctrl+S，但工作區目前沒有任何積木。系統應該跳過備份並友善地通知使用者，避免建立無意義的空備份檔案。

**Why this priority**: 這是重要的邊界情況處理，防止產生無用的備份檔案並給予使用者明確的反饋。

**Independent Test**: 可以透過開啟一個空的 Blockly 工作區後按下 Ctrl+S 來獨立測試，預期看到警告 Toast 通知「工作區為空，不需要備份」。

**Acceptance Scenarios**:

1. **Given** 工作區沒有任何積木, **When** 使用者按下 Ctrl+S, **Then** 系統不建立備份，並顯示警告 Toast 通知「工作區為空，不需要備份」
2. **Given** 顯示警告 Toast, **When** 經過 2.5 秒, **Then** Toast 自動消失

---

### User Story 3 - 防止重複備份（節流機制）(Priority: P2)

使用者在短時間內多次按下 Ctrl+S（例如緊張時連按），系統應該防止建立過多重複備份，並友善地通知使用者需要稍候。

**Why this priority**: 這是重要的使用者體驗保護，防止短時間內產生大量幾乎相同的備份檔案，同時不讓使用者困惑。

**Independent Test**: 可以透過連續快速按下 Ctrl+S 兩次來獨立測試，第一次應成功，第二次應顯示冷卻提示。

**Acceptance Scenarios**:

1. **Given** 使用者剛在 3 秒內執行過快速備份, **When** 使用者再次按下 Ctrl+S, **Then** 系統不建立備份，顯示提示 Toast「請稍候，上次備份剛完成」
2. **Given** 上次備份已超過 3 秒, **When** 使用者按下 Ctrl+S, **Then** 系統正常建立新備份

---

### Edge Cases

-   ~~當備份過程中發生錯誤時，應顯示錯誤 Toast 通知而非成功通知~~ **[延遲實作]**：依據 Constitution 原則 III（避免過度開發），本版本 Toast 不等待 Extension 回傳，錯誤處理留待未來需求確認後實作
-   當瀏覽器預設的 Ctrl+S（儲存網頁）行為被觸發時，應該被正確攔截（preventDefault）

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 在 WebView 積木編輯區監聽 Ctrl+S（Windows/Linux）和 Cmd+S（macOS）鍵盤事件
-   **FR-002**: 系統 MUST 攔截瀏覽器預設的 Ctrl+S 儲存網頁行為（呼叫 event.preventDefault()）
-   **FR-003**: 系統 MUST 使用 `backup_YYYYMMDD_HHMMSS` 格式命名備份檔案，與現有手動備份命名一致
-   **FR-004**: 系統 MUST 在工作區為空時（無積木）跳過備份建立
-   **FR-005**: 系統 MUST 實作 3 秒節流機制，防止短時間內重複建立備份
-   **FR-006**: 系統 MUST 透過 Toast 通知顯示備份結果（成功、空工作區、冷卻中）
-   **FR-007**: Toast 通知 MUST 在 2.5 秒後自動消失
-   **FR-008**: Toast 通知 MUST 支援成功（綠色）和警告（橙色）兩種視覺狀態
-   **FR-009**: 系統 MUST 支援 15 種語言的 i18n 訊息（BACKUP_QUICK_SAVE_SUCCESS、BACKUP_QUICK_SAVE_EMPTY、BACKUP_QUICK_SAVE_COOLDOWN）

### Key Entities

-   **Toast 通知**: 臨時顯示的訊息元素，包含訊息文字、類型（success/warning）、顯示時長
-   **快速備份狀態**: 追蹤上次備份時間（lastQuickSaveTime），用於節流判斷
-   **備份檔案**: 使用現有 backup 機制儲存到 `{workspace}/blockly/backups/` 目錄

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者從按下 Ctrl+S 到看到 Toast 通知的時間小於 500ms
-   **SC-002**: Toast 通知在 2.5 秒（±200ms）後自動消失
-   **SC-003**: 節流機制在 3 秒內有效阻止重複備份
-   **SC-004**: 所有 15 種支援語言都有正確的 i18n 訊息顯示
-   **SC-005**: 快捷鍵在 Windows（Ctrl+S）和 macOS（Cmd+S）上都正常運作

## Assumptions

-   現有的 `createBackup` 訊息處理機制和備份儲存邏輯無需修改
-   WebView 環境支援 `keydown` 事件監聽和 `preventDefault()` 方法
-   使用者瀏覽器支援 CSS 動畫（淡入淡出效果）
