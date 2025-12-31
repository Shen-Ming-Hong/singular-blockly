# Feature Specification: i18n 硬編碼字串修復

**Feature Branch**: `024-i18n-hardcode-fix`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "修復 i18n 翻譯問題：1. 英文 VSCode 啟動 Blockly 時警告訊息顯示變數名而非正常英文 2. Python 模式上傳程式到硬體時 toast 顯示中文而非本地化文字 3. 全面檢查並修復所有硬編碼字串"

## Clarifications

### Session 2025-12-31

-   Q: 當某語言的翻譯檔案缺少特定訊息鍵時，系統應如何處理回退？ → A: 回退到英文翻譯（缺少鍵 → 使用 en/messages.js 的值）

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 英文環境下警告訊息正確顯示 (Priority: P1)

當使用者在英文版 VSCode 環境中啟動 Blockly 編輯器時，若觸發安全警告對話框（例如開啟非 Blockly 專案時的提示），對話框中的文字應顯示正確的英文訊息，而非 i18n 鍵名（如 `SAFETY_WARNING_BODY_NO_TYPE`）。

**Why this priority**: 這是使用者回報的主要問題之一，直接影響英文使用者的使用體驗。顯示變數名而非正常文字會讓使用者困惑，無法理解警告內容。

**Independent Test**: 可在英文版 VSCode 中開啟任意非 Blockly 專案，啟動 Blockly 編輯器，驗證警告對話框顯示正確英文文字。

**Acceptance Scenarios**:

1. **Given** VSCode 語言設定為英文，**When** 使用者在非 Blockly 專案中開啟 Blockly 編輯器，**Then** 安全警告對話框顯示正確英文訊息（如 "This project does not appear to be a Blockly project..."）
2. **Given** VSCode 語言設定為英文且翻譯檔案載入失敗，**When** 系統需要顯示任何訊息，**Then** 顯示英文 fallback 訊息而非 i18n 鍵名
3. **Given** VSCode 語言設定為繁體中文，**When** 使用者在非 Blockly 專案中開啟 Blockly 編輯器，**Then** 安全警告對話框顯示正確繁體中文訊息

---

### User Story 2 - MicroPython 上傳進度訊息本地化 (Priority: P1)

當使用者在 Python/MicroPython 模式下上傳程式碼到 CyberBrick 硬體時，進度通知（toast）應根據 VSCode 語言設定顯示對應語言的訊息，而非總是顯示中文。

**Why this priority**: 這是使用者回報的第二個問題，直接影響非中文使用者的體驗。上傳是核心功能，進度訊息應該被正確本地化。

**Independent Test**: 可在英文版 VSCode 中選擇 CyberBrick 開發板，撰寫簡單程式並上傳，驗證進度訊息顯示英文。

**Acceptance Scenarios**:

1. **Given** VSCode 語言設定為英文，**When** 使用者上傳 MicroPython 程式到 CyberBrick，**Then** 進度訊息顯示英文（如 "Preparing upload...", "Uploading program...", "Upload complete!"）
2. **Given** VSCode 語言設定為繁體中文，**When** 使用者上傳 MicroPython 程式到 CyberBrick，**Then** 進度訊息顯示繁體中文（如「準備上傳...」、「上傳程式...」、「上傳完成！」）
3. **Given** VSCode 語言設定為日文，**When** 使用者上傳 MicroPython 程式到 CyberBrick，**Then** 進度訊息顯示日文翻譯

---

### User Story 3 - 備份功能訊息本地化 (Priority: P2)

當使用者使用備份相關功能（建立備份、刪除備份、還原備份）時，所有確認對話框和錯誤訊息應根據 VSCode 語言設定顯示對應語言。

**Why this priority**: 備份是重要的輔助功能，訊息本地化提升整體使用體驗一致性，但不如核心編輯和上傳功能緊急。

**Independent Test**: 可在英文版 VSCode 中使用備份功能，驗證確認對話框和錯誤訊息顯示英文。

**Acceptance Scenarios**:

1. **Given** VSCode 語言設定為英文，**When** 使用者嘗試刪除備份，**Then** 確認對話框顯示英文（如 "Are you sure you want to delete backup '[name]'?"）
2. **Given** VSCode 語言設定為英文，**When** 使用者嘗試還原備份，**Then** 確認對話框顯示英文（如 "Are you sure you want to restore backup '[name]'?"）
3. **Given** VSCode 語言設定為英文且發生錯誤，**When** 備份操作失敗，**Then** 錯誤訊息顯示英文

---

### User Story 4 - 統一 i18n 常數管理 (Priority: P2)

開發者在維護或新增訊息時，應能透過統一的常數檔案管理所有 i18n 鍵名，確保鍵名一致性並獲得 TypeScript 類型檢查支援。

**Why this priority**: 這是技術債清理，建立良好的架構基礎，讓未來新增訊息時能遵循一致的模式，減少硬編碼字串的產生。

**Independent Test**: 開發者可檢查新建的常數檔案，驗證所有訊息鍵名都有定義且有 TypeScript 類型支援。

**Acceptance Scenarios**:

1. **Given** 開發者需要新增訊息，**When** 引入 i18n 常數模組，**Then** 可透過 IntelliSense 看到所有可用的訊息鍵名
2. **Given** 開發者使用不存在的鍵名，**When** TypeScript 編譯，**Then** 應產生編譯錯誤提示

---

### Edge Cases

-   翻譯檔案載入失敗或損壞時，系統應回退到英文翻譯檔（en/messages.js）
-   某語言的翻譯檔案缺少特定鍵時，應回退到英文翻譯（en/messages.js 的對應值）
-   使用者快速切換語言設定時，已顯示的訊息保持原樣，新訊息使用新語言
-   訊息包含動態參數（如檔案名稱、開發板類型）時，參數應正確插入翻譯後的訊息模板

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 在翻譯鍵查找失敗時回退到英文翻譯檔（en/messages.js），而非返回鍵名本身
-   **FR-002**: `LocaleService.getLocalizedMessage()` MUST 實作回退鏈：當前語言 → 英文翻譯 → fallback 參數
-   **FR-003**: `micropythonUploader.ts` 中所有進度訊息 MUST 使用英文作為基礎值，讓 WebView 端的翻譯機制能正確覆蓋
-   **FR-004**: `micropythonUploader.ts` 中所有錯誤訊息 MUST 改為英文 fallback，並透過 i18n 機制取得本地化訊息
-   **FR-005**: `backupService.ts` 中所有確認對話框 MUST 使用 `LocaleService` 取得本地化訊息
-   **FR-006**: `messageHandler.ts` 中所有使用者可見訊息 MUST 使用 `LocaleService` 取得本地化訊息
-   **FR-007**: `workspaceValidator.ts` 中所有 fallback 訊息 MUST 改為英文
-   **FR-008**: 系統 MUST 提供統一的 i18n 常數檔案，定義所有訊息鍵名並提供類型安全
-   **FR-009**: 所有新增的訊息鍵 MUST 在 15 種語言的翻譯檔案中都有對應翻譯
-   **FR-010**: MCP 工具的訊息 SHOULD 保持英文，不需國際化（因主要供 AI 使用）

### Key Entities

-   **MESSAGE_KEYS**: 安全警告相關訊息鍵（現有）- 包含安全警告對話框的標題、內容、按鈕文字
-   **ERROR_KEYS**: 錯誤訊息鍵（新增）- 包含工作區未開啟、檔案為空、裝置未找到等錯誤
-   **PROGRESS_KEYS**: 進度訊息鍵（新增）- 包含上傳各階段的進度訊息
-   **DIALOG_KEYS**: 對話框訊息鍵（新增）- 包含確認刪除、確認還原等對話框訊息
-   **BUTTON_KEYS**: 按鈕文字鍵（新增）- 包含繼續、取消、刪除、還原等按鈕文字

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 英文版 VSCode 中所有使用者可見訊息顯示正確英文，無 i18n 鍵名顯示（可透過全功能測試驗證）
-   **SC-002**: 繁體中文版 VSCode 中所有使用者可見訊息顯示正確繁體中文（可透過全功能測試驗證）
-   **SC-003**: Extension Host 端無硬編碼中文字串（MCP 工具除外），可透過搜尋驗證
-   **SC-004**: 所有 `getLocalizedMessage()` 呼叫都提供英文 fallback 參數（可透過程式碼審查驗證）
-   **SC-005**: 新增的 i18n 常數檔案涵蓋所有訊息鍵，且有完整類型定義（可透過編譯驗證）
-   **SC-006**: 15 種語言的翻譯檔案都包含所有新增的訊息鍵（可透過現有 `npm run validate:i18n` 驗證）

## Assumptions

-   現有 WebView 端的翻譯機制運作正常，問題僅在 Extension Host 端
-   現有 15 種語言的翻譯檔案結構正確，只需新增缺少的鍵值
-   MCP 工具主要供 AI 使用，保持英文不影響使用者體驗
-   `LocaleService` 的依賴注入模式已建立，可直接擴展使用
