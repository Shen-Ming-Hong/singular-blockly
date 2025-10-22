# Feature Specification: 專案安全防護機制

**Feature Branch**: `010-project-safety-guard`  
**Created**: 2025-10-22  
**Status**: Draft  
**Input**: User description: "當使用者在其他專案當中,不小心按到目前擴展的按鈕會打開 blockly 編輯器,然後破壞其他專案的檔案目錄結構,有沒有適當的方法在開啟編輯季之前可以先做偵測或是警告使用者,避免誤觸造成其他專案的檔案結構被破壞"

## Clarifications

### Session 2025-10-22

-   Q: 警告對話框的確切訊息文案(需符合國小學童理解能力) → A: 「這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?」
-   Q: 空工作區的處理方式 → A: 顯示友善提示「請先開啟一個資料夾,才能使用 Blockly 積木喔!」然後中止操作(系統已有類似實作)
-   Q: 「不再顯示」選項的位置 → A: 作為核取方塊選項,對話框下方顯示「☑ 不要再提醒我」核取方塊,配合「繼續」或「取消」按鈕

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 非 Blockly 專案偵測與警告 (Priority: P1)

當使用者在非 Singular Blockly 專案中誤觸擴展按鈕時,系統應在開啟編輯器前偵測專案類型並顯示警告對話框,讓使用者確認是否要在此專案中建立 Blockly 檔案結構。

**為什麼是 P1 優先級**: 這是核心安全功能,直接解決使用者最關心的問題——防止誤操作破壞現有專案。此功能獨立運作即可提供完整價值。

**獨立測試**: 可以透過在任意非 Blockly 專案(如 Node.js、Python、Java 專案)中點擊擴展按鈕來測試,驗證是否顯示警告並正確阻止預設行為。

**驗收場景**:

1. **Given** 使用者在沒有 `blockly/` 資料夾的 VSCode 工作區中, **When** 點擊 "開啟 Blockly 編輯器" 命令, **Then** 系統顯示警告對話框,訊息為「這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?」並提供「繼續」與「取消」按鈕
2. **Given** 警告對話框顯示中, **When** 使用者點擊「取消」, **Then** 編輯器不開啟,專案檔案結構完全不變
3. **Given** 警告對話框顯示中, **When** 使用者點擊「繼續」, **Then** 系統建立 Blockly 檔案結構並開啟編輯器
4. **Given** 使用者在已有 `blockly/` 資料夾的專案中, **When** 點擊開啟編輯器命令, **Then** 直接開啟編輯器,不顯示任何警告

---

### User Story 2 - 智慧專案類型識別 (Priority: P2)

系統應能識別常見專案類型(如 Node.js、Python、Java、.NET 等),並在警告訊息中顯示偵測到的專案類型,提供更具脈絡的警告資訊。

**為什麼是 P2 優先級**: 提升使用者體驗,讓警告更具脈絡性,但即使沒有此功能,P1 的通用警告已足夠保護專案安全。

**獨立測試**: 在不同類型專案(含 `package.json`、`pom.xml`、`requirements.txt` 等)中測試,驗證警告訊息是否正確顯示偵測到的專案類型。

**驗收場景**:

1. **Given** 使用者在含有 `package.json` 的 Node.js 專案中, **When** 觸發警告對話框, **Then** 訊息顯示「偵測到 Node.js 專案」
2. **Given** 使用者在含有 `requirements.txt` 的 Python 專案中, **When** 觸發警告對話框, **Then** 訊息顯示「偵測到 Python 專案」
3. **Given** 使用者在含有 `pom.xml` 的 Java Maven 專案中, **When** 觸發警告對話框, **Then** 訊息顯示「偵測到 Java Maven 專案」
4. **Given** 使用者在無法識別類型的專案中, **When** 觸發警告對話框, **Then** 訊息顯示「偵測到非 Blockly 專案」

---

### User Story 3 - 使用者偏好記憶 (Priority: P3)

當使用者在特定工作區選擇「不再顯示此警告」時,系統記住此偏好設定,未來在同一工作區不再顯示警告。

**為什麼是 P3 優先級**: 這是便利性功能,適用於使用者確實想在非 Blockly 專案中使用擴展的情境,但不影響核心安全功能。

**獨立測試**: 在同一專案中多次觸發命令,驗證勾選「不再顯示」後是否確實不再出現警告。

**驗收場景**:

1. **Given** 警告對話框顯示中, **When** 使用者勾選「☑ 不要再提醒我」核取方塊並點擊「繼續」, **Then** 系統記錄此工作區路徑的偏好設定
2. **Given** 使用者已在某工作區選擇「不再顯示」, **When** 再次在同一工作區點擊開啟編輯器命令, **Then** 直接開啟編輯器不顯示警告
3. **Given** 使用者在工作區 A 選擇「不再顯示」, **When** 在不同工作區 B 點擊開啟編輯器命令, **Then** 工作區 B 仍顯示警告(設定不跨工作區)

---

### Edge Cases

-   當工作區沒有開啟任何資料夾時(空工作區)觸發命令會發生什麼?
-   當使用者在 multi-root workspace(多根工作區)中觸發命令時,如何決定要檢查哪個資料夾?
-   當 `blockly/` 資料夾存在但為空或損壞時,系統如何處理?
-   當使用者快速連續點擊開啟命令時,是否會顯示多個警告對話框?
-   當使用者在警告對話框顯示期間關閉 VSCode 時,狀態如何處理?

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統在執行「開啟 Blockly 編輯器」命令時,必須先檢查當前工作區是否存在 `blockly/` 資料夾
-   **FR-002**: 若工作區不存在 `blockly/` 資料夾,系統必須顯示警告對話框並阻止預設編輯器開啟行為,對話框訊息為:「這個專案還沒有 Blockly 積木。如果繼續,會在這裡建立 blockly 資料夾和檔案。要繼續嗎?」
-   **FR-003**: 警告對話框必須提供「繼續」與「取消」兩個明確按鈕選項
-   **FR-004**: 使用者點擊「取消」時,系統必須完全中止開啟編輯器的操作,不對檔案系統進行任何變更
-   **FR-005**: 使用者點擊「繼續」時,系統必須繼續原有的編輯器開啟流程(包含建立 Blockly 結構)
-   **FR-006**: 若工作區已存在 `blockly/` 資料夾,系統必須直接開啟編輯器,不顯示任何警告
-   **FR-007**: 系統必須能識別至少五種常見專案類型(Node.js、Python、Java、.NET、Go)並在警告訊息中顯示
-   **FR-008**: 警告對話框必須提供「繼續」、「取消」、「不再提醒」三個明確按鈕選項 _(注意:原規格設計為核取方塊,研究結果 R1 改為三按鈕以符合 VSCode API 限制)_
-   **FR-009**: 使用者點擊「不再提醒」按鈕時,系統必須將此偏好設定儲存到工作區設定中並繼續開啟編輯器
-   **FR-010**: 系統必須在每次執行命令時檢查工作區偏好設定,若已設定「不再顯示」則跳過警告
-   **FR-011**: 當工作區沒有開啟資料夾時,系統必須顯示友善提示訊息「請先開啟一個資料夾,才能使用 Blockly 積木喔!」並中止操作(注意:現有系統已有類似實作,需整合一致)
-   **FR-012**: 在 multi-root workspace 中,系統必須檢查第一個根資料夾的 Blockly 結構(技術說明:使用 VSCode API `workspaceFolders[0]` 取得第一個根資料夾)
-   **FR-013**: 系統必須在警告對話框開啟時設定旗標,防止重複顯示對話框(技術說明:使用模組級別 `isDialogShowing: boolean` 變數實作防重入機制)

### Key Entities

-   **WorkspaceValidation**: 代表專案工作區的驗證狀態,包含屬性:是否為 Blockly 專案、偵測到的專案類型、是否已設定不顯示警告
-   **ProjectTypeDetector**: 負責識別專案類型的邏輯單元,根據特定檔案(如 `package.json`、`pom.xml`)判斷專案性質
-   **UserPreference**: 使用者針對特定工作區的警告偏好設定,儲存在 VSCode workspace settings 中

### Assumptions

-   假設目標使用者群為國小學童,所有使用者介面文案應使用簡單易懂的用語,避免艱深術語(如「初始化」、「結構」等)
-   假設使用者主要在單一工作區資料夾環境中使用擴展(multi-root workspace 為次要情境)
-   假設 `blockly/` 資料夾的存在即代表此為 Blockly 專案(不需進一步驗證資料夾內容完整性)
-   假設警告對話框使用標準 VSCode `showWarningMessage` API 即可滿足需求(不需自訂 WebView UI)
-   假設使用者偏好設定儲存於 VSCode workspace settings(`.vscode/settings.json`)而非 global settings,以確保不跨專案
-   假設專案類型識別基於檔案存在性檢查(如 `package.json` 存在即為 Node.js 專案),不深入解析檔案內容
-   假設警告對話框顯示時間不超過 100 毫秒,不影響使用者體驗(基於 VSCode API 的標準效能)

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 使用者在非 Blockly 專案中誤觸命令時,100% 會收到明確警告並有機會取消操作
-   **SC-002**: 使用者在現有 Blockly 專案中開啟編輯器的操作不受影響,0 秒延遲或額外步驟
-   **SC-003**: 系統能正確識別至少 5 種常見專案類型(Node.js、Python、Java、.NET、Go),識別準確率 95% 以上
-   **SC-004**: 使用者設定「不再顯示」後,在同一工作區的後續操作不再顯示警告,設定持久化成功率 100%
-   **SC-005**: 警告對話框的顯示與回應時間在 100 毫秒內完成,不影響使用者體驗

## Constitution Alignment

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: 功能設計採用簡單的檢查機制(檢查資料夾是否存在)與標準 VSCode 對話框 API,避免複雜邏輯
-   **Modularity**: 專案類型偵測器可獨立模組化,未來可輕鬆擴展支援更多專案類型
-   **Avoid Over-Development**: 功能範圍最小化,專注於核心防護需求,不過度設計(如不追蹤歷史、不建立複雜規則引擎)
-   **Flexibility**: 設計支援未來擴展更多專案類型識別規則,使用者偏好設定機制具彈性
-   **Research-Driven**: 實作時將使用 MCP 工具查詢 VSCode API 最佳實踐(對話框 API、工作區設定 API)
-   **Structured Logging**: 診斷輸出將使用 `log.info/warn/error` 統一記錄檢查結果、使用者選擇等事件
-   **Comprehensive Test Coverage**: 檢查邏輯與對話框處理將設計為可 100% 測試,使用 mock VSCode API
-   **Pure Functions and Modular Architecture**: 專案類型偵測邏輯將實作為純函式,與 UI 層分離
-   **Traditional Chinese Documentation**: 本規格以繁體中文(zh-TW)撰寫,符合要求

This feature specification aligns with Singular Blockly constitution principles:

-   **Simplicity**: Feature design avoids unnecessary complexity and remains maintainable
-   **Modularity**: Implementation plan allows extension without major refactoring
-   **Avoid Over-Development**: Feature scope is minimal and addresses proven user needs
-   **Flexibility**: Design supports multiple boards/languages/configurations as applicable
-   **Research-Driven**: MCP tools will be used to verify library compatibility and best practices during implementation
-   **Structured Logging**: Diagnostic outputs will use standardized logging service
-   **Comprehensive Test Coverage**: Code will be designed for 100% testability with no infinite loops or blocking operations in tests
-   **Pure Functions and Modular Architecture**: Business logic will be separated from side effects with pure functions where possible
-   **Traditional Chinese Documentation**: This specification is written in Traditional Chinese (zh-TW) as required
