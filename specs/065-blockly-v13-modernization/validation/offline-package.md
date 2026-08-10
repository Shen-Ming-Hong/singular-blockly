# Blockly 13 離線封裝檢查

**日期**：2026-08-09  
**狀態**：封裝與隔離安裝通過；實際 GUI 斷網 smoke test 待 UI 控制授權。

## VSIX

- 產物：`/tmp/singular-blockly-0.84.1-blockly13.vsix`
- 大小：6.41 MB
- 檔案數：1180
- 隔離安裝目錄：`/tmp/singular-blockly-vsix-smoke-extensions`
- 安裝結果：`singular-ray.singular-blockly@0.84.1`

## 必要內容

| 內容 | 結果 |
|---|---|
| `blockly_compressed.js`、`blocks_compressed.js`、`javascript_compressed.js` | 已包含 |
| `@blockly/theme-modern/dist/index.js` | 已包含（13.2.0） |
| Blockly `media/` SVG、游標、音效及圖片 | 已包含 |
| `media/js/blocklyRuntime.js` | 已包含 |
| editor／preview HTML 與 CSS | 已包含 |
| bg、cs、de、en、es、fr、hu、it、ja、ko、pl、pt-br、ru、tr、zh-hant core locale | 15/15 已包含 |

封裝模板沒有 `http://` 或 `https://` Blockly 資源；實際 WebView 內容由 `webview.asWebviewUri()` 產生本地 URI，CSP 也不允許外部 origin。WebView 內容產生與資源注入契約測試均通過。

T054 尚未勾選：隔離 VSIX 已成功安裝，但 Computer Use 權限拒絕開啟專案及操作 Extension Host，因此未宣稱完成「實際切斷網路後操作 editor／preview」的人工 smoke test。
