# MCP 與使用者端 Node.js 移除基準

記錄日期：2026-08-12

## 產品入口

- `package.json`：`mcpServerDefinitionProviders`、`singular-blockly.checkMcpStatus`、`singularBlockly.mcp.nodePath`、`singularBlockly.mcp.showStartupWarning`。
- `src/extension.ts`：MCP provider 註冊、Node.js 偵測、啟動警告、MCP status command 與設定 listener。
- `src/mcp/`：server、provider、tools、resources 與 block dictionary。
- `src/services/nodeDetectionService.ts`、`src/services/diagnosticService.ts`、`src/types/nodeDetection.ts`。
- `webpack.config.js`：第二個 MCP bundle 與 dictionary copy。
- `@modelcontextprotocol/sdk` 與只供 MCP 使用的 `zod` 相依。

## 產生器與產品內消費者

- `scripts/generate-block-dictionary.js` 與 `generate:dictionary` script。
- `src/services/shadowSuggestionService.ts` 的 MCP dictionary 讀取路徑。
- `src/test/suite/txtMOutputMetadata.test.ts` 的 MCP dictionary import。

## 使用者與開發者文件

- `README.md`、`AGENTS.md`。
- `docs/specifications/00-technical-foundation/`、`01-architecture/architecture.md`、`05-dependencies/dependency-upgrades.md`、`06-features/mcp-integration.md`、`EVOLUTION.md`、`README.md`、`appendix/glossary.md`。
- `package.nls*.json` 與 `media/locales/*/messages.js` 的 MCP／Node.js 使用者字串。

## 合理保留

- `package.json#engines.node` 與 npm scripts：貢獻者建置、測試及封裝工具鏈。
- 已完成的舊 feature specs 與 CHANGELOG 歷史：保留當時狀態，不代表現行產品介面。
- PlatformIO、mpremote 與 TXT SSH 所需的執行環境及診斷：不屬於 MCP。
