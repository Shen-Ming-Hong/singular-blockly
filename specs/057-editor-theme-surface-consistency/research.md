# 研究紀錄：編輯器主題 surface 一致性

## 決策 1：editor-owned surfaces 的主題 ownership 以 `body.theme-light` / `body.theme-dark` 為準

**決策**：本輪納入的 Blockly editor-owned surfaces 一律以 editor theme class（`body.theme-light` / `body.theme-dark`）決定背景、文字、邊界、表單、卡片與提示底色，不以 VS Code host theme class（`body.vscode-light` / `body.vscode-dark`）作為 base surface 的主要來源。

**理由**：目前 TXT connection modal 在 VS Code 深色、Blockly editor 淺色時出現深色 input，根因是 editor-owned modal 的 input inline style 使用 `--vscode-input-*` host tokens。VS Code 官方文件說明 WebView 可以使用 `body.vscode-light` / `body.vscode-dark` 與 `--vscode-*` 變數，這適合刻意跟隨 workbench 的 WebView；但本專案已有獨立 Blockly editor theme 設定，使用者期待 editor 內主要操作 surface 跟隨 editor theme 而非 host theme。

**曾考慮的替代方案**：

- 繼續使用 `--vscode-*` 並補 fallback：會在 host/editor 交錯主題時繼續混色，無法解決根因。
- 讓 Blockly editor theme 跟著 VS Code theme：違反使用者可獨立切換 editor 主題的既有設計。
- 每個 modal 用 JS 直接塞顏色：會增加狀態同步成本，且比 CSS token 更難維護。

## 決策 2：用 editor-owned CSS tokens 收斂樣式，而不是分散硬編碼顏色

**決策**：在 `media/css/blocklyEdit.css` 以 editor-owned CSS custom properties 建立 surface / field / border / description / warning / focus 等 token，並由 `body.theme-light` / `body.theme-dark` 賦值。核心 surface 的 selector 使用這些 token；必要的高對比或系統字型例外另列 allowlist。

**理由**：現有 CSS 已有 `body.theme-light` / `body.theme-dark` pattern，且 `experimentalBlocks.css` 也展示了 editor-owned theme class 的可行做法。集中 token 可以讓 TXT modal、Sample Browser 與 TXT virtual controls chrome 共用語意色，減少每個區塊各自硬編碼 light/dark 顏色造成的漂移。

**曾考慮的替代方案**：

- 直接在每個 selector 寫固定 light/dark 顏色：短期可修，但長期難以盤點 ownership。
- 把所有 WebView UI 全部改成一套新設計系統：超出 057 範圍，會變成全域 UI 重構。
- 只修 TXT connection modal：無法回應已確認的 Sample Browser 與 TXT virtual controls chrome leakage 風險。

## 決策 3：移除核心 modal 的高風險 inline host style，而不是只加更高 specificity 的 CSS

**決策**：TXT connection modal 中 `#txtHostInput`、`#txtUsernameInput`、`#txtPasswordInput`、`#txtRemotePathInput` 的 inline `background/color/border: var(--vscode-input-*)` 應移除，改成 class 或共用 selector 套用 editor-owned field tokens。`#txtSshHint` 的硬編碼 `#888` 也應改為 editor-owned description token。

**理由**：Blockly CSS 官方文件提醒 inline style 的 specificity 高於一般 selector；若只在 stylesheet 補規則，容易需要 `!important` 或仍被 inline style 壓過。把 style ownership 回收至 CSS file，可同時降低 specificity 風險與後續維護成本。

**曾考慮的替代方案**：

- 使用 `!important` 覆蓋 inline style：可行但不乾淨，且會讓未來表單狀態樣式更難調整。
- 在 `updateTheme(theme)` 逐一改 input style：增加 JS DOM 操作與漏改風險。
- 保留 inline style 只改 fallback 色：仍會讀 host token，不符合 editor-owned ownership。

## 決策 4：theme switch 使用既有 `updateTheme(theme)` 與 postMessage flow，不 reload WebView

**決策**：本輪 theme switch 即時更新必須沿用既有 flow：WebView toolbar 或 Extension Host command 更新 theme，透過 `updateTheme(theme)` 切換 body class、Blockly theme object，並刷新必要的 inline/computed UI。不得透過重新指定 `webview.html` 達成更新。

**理由**：VS Code WebView 文件說明 Extension Host 可用 `webview.postMessage()` 傳訊息給 WebView；同時重新設定 `webview.html` 會重設 WebView script state。此專案目前已使用 `retainContextWhenHidden` 與 `updateTheme(theme)`，重載 HTML 會破壞 workspace 狀態、開啟中的 modal、TXT virtual controls 狀態與使用者操作脈絡。

**曾考慮的替代方案**：

- 切主題時重建整個 WebView：狀態成本過高，且與 FR-016「開啟中的 surface 立即更新」精神不符。
- 每個 modal 關閉再重開：使用者體驗差，且規格明確不接受。
- 新增獨立 theme observer framework：本輪不需要，現有 `updateTheme(theme)` 足以承載。

## 決策 5：核心範圍固定為三組 surface，secondary overlays 只 opportunistic

**決策**：057 的完成門檻只要求：TXT connection modal、Sample Browser、TXT virtual controls editor-owned chrome。Shadow suggestion hint 等次要編輯輔助覆層列為 smoke-check / opportunistic；若本輪實作碰到它，必須符合 editor theme 與即時更新規則，否則不把它列為 blocking completion gate。

**理由**：使用者已明確擔心「統一提示」會讓範圍過大。Spec clarify 也明確排除全域提示 taxonomy，並把 secondary overlays 定義為 opportunistic。此決策能避免 057 從 theme leakage 修復膨脹成所有提示/覆層治理。

**曾考慮的替代方案**：

- 把所有 WebView overlay 都列為必修：範圍過大且風險高。
- 完全忽略 shadow hint：可能在 smoke check 中留下明顯不協調，但不應阻塞 P1 修復。
- 新增完整 feedback framework：與本輪 scope control 衝突。

## 決策 6：明確定義 host-themed allowlist，避免把例外和 leakage 混在一起

**決策**：本輪 contract 需明確列出允許 host theme 的情況：刻意 host-themed standalone pages（例如 `media/css/platformioDiagnostic.css`）、高對比/forced-colors 支援、VS Code contrast/focus 輔助 token、字型 token。核心 editor-owned base surface 的背景、文字、邊界、表單與卡片 token 不應直接取自 host theme。

**理由**：VS Code Theme Color 官方文件列出大量 host UI tokens，這些 token 對 workbench-like UI 有價值；但 057 要解決的是 editor-owned surface 被 host theme 覆蓋。若沒有 allowlist，後續 source-contract tests 容易誤判高對比支援或故意 host-themed page；若 allowlist 太寬，又會讓真正 leakage 溜過。

**曾考慮的替代方案**：

- 完全禁止所有 `--vscode-*`：會誤傷字型、高對比與刻意 host-themed page。
- 完全依人工 review 判斷：容易回歸，缺少可測契約。
- 只靠 selector 命名猜測 owner：不夠可靠，需搭配 surface allowlist。

## 決策 7：測試採 source-contract + manual matrix，避免為 WebView 視覺互動引入大型測試框架

**決策**：自動化測試以 source-contract 為主，檢查核心 HTML/CSS 不再含未允許 host base tokens 或 inline host input style，並鎖定 WebView initial theme injection 不回歸。實際視覺一致性、交錯主題與高對比情境，依 `quickstart.md` manual matrix 驗證並記錄。

**理由**：專案憲法允許 WebView 互動視覺功能採手動測試，前提是規格與 quickstart 明確列出情境並記錄結果。為本輪 light/dark surface consistency 導入 Playwright/WebdriverIO 會超過 ROI；但完全無自動化又容易讓 `--vscode-*` leakage 回歸，因此 source-contract 是較輕量且可維護的平衡點。

**曾考慮的替代方案**：

- 全靠人工測試：無法防止 CSS/HTML ownership 回歸。
- 建立完整 WebView E2E 視覺測試：基礎建設成本過高，不符合 057 範圍。
- 只跑 compile/lint：無法捕捉 CSS/HTML theme leakage。

## 決策 8：本輪 touched feedback 只保留角色與可讀性，不重新設計互動模式

**決策**：本輪如果碰到 `#txtSshHint`、Sample Browser offline/loading/empty notice、TXT virtual controls hints/warnings 等 feedback elements，只調整 theme token、可讀性、非 hover-only 與 i18n 完整性；不把 toast、modal、inline hint、block warning 等角色重新分類或重命名。

**理由**：使用者最終選擇縮小提示統一範圍。057 的價值在於「同一 editor 主題下看起來一致且可讀」，不是讓使用者重新學習新的提示方法。

**曾考慮的替代方案**：

- 一次建立全域 feedback taxonomy：過度開發且會牽動大量既有流程。
- 不管 feedback 元素：若 touched surface 內提示文字仍不可讀，會違反 FR-007/FR-009。
- 把所有提示改成 toast：會改變使用情境與資訊可見性，不符合角色保留。

## 參考依據

- VS Code WebView API 官方文件：WebView 可接收 `postMessage`、會有 `body.vscode-light` / `body.vscode-dark` / `body.vscode-high-contrast` host theme classes，且高對比需要測試。
- VS Code Theme Color 官方文件：host theme colors 可作為 WebView CSS variables，但 token 語意屬於 workbench/host UI。
- Blockly Themes 官方文件：Blockly workspace 支援 theme component styles 與 dynamic theme switching。
- Blockly CSS 官方文件：可用 CSS 覆寫 Blockly/自訂元件樣式；inline style specificity 高於一般 selector。
- Repo 既有實作：`src/webview/webviewManager.ts`、`src/services/settingsManager.ts`、`media/js/blocklyEdit.js`、`media/css/blocklyEdit.css`、`media/html/blocklyEdit.html`、`media/css/experimentalBlocks.css`。
- Repo memory：`/memories/repo/editor-theme-isolation.md`、`/memories/repo/txt-connection-ux-decisions.md`、`/memories/repo/txt-virtual-controls-runtime.md`。

## 結論

Phase 0 所需未知項已收斂：

- 057 不需要新增 theme framework 或重載 WebView。
- 核心修復路徑是 editor-owned CSS tokens + 移除 inline host style + source-contract tests。
- Host theme 不是全面禁止，而是只允許在明確例外、高對比與輔助 token 中使用。
- Touched feedback 只做可讀性與角色保留，不做全域提示治理。

本功能可進入 Phase 1 設計與契約定義，且沒有未解的 `NEEDS CLARIFICATION`。
