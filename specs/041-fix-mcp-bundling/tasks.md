# Tasks: 修復 MCP SDK 打包問題

**Input**: Design documents from `/specs/041-fix-mcp-bundling/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Tests**: 不包含自動化測試任務。驗證透過編譯檢查、輸出檔案內容檢查和手動端對端測試完成。

**Organization**: 由於本 feature 僅修改單一檔案（`webpack.config.js`），User Story 1（MCP Server 正常啟動）和 User Story 2（Webpack 編譯無錯誤）共享相同的實作變更，因此以實作步驟而非 User Story 組織任務。User Story 3（體積合理）透過驗證任務覆蓋。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: 記錄修改前的基準數據供後續比較

- [x] T001 記錄 `dist/mcp-server.js` 目前檔案大小（基準值）以及執行 `npx @vscode/vsce package` 產生的 `.vsix` 檔案大小（基準值），作為體積比較依據

---

## Phase 2: Implementation — 修改 Webpack 配置 (US1 + US2) 🎯 MVP

**Goal**: 修改 `webpack.config.js` 的 `mcpServerConfig`，讓 MCP SDK 和 zod 完整打包進 `dist/mcp-server.js`

**Independent Test**: 執行 `npm run compile` 確認 exit code 為 0，檢查 `dist/mcp-server.js` 不含外部 `require('@modelcontextprotocol/...')` 呼叫

### Implementation

- [x] T002 [US1] [US2] 移除 `mcpServerConfig.externals` 中的 MCP SDK 和 zod 聲明，僅保留 vscode external，在 `webpack.config.js`
- [x] T003 [US1] [US2] 移除 `mcpServerConfig.resolve.extensionAlias`，替換為自訂 TsJsResolverPlugin resolve plugin（僅對非 node_modules 的 `.js` import 嘗試 `.ts` 解析），在 `webpack.config.js`。實作使用 `resolver.getHook('described-resolve')` hook（修正 plan.md 中建議的 `raw-file` hook，因 `raw-file` 階段 `request.request` 已為空值）
- [x] T004 [US1] [US2] 更新 `mcpServerConfig` 的註解，移除過時的 "MCP server runs as standalone Node.js process with access to node_modules" 說明，在 `webpack.config.js`

**Checkpoint**: webpack.config.js 修改完成，準備進入驗證階段

---

## Phase 3: Verification — 編譯與輸出驗證 (US1 + US2 + US3)

**Goal**: 驗證修改後 webpack 編譯成功、SDK 已被內聯打包、體積在合理範圍內

**Independent Test**: 所有驗證步驟可依序執行，每步驟的預期結果明確

- [x] T005 [US2] 執行 `npm run compile` 確認 exit code 為 0，`extensionConfig` 和 `mcpServerConfig` 均成功編譯
- [x] T006 [US1] [US2] 檢查 `dist/mcp-server.js` 不包含 `require("@modelcontextprotocol` 和 `require("zod")` 的外部呼叫（確認 SDK 已內聯打包）
- [x] T007 [US3] 檢查 `dist/mcp-server.js` 檔案大小是否低於 5 MB 上限
- [x] T008 [US1] 執行 `node dist/mcp-server.js` 確認 MCP Server 可正常啟動（應在 stderr 輸出 Started 訊息）
- [x] T009 [US2] 執行 `npm test` 確認既有測試全部通過，無副作用（449 passing, 1 failing — 既有 flaky test，與本變更無關）
- [x] T012 [US1] [P] 驗證 FR-004：檢查 `dist/mcp-server.js` 中包含來自 `src/mcp/tools/blockQuery.ts` 的實際程式碼（如 `get_block_usage` 字串），確認 resolve plugin 成功將 `.js` import 解析到對應 `.ts` 檔案
- [x] T013 [US1] [US2] [US3] 驗證 FR-007 + tree-shaking 安全性：執行 `npm run package`（production mode），然後 (1) 檢查 `dist/mcp-server.js` 不含外部 `require("@modelcontextprotocol`)，(2) 執行 `node dist/mcp-server.js` 確認啟動正常，(3) dev mode `npm run compile` 增量編譯無錯誤
- [x] T014 [US3] 驗證 `.vsix` 體積增幅：執行 `npx @vscode/vsce package` 打包，比較 `.vsix` 大小與 T001 基準值，增幅 14.5% 低於 20% 上限

**Checkpoint**: 所有驗證通過，修復完成

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 確保修改不影響其他部分並更新文件

- [x] T010 確認 `extensionConfig`（主 extension bundle）的 `dist/extension.js` 未受影響（內容不變或僅因重新編譯而有 sourcemap 差異）
- [x] T011 執行 quickstart.md 中的完整驗證流程確認一致性

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 無依賴，立即開始
- **Phase 2 (Implementation)**: 依賴 Phase 1 完成（需要基準數據）
    - T002 → T003 → T004：順序執行（均修改同一檔案 `webpack.config.js`）
- **Phase 3 (Verification)**: 依賴 Phase 2 完成
    - T005 必須首先完成（編譯成功後才能檢查輸出）
    - T006、T007、T008、T009、T012 可在 T005 後平行執行
    - T013 需在 T005 後執行（production build 驗證）
    - T014 依賴 T013 完成（需 production build 產出的 `.vsix`）
- **Phase 4 (Polish)**: 依賴 Phase 3 完成

### User Story Mapping

- **US1（MCP Server 正常啟動）**: T002, T003, T004, T006, T008, T012, T013
- **US2（Webpack 編譯無錯誤）**: T002, T003, T004, T005, T006, T009, T013
- **US3（體積合理）**: T007, T013, T014

### Parallel Opportunities

```text
# Phase 3 中可平行執行的驗證任務（T005 完成後）：
T006: 檢查外部 require 呼叫
T007: 檢查檔案大小
T008: MCP Server 啟動測試
T009: npm test
T012: 驗證 .js→.ts resolve 正確性

# T013 需在 T005 後執行（需先確認 compile 通過再測 production build）
# T014 依賴 T013 完成（需 production build 產出）
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. T001: 記錄基準數據
2. T002-T004: 修改 webpack.config.js（核心修復，~15 分鐘）
3. T005-T009: 驗證修復結果
4. **STOP and VALIDATE**: 確認所有驗證通過

### Total Effort

- **任務總數**: 14
- **US1 任務數**: 7（T002, T003, T004, T006, T008, T012, T013）
- **US2 任務數**: 7（T002, T003, T004, T005, T006, T009, T013）
- **US3 任務數**: 3（T007, T013, T014）
- **平行機會**: Phase 3 中 5 項驗證任務可平行執行（T006-T009, T012），T013/T014 順序執行
- **預估時間**: 20-40 分鐘（含驗證）
- **修改檔案**: 僅 `webpack.config.js`

---

## Notes

- 所有 Phase 2 任務修改同一檔案，必須順序執行
- 不需要新增任何源碼檔案或 npm 依賴
- 自訂 resolve plugin 的程式碼請參考 plan.md 的「實作方案」章節
- 驗證指令請參考 quickstart.md
