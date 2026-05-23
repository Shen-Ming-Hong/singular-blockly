# Contract：Touched Feedback Rules

## 目的

本契約約束 057 中「被碰到的提示/說明/狀態元素」如何被主題化。它不是全域 feedback framework，也不重新定義所有提示方法；只確保本輪 touched elements 在 editor theme 下可讀、角色不變、且不因 theme 修正引入新的互動成本。

## 適用元素

下列元素若在本輪被修改，需符合本契約：

| 元素類型 | 範例 | 本輪目標 |
|---|---|---|
| Inline hint | TXT SSH hint、TXT virtual controls 說明文字 | 改用 editor-owned description token，保持說明角色 |
| Notice | Sample Browser offline notice、empty state | 改用 editor-owned notice token，保持原本顯示位置與語氣 |
| Loading/status | Sample Browser loading spinner/status、connection status | 保持狀態含義，確保 light/dark 可讀 |
| Warning/invalid state | TXT virtual controls invalid references 或警告 chrome | 保持 warning role，顏色跟 editor theme 協調 |
| Secondary overlay hint | Shadow suggestion hint（若 touched） | 不列為 P1，但 touched 時需跟 editor theme 且即時更新 |

## 非目標

057 不做以下工作：

- 不建立全域 feedback taxonomy。
- 不把所有 hint/notice/warning/toast/block warning 合併成同一元件。
- 不更改現有提示的主要互動模式。
- 不新增大規模 i18n 文案重寫。
- 不為所有 overlay 建立完整設計系統。

## 規則

### 規則 1：角色保留

被修改的 feedback element 必須保留原本角色。

- `hint` 還是 hint，不變成 modal 或 toast。
- `offline notice` 還是 notice，不變成 blocking error。
- `warning` 還是 warning，不降級成一般 description。

若需要改變角色，必須另開規格，不在 057 完成。

### 規則 2：可讀性優先

Feedback element 必須使用 editor-owned token 或允許的 accessibility token，讓 light/dark editor theme 都可讀。

- 不得只依賴固定 `#888` 這類在某些背景下可能低對比的顏色。
- 不得用 host theme token 讓文字在交錯主題下變成 host-colored。
- 高對比 smoke check 中不得消失或變成無法辨識。

### 規則 3：重要資訊不得只靠 hover

若提示承載操作必要資訊，不能改成 hover-only。

- TXT connection SSH hint 應在需要時可直接看到。
- Sample Browser offline/empty/loading 狀態應保留可見位置。
- Tooltip 可作為補充，但不能是唯一資訊來源。

### 規則 4：i18n 不回歸

若本輪新增或修改 visible text：

- 必須更新 `media/locales/*/messages.js` 的 15 語系。
- 必須跑 `npm run validate:i18n`。
- 長翻譯需在 Sample Browser/modal/panel 中保持不溢出主要操作區。

若只改 CSS token、不改文字，可不新增 i18n key。

### 規則 5：即時 theme update

被修改的 feedback element 必須跟隨本輪 theme switch contract。

- 已開啟 surface 中的 hint/notice/status 在 `updateTheme(theme)` 後立即換色。
- 若 element 使用 CSS token，應由 body class repaint。
- 若 element 使用 JS inline/computed style，必須納入 refresh flow。

### 規則 6：不要擴張 selector 影響範圍

為避免 scope creep，CSS selector 應鎖定本輪 surface 或共用 editor-owned token，不應用過寬 selector 意外改到 host-themed standalone pages。

- 可使用 surface-specific class 或 modal/container selector。
- 不應全域覆寫所有 `button`、`input`、`.notice`，除非位於 Blockly editor container 且已確認不影響排除頁面。

## Source-contract 檢查建議

- 若 `blocklyEdit.html` 的 hint style 被改動，確認沒有固定低對比 inline color。
- 若 `blocklyEdit.css` 的 notice/status/warning selector 被改動，確認它們讀取 editor-owned token 或 allowlisted accessibility token。
- 若新增 visible text，確認 i18n validation 納入 quickstart。
- 若觸及 `shadowBlock.css`，確認 selector 不再只依賴 `body.vscode-light/dark` 來決定 editor-owned hint base theme，或在 plan/tasks 中記錄例外。

## 驗收條件

- 使用者在 P1 surfaces 中看到的提示/狀態文字在 editor light/dark 都清楚可讀。
- Theme 修正後，提示元素仍出現在原本位置、扮演原本角色。
- 沒有因本輪修改新增需要使用者學習的新提示互動模式。
- 若可見文字有改，15 語系驗證通過。
