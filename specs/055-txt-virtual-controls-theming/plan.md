# 實作計畫：TXT 虛擬控制主題一致性

**分支**：`055-txt-virtual-controls-theming` | **日期**：2026-05-22 | **規格**：`specs/055-txt-virtual-controls-theming/spec.md`
**輸入**：來自 `specs/055-txt-virtual-controls-theming/spec.md` 的功能規格

**註記**：本文件由 `/speckit.plan` 產生，範圍止於 Phase 2 規劃；實作任務清單會由後續 `/speckit.tasks` 產生。

## 摘要

本功能補齊 TXT 虛擬控制在編輯與預覽畫面中的主題一致性與可近性：亮色、暗色、高對比深色與高對比淺色都必須讓 panel、canvas、button、inspector field、focus 與狀態提示清楚可辨識。實作方向是讓亮色與暗色各自擁有可讀初始配色，並在使用者手動調整後保存該主題的顏色記錄；改由 TXT-scoped CSS variables、VS Code WebView theme class/token、內建 `theme-light` / `theme-dark` override、主題別有效樣式、非單一顏色狀態線索與 high contrast border/focus 補強維持可讀性，不再顯示額外配色提示。

## 技術背景

**語言/版本**：TypeScript 5.9.3（Extension Host 與測試）、JavaScript ES2020（WebView）、HTML/CSS（VS Code WebView）
**主要相依項目**：VS Code API 1.105.0+、Blockly 12.3.1、既有 `SettingsManager` 主題設定、`LocaleService` / `media/locales/*/messages.js`、既有 TXT virtual controls WebView DOM 與 preview payload
**儲存**：向後相容地延伸 `txtVirtualControls.controls[].style`；保留 `backgroundColor` 與 `textColor` 作為目前有效/舊版欄位，新增可選 `themeStyles.light/dark` 以記錄各主題手動顏色。主題切換可更新目前有效樣式，但不得覆蓋另一主題的手動記錄。
**測試**：Mocha + Sinon + `@vscode/test-electron` 的現有 host/contract 測試；WebView 視覺與互動依憲法允許的 UI 測試例外，以文件化手動驗證補足
**目標平台**：VS Code 1.105+（macOS / Windows / Linux）；VS Code WebView 的亮色、暗色、高對比類別與主題色 CSS variables
**專案型態**：VS Code 擴充功能（Extension Host + WebView browser context），TXT 虛擬控制屬於 WebView UI 功能
**效能目標**：主題有效樣式解析須為 $O(n)$（n = 畫面中的 TXT virtual buttons），僅在渲染、顏色變更、主題變更、preview 載入等事件觸發，不新增輪詢或長時間背景工作
**限制**：不覆蓋使用者已在特定主題手動調整的按鈕顏色；edit 與 preview 規則一致但語意分明；preview 必須維持唯讀；非 TXT 畫面不得套用 TXT 專屬視覺或互動；Extension Host 與 WebView 仍只能透過 `postMessage` 溝通；內建亮/暗主題切換不得只依賴可能仍解析為另一主題的 VS Code token
**範圍**：單一功能範圍限於 TXT virtual controls 的 panel/canvas/button/inspector field/focus/state cues 與主題別有效樣式；不新增控制類型、不新增設定頁、不改變 TXT runtime、generator 或 Blockly block 語意

## 憲法檢查

*關卡：Phase 0 research 前必須通過；Phase 1 design 後重新檢查。*

| 原則 | 檢查結果 | 說明 |
|-----------|-------------|-------|
| I. Simplicity and Maintainability | 通過 | 以既有 CSS/JS render path 補強，不引入大型 UI framework 或新狀態管理系統。 |
| II. Modularity and Extensibility | 通過 | 將 TXT-specific theme/style 規則限制在 TXT virtual controls CSS class、WebView helper 與型別正規化；不污染 Arduino/CyberBrick 流程。 |
| III. Avoid Over-Development | 通過 | 明確不新增設定頁、不新增控制類型；只處理規格列出的主題別初始色、手動記錄、辨識性與狀態 cue。 |
| IV. Flexibility and Adaptability | 通過 | 採 TXT-scoped CSS variables、VS Code theme class、theme color CSS variables、內建 `theme-light` / `theme-dark` override 與 `forced-colors` 補強，可隨使用者主題變化。 |
| V. Research-Driven Development | 通過 | 已查閱 VS Code WebView theming 官方文件：WebView body 會有 `vscode-light`、`vscode-dark`、`vscode-high-contrast`；theme colors 可透過 `--vscode-*` CSS variables 使用。已查閱 Theme Color Reference 中 `contrastBorder`、`contrastActiveBorder`、`focusBorder`、input、editor 與 text code block 相關 token；後續實測確認內建 theme 切換需以 TXT-scoped variables 覆蓋可能殘留的亮色 token。 |
| VI. Structured Logging | 通過 | 本階段不改 Extension Host logging；若後續加入 host 診斷必須使用 `log()` / logging service，不得新增 `console.log`。 |
| VII. Comprehensive Test Coverage | 通過（含 UI 例外） | 對純判定邏輯與 preview payload/contract 增加可自動化測試；WebView 視覺狀態與 high contrast 依已批准的 UI 測試例外，以 `quickstart.md` 手動矩陣驗證。 |
| VIII. Pure Functions and Modular Architecture | 通過 | 顏色解析、可讀文字色與主題有效樣式需抽成可重現的 helper（無 DOM side effect）；DOM render 只消費 helper 結果並套用 style / class。 |
| IX. Traditional Chinese Documentation Standard | 通過 | 本 plan、research、data model、contracts、quickstart 均以繁體中文撰寫。 |
| X. Professional Release Management | 不適用 | 本階段不發布版本；若後續 release，遵循既有流程。 |
| XI. Agent Skills Architecture | 通過 | 依 SpecKit plan workflow 建立 artifacts；後續 commit/release 可使用對應 skill。 |

**設計後重新檢查**：通過。Phase 1 設計維持同一範圍：無新持久化 schema、無 speculative feature、無跨 context import，並保留 WebView manual validation 例外的明確驗證矩陣。

## 專案結構

### 文件（本功能）

```text
specs/055-txt-virtual-controls-theming/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── txt-theme-style-contract.md
│   ├── txt-theme-verification-matrix.md
│   └── txt-theming-ui-contract.md
└── tasks.md              # 後續 /speckit.tasks 產生，本階段不建立
```

### 原始碼（儲存庫根目錄）

```text
media/
├── css/
│   └── blocklyEdit.css              # TXT panel/canvas/button/inspector/focus/high-contrast/state cue 樣式
├── html/
│   ├── blocklyEdit.html             # 如需載入共用 WebView helper，需新增 script placeholder
│   └── blocklyPreview.html          # 如需載入共用 WebView helper，需新增 script placeholder
├── js/
│   ├── blocklyEdit.js               # edit 端主題有效樣式、手動色記錄、theme refresh hook
│   └── blocklyPreview.js            # preview 端主題有效樣式與唯讀狀態 render
└── locales/
    └── */messages.js                # 15 語系狀態與可近性提示字串

src/
├── types/
│   └── previewMessages.ts           # 保留既有備份完整性訊息；Host 不計算 theme-dependent button style
└── test/
    ├── webviewPreview.test.ts       # preview 載入與非 TXT 回歸 contract 測試可在此擴充
    └── suite/                       # 可新增 TXT theming/contrast contract tests（不直接匯入 WebView DOM）
```

**結構決策**：採既有 VS Code 擴充功能 + WebView 結構。主題有效樣式會依目前 WebView theme 與按鈕是否已有主題別手動記錄而變，因此解析與呈現放在 WebView context；Extension Host 只負責注入資源、傳送既有 preview payload、正規化儲存資料與同步 theme/language。共用 helper 必須保持 WebView-only、無外部依賴、無 DOM side effect，並透過契約測試/手動矩陣驗證輸入輸出一致。

## 複雜度追蹤

> 本功能沒有憲法違規，因此不需要複雜度例外。

| 違規項目 | 為何需要 | 為何不採用更簡單替代方案 |
|-----------|------------|-------------------------------------|
| 不適用 | 不適用 | 不適用 |

## Phase 0 研究輸出

- `research.md` 記錄：主題別初始色、主題別手動記錄、WCAG 相對亮度對比作為自動文字色依據、VS Code WebView theme class/token + TXT-scoped override 策略、以 generic high contrast 規則 + 手動矩陣驗證深/淺高對比變體的策略、preview 唯讀鍵盤策略，以及不採用額外配色提示、阻擋儲存或 host-side theme guessing 的理由。
- 已解決所有 Technical Context 中的未知項；沒有保留未解析澄清標記。

## Phase 1 設計與契約輸出

- `data-model.md` 定義 Theme Mode、ThemeStyleRecord、Virtual Control Appearance、Interaction State Cue、Theme Verification Case。
- `contracts/txt-theming-ui-contract.md` 定義 edit/preview 視覺狀態、high contrast、focus、readonly 與非 TXT 回歸邊界。
- `contracts/txt-theme-style-contract.md` 定義主題初始色、亮暗手動記錄、舊資料相容、edit/preview 一致性與安全邊界。
- `contracts/txt-theme-verification-matrix.md` 定義亮色、暗色、高對比深色、高對比淺色、edit state、preview readonly、主題別手動配色、舊備份與非 TXT 回歸等驗證案例。
- `quickstart.md` 提供後續 implementation 後的手動驗證流程。

## Phase 2 任務實作大綱

1. 在 `blocklyEdit.css` 補齊 TXT-specific CSS variables、panel/canvas/inspector field/code surfaces、focus-visible、selected/running/pressed/read-only cue、高對比與 `forced-colors` 規則；避免只靠 box-shadow 或顏色差異表達狀態。
2. 在 `blocklyEdit.js` 將主題有效樣式整合到按鈕 render、顏色變更、選取變更與 `updateTheme()`；顏色 input 變更要寫入目前主題的手動記錄。
3. 在 `blocklyPreview.js` 將相同主題有效樣式套用至 preview controls；preview button 必須維持 `aria-disabled` / readonly guard，不送出 edit/runtime mutation message。
4. 補齊 15 語系仍需使用的狀態與 ARIA locale keys，並移除已無使用的配色提示字串；執行涵蓋所有 `media/locales/*/messages.js` 的 i18n 驗證。
5. 擴充自動化測試：至少涵蓋主題有效樣式 helper、themeStyles 持久化、非 TXT preview 回歸、既有 color persistence；WebView high contrast/focus 以 quickstart manual matrix 記錄。

## 風險與驗證說明

- **主要風險：theme token resolved color 只能在 WebView 取得**。避免在 Extension Host 猜測實際可見顏色，以免與 CSS 不一致。
- **主要風險：內建亮/暗切換與 VS Code token 解析可能不同步**。TXT panel、canvas、identifier 與 input field 必須透過 TXT-scoped variables 在 `theme-light` / `theme-dark` 下明確覆蓋，避免暗色主題仍顯示白底或低對比文字。
- **主要風險：使用者主題別手動顏色是內容**。任何自動初始色只能套用於缺少目前主題手動記錄的情境，不得覆蓋另一主題手動值。
- **主要風險：preview 唯讀語意**。若讓 preview button 可 keyboard focus，必須保證 Enter/Space/click 不會觸發按下狀態或 `postMessage` mutation。
- **驗證標準**：`npm run compile`、`npm run lint`、`npm run validate:i18n`、相關 Mocha tests，以及 `quickstart.md` 的 light/dark/high contrast manual matrix。
