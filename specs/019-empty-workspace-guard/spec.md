# Feature Specification: 空 Workspace 防護機制

**Feature Branch**: `019-empty-workspace-guard`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: User description: "修復方塊拖曳時意外消失的資料遺失問題，實作三層防護機制：WebView 端不存空 Workspace、Extension 端拒絕空資料、覆寫前備份到.bak"

## 問題背景

用戶在拖曳方塊過程中，有時會發生所有方塊突然消失的情況。滑鼠放開後畫面上的方塊沒有被釋放，整個程式碼都不見了。重新開啟編輯器也是一樣（代表已被儲存為空狀態），只能依靠備份檔案還原。

**根本原因**：當拖曳過程中 Blockly 序列化返回空狀態時，系統直接將空狀態寫入 `main.json`，導致資料永久遺失。現有的快速備份功能有空 Workspace 檢查，但主要儲存流程沒有。

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 正常編輯方塊時自動儲存 (Priority: P1)

用戶在 Blockly 編輯器中新增、修改、移動或刪除方塊時，系統會自動儲存工作區狀態，確保用戶的工作不會遺失。

**Why this priority**: 這是系統的核心功能，必須確保正常操作時儲存機制運作正常。

**Independent Test**: 可透過新增一個方塊、關閉編輯器、重新開啟來驗證方塊是否被正確儲存。

**Acceptance Scenarios**:

1. **Given** 用戶已開啟 Blockly 編輯器並有方塊在工作區, **When** 用戶新增一個方塊並等待自動儲存完成, **Then** 工作區狀態被儲存到 `main.json`
2. **Given** 用戶有方塊在工作區且已儲存, **When** 用戶關閉並重新開啟編輯器, **Then** 所有方塊完整還原

---

### User Story 2 - 拖曳方塊時不會遺失資料 (Priority: P1)

用戶在拖曳方塊的過程中，即使發生異常情況（如 Blockly 序列化返回空狀態），系統也不會覆寫原有的 `main.json`，確保用戶的工作不會遺失。

**Why this priority**: 這是本次修復的核心問題，必須防止資料遺失。

**Independent Test**: 可透過模擬空 Workspace 儲存請求，驗證系統是否拒絕儲存。

**Acceptance Scenarios**:

1. **Given** 用戶有方塊在工作區, **When** 用戶正在拖曳方塊, **Then** 系統不會觸發儲存動作
2. **Given** 用戶有方塊在工作區, **When** 因異常導致序列化返回空狀態, **Then** WebView 端不會送出儲存請求
3. **Given** Extension 端收到空的 workspace 儲存請求, **When** 處理該請求, **Then** Extension 端拒絕儲存並記錄警告日誌

---

### User Story 3 - 覆寫前自動備份 (Priority: P2)

每次覆寫 `main.json` 前，系統會先將現有檔案備份到 `main.json.bak`，作為最後一道防線。

**Why this priority**: 這是額外的保險機制，即使前兩層防護都失效，用戶仍有機會從備份還原。

**Independent Test**: 可透過觸發一次正常儲存，驗證 `.bak` 檔案是否被建立且內容正確。

**Acceptance Scenarios**:

1. **Given** `main.json` 已存在且有方塊內容, **When** 系統準備寫入新的狀態, **Then** 先將現有內容複製到 `main.json.bak`
2. **Given** `main.json.bak` 已存在, **When** 下一次儲存發生, **Then** `.bak` 檔案被更新為最新的備份（只保留一份）
3. **Given** `main.json` 不存在或為空, **When** 系統準備寫入新狀態, **Then** 不建立 `.bak` 檔案（沒有需要備份的內容）

---

### User Story 4 - 問題追蹤日誌 (Priority: P3)

當系統執行防護機制（跳過儲存或拒絕儲存）時，會記錄日誌供除錯使用。

**Why this priority**: 輔助功能，幫助開發者追蹤問題發生時的狀態。

**Independent Test**: 可透過觸發空 Workspace 情況，檢查 Output Channel 是否有對應的警告訊息。

**Acceptance Scenarios**:

1. **Given** 拖曳期間觸發儲存, **When** 系統跳過儲存, **Then** 記錄訊息「跳過保存：正在拖曳」
2. **Given** 序列化返回空狀態, **When** WebView 端跳過儲存, **Then** 記錄警告「跳過保存：工作區為空」
3. **Given** Extension 端收到空狀態, **When** 拒絕儲存, **Then** 記錄警告「Rejected empty workspace」

---

### Edge Cases

-   新專案首次儲存時 `main.json` 不存在，應正常建立檔案而非報錯
-   用戶透過「清除全部」按鈕清空所有方塊時，此情況應有獨立的處理邏輯允許儲存空狀態（不在本次修復範圍）
    -   **未來處理方向**：預計新增專屬的 `clearAllBlocks` 命令，透過明確的使用者意圖標記繞過空狀態檢查，而非修改現有防護邏輯
-   `main.json.bak` 檔案被用戶手動刪除或損壞時，不應影響正常儲存流程
-   磁碟空間不足導致備份失敗時，不阻止主檔案儲存，但應記錄錯誤日誌

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 在 WebView 端儲存函數中檢查拖曳狀態，若正在拖曳則跳過儲存
-   **FR-002**: 系統 MUST 在 WebView 端序列化後檢查方塊數量，若為 0 或未定義則跳過儲存
-   **FR-003**: 系統 MUST 在 Extension 端儲存處理中檢查收到的 workspace 狀態，若為空則拒絕儲存
-   **FR-004**: 系統 MUST 在覆寫 `main.json` 前，若檔案已存在且有內容，則先複製到 `main.json.bak`
-   **FR-005**: 系統 MUST 只保留一份 `.bak` 備份檔案，每次覆寫時更新
-   **FR-006**: 系統 MUST 在執行防護機制時記錄適當的日誌（info 或 warn 層級）

### Key Entities

-   **Workspace State**: Blockly 工作區的序列化狀態，包含方塊陣列
-   **main.json**: 工作區持久化檔案，位於專案的 `blockly` 目錄
-   **main.json.bak**: 備份檔案，與 `main.json` 同目錄

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 拖曳方塊期間不會觸發任何 `main.json` 寫入操作
-   **SC-002**: 空的 workspace 狀態永遠不會被寫入 `main.json`
-   **SC-003**: 每次成功儲存前，若原檔案有內容，`.bak` 檔案包含前一版本的完整內容
-   **SC-004**: 所有防護機制觸發時都有對應的日誌記錄
-   **SC-005**: 正常編輯操作（非拖曳、非空狀態）的儲存流程不受影響

## Assumptions

-   用戶清空所有方塊的操作（如「清除全部」按鈕）會有獨立的處理邏輯，不在本次修復範圍內
-   備份機制只保留最新一份 `.bak` 檔案，不做多版本備份
-   備份失敗不應阻止主檔案儲存（可用性優先於完整備份）
