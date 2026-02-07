# Feature Specification: 修復 MCP SDK 打包問題

**Feature Branch**: `041-fix-mcp-bundling`  
**Created**: 2026-02-08  
**Status**: Draft  
**Input**: User description: "將 MCP SDK 完整打包進 webpack bundle，修復 extension 安裝後 Cannot find module '@modelcontextprotocol/sdk/server/mcp.js' 的錯誤"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Extension 安裝後 MCP Server 正常啟動 (Priority: P1)

使用者透過 VS Code Marketplace 安裝 Singular Blockly extension 後，開啟任何 Blockly 專案，MCP Server 應能自動啟動並正常回應 AI 工具呼叫，不再出現 `Cannot find module` 錯誤。

**Why this priority**: 這是核心問題 — MCP Server 完全無法啟動意味著所有 AI 輔助功能（積木查詢、平台配置、工作區操作）全部失效，影響所有使用 MCP 功能的使用者。

**Independent Test**: 使用 `vsce package` 打包 `.vsix`，安裝至全新 VS Code 環境，開啟 Blockly 專案後確認 MCP Server 連線狀態正常，不出現模組錯誤。

**Acceptance Scenarios**:

1. **Given** 使用者從 Marketplace 安裝 Singular Blockly extension，**When** 開啟含 `blockly/main.json` 的工作區，**Then** MCP Server 成功啟動，連線狀態顯示為「已連線」
2. **Given** MCP Server 已啟動，**When** AI 工具呼叫 `get_block_usage` 或 `search_blocks`，**Then** 工具正確回傳結果，不出現 `MODULE_NOT_FOUND` 錯誤
3. **Given** 使用者在開發環境（`npm run watch`）執行 extension，**When** 啟動 MCP Server，**Then** 同樣正常運作（開發/生產環境一致性）

---

### User Story 2 - Webpack 編譯流程無錯誤 (Priority: P1)

開發者執行 `npm run compile` 或 `npm run watch` 時，`mcpServerConfig` 的 webpack 編譯應成功完成，不出現靜默失敗（exit code 1 無錯誤訊息）。

**Why this priority**: 編譯失敗會阻擋所有後續開發與發布流程，與 User Story 1 同等重要。

**Independent Test**: 執行 `npm run compile` 確認 exit code 為 0，且 `dist/mcp-server.js` 被正確產生。

**Acceptance Scenarios**:

1. **Given** 開發者 clone 專案並執行 `npm install`，**When** 執行 `npm run compile`，**Then** 兩個 webpack 配置（`extensionConfig` 和 `mcpServerConfig`）都成功編譯，exit code 為 0
2. **Given** webpack 編譯完成，**When** 檢查 `dist/mcp-server.js`，**Then** 檔案中不包含對 `@modelcontextprotocol/sdk` 或 `zod` 的外部 `require()` 呼叫（這些模組已被內聯打包）

---

### User Story 3 - 打包後的 Extension 體積合理 (Priority: P2)

將 MCP SDK 和 zod 完整打包後，`dist/mcp-server.js` 的檔案大小應維持在合理範圍內，不會讓整個 extension 變得過大。

**Why this priority**: 體積影響下載速度和使用體驗，但不影響功能正確性。

**Independent Test**: 打包後比較 `dist/mcp-server.js` 大小，確認在可接受範圍內。

**Acceptance Scenarios**:

1. **Given** 執行 `npm run compile`，**When** 檢查 `dist/mcp-server.js` 的檔案大小，**Then** 大小在合理範圍內（預估增加數百 KB，應低於 5 MB）
2. **Given** 使用 `vsce package` 打包 `.vsix`，**When** 檢查 `.vsix` 總大小，**Then** 總大小不會因本次變更而顯著增長（增幅應低於 20%）

---

### Edge Cases

- `extensionAlias`（`.js` → `.ts`）與 `@modelcontextprotocol/sdk` 的 `exports` map 衝突時，需確保專案自身的 TypeScript 檔案仍能正確解析
- MCP SDK 的 transitive dependencies（如 `eventsource`、`express`、`cors` 等）可能包含動態 `require()` 呼叫，需處理 webpack 的 critical dependency 警告
- 生產模式（`mode: 'production'`）打包時，tree-shaking 可能移除 SDK 中看似未使用但實際需要的模組（如透過 re-export 引入的模組）
- 開發環境 `npm run watch` 觸發增量編譯時，MCP SDK 相關模組的變更偵測應正常運作

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `dist/mcp-server.js` MUST 將 `@modelcontextprotocol/sdk` 的所需模組完整內聯打包，不依賴外部 `node_modules`
- **FR-002**: `dist/mcp-server.js` MUST 將 `zod` 完整內聯打包，不依賴外部 `node_modules`
- **FR-003**: webpack 編譯過程 MUST 不出現靜默失敗（若有錯誤須有明確訊息）
- **FR-004**: 專案自身的 TypeScript 模組間引用（如 `import from './tools/blockQuery.js'`）MUST 仍能正確解析到對應的 `.ts` 檔案
- **FR-005**: `vscode` 模組 MUST 仍保持為 external（由 VS Code 宿主在執行時提供）
- **FR-006**: 本次修改 MUST 不影響 `extensionConfig`（主 extension bundle）的編譯結果與行為
- **FR-007**: 開發環境（`npm run watch`）和生產環境（`npm run package`）的 MCP Server 行為 MUST 一致

### Key Entities

- **mcpServerConfig**: webpack 配置物件，控制 `dist/mcp-server.js` 的打包行為，包含 `externals`、`resolve`、`module` 等設定
- **externals**: webpack 設定，定義哪些模組不被打包而保留為執行時 `require()` 呼叫
- **extensionAlias**: webpack `resolve` 設定，控制模組路徑中 `.js` 副檔名到 `.ts` 的映射解析
- **exports map**: `@modelcontextprotocol/sdk` 的 `package.json` 中定義的模組匯出路徑映射

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者從 Marketplace 安裝 extension 後，MCP Server 能在 5 秒內成功啟動並建立連線
- **SC-002**: `npm run compile` 連續編譯均穩定通過，無靜默失敗
- **SC-003**: 打包後的 `.vsix` 安裝在全新 VS Code 環境中，所有 MCP 工具呼叫（`get_block_usage`、`search_blocks`、`list_blocks_by_category`、`get_workspace_state`）均正常回應
- **SC-004**: 因 MCP Server 模組載入錯誤而產生的使用者問題降為零

## Assumptions

- `extensionConfig`（主 extension bundle）不使用 `extensionAlias` 但能正常編譯，表示 `ts-loader` 已處理 `.js` → `.ts` 的解析
- MCP SDK 的 Server 端模組（`mcp.js`、`stdio.js`）不包含無法被 webpack 處理的動態 `require()` 呼叫
- `.vscodeignore`（未被版本控制追蹤）或 `.gitignore` 的預設行為會排除 `node_modules`，因此 externals 方案在打包後無法運作
- zod 作為 MCP SDK 的 peer dependency，同樣需要被完整打包
