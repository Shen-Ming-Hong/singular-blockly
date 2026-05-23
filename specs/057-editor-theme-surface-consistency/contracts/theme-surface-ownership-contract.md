# Contract：Theme Surface Ownership

## 目的

本契約定義 Blockly editor-owned surfaces 的主題 ownership：凡屬於 Blockly editor 內的主要操作 surface，必須跟隨 `singular-blockly.theme` 所代表的 editor theme，而不是 VS Code host theme。

## 適用範圍

### P1 必修 surfaces

| Surface | 主要檔案 | 必須符合的範圍 |
|---|---|---|
| TXT connection modal | `media/html/blocklyEdit.html`, `media/css/blocklyEdit.css` | modal body、標籤、input、password/path 欄位、SSH hint、主要/次要按鈕、status/hint text |
| Sample Browser | `media/html/blocklyEdit.html`, `media/css/blocklyEdit.css`, `media/js/blocklyEdit.js` | modal shell、offline notice、loading spinner/status、category header、sample card、empty state、action button |
| TXT virtual controls editor chrome | `media/css/blocklyEdit.css`, `media/js/blocklyEdit.js` | panel shell、header、tabs、toolbar、canvas background/chrome、inspector、splitter、badge、warning/invalid reference chrome |

### Opportunistic surfaces

| Surface | 規則 |
|---|---|
| Shadow suggestion hint / AI suggestion overlays | 若本輪實作有修改，必須使用 editor theme 並即時更新；若未修改，只做 smoke-check 紀錄，不作為 completion gate。 |

### 排除範圍

| Surface | 排除原因 |
|---|---|
| `media/css/platformioDiagnostic.css` | 這是 standalone diagnostic page，設計上可跟隨 VS Code host theme。 |
| VS Code workbench native UI | 不屬於 Blockly editor WebView。 |
| Blockly block fill/stroke 本身 | 由 Blockly theme object 管理，非本契約的自訂 surface base UI。 |

## Ownership 規則

### 必須使用 editor theme 的 CSS 軸

- Core surface selectors 必須以 `body.theme-light` / `body.theme-dark` 或 editor-owned CSS custom properties 作為 base UI 的色彩來源。
- Core surface 的 base UI 包含：
  - `background`
  - `color`
  - `border-color`
  - input/textarea/select 的 background/foreground/border
  - card/list item background/foreground/border
  - hint/notice/status 的 readable foreground/background
  - scrollbar track/thumb（若在 editor-owned panel 中定義）

### 禁止的 leakage pattern

在 P1 surfaces 中，下列 pattern 不得作為 base UI 色彩來源：

- HTML inline style 使用：
  - `var(--vscode-input-background)`
  - `var(--vscode-input-foreground)`
  - `var(--vscode-input-border)`
  - `var(--vscode-editor-background)`
  - `var(--vscode-editor-foreground)`
  - `var(--vscode-panel-border)`
- P1 surface base selector 使用 `body.vscode-light` / `body.vscode-dark` 指派 editor-owned token。
- 對 editor-owned surface 使用 host list/button/input tokens 作為主要背景、文字或邊界，除非列入 allowlist。
- 使用低對比硬編碼色作為提示文字，例如在 light/dark 其中一邊不可讀的固定 `#888`。

## 允許例外

下列情況允許使用 host/system token，但必須在 code review 中能被辨識為例外而非 leakage：

| 例外 | 允許內容 |
|---|---|
| High contrast / forced-colors | `body.vscode-high-contrast`、`body.vscode-high-contrast-light`、system colors、VS Code contrast/focus tokens |
| Focus / contrast rings | `--vscode-focusBorder`、`--vscode-contrastActiveBorder`、`--vscode-contrastBorder` 等輔助邊界 token |
| Font tokens | `--vscode-font-family`、`--vscode-editor-font-family`、monospace font tokens |
| Standalone host-themed pages | `platformioDiagnostic.css` 等非 Blockly editor-owned page |
| Existing control semantic colors | TXT virtual control 的使用者自訂按鈕顏色、狀態顏色可保留，但 chrome 必須 editor-themed |

## Source-contract 檢查建議

自動化測試可用文字/AST-lite 掃描以下 contract：

1. `media/html/blocklyEdit.html`
   - `#txtHostInput`、`#txtUsernameInput`、`#txtPasswordInput`、`#txtRemotePathInput` 不得含 inline `--vscode-input-*`。
   - `#txtSshHint` 不得用固定 `#888` 作為唯一 color。
2. `media/css/blocklyEdit.css`
   - Sample Browser P1 selectors（例如 `.sample-card`、`.sample-offline-notice`、`.sample-category-header`）不得使用 host editor/panel base tokens 作為 primary background/border/foreground。
   - TXT virtual controls editor chrome token 不得在 `body.vscode-light` / `body.vscode-dark` 下被指派為 base light/dark theme。
   - 高對比、focus ring、font token 使用需符合 allowlist。
3. `media/css/platformioDiagnostic.css`
   - 不納入 editor-owned leakage failure。

## 驗收條件

- 在 VS Code 深色 + Blockly editor 淺色時，TXT connection modal、Sample Browser、TXT virtual controls chrome 都呈現淺色 editor surface。
- 在 VS Code 淺色 + Blockly editor 深色時，同一批 surface 都呈現深色 editor surface。
- 在 host/editor 主題相同時，不出現回歸或突兀混色。
- 高對比 smoke check 中，主要邊界、焦點與文字仍可辨識。
