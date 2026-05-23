# 實作計畫：編輯器主題 surface 一致性

**分支**：`057-editor-theme-surface-consistency` | **日期**：2026-05-23 | **規格**：`specs/057-editor-theme-surface-consistency/spec.md`  
**輸入**：來自 `specs/057-editor-theme-surface-consistency/spec.md` 的功能規格

**註記**：本文件由 `/speckit.plan` 產生，範圍止於 Phase 2 規劃；實作任務清單會由後續 `/speckit.tasks` 產生。

## 摘要

本功能修正 Blockly 編輯器內 editor-owned surfaces 的主題 ownership，避免 VS Code host theme 經由 `body.vscode-*` 或 `--vscode-*` CSS variables 滲入主要編輯器視窗。核心範圍包含 TXT 控制器連線設定視窗、CyberBrick Sample Browser，以及 TXT virtual controls 的 editor-owned chrome；次要編輯輔助覆層（例如 shadow suggestion hint）只列為 smoke-check / opportunistic，不作為 057 完成門檻。全域 toast、warning、dialog、status taxonomy 不在本輪重構範圍內。

技術方向是沿用現有 editor theme 流程：`SettingsManager` 儲存 `singular-blockly.theme`，`WebViewManager` 注入 `window.initialTheme` 與 `body.theme-{theme}`，`media/js/blocklyEdit.js` 的 `updateTheme(theme)` 切換 `body.theme-light` / `body.theme-dark` 並呼叫 Blockly `workspace.setTheme(...)`。本輪將 editor-owned surfaces 的背景、文字、邊界、表單欄位、卡片與提示樣式改由 editor-owned CSS tokens 控制；host-themed standalone pages 與高對比輔助例外需明確列入 allowlist。所有本輪 touched surfaces 在開啟狀態下切換 editor theme 時，都必須在不 reload WebView、不關閉再開啟 surface 的前提下，於 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 呈現新 editor theme。

## 技術背景

**語言/版本**：TypeScript 5.9.3（Extension Host 與測試）、JavaScript ES2020（WebView/Blockly UI）、HTML/CSS（VS Code WebView 與 Blockly editor chrome）  
**主要相依項目**：VS Code API 1.105.0+、Blockly 12.3.1、`@blockly/theme-modern`、Mocha、Sinon、`@vscode/test-electron`、既有 `SettingsManager` / `WebViewManager` / `LocaleService`、`media/locales/*/messages.js`  
**儲存**：不新增資料庫或 workspace schema；沿用 `.vscode/settings.json` 的 `singular-blockly.theme` 與既有 Blockly workspace JSON。若本輪新增或調整可見文字，需同步 15 語系 messages。  
**測試**：Mocha + Sinon + `@vscode/test-electron` 既有測試；新增 source-contract tests 鎖定 HTML/CSS 主題 ownership；WebView 視覺互動依憲法 WebView 例外，以 quickstart manual matrix 驗證。  
**目標平台**：VS Code 1.105+ 的 WebView（macOS / Windows / Linux）；主要回歸情境為 VS Code host light/dark 與 Blockly editor light/dark 交錯。  
**專案型態**：VS Code 擴充功能（Extension Host + WebView browser context + Blockly editor）。  
**效能目標**：主題切換透過 CSS variables / body class / 必要的現有 re-render 完成；不得透過重設 `webview.html` 造成 WebView 重新載入；切換已開啟 touched surfaces 時，`updateTheme(theme)` 完成後下一次瀏覽器 repaint 應呈現新 editor theme，且不新增背景輪詢。  
**限制**：Extension Host TypeScript 不可 import WebView `media/` 程式碼；WebView 與 Extension Host 只透過 `postMessage`；editor-owned base surfaces 不得直接跟隨 `body.vscode-light/dark` 或 host `--vscode-*` 背景/文字/邊界 token；高對比與字型 token 可作為明確例外；不建立全域提示框架；不改刻意 host-themed standalone pages。  
**範圍**：P1 必修為 TXT connection modal、Sample Browser、TXT virtual controls editor-owned chrome；P2 為本輪觸及提示的最小可讀性與角色保留；P3 為高對比 smoke check；shadow suggestion hint 等次要覆層只在本輪實際碰到時 opportunistic 修正。

## 憲法檢查

*關卡：Phase 0 research 前必須通過；Phase 1 design 後重新檢查。*

| 原則 | 檢查結果 | 說明 |
|---|---|---|
| I. Simplicity and Maintainability | 通過 | 直接收斂為 theme ownership/token cleanup，不重寫整套 UI 或提示系統；優先移除明確 leakage 與 inline style。 |
| II. Modularity and Extensibility | 通過 | 以 editor-owned CSS tokens、surface contract 與 allowlist 管理 ownership，避免每個 modal 各自硬編碼 host/theme 判斷。 |
| III. Avoid Over-Development | 通過 | 已明確排除全域提示 taxonomy、所有次要覆層必修、host-themed standalone pages 改版與全面視覺重設計。 |
| IV. Flexibility and Adaptability | 通過 | 保留現有 `light` / `dark` editor theme 設定與 Blockly theme object；高對比以 smoke-check 與明確例外支援。 |
| V. Research-Driven Development | 通過 | 已查閱 VS Code WebView theming/theme color 官方文件與 Blockly theme/CSS 官方文件，並比對 repo 既有 theme 注入流程。 |
| VI. Structured Logging | 通過 | 本階段不新增 Extension Host logging；後續若需 host 診斷必須使用 `log()` service，WebView console 僅限 browser context 既有偵錯用途。 |
| VII. Comprehensive Test Coverage | 通過（含 WebView 例外） | CSS/HTML ownership 使用 source-contract tests；視覺一致性與交錯主題需以 quickstart manual matrix 記錄，符合 WebView manual testing exception。 |
| VIII. Pure Functions and Modular Architecture | 通過 | 若新增 ownership scanner/contract helper，應以純文字/selector 檢查為主；DOM 即時更新集中在既有 `updateTheme(theme)` flow。 |
| IX. Traditional Chinese Documentation Standard | 通過 | 本 plan、research、data model、contracts、quickstart 均以繁體中文撰寫。 |
| X. Professional Release Management | 不適用 | 本階段不發布版本；若後續 release，另依 release workflow 處理。 |
| XI. Agent Skills Architecture | 通過 | 依 SpecKit plan workflow 產出 artifacts；後續 commit/release 可使用既有 git/release skills。 |

**設計後重新檢查**：通過。Phase 1 設計維持相同邊界：只規範 editor-owned surfaces、touched feedback 最小規則、theme switch 即時更新與 host-themed allowlist；未引入新框架、新 package 或跨 context import。

## 專案結構

### 文件（本功能）

```text
specs/057-editor-theme-surface-consistency/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
├── contracts/
│   ├── theme-surface-ownership-contract.md
│   ├── theme-switch-update-contract.md
│   └── touched-feedback-rules-contract.md
└── tasks.md              # 後續 /speckit.tasks 產生，本階段不建立
```

### 原始碼（儲存庫根目錄）

```text
media/
├── html/
│   └── blocklyEdit.html                  # TXT connection modal inline host-theme styles 需改為 class/token；核心 HTML surface
├── css/
│   ├── blocklyEdit.css                   # editor-owned tokens、modal/Sample Browser/TXT virtual controls chrome、high contrast smoke styles
│   ├── shadowBlock.css                   # 次要覆層 opportunistic；若 touched，需改用 editor theme 或記錄例外
│   └── platformioDiagnostic.css          # 刻意 host-themed standalone page；本輪 allowlist，不修改
├── js/
│   ├── blocklyEdit.js                    # `updateTheme(theme)` 即時更新鏈；必要時 refresh touched inline/computed UI
│   └── txtVirtualControlsContrast.js     # TXT virtual controls fallback contrast 判斷；需以 editor theme class 優先
└── locales/
    └── */messages.js                     # 僅當本輪新增/修改可見文字時更新 15 語系

src/
├── services/
│   └── settingsManager.ts                # 既有 `singular-blockly.theme` persistence；預期不需重構
├── webview/
│   └── webviewManager.ts                 # 既有 `window.initialTheme` / `body.theme-{theme}` 注入；測試可鎖定不回歸
└── test/
    ├── suite/
    │   ├── editorThemeSurfaceContract.test.ts   # 建議新增：核心 surfaces 不得使用未允許 host vars/inline styles
    │   └── txtVirtualControlsPersistence.test.ts # 既有 pattern 可參考或補充 TXT virtual controls source contract
    ├── webviewManager.test.ts            # 既有 initial theme injection 測試，視需要補強
    └── helpers/
        └── mocks.ts
```

**結構決策**：採既有單一 VS Code extension 專案結構，不新增 package 或 WebView framework。主題一致性主要由 `media/css/blocklyEdit.css` 與 `media/html/blocklyEdit.html` 修正；`media/js/blocklyEdit.js` 承擔既有 theme switch / re-render 串接，`media/js/txtVirtualControlsContrast.js` 僅在 TXT virtual controls fallback contrast 判斷需要時調整為 editor theme 優先，不建立新狀態管理器。測試以 source-contract 鎖定 ownership 邊界，視覺驗證由 `quickstart.md` manual matrix 補足。

## 複雜度追蹤

> 本功能沒有憲法違規，因此不需要複雜度例外。

| 違規項目 | 為何需要 | 為何不採用更簡單替代方案 |
|---|---|---|
| 不適用 | 不適用 | 不適用 |

## Phase 0 研究輸出

- `research.md` 記錄：editor theme ownership 應以 `body.theme-light` / `body.theme-dark` 為軸；核心 editor-owned base surfaces 不直接使用 host `--vscode-*`；HTML inline style 是高風險 leakage；`updateTheme(theme)` 應以 postMessage / body class 即時更新而非 reload WebView；高對比與 host-themed standalone pages 需作為明確例外。
- 已查閱 VS Code WebView API、VS Code Theme Color、Blockly Themes 與 Blockly CSS 官方文件，確認 WebView host theme classes/CSS variables 的適用性、Blockly dynamic theme switching 與 CSS cascade/inline style 風險。
- 已解決 Technical Context 中的未知項；沒有保留 `NEEDS CLARIFICATION`。

## Phase 1 設計與契約輸出

- `data-model.md` 定義 `EditorThemePreference`、`EditorOwnedSurface`、`ThemeTokenSet`、`ThemeLeakRecord`、`TouchedFeedbackElement`、`ThemeOwnershipException`、`ThemeSwitchScenario` 與 `ManualThemeValidationScenario`。
- `contracts/theme-surface-ownership-contract.md` 定義核心 surface、allowlist、禁止/允許 host token 類型與 source-contract 驗收規則。
- `contracts/theme-switch-update-contract.md` 定義 initial theme、toolbar toggle、Extension Host command、已開啟 touched surfaces 與 opportunistic overlay 的即時更新契約。
- `contracts/touched-feedback-rules-contract.md` 定義本輪觸及提示的角色保留、可讀性、非 hover-only、i18n 與長字串處理契約。
- `quickstart.md` 提供自動化命令與手動 light/dark/high-contrast 驗證矩陣。
- Agent context 已更新為指向本 plan；本機只存在 PowerShell 版 update-agent-context 腳本且 `pwsh` 不可用，因此採等效 marker 更新。

## Phase 2 任務實作大綱

1. 建立 editor-owned theme tokens：在 `blocklyEdit.css` 補齊 modal、form、card、notice、scrollbar、focus、warning 等 `body.theme-light` / `body.theme-dark` token，避免核心 surface base colors 綁 host tokens。
2. 修正 TXT connection modal：移除 `blocklyEdit.html` 中 `#txtHostInput`、`#txtUsernameInput`、`#txtPasswordInput`、`#txtRemotePathInput` 的 inline `--vscode-input-*`，改用 class 與 CSS token；`#txtSshHint` 改用 editor-owned description token。
3. 修正 Sample Browser：讓 `#sampleModal`、`.sample-card`、`.sample-category-header`、`.sample-offline-notice`、loading/empty 狀態跟隨 editor theme，並處理 scrollbar/long text 可讀性。
4. 修正 TXT virtual controls chrome：將 panel/splitter/canvas/inspector/mode badge/warning chrome 的 base colors 從 host token 改為 editor-owned token；保留使用者自訂 virtual button 顏色與必要 focus/high-contrast ring。
5. 檢查 `updateTheme(theme)` 即時更新：確認已開啟 TXT modal、Sample Browser、TXT virtual controls 在切換 editor theme 後不需重開，且 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 呈現新 editor theme；若有 inline computed styles（例如 virtual control buttons）需在 `refreshTxtVirtualControlsUI()` 或等效流程中重繪。TXT virtual controls fallback contrast 判斷需在 `txtVirtualControlsContrast.js` 優先讀取 editor theme class，而不是 host `vscode-dark`。
6. 處理 touched feedback 最小規則：本輪碰到的 hint/offline/status text 保留原角色，改用 editor-owned tokens；若改動可見文字，補齊 15 語系並通過 i18n validation。
7. 補 source-contract tests：鎖定核心 surfaces 不再直接使用未允許的 host `--vscode-*` base tokens、TXT modal 不含 inline host input style、host-themed allowlist 不被誤改。
8. 依 `quickstart.md` 執行手動矩陣，記錄 VS Code/editor 交錯主題、高對比 smoke check 與 immediate theme switch 結果。

## 風險與驗證說明

- **主要風險：host token false positive / false negative**。並非所有 `--vscode-*` 都是錯；字型、高對比、contrast/focus 輔助與 host-themed standalone pages 可例外。contract tests 需用 allowlist，避免把 `platformioDiagnostic.css` 或高對比支援誤判。
- **主要風險：inline style specificity**。TXT modal 目前 input inline style 的 specificity 高於 CSS selector，若只在 CSS 加規則而不移除/覆蓋 inline style，仍可能保留 host theme leakage。
- **主要風險：theme switch 即時性**。純 CSS tokens 會自動更新，但 TXT virtual controls button 使用 JS inline `backgroundColor` / `color` 呈現使用者自訂顏色；切換 theme 時需確認 fallback/default style 會重算並重繪，且 `txtVirtualControlsContrast.js` 不再以 host `vscode-dark` 作為 editor-owned fallback 的優先判斷。
- **主要風險：scope creep**。提示統一只限本輪 touched feedback 的可讀性與角色保留，不建立全域 toast/dialog/status framework。
- **主要風險：高對比回歸**。修掉 host leakage 後仍需保留高對比可辨識性；通過標準為主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失；可使用 system colors / `forced-colors` / contrast border 作為明確例外。
- **驗證標準**：`npm run compile`、`npm run lint`、必要的 focused Mocha source-contract tests、`npm run validate:i18n`（若改可見文字）、`quickstart.md` 的 manual matrix。
