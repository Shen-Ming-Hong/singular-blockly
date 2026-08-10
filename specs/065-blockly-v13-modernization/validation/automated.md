# Blockly 13 自動驗證紀錄

**日期**：2026-08-09  
**狀態**：部分完成；本機測試全數通過，真實 Copilot 整合測試待外傳授權。

## 結果

| 項目 | 結果 | 證據 |
|---|---|---|
| `npm run compile` | 通過 | webpack extension 與 MCP server 均成功編譯 |
| `npm run lint` | 通過 | ESLint 0 errors |
| `npm test` | 通過 | VS Code 1.105.0；1036 passing、1 pending、0 failed |
| `npm run test:integration` | 未執行 | 會把工作區內容傳送至真實 Copilot API，安全層要求使用者另行明確授權 |
| `npm run validate:i18n` | 通過 | 14 個非英文語系皆 0 errors；連同英文共 15 語系 |
| `npm run package` | 通過 | production webpack build 成功 |
| fixture validator | 通過 | 4/4 JSON/XML fixtures round-trip 通過 |
| legacy function validator | 通過 | Blockly 13.2.1；舊函式名稱、定義關聯、參數與 ARG shadow 經 2 次 load/save round-trip 皆保留 |
| `npm audit --audit-level=low` | 通過 | 0 vulnerabilities |
| `git diff --check` | 通過 | 無 whitespace errors |

單元測試的 1 個 pending 為測試環境沒有可用 AI provider 時的既有條件式跳過，不是 Blockly 13 失敗。`.vscode-test.mjs` 已固定 `version: '1.105.0'`，避免測試 CLI 自動下載 1.132.0 後因 macOS app executable 名稱不相容而在啟動前失敗。

T053 尚未勾選，直到使用者明確授權把測試工作區內容傳給 Copilot 並完成 `npm run test:integration`。
