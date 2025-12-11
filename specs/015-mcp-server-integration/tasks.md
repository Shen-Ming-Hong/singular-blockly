# Tasks: MCP Server 整合

**Input**: Design documents from `/specs/015-mcp-server-integration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/mcp-tools.json ✅, quickstart.md ✅

**Tests**: 整合測試將包含於各 User Story 的實作中，以驗證完整流程。

**Organization**: 任務依 User Story 組織，確保每個故事可獨立實作和測試。

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可平行執行（不同檔案，無依賴）
-   **[Story]**: 所屬 User Story（例如 US1, US2, US3）
-   描述中包含確切檔案路徑

---

## Phase 1: Setup（專案初始化）

**Purpose**: 專案設定與基礎結構建立

-   [ ] T001 安裝 MCP SDK 依賴：`npm install @modelcontextprotocol/sdk zod`
-   [ ] T002 [P] 更新 package.json 添加 mcpServerDefinitionProviders 貢獻點
-   [ ] T003 [P] 建立 MCP 模組目錄結構 src/mcp/ 與 src/mcp/tools/
-   [ ] T004 [P] 更新 tsconfig.json 確保 MCP 模組正確編譯
-   [ ] T005 [P] 更新 webpack.config.js 添加 MCP Server 打包配置

---

## Phase 2: Foundational（阻塞性前置任務）

**Purpose**: 所有 User Story 依賴的核心基礎設施

**⚠️ 關鍵**: 此階段必須完成後才能開始任何 User Story 工作

-   [ ] T006 建立積木字典資料結構與載入器 in src/mcp/blockDictionary.ts
-   [ ] T007 建立 MCP Server 主入口，使用 STDIO Transport in src/mcp/mcpServer.ts
-   [ ] T008 建立 MCP Provider 註冊模組，實作 McpServerDefinitionProvider in src/mcp/mcpProvider.ts
-   [ ] T009 修改 src/extension.ts 在 activate 中呼叫 registerMcpProvider
-   [ ] T010 [P] 建立工具索引匯出檔案 src/mcp/tools/index.ts
-   [ ] T011 建立 FileWatcher 服務監聽 main.json 變更 in src/mcp/fileWatcher.ts
-   [ ] T012 [P] 建立積木字典生成腳本 scripts/generate-block-dictionary.js
-   [ ] T013 執行 generate-block-dictionary 生成初始 src/mcp/block-dictionary.json

**Checkpoint**: 基礎設施就緒 - 可開始平行實作 User Stories

---

## Phase 3: User Story 2 - AI 查詢積木用法 (Priority: P1) 🎯 MVP

**Goal**: AI 能透過 MCP 查詢積木字典，取得積木用法、欄位、範例

**Independent Test**: 在 Copilot 中詢問「伺服馬達積木怎麼用」，驗證能回傳完整說明

### Implementation for User Story 2

-   [ ] T014 [US2] 實作 get_block_usage 工具：查詢積木用法 in src/mcp/tools/blockQuery.ts
-   [ ] T015 [US2] 實作 search_blocks 工具：關鍵字搜尋積木（含中英文） in src/mcp/tools/blockQuery.ts
-   [ ] T016 [US2] 實作 list_blocks_by_category 工具：列出分類積木 in src/mcp/tools/blockQuery.ts
-   [ ] T017 [US2] 實作積木搜尋索引建立邏輯 in src/mcp/blockDictionary.ts
-   [ ] T018 [US2] 添加多語言支援（zh-hant 預設）至積木查詢工具
-   [ ] T019 [US2] 註冊 blockQuery 工具至 MCP Server in src/mcp/mcpServer.ts

**Checkpoint**: User Story 2 完成 - AI 可查詢任何積木的用法

---

## Phase 4: User Story 3 - AI 讀取專案配置 (Priority: P1)

**Goal**: AI 能取得專案的硬體配置，包括板卡、引腳、函式庫

**Independent Test**: AI 呼叫 get_platform_config 和 get_board_pins，驗證取得正確資訊

### Implementation for User Story 3

-   [ ] T020 [US3] 實作 get_platform_config 工具：解析 platformio.ini in src/mcp/tools/platformConfig.ts
-   [ ] T021 [US3] 實作 get_board_pins 工具：回傳板卡引腳配置 in src/mcp/tools/platformConfig.ts
-   [ ] T022 [US3] 實作 get_generated_code 工具：讀取 main.cpp in src/mcp/tools/platformConfig.ts
-   [ ] T023 [US3] 整合現有 board_configs.js 資料至板卡配置查詢
-   [ ] T024 [US3] 處理 platformio.ini 不存在的錯誤情況
-   [ ] T025 [US3] 註冊 platformConfig 工具至 MCP Server in src/mcp/mcpServer.ts

**Checkpoint**: User Story 3 完成 - AI 可讀取任何專案配置

---

## Phase 5: User Story 1 - AI 協助新增積木 (Priority: P1)

**Goal**: AI 能完成「查詢 → 修改 → 刷新 → 驗證」完整流程

**Independent Test**: 在 Copilot Agent Mode 輸入「幫我加一個超音波感測器」，驗證完整流程

### Implementation for User Story 1

-   [ ] T026 [US1] 實作 get_workspace_state 工具：讀取 main.json in src/mcp/tools/workspaceOps.ts
-   [ ] T027 [US1] 實作 update_workspace 工具的 'add' action：新增積木 in src/mcp/tools/workspaceOps.ts
-   [ ] T028 [US1] 實作 update_workspace 的 JSON 結構驗證邏輯
-   [ ] T029 [US1] 實作 update_workspace 的備份機制：寫入前備份為 main.json.bak
-   [ ] T030 [US1] 實作 refresh_editor 工具：通知 WebView 重載 in src/mcp/tools/workspaceOps.ts
-   [ ] T031 [US1] 修改 src/webview/messageHandler.ts 處理 'reloadWorkspace' 命令
-   [ ] T032 [US1] 修改 src/webview/webviewManager.ts 整合 FileWatcher 觸發重載
-   [ ] T033 [US1] 實作 FileWatcher 去抖動邏輯（500ms debounce）
-   [ ] T034 [US1] 實作避免內部更新觸發 FileWatcher 的機制
-   [ ] T035 [US1] 註冊 workspaceOps 工具至 MCP Server in src/mcp/mcpServer.ts

**Checkpoint**: User Story 1 完成 - AI 可新增積木並觸發編輯器更新

---

## Phase 6: User Story 4 - AI 修改現有積木 (Priority: P2)

**Goal**: AI 能修改現有積木的欄位值，如角度、引腳

**Independent Test**: 請 AI 將伺服馬達角度從 90 度改為 45 度

### Implementation for User Story 4

-   [ ] T036 [US4] 實作 update_workspace 的 'modify' action：修改積木欄位 in src/mcp/tools/workspaceOps.ts
-   [ ] T037 [US4] 實作積木 ID 查找與欄位更新邏輯
-   [ ] T038 [US4] 實作修改操作的欄位驗證（確認欄位存在於積木定義）
-   [ ] T039 [US4] 處理修改不存在積木的錯誤情況

**Checkpoint**: User Story 4 完成 - AI 可修改任何積木的欄位

---

## Phase 7: User Story 5 - AI 刪除積木 (Priority: P2)

**Goal**: AI 能刪除指定積木並維持其他積木的連接關係

**Independent Test**: 請 AI 移除某個感測器積木，驗證不影響其他積木

### Implementation for User Story 5

-   [ ] T040 [US5] 實作 update_workspace 的 'remove' action：刪除積木 in src/mcp/tools/workspaceOps.ts
-   [ ] T041 [US5] 實作多積木刪除邏輯（批次刪除）
-   [ ] T042 [US5] 處理刪除連接中積木時的連接關係處理
-   [ ] T043 [US5] 處理刪除不存在積木的錯誤情況

**Checkpoint**: User Story 5 完成 - AI 可刪除任何積木

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 優化與跨 User Story 的改進

-   [ ] T044 [P] 完善積木字典涵蓋所有 55 個自訂積木
-   [ ] T045 [P] 添加結構化日誌記錄 MCP 工具調用 in src/mcp/tools/\*.ts
-   [ ] T046 [P] 實作 update_workspace 的 'replace' action：完整替換工作區狀態
-   [ ] T047 Edge Case：處理 main.json 不存在時回傳空工作區
-   [ ] T048 Edge Case：處理 WebView 未開啟時 refresh_editor 的提示訊息
-   [ ] T049 Edge Case：處理積木字典找不到積木時的錯誤訊息
-   [ ] T050 Edge Case：處理不支援板卡類型時列出支援清單
-   [ ] T051 [P] 建立 MCP 工具單元測試 in src/test/mcp/blockQuery.test.ts
-   [ ] T052 [P] 建立 MCP 工具單元測試 in src/test/mcp/workspaceOps.test.ts
-   [ ] T053 [P] 建立 MCP 工具單元測試 in src/test/mcp/platformConfig.test.ts
-   [ ] T054 建立整合測試驗證完整工作流程 in src/test/integration/mcpIntegration.test.ts
-   [ ] T055 更新 README.md 添加 MCP Server 功能說明
-   [ ] T056 執行 quickstart.md 驗證流程確認功能正常

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Setup (Phase 1)**: 無依賴 - 可立即開始
-   **Foundational (Phase 2)**: 依賴 Setup 完成 - **阻塞所有 User Stories**
-   **User Stories (Phase 3-7)**: 均依賴 Foundational 完成
    -   可依優先順序（P1 → P2）執行
    -   或有人力時可平行進行
-   **Polish (Phase 8)**: 依賴所有核心 User Stories 完成

### User Story Dependencies

-   **User Story 2 (P1)**: Foundational 完成後可立即開始 - 無其他故事依賴
-   **User Story 3 (P1)**: Foundational 完成後可立即開始 - 無其他故事依賴
-   **User Story 1 (P1)**: 建議在 US2 和 US3 之後，因需要查詢和配置功能驗證完整流程
-   **User Story 4 (P2)**: 依賴 US1 的 workspaceOps 基礎實作
-   **User Story 5 (P2)**: 依賴 US1 的 workspaceOps 基礎實作

### Within Each User Story

-   模型/資料結構優先於服務邏輯
-   服務邏輯優先於 MCP 工具註冊
-   核心實作優先於錯誤處理
-   Story 完成後再進行下一優先級

### Parallel Opportunities

-   Phase 1 所有標記 [P] 的任務可平行執行
-   Phase 2 中 T006-T008 需依序，T010/T012 可平行
-   User Story 2 和 3 可完全平行執行
-   User Story 4 和 5 可完全平行執行（在 US1 完成後）
-   Phase 8 大部分測試任務可平行執行

---

## Parallel Example: Phase 1 Setup

```bash
# 可同時執行的 Setup 任務:
Task T002: "更新 package.json 添加 mcpServerDefinitionProviders 貢獻點"
Task T003: "建立 MCP 模組目錄結構 src/mcp/ 與 src/mcp/tools/"
Task T004: "更新 tsconfig.json 確保 MCP 模組正確編譯"
Task T005: "更新 webpack.config.js 添加 MCP Server 打包配置"
```

---

## Parallel Example: User Story 2 & 3

```bash
# User Story 2 和 3 可同時由不同開發者進行:

# Developer A - User Story 2 (積木查詢):
Task T014: "實作 get_block_usage 工具"
Task T015: "實作 search_blocks 工具"
Task T016: "實作 list_blocks_by_category 工具"

# Developer B - User Story 3 (專案配置):
Task T020: "實作 get_platform_config 工具"
Task T021: "實作 get_board_pins 工具"
Task T022: "實作 get_generated_code 工具"
```

---

## Implementation Strategy

### MVP First (User Story 2 + 3 + 1 Core)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（關鍵 - 阻塞所有故事）
3. 完成 Phase 3: User Story 2（積木查詢）
4. 完成 Phase 4: User Story 3（專案配置）
5. 完成 Phase 5: User Story 1 核心（新增積木）
6. **停止驗證**: 測試完整流程
7. 部署/展示 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2.  - User Story 2 → AI 可查詢積木 → 驗證
3.  - User Story 3 → AI 可讀取配置 → 驗證
4.  - User Story 1 → AI 可新增積木 → **MVP 完成！**
5.  - User Story 4 → AI 可修改積木 → 驗證
6.  - User Story 5 → AI 可刪除積木 → 驗證
7.  - Polish → 完整功能！

### Task Count Summary

| Phase        | 任務數 | 可平行 |
| ------------ | ------ | ------ |
| Setup        | 5      | 4      |
| Foundational | 8      | 3      |
| User Story 2 | 6      | 0      |
| User Story 3 | 6      | 0      |
| User Story 1 | 10     | 0      |
| User Story 4 | 4      | 0      |
| User Story 5 | 4      | 0      |
| Polish       | 13     | 9      |
| **Total**    | **56** | **16** |

---

## Notes

-   [P] 任務 = 不同檔案，無依賴
-   [Story] 標籤將任務對應至特定 User Story 以便追蹤
-   每個 User Story 應可獨立完成和測試
-   每個任務或邏輯群組完成後提交
-   可在任何 Checkpoint 停止驗證 Story 獨立性
-   避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 依賴
