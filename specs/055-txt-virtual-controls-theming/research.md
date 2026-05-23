# 研究紀錄：TXT 虛擬控制主題一致性

## 決策 1：主題判定同時使用內建 theme class 與 VS Code WebView class/token

**決策**：TXT 虛擬控制的 light/dark/high contrast 呈現應同時使用既有 `theme-light` / `theme-dark` class 與 VS Code WebView 自動提供的 `vscode-light`、`vscode-dark`、`vscode-high-contrast` body class。`vscode-*` class 與 `--vscode-*` token 用於跟隨 VS Code 主題與 high contrast；內建 `theme-light` / `theme-dark` 則必須透過 TXT-scoped CSS variables 明確覆蓋 panel、canvas、identifier、input field 與 code field surface，避免使用者只切換擴充功能內建主題時仍解析到另一個主題的 token。

**理由**：VS Code 官方 WebView 文件指出，WebView 會依目前主題在 `body` 加上 `vscode-light`、`vscode-dark` 或 `vscode-high-contrast`，並提供 theme color CSS variables。後續實測發現，擴充功能內建的亮/暗切換可能只改變 `theme-light` / `theme-dark`，而 VS Code token 仍維持目前 VS Code color theme 的解析值；若 TXT panel 或 inspector 直接使用 generic input/code token，就會在暗色主題出現白底淡字。因此 TXT 專屬 UI 需要集中在 TXT-scoped variables 中處理內建 theme override，再由各 selector 消費這些 variables。

**曾考慮的替代方案**：

- 只使用專案自己的 `theme-light` / `theme-dark`：無法涵蓋 VS Code high contrast 類別。
- 只使用 VS Code `--vscode-*` token：在使用者切換擴充功能內建亮/暗主題但未切換 VS Code color theme 時，panel、canvas 或 inspector 可能仍拿到亮色 token，拒絕。
- 在 Extension Host 推斷高對比：Host 不知道 WebView resolved CSS 與使用者實際 color theme，不可靠。
- 為 TXT 新增獨立主題設定：超出規格，且違反避免過度開發。

**實作註記**：由於官方 WebView 保證的是 `vscode-high-contrast` generic class，而不是穩定的「高對比深色 / 淺色」細分 class，本功能應以 generic high contrast CSS 規則為主，並以 Theme Verification Matrix 的手動案例驗證深色與淺色兩種高對比主題都通過驗收。只有在可以穩定取得 theme id 或其他官方訊號時，才額外加入變體專屬細修樣式。`theme-light` / `theme-dark` 的 TXT-scoped variables 必須位於 `vscode-light` / `vscode-dark` 規則之後，讓內建 theme switch 能正確覆蓋 token fallback；high contrast 規則仍應最後覆蓋以保留可近性。

## 決策 2：亮色與暗色各自使用可讀初始配色

**決策**：未手動調色的 TXT virtual button 必須依目前主題使用可讀初始配色；亮色與暗色初始色必須不同，讓面板開啟中切換主題時按鈕能立即呈現符合主題的基礎外觀。

**理由**：使用者實測指出，面板開啟時切換主題若按鈕仍沿用同一組顏色，學生可能在另一個主題下看不到按鈕或文字。主題初始色能提供穩定且可讀的起點，降低第一次使用與跨主題切換的認知負擔。

**曾考慮的替代方案**：

- 永遠沿用同一組預設顏色：切到另一主題時仍可能難以辨識，拒絕。
- 切主題時強制改寫所有按鈕顏色：會覆蓋學生手動設定，拒絕。
- 新增設定頁讓使用者管理預設色：超出本規格，拒絕。

## 決策 3：手動配色按主題分開保存

**決策**：`txtVirtualControls.controls[].style` 向後相容保留 `backgroundColor` 與 `textColor`，並新增可選 `themeStyles.light` / `themeStyles.dark` 來記錄使用者在各主題下手動設定的背景色與文字色。使用者只在目前主題調整顏色時，才更新該主題記錄。

**理由**：教師與學生可能把顏色當作教學語意。若只保存單一配色，亮色下調整的顏色可能在暗色下不可讀；若切換時自動覆蓋，又會破壞使用者明確設定。主題別記錄可以同時滿足「自動可讀起點」與「保留學生數值」。

**曾考慮的替代方案**：

- 只保留單一 `backgroundColor` / `textColor`：無法區分亮暗主題的手動意圖。
- 每次 render 都把有效樣式寫回單一欄位：會讓缺少手動記錄的主題誤變成使用者內容。
- 為高對比也新增獨立手動記錄：目前需求只要求亮色與暗色手動記錄，高對比以系統 cue 與手動矩陣驗證，避免過度開發。

## 決策 4：可讀文字色用 WCAG 相對亮度作為純函式依據

**決策**：共用 helper 保留顏色解析、相對亮度與 contrast ratio 純函式，並用它們在自動初始色或 fallback 中選擇更可讀的文字色。這些函式不得直接操作 DOM 或依賴 Blockly runtime。

**理由**：相對亮度比值是標準、可測、可重現的演算法；純函式能讓 Mocha contract tests 驗證顏色解析與有效樣式選擇，不需要模擬完整 WebView DOM。

**曾考慮的替代方案**：

- 用 RGB 距離或簡單亮度差：實作較短但誤判率高。
- 在 Extension Host 計算所有有效樣式：Host 無法知道 WebView theme class 與實際 preview 狀態，且會混淆兩個 context。
- 完全交給 CSS：無法支援持久化 `themeStyles` 與 color input 的目前主題值。

## 決策 5：Edit 與 preview 共用有效樣式規則，但 preview 維持唯讀

**決策**：edit 與 preview 都在 WebView context 中解析目前主題有效樣式：有目前主題手動記錄時使用手動色，沒有時使用該主題初始色。Preview 只讀取並呈現資料，不得建立或更新手動記錄，也不得送出編輯或 runtime mutation message。

**理由**：使用者會在 edit 與 preview 中比較同一份 TXT 控制內容；有效樣式規則一致可以降低混淆。Preview 是檢視功能，必須保留 `054-preview-txt-controls` 已定義的唯讀邊界。

**曾考慮的替代方案**：

- Edit 使用新規則、preview 保持舊單一配色：兩個畫面會看起來不一致，拒絕。
- Preview 幫忙補寫缺少的主題記錄：違反唯讀邊界，拒絕。
- 讓 Host 在 preview payload 中預先展開有效樣式：會把主題狀態搬到 Host，增加錯判風險。

## 決策 6：移除額外配色提示 UI，改以良好預設與狀態 cue 解決可辨識性

**決策**：採用主題初始色與主題別手動記錄後，不再為按鈕配色額外顯示按鈕標記或 panel 清單。可辨識性由初始色、使用者手動調整、border/outline/focus/state cues 與 high contrast 規則共同維持。

**理由**：使用者明確表示新設計下可以移除提示功能。對學生而言，自動換到可讀起點比顯示警示更直接，也避免 panel 中出現過多干擾資訊。

**曾考慮的替代方案**：

- 保留舊提示 UI：與最新需求不符，拒絕。
- 阻擋使用者保存不易閱讀的手動色：會干擾教學流程且覆蓋使用者意圖，拒絕。
- 自動改寫使用者手動色：會破壞顏色作為內容的語意，拒絕。

## 決策 7：High contrast 以 border/outline 與非透明 cues 優先，shadow 只能作為輔助

**決策**：high contrast 模式中，TXT button、panel、canvas 與 focus 必須使用高對比 border/outline/token；原有 box-shadow 不能是唯一辨識手段。若 OS 啟用 `forced-colors: active`，需允許系統色與 `forced-color-adjust` 策略維持辨識性。

**理由**：VS Code Theme Color Reference 指出 `contrastBorder` / `contrastActiveBorder` 用於高對比主題中的額外邊框。陰影在高對比或 forced-colors 環境中可能消失或不明顯，因此不可依賴。

**曾考慮的替代方案**：

- 延續硬編碼 rgba shadow：目前缺口來源之一，拒絕。
- 只在 dark theme 改 shadow：無法涵蓋 high contrast light/dark。
- 強制按鈕背景改成 theme button color：破壞使用者儲存色。

## 決策 8：Preview 維持唯讀；鍵盤可近性不得引入操作語意

**決策**：preview 的虛擬按鈕仍是檢視用途，不能編輯、不能觸發按下狀態、不能送出 runtime mutation message。若實作讓 preview button 可被 Tab 聚焦以利辨識，必須保留 `aria-disabled`、readonly title/hint 與 readonly guard；Enter/Space/click 都不得改變狀態。

**理由**：`054-preview-txt-controls` 的核心邊界是 preview-only。此功能要提升焦點與狀態可辨識性，但不能讓使用者誤以為 preview 可操作。

**曾考慮的替代方案**：

- 保持 button `tabIndex=-1` 且只讓 canvas 聚焦：風險最低，但個別按鈕的鍵盤辨識較弱。
- 讓 preview button 可按下模擬 runtime：屬於新功能，超出本規格。
- 用 disabled attribute：瀏覽器可能移除 focusability，且較難提供自訂 readonly hint。

## 決策 9：Inspector 欄位與識別字膠囊納入主題 surface

**決策**：TXT edit inspector 中的識別字 label/value、名稱輸入欄與顏色輸入欄，必須使用 TXT-scoped `field` / `code` surface variables，而不是直接在 HTML inline style 或 selector 中使用 generic `--vscode-input-*` / `--vscode-textCodeBlock-*` token。

**理由**：使用者實測指出暗色主題下識別字值會出現白底淡字。這類欄位屬於 TXT virtual controls panel 的一部分，應跟著 panel 的目前主題更新；若留在 HTML inline style 或直接使用 generic token，就會繞過 TXT 的內建 theme override。

**曾考慮的替代方案**：

- 保留 inline `--vscode-input-*` style：會在內建 theme 與 VS Code color theme 不一致時產生低對比，拒絕。
- 只修識別字 value，不修名稱與顏色 input：仍會留下同類型低對比風險，拒絕。
- 在 JavaScript 切主題時直接寫入欄位顏色：會分散樣式邏輯並增加 WebView 狀態同步成本，拒絕。
