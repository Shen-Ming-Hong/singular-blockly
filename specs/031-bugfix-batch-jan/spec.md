# Feature Specification: January 2026 Bugfix Batch

**Feature Branch**: `031-bugfix-batch-jan`  
**Created**: 2026-01-20  
**Status**: Draft  
**Input**: User description: "Fix 4 bugs: CyberBrick multiple main blocks deletion, backup preview URI error, restore backup missing auto_restore, and missing CONTROLS_REPEAT_INPUT_DO translation key"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Delete Duplicate Main Program Blocks (Priority: P1)

使用者在 CyberBrick 或 Arduino 模式下，意外複製或從舊專案載入了多個主程式積木（`micropython_main` 或 `arduino_setup_loop`），需要能夠刪除多餘的積木以正常使用編輯器。

**Why this priority**: 多個主程式積木會導致無法正常編輯工作區，影響所有 CyberBrick/Arduino 使用者的核心工作流程。

**Independent Test**: 可透過建立包含多個 `micropython_main` 的專案檔案，載入後驗證能否刪除多餘積木。

**Acceptance Scenarios**:

1. **Given** 工作區有 2 個 `micropython_main` 積木, **When** 使用者右鍵點擊任一積木選擇刪除, **Then** 該積木成功被刪除且不顯示錯誤
2. **Given** 工作區只有 1 個 `micropython_main` 積木, **When** 使用者嘗試刪除該積木, **Then** 刪除選項不可用或積木無法被刪除（保護最後一個）
3. **Given** 使用者在 CyberBrick 模式且工作區已有 1 個 `micropython_main`, **When** 使用者嘗試從工具箱拖曳第二個 `micropython_main`, **Then** 操作被阻止（工具箱中該積木變灰或不可拖曳）
4. **Given** 使用者在 Arduino 模式, **When** 對 `arduino_setup_loop` 積木執行相同操作, **Then** 行為與 CyberBrick 的 `micropython_main` 一致

---

### User Story 2 - Preview Backup File Successfully (Priority: P2)

使用者想要預覽備份檔案的內容，點擊預覽按鈕後應該在 VSCode 中開啟預覽視窗（`blocklyPreview.html`）並載入對應備份。

**Why this priority**: 備份預覽功能完全無法使用，但使用者可透過手動開啟檔案作為暫時替代方案。

**Independent Test**: 點擊備份管理中的預覽按鈕，驗證預覽視窗是否正確開啟並載入積木。

**Acceptance Scenarios**:

1. **Given** 使用者有一個名為 `auto_20260115_180409` 的備份檔案, **When** 使用者點擊該備份的預覽按鈕, **Then** VSCode 成功開啟備份預覽視窗並載入 `blockly/backup/auto_20260115_180409.json`
2. **Given** 使用者點擊預覽按鈕, **When** 檔案路徑包含空格或特殊字元, **Then** 預覽視窗仍能正確開啟並載入內容

---

### User Story 3 - Auto Backup Before Restore (Priority: P2)

使用者還原備份前，系統應自動備份當前工作區狀態，以防還原錯誤備份時能夠回復。

**Why this priority**: 還原錯誤備份會導致當前工作永久丟失，資料安全性至關重要。

**Independent Test**: 執行還原操作後，檢查是否有新的 `auto_restore_*` 備份檔案產生。

**Acceptance Scenarios**:

1. **Given** 使用者有當前工作進度且選擇還原備份 `backup_test`, **When** 使用者確認還原, **Then** 系統在還原前建立 `blockly/backup/auto_restore_YYYYMMDD_HHMMSS.json` 備份
2. **Given** 系統建立了 `auto_restore_*` 備份, **When** 還原完成, **Then** 備份管理列表中可看到該自動備份檔案
3. **Given** 當前 `main.json` 不存在（新專案）, **When** 使用者還原備份, **Then** 跳過自動備份步驟直接還原

---

### User Story 4 - Correct Translation for Loop Blocks (Priority: P3)

使用者將語言切換至英文後，while/repeat 等迴圈積木應顯示英文 "do" 而非殘留的中文「執行」。此問題可能不只出現在單一積木，需要全盤檢查所有 Blockly 內建積木的翻譯鍵。

**Why this priority**: 翻譯問題影響非中文使用者體驗，但不影響功能使用。

**Independent Test**: 切換到英文模式，檢查迴圈積木的 "do" 標籤顯示；執行翻譯掃描工具檢查所有缺失鍵。

**Acceptance Scenarios**:

1. **Given** VSCode 語言設為英文, **When** 使用者開啟 Blockly 編輯器並拖曳 `controls_whileUntil` 積木, **Then** 積木顯示 "do" 而非「執行」
2. **Given** 使用者從中文切換至英文, **When** 頁面重新載入, **Then** 所有迴圈積木的 "do" 標籤顯示為英文
3. **Given** 使用者語言為日文/韓文/德文等其他語言, **When** 使用迴圈積木, **Then** 顯示對應語言的 "do" 翻譯
4. **Given** 執行 `npm run scan:blockly-msg` 掃描工具, **When** 掃描完成, **Then** 報告列出所有專案使用但缺失翻譯的 Blockly.Msg 鍵
5. **Given** 掃描報告列出缺失的翻譯鍵, **When** 開發者補充翻譯, **Then** 所有 15 個語言檔案都包含這些鍵的正確翻譯

---

### User Story 5 - Sync Preview Language with Editor (Priority: P3)

使用者在主編輯器透過地球圖示切換語言時，所有已開啟的備份預覽視窗也應同步更新語言，確保預覽積木與 UI 文字一致。

**Why this priority**: 預覽視窗語言不同步會造成理解混亂，且使用者容易誤判積木語意。

**Independent Test**: 開啟任一備份預覽視窗，切換語言後確認預覽視窗的積木與標題文字同步更新。

**Acceptance Scenarios**:

1. **Given** 使用者已開啟一個備份預覽視窗, **When** 在主編輯器切換語言, **Then** 預覽視窗的標題與介面文字同步更新
2. **Given** 使用者已開啟一個備份預覽視窗, **When** 在主編輯器切換語言, **Then** 預覽視窗中的積木文字同步更新為新語言
3. **Given** 使用者未開啟任何預覽視窗, **When** 在主編輯器切換語言, **Then** 系統不產生錯誤且不影響主編輯器

### Edge Cases

- 當使用者透過 Ctrl+V 快速貼上多個主程式積木時，系統如何處理？
    - **處理策略**: `maxInstances` 會在貼上時自動阻止超過上限的積木建立；若舊專案載入導致超限，透過動態 `deletable` 控制讓使用者手動刪除
- 還原備份時 backup 目錄不存在怎麼辦？
    - **處理策略**: `FileService.copyFile()` 會自動建立父目錄；若來源備份檔案不存在則顯示錯誤訊息並中止還原
- 翻譯檔案格式錯誤時如何 fallback？
    - **處理策略**: `languageManager.getMessage()` 接受第二個參數作為 fallback 字串，確保即使翻譯鍵缺失也能顯示預設訊息

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統 MUST 使用 Blockly 的 `maxInstances` 選項限制 `micropython_main` 和 `arduino_setup_loop` 積木各只能有一個
- **FR-002**: 當工作區存在多個主程式積木時，系統 MUST 允許使用者刪除多餘的積木
- **FR-003**: 當工作區只剩一個主程式積木時，系統 MUST 保護該積木不被刪除
- **FR-004**: 偵測到多個主程式積木時，系統 SHOULD 顯示 Toast 警告訊息提醒使用者
- **FR-005**: 備份預覽功能 MUST 使用預覽視窗（`blocklyPreview.html`）顯示備份內容，而非直接開啟原始 JSON 檔案
- **FR-006**: 還原備份確認後，系統 MUST 在覆蓋 `main.json` 前建立 `auto_restore_YYYYMMDD_HHMMSS.json` 備份
- **FR-007**: 所有 15 個語言翻譯檔案 MUST 包含 `CONTROLS_REPEAT_INPUT_DO` 及其他掃描工具識別出的缺失翻譯鍵
- **FR-008**: 系統 MUST 提供 Blockly.Msg 翻譯鍵掃描工具（`npm run scan:blockly-msg`），全盤檢查所有 Blockly 內建積木使用的翻譯鍵是否在專案翻譯檔案中定義
- **FR-009**: 掃描工具 MUST 輸出缺失報告，包含：缺失的鍵名、該鍵的英文預設值、受影響的積木類型
- **FR-010**: 當語言偏好更新時，系統 MUST 同步更新所有已開啟的備份預覽視窗語言

### Key Entities

- **Main Program Block**: 代表程式入口點的積木（CyberBrick: `micropython_main`, Arduino: `arduino_setup_loop`）
- **Auto Restore Backup**: 還原前自動建立的備份，命名格式 `auto_restore_YYYYMMDD_HHMMSS.json`
- **Translation Key**: Blockly.Msg 中的多語言字串鍵值，如 `CONTROLS_REPEAT_INPUT_DO`

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者可在 5 秒內成功刪除多餘的主程式積木
- **SC-002**: 備份預覽功能 100% 成功開啟預覽視窗並載入備份內容
- **SC-003**: 每次還原備份操作都產生一個 `auto_restore_*` 備份檔案
- **SC-004**: 所有 15 個語言的 Blockly 內建積木顯示正確翻譯（0 個殘留中文或未翻譯的鍵）
- **SC-005**: `npm run scan:blockly-msg` 腳本能正確識別所有缺失的 Blockly.Msg 翻譯鍵
- **SC-006**: 掃描報告識別的所有缺失鍵都已補充到 15 個語言翻譯檔案中
- **SC-007**: 語言切換後，所有預覽視窗的 UI 與積木文字在 2 秒內同步更新

## Assumptions

- Blockly 的 `maxInstances` 選項是 workspace inject 時的設定，在切換 board 時可能需要重新處理
- 現有的 backup 目錄結構和命名規則保持不變
- 翻譯檔案格式遵循現有的 `window.languageManager.loadMessages()` 結構

## Clarifications

### Session 2026-01-20

- Q: 邊緣情況（Ctrl+V 貼上多個積木、backup 目錄不存在、翻譯檔案格式錯誤）的處理策略？ → A: 由實作階段根據 Blockly API 行為和技術可行性決定
- Q: 翻譯問題是否只出現在 controls_whileUntil 積木？ → A: 不確定，需建立全盤掃描工具檢查所有 Blockly 內建積木的翻譯鍵
