# 057 手動驗證紀錄：編輯器主題 surface 一致性

## 驗證矩陣

| 情境 | VS Code host theme | Blockly editor theme | TXT modal | Sample Browser | TXT virtual controls | 結果 | 備註 / 截圖 |
|---|---|---|---|---|---|---|---|
| M1 | Dark | Light | 自動化通過 | 自動化通過 | 自動化通過 | 部分通過 | Source-contract tests 確認 editor-owned tokens、備份預覽 chrome / board warning / virtual controls scrollbar tokens 與 runtime `updateTheme(theme)`；本次 headless session 未開啟互動式 WebView，需人工複核畫面截圖 |
| M2 | Light | Dark | 自動化通過 | 自動化通過 | 自動化通過 | 部分通過 | Source-contract tests 確認 editor-owned tokens 與 runtime `updateTheme(theme)`；本次 headless session 未開啟互動式 WebView，需人工複核畫面截圖 |
| M3 | Dark | Dark | 自動化通過 | 自動化通過 | 自動化通過 | 部分通過 | Source-contract tests 確認相同 host/editor 主題下不依賴 host base tokens；需人工 smoke check |
| M4 | Light | Light | 自動化通過 | 自動化通過 | 自動化通過 | 部分通過 | Source-contract tests 確認相同 host/editor 主題下不依賴 host base tokens；需人工 smoke check |
| M5 | High Contrast | Light 或 Dark | 自動化通過 | 自動化通過 | 自動化通過 | 部分通過 | `editorThemeHighContrastContract.test` 通過，涵蓋 host-token allowlist、forced-colors P1 selectors 與備份預覽 chrome selectors；本次 headless session 未執行互動式截圖 smoke check，需人工以 VS Code 高對比主題複核主要文字、邊界、focus ring、主要按鈕、必要 status/hint |

## 即時主題切換紀錄

| Surface | 驗證項目 | 結果 | 備註 |
|---|---|---|---|
| TXT connection modal | 開啟時切換 editor theme，不 reload、不關閉、input value 保留，下一次 repaint 換色 | 自動化通過 / 手動未執行 | `editorThemeMainSurfaceSwitchContract.test` 與 `editorThemeSwitchContract.test` 確認 runtime path；需人工在 WebView 中複核 input value |
| Sample Browser | 開啟時切換 editor theme，不 reload、不關閉、scroll state 盡量保留，下一次 repaint 換色 | 自動化通過 / 手動未執行 | `editorThemeMainSurfaceSwitchContract.test` 確認 Extension Host `updateTheme` 走 runtime path；需人工複核 scroll state |
| TXT virtual controls | 開啟時切換 editor theme，不 reload、不覆蓋自訂 control colors，下一次 repaint 換色 | 自動化通過 / 手動未執行 | `editorThemeTxtVirtualControlsSwitchContract.test` 確認 refresh path 與 editor-theme fallback priority |

## 自動化驗證紀錄

| 命令 / 檢查 | 結果 | 備註 |
|---|---|---|
| npm run compile | PASS | `webpack 5.105.1 compiled successfully`；exit 0 |
| npm run lint | PASS | `eslint src`；exit 0 |
| npm test | PASS | 765 passing、1 pending；exit 0 |
| WebViewManager target test | PASS | `npx vscode-test --label unit --run out/test/webviewManager.test.js --grep "inject stored editor theme"`；exit 0（WebView Manager suite 28 passing） |
| source-contract tests | PASS | `npm run compile-tests && npx mocha ...editorTheme*.test.js`；18 passing，exit 0；包含備份預覽 body theme ownership、preview chrome tokens、theme toggle focus ring、board warning class styling、TXT virtual controls scrollbar editor-owned token regression、高對比 forced-colors selectors |
| WebView preview target test | PASS | `npx vscode-test --label unit --run out/test/webviewPreview.test.js`；13 passing，exit 0；確認備份預覽載入與 TXT readonly preview flow 未受影響 |
| npm run validate:i18n | PASS | 14/14 languages passed；0 errors，既有 length warnings 保留；本輪未變更 visible text |

## 例外與排除紀錄

| 項目 | 結果 | 理由 / 備註 |
|---|---|---|
| media/css/platformioDiagnostic.css | 已檢查 | `git status --short` 未列出此檔；仍為 standalone host-themed page，允許跟隨 VS Code host theme |
| media/css/shadowBlock.css / secondary overlays | 未觸及 | `git status --short` 未列出此檔；本輪未修改 secondary overlay，依規格記錄為刻意不納入 |
