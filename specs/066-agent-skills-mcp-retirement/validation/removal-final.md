# MCP 與使用者端 Node.js 最終移除驗證

驗證日期：2026-08-12

## T001 基準逐項結果

| 基準項目 | 結果 |
| --- | --- |
| `package.json` server provider、status command、Node path／startup warning 設定 | 已移除 |
| `src/extension.ts` provider 註冊、Node 偵測、警告、status command、listener | 已移除 |
| `src/mcp/` server、provider、tools、resources、dictionary | 已刪除 |
| `nodeDetectionService`、舊 MCP diagnostic 與專用型別 | 已刪除 |
| 第二個 webpack server bundle 與 dictionary copy | 已移除 |
| `@modelcontextprotocol/sdk` 與只供舊 server 使用的 `zod` | 已從 package 與 lockfile 移除 |
| 舊 server 專用 `hono`、`@hono/node-server`、`body-parser`、`ws`、`express-rate-limit`、`ip-address`、`path-to-regexp` overrides | 已移除，契約測試防止回流 |
| `generate-block-dictionary.js` 與 `generate:dictionary` | 已刪除／移除 |
| Shadow suggestion 與 TXT metadata 對舊 dictionary 的依賴 | 已改讀正式 block contract |
| `package.nls*.json` 與 15 locale 使用者 MCP／Node 字串 | 已移除 |
| 使用者／現行架構文件 | 已改為 Agent Skills；舊 integration 文件已由 `agent-skills.md` 取代 |

## 掃描

針對 `package.json`、lockfile、`src/`、`media/`、`scripts/`、webpack、README、AGENTS 與現行 specifications 搜尋舊 provider、bundle、SDK、設定、command、Node detection、dictionary 與 `mcpReload` 識別字，結果為零。

VSIX 掃描亦未找到舊 bundle、SDK、command、設定或 Node detection service。VS Code 測試程序輸出的 `MCP Registry configured` 屬於 VS Code 1.109 自身，不是本 extension 的封裝或介面。

## 合理保留 allowlist

- `package.json#engines.node`、`@types/node` 與 npm scripts：貢獻者建置、測試、封裝工具鏈。
- README 與技術文件中的 Node.js：明確標示為貢獻者工具、Extension Host runtime 或非 Blockly 專案類型偵測範例。
- `docs/specifications/EVOLUTION.md`、已完成舊 specs 與 CHANGELOG：歷史紀錄，不代表現行產品介面。
- `mcpRetirement.contract.test.ts` 與 066 規格／驗證檔：用來防止舊功能回歸。
- PlatformIO、mpremote、TXT SSH 與其 Node/Python runtime 診斷：硬體流程，不屬於已退役的 AI server。

## 結論

FR-018、FR-019、FR-022 與 SC-008 通過；沒有過渡 server 或相容模式。
