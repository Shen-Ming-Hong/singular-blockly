# Contract：Theme Switch Immediate Update

## 目的

本契約定義 editor theme 切換時，已開啟的 Blockly editor-owned surfaces 必須即時更新且保持操作狀態，不得依賴 WebView reload。

## Theme source of truth

- 持久化設定：`singular-blockly.theme`
- Extension Host service：`src/services/settingsManager.ts`
- WebView initial injection：`src/webview/webviewManager.ts`
  - `window.initialTheme`
  - `<body class="theme-{theme}">`
- WebView runtime update：`media/js/blocklyEdit.js`
  - `currentTheme`
  - `updateTheme(theme)`
  - Blockly `workspace.setTheme(...)`

## 觸發情境

### 情境 A：WebView toolbar theme toggle

**Given** Blockly editor 已開啟，且任一 P1 surface 可見。  
**When** 使用者按下 editor 內主題切換按鈕。  
**Then** WebView 必須：

1. 更新 `currentTheme`。
2. 呼叫 `updateTheme(nextTheme)`。
3. 將 `body.theme-light` / `body.theme-dark` 切到新值。
4. 套用 Blockly theme object。
5. 保留已開啟 surface 的 open state 與輸入內容。
6. 將 `{ command: 'updateTheme', theme: nextTheme }` 傳回 Extension Host 持久化。

### 情境 B：Extension Host command `singular-blockly.toggleTheme`

**Given** Blockly editor WebView 已存在。  
**When** 使用者透過 VS Code command 切換 Singular Blockly theme。  
**Then** Extension Host 必須：

1. 更新 settings 中的 editor theme。
2. 對現有 panel 發送 `updateTheme` 或等效 message。
3. WebView 收到後呼叫 `updateTheme(theme)`。
4. 不重設 `webview.html`，不 reload WebView。

### 情境 C：Workspace load message 帶入 theme

**Given** WebView 正在載入 workspace state。  
**When** message 包含有效 `theme`。  
**Then** WebView 必須以該 theme 更新 editor-owned body class 與 Blockly theme。

### 情境 D：已開啟 surface 的即時更新

**Given** 下列任一 surface 已開啟：

- TXT connection modal
- Sample Browser
- TXT virtual controls panel/chrome
- 任何本輪有修改的 secondary overlay

**When** editor theme 從 light 切到 dark 或從 dark 切到 light。  
**Then** surface 必須在不關閉、不重新開啟、不 reload WebView 的情況下更新：

- 背景
- 前景文字
- 邊界
- input/field 顏色
- card/list/notice 顏色
- focus/hover/active 狀態（若目前可見或可操作）
- TXT virtual controls chrome；使用者自訂控制色需保留

### 可觀測更新門檻

「即時更新」的通過標準為：使用者觸發 editor theme switch 後，WebView 不 reload、surface 不關閉再開啟；`updateTheme(theme)` 完成後下一次瀏覽器 repaint 必須呈現新 editor theme。已開啟 surface 的 input value、scroll state、modal open state、TXT virtual controls 配置與使用者自訂 control colors 必須保留。

## 禁止行為

- 不得為了套用 theme 而重新指定整個 `panel.webview.html`。
- 不得要求使用者關閉再開啟 modal/browser/panel。
- 不得只更新 Blockly workspace 本身而漏掉 editor-owned custom surface。
- 不得讓 host `body.vscode-*` class 決定 P1 surface base light/dark。

## JS/CSS 實作期待

### CSS-first surface

若 surface 的顏色可由 CSS custom properties 與 body class 完成，應優先使用 CSS-first：

- `body.theme-light` / `body.theme-dark` 改變 token。
- surface selectors 讀取 token。
- 切換時瀏覽器自動 repaint。

### JS-computed surface

若 surface 仍有必要使用 JS 計算 inline style（例如 TXT virtual controls canvas/control preview），切換時必須由既有或新增 refresh function 更新：

- `updateTheme(theme)` 呼叫 `refreshTxtVirtualControlsUI()` 或等效函式。
- refresh 不得改變使用者配置資料。
- refresh 不得覆蓋使用者自訂 control colors。

## Source-contract 檢查建議

1. `media/js/blocklyEdit.js`
   - `updateTheme(theme)` 應保留 body class 更新與 Blockly `setTheme`。
   - 若 TXT virtual controls 有 JS-computed chrome 色，`updateTheme(theme)` 必須觸發刷新。
2. `src/webview/webviewManager.ts`
   - 初始 HTML 仍注入 `window.initialTheme` 與 body `theme-{theme}`。
3. `src/extension.ts` / `src/webview/messageHandler.ts`
   - WebView toolbar 與 Extension Host command 的持久化/同步 flow 不得被破壞。

## 驗收條件

- 切換 editor theme 時，已開啟的 TXT connection modal 不消失，欄位內容不被清空，且在 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 換色。
- 切換 editor theme 時，已開啟的 Sample Browser 保留目前顯示狀態，卡片與 notice 在下一次瀏覽器 repaint 換色。
- 切換 editor theme 時，TXT virtual controls chrome 在下一次瀏覽器 repaint 換色，但 custom button/control colors 不被重設。
- VS Code host theme 不變時，editor theme 切換仍能獨立生效。
- VS Code host theme 與 editor theme 交錯時，P1 surfaces 跟隨 editor theme。
