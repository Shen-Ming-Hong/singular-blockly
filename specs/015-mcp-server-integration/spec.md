# Feature Specification: MCP Server 整合

**Feature Branch**: `015-mcp-server-integration`  
**Created**: 2025-12-11  
**Status**: Draft  
**Input**: User description: "在 VSCode 擴展中整合 MCP Server，讓其他 AI 工具可以查詢積木用法、讀取專案狀態、修改 main.json 並驗證生成結果"

## Clarifications

### Session 2025-12-11

-   Q: MCP Server 與 Extension Host 通訊機制？ → A: FileWatcher 模式 - Extension 監聽 main.json 變更，自動觸發 WebView 重載
-   Q: 檔案寫入安全機制？ → A: 原子寫入 + 備份 - 寫入前備份為 main.json.bak，並在工具說明中告知 AI 可透過此備份回復
-   Q: 成功率指標如何測量？ → A: 整合測試覆蓋 - 撰寫自動化測試模擬 AI 操作，驗證多種積木組合

## User Scenarios & Testing _(mandatory)_

### User Story 1 - AI 協助新增積木 (Priority: P1)

使用者在 VSCode 中請 AI（如 Copilot、Claude）幫忙新增特定功能的積木。AI 透過 MCP 查詢積木用法、讀取目前工作區狀態、修改 main.json、觸發編輯器更新，最後驗證生成的 Arduino 程式碼是否正確。

**Why this priority**: 這是最核心的使用情境，展現 MCP 整合的完整價值鏈 - 從查詢、修改到驗證的完整流程。

**Independent Test**: 可透過在 Copilot Agent Mode 中輸入「幫我加一個超音波感測器」來測試，驗證 main.json 被正確修改且 main.cpp 包含對應程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者開啟一個 Singular Blockly 專案，**When** 使用者請 AI 新增超音波感測器積木，**Then** AI 能查詢積木用法並正確修改 main.json
2. **Given** AI 已修改 main.json，**When** AI 呼叫 refresh_editor，**Then** WebView 重新載入並自動更新 main.cpp
3. **Given** main.cpp 已更新，**When** AI 讀取 main.cpp，**Then** AI 能驗證程式碼包含正確的超音波感測器設定

---

### User Story 2 - AI 查詢積木用法 (Priority: P1)

使用者詢問 AI 某個積木的使用方式，AI 透過 MCP 查詢積木字典，回傳積木的說明、欄位定義、JSON 範例和生成程式碼範例。

**Why this priority**: 這是 AI 能正確操作積木的前提，沒有查詢能力就無法正確產生 main.json。

**Independent Test**: 在 Copilot 中詢問「伺服馬達積木怎麼用」，驗證 AI 能回傳完整的積木用法說明。

**Acceptance Scenarios**:

1. **Given** MCP Server 已啟動，**When** AI 呼叫 get_block_usage("servo_setup")，**Then** 回傳包含欄位說明、JSON 範例、程式碼範例的完整資訊
2. **Given** MCP Server 已啟動，**When** AI 呼叫 search_blocks("馬達")，**Then** 回傳所有與馬達相關的積木列表
3. **Given** MCP Server 已啟動，**When** AI 呼叫 list_blocks_by_category("motors")，**Then** 回傳 motors 分類下的所有積木

---

### User Story 3 - AI 讀取專案配置 (Priority: P1)

AI 在操作前需要了解專案的硬體配置，包括使用的開發板類型、已安裝的函式庫、可用的引腳等資訊。

**Why this priority**: AI 必須知道目標硬體才能產生正確的積木配置，例如 ESP32 和 Arduino Uno 的引腳和 PWM 範圍不同。

**Independent Test**: AI 呼叫 get_platform_config 和 get_board_pins，驗證能取得正確的板卡和引腳資訊。

**Acceptance Scenarios**:

1. **Given** 專案使用 Arduino Uno，**When** AI 呼叫 get_platform_config，**Then** 回傳 board 為 uno 及相關函式庫設定
2. **Given** 板卡為 ESP32，**When** AI 呼叫 get_board_pins("esp32")，**Then** 回傳 ESP32 的數位/類比/PWM 引腳列表
3. **Given** platformio.ini 不存在，**When** AI 呼叫 get_platform_config，**Then** 回傳錯誤訊息說明檔案不存在

---

### User Story 4 - AI 修改現有積木 (Priority: P2)

使用者請 AI 修改現有積木的設定，例如更改伺服馬達的角度或超音波感測器的引腳。

**Why this priority**: 修改是新增之外的重要操作，但相對簡單，優先確保新增功能完整。

**Independent Test**: 請 AI 將現有伺服馬達的角度從 90 度改為 45 度，驗證 main.json 被正確更新。

**Acceptance Scenarios**:

1. **Given** 工作區有一個 servo_write 積木設定為 90 度，**When** AI 呼叫 update_workspace 修改角度為 45，**Then** main.json 中該積木的 ANGLE 欄位更新為 45
2. **Given** AI 修改了積木欄位，**When** AI 呼叫 refresh_editor，**Then** main.cpp 反映新的角度值

---

### User Story 5 - AI 刪除積木 (Priority: P2)

使用者請 AI 移除不需要的積木，AI 能正確從 main.json 中刪除指定積木並維持其他積木的連接關係。

**Why this priority**: 刪除功能是 CRUD 的一部分，但使用頻率較低。

**Independent Test**: 請 AI 移除工作區中的某個感測器積木，驗證 main.json 正確更新且不影響其他積木。

**Acceptance Scenarios**:

1. **Given** 工作區有三個積木 A → B → C 連接在一起，**When** AI 刪除積木 B，**Then** main.json 中 B 被移除，A 和 C 不再相連
2. **Given** 使用者請求刪除不存在的積木 ID，**When** AI 呼叫 update_workspace，**Then** 回傳錯誤訊息說明積木不存在

---

### Edge Cases

-   當 main.json 檔案不存在時，get_workspace_state 應回傳空工作區結構而非錯誤
-   當 WebView 未開啟時，refresh_editor 應回傳提示訊息告知使用者需開啟編輯器
-   當積木字典中找不到指定積木時，get_block_usage 應回傳「積木不存在」而非空結果
-   當 update_workspace 的 JSON 格式錯誤時，應回傳明確的格式錯誤訊息而非覆蓋檔案
-   當板卡類型不支援時，get_board_pins 應列出支援的板卡清單

## Requirements _(mandatory)_

### Functional Requirements

**MCP Server 基礎架構**

-   **FR-001**: 系統必須在 VSCode 擴展啟動時註冊 MCP Server Definition Provider
-   **FR-002**: MCP Server 必須使用 STDIO 傳輸層與 MCP Client 通訊
-   **FR-003**: MCP Server 必須在 VSCode 1.99+ 版本正常運作（使用 registerMcpServerDefinitionProvider API）

**積木查詢工具**

-   **FR-004**: get_block_usage 工具必須回傳指定積木的完整用法，包含名稱、分類、說明、欄位定義、JSON 範例、程式碼範例、相關積木、注意事項
-   **FR-005**: search_blocks 工具必須支援繁體中文和英文關鍵字搜尋
-   **FR-006**: list_blocks_by_category 工具必須回傳指定分類下的所有積木摘要

**工作區操作工具**

-   **FR-007**: get_workspace_state 工具必須回傳 main.json 的完整內容
-   **FR-008**: update_workspace 工具必須支援新增、修改、刪除積木操作
-   **FR-009**: update_workspace 工具必須在寫入前驗證 JSON 結構有效性
-   **FR-010**: refresh_editor 工具必須觸發 WebView 重新載入 main.json 並重新生成 main.cpp
-   **FR-017**: update_workspace 工具必須在寫入前將現有 main.json 備份為 main.json.bak
-   **FR-018**: update_workspace 工具回傳訊息必須告知 AI 可透過 main.json.bak 進行回復
-   **FR-019**: Extension 必須透過 FileWatcher 監聽 main.json 變更，自動觸發 WebView 重新載入（refresh_editor 的實作機制）

**專案配置工具**

-   **FR-011**: get_generated_code 工具必須回傳 main.cpp 的完整內容
-   **FR-012**: get_platform_config 工具必須解析 platformio.ini 並回傳板卡類型和函式庫列表
-   **FR-013**: get_board_pins 工具必須根據板卡類型回傳可用的數位、類比、PWM 引腳列表

**積木字典**

-   **FR-014**: 積木字典必須涵蓋所有自訂積木（約 55 個）
-   **FR-015**: 積木字典必須使用繁體中文撰寫說明
-   **FR-016**: 積木字典必須包含每個積木的 JSON 結構範例和對應生成的 Arduino 程式碼範例

### Key Entities

-   **積木字典 (Block Dictionary)**: 儲存所有積木的使用說明，包含 name、category、description、fields、json_example、generated_code_example、related_blocks、notes
-   **工作區狀態 (Workspace State)**: main.json 的結構，包含 workspace（Blockly 序列化資料）、board（板卡類型）、theme（主題）
-   **平台配置 (Platform Config)**: platformio.ini 解析結果，包含 board、framework、lib_deps、build_flags
-   **板卡引腳 (Board Pins)**: 各板卡的引腳定義，包含 digital_pins、analog_pins、pwm_pins、interrupt_pins

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: AI 透過 MCP 完成「查詢積木 → 修改 main.json → 更新編輯器 → 驗證 main.cpp」的完整流程，透過自動化整合測試驗證 20 種以上積木組合，通過率達 95%
-   **SC-002**: get_block_usage 對所有 55 個自訂積木都能回傳完整說明
-   **SC-003**: AI 新增單一積木的完整流程（含查詢、修改、驗證）可在 10 秒內完成
-   **SC-004**: refresh_editor 觸發後，WebView 在 2 秒內完成重新載入並更新 main.cpp
-   **SC-005**: 積木字典的繁體中文說明讓開發者能直接審閱確認正確性
-   **SC-006**: MCP Server 在擴展啟動後 3 秒內完成註冊並可接受工具呼叫

## Assumptions

-   使用者已安裝 VSCode 1.99 或更新版本（MCP Server Definition Provider API 需求）
-   專案目錄結構符合 Singular Blockly 標準（blockly/main.json、src/main.cpp、platformio.ini）
-   AI Client（如 GitHub Copilot）已支援 MCP 工具呼叫
-   WebView 已實作接收 reload 訊息並重新載入工作區的功能
