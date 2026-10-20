---
name: security-checker
description: 編輯或審查涉及外部輸入、命令執行、WebView 訊息、檔案路徑或憑證的程式碼時，檢查實際資料流中的安全風險。Use when code changes or review touch security boundaries.
metadata:
  author: singular-blockly
  version: '1.1.0'
  category: security
  inspired-by: anthropics/claude-code/plugins/security-guidance
license: Apache-2.0
---

# 程式碼安全檢查

依變更範圍追蹤不可信資料到敏感操作，指出可重現的問題和最小修正。一般編輯只檢查相關邊界；不要因出現 `eval`、`innerHTML` 或 `postMessage` 字樣就推斷有漏洞。

## 檢查重點

- **命令執行**：檢查使用者或檔案內容是否進入 shell 命令。優先使用 `spawn`／`execFile` 的參數陣列，避免 `shell: true` 和字串拼接；仍須驗證工具名稱、選項及業務允許值。刪除少數特殊字元不能防止命令注入。
- **WebView 與 HTML**：不可信文字用 `textContent`；確需 HTML 時依輸出上下文轉義或使用受信任的淨化方式。確認 WebView CSP、資源的 `webview.asWebviewUri()`，以及動態 URL 的允許範圍。
- **訊息邊界**：Extension Host 只透過 VS Code WebView API 與 WebView 通訊。依 `command` 驗證訊息形狀、欄位型別、允許值及動作所需狀態；檢查回覆的 `requestId` 與待處理請求是否對應。WebView 的 `event.source === window` 不能替代內容驗證。
- **檔案路徑**：檔案 I/O 經 `FileService`。在套用工作區路徑前先確認 `vscode.workspace.workspaceFolders`，拒絕越界、符號連結逃逸與非預期檔案類型。字串 `startsWith(basePath)` 會錯收同字首的相鄰目錄。
- **反序列化**：對 `JSON.parse` 等外部資料檢查結構與大小，再交給 workspace／board／command 流程。不要假設本專案已有 Zod 或 MCP 驗證層。
- **憑證與日誌**：避免硬編碼或在輸出、錯誤、PR 差異中洩漏金鑰。Extension Host 使用 `log(message, level)`；記錄非敏感診斷資訊即可。WebView 的記錄方式依其現有實作。
- **動態執行**：檢查不可信資料能否到達 `eval`、`new Function`、字串式 timer、動態 `require`／`import`，或其他程式碼執行點；區分 Blockly 產生文字與執行文字。

## 路徑驗證範例

```typescript
const root = path.resolve(basePath);
const candidate = path.resolve(root, userPath);
const relative = path.relative(root, candidate);
if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
  throw new Error('Path outside workspace');
}
// 若目標或父目錄可能是符號連結，還須在實際檔案操作前檢查 realpath。
```

## 工作方式

1. 找出修改處及其呼叫者，確認資料來源與敏感操作，僅對相關邊界檢查。
2. 對可利用的問題指出檔案、資料流、影響和修正；對不確定處明示尚需驗證的條件。
3. 修正後執行受影響的測試與 `npm run lint`；只在相關且可執行時擴大測試。
4. 檢查差異沒有意外的憑證或除錯輸出。報告安全問題時遵循 [SECURITY.md](../../../SECURITY.md)。

參考：[VS Code WebView Security](https://code.visualstudio.com/api/extension-guides/webview#security)、[OWASP Top 10](https://owasp.org/www-project-top-ten/)。
