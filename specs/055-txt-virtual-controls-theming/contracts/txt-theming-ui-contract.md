# 契約：TXT 虛擬控制主題 UI

## 範圍

本契約定義 TXT 虛擬控制在 edit 與 preview WebView 中的主題、狀態、focus、high contrast 與 readonly 呈現要求。它不定義新的控制資料格式、不改變 TXT runtime、不改變 Blockly block/generator 語意。

## 主題契約

- UI 必須在 VS Code WebView 的 `vscode-light`、`vscode-dark`、`vscode-high-contrast` body class 下維持可讀。
- UI 必須同時通過高對比深色與高對比淺色的手動驗收案例。
- UI 應集中使用 TXT-scoped CSS variables；這些 variables 可使用 VS Code theme color CSS variables 作為 fallback，但在內建 `theme-light` / `theme-dark` 下必須能明確覆蓋 panel、canvas、identifier 與 input field surface，避免 selector 或 inline style 直接綁死在可能不同步的 generic token。
- 在 high contrast 中，button、panel、canvas、focus 必須使用 border/outline 或其他非透明 cue；box-shadow 不得是唯一狀態提示。
- 若 `forced-colors: active`，UI 仍必須可辨識，且不可因透明陰影或背景填色接近周圍表面而失去邊界。

## 主題別配色契約

- 未手動調色的按鈕必須依目前主題套用可讀初始背景色與文字色。
- 已在亮色主題手動調整過的按鈕，亮色有效樣式必須保留該主題記錄。
- 已在暗色主題手動調整過的按鈕，暗色有效樣式必須保留該主題記錄。
- 切換主題不得把亮色手動色覆蓋到暗色，也不得把暗色手動色覆蓋到亮色。
- 系統新增的 state cues 可以加入 border、outline、badge、ARIA description；這些 cues 不得被序列化進 `txtVirtualControls` 作為使用者內容。

## 編輯畫面契約

在 edit 模式中：

- Panel/header/canvas/help text 必須透過 TXT-scoped variables 跟隨目前主題；VS Code 主題 token 可作為 fallback，但不得讓內建亮/暗切換失效。
- Inspector 的識別字 value、名稱輸入欄、背景色 input 與文字色 input 必須使用 TXT-scoped field/code variables，並在暗色主題下維持深色 surface 與淺色文字。
- Button 的 normal/selected/running/pressed/focused 狀態，必須在 light、dark、high contrast 下都能區分。
- Button 的顏色 input 必須反映目前主題的有效背景色與文字色。
- 使用者修改顏色 input 時，必須只更新目前主題的手動配色記錄。
- Selected 狀態必須包含非單一顏色狀態線索，例如較粗的 outline / border。
- Running / pressed 狀態必須在不只依賴亮度濾鏡的情況下仍可理解。
- 當鍵盤焦點進入 TXT virtual controls 時，focus-visible 狀態必須清楚可見。
- 切換主題時，已開啟的 TXT virtual controls panel 必須立即更新有效樣式，不要求重新開啟 panel。

## 預覽畫面契約

在 preview 模式中：

- Preview panel 必須透過 badge / hint / title / ARIA text 清楚傳達唯讀語意。
- Preview button 不得可編輯。
- Preview button 不得送出 `saveWorkspace`、`txtUpload`、`txtVirtualControlStateChanged` 或 runtime mutation messages。
- Preview button 可以為了辨識而允許鍵盤聚焦，但若可聚焦，必須保留 `aria-disabled="true"` 與 readonly guard 行為。
- Preview button 的有效配色規則必須與 edit 模式一致，同時仍呈現唯讀感。
- 既有備份完整性 warnings 必須持續顯示；主題有效樣式不得取代 legacy / empty / invalid / missing-reference warnings。

## ARIA 與安全文字契約

- Button 的 ARIA label / title 必須能表達可編輯、已選取、執行中、按下中或唯讀等狀態。
- 使用者提供的按鈕名稱、identifier 與狀態文字必須使用文字安全的 DOM API（`textContent` 或等效方式）插入，不得使用未清理 HTML。
- Preview readonly 說明必須能透過可見文字、title 或 ARIA label 被理解。

## 非 TXT 回歸契約

- 非 TXT 的 edit 與 preview 畫面必須維持既有行為。
- TXT 專屬的 panel、classes、style resolution、keyboard 變更不得出現在 CyberBrick / Arduino previews。
- 既有斷言「non-TXT preview 不含 `txtVirtualControls` payload 且 `previewWarnings` 為空」的測試，除非未來規格變更，否則必須持續有效。

## 驗收證據

當符合以下條件時，可視為實作符合契約：

1. 主題驗證矩陣在亮色、暗色、高對比深色、高對比淺色下皆通過。
2. 未手動調色按鈕會依亮色/暗色主題顯示不同初始色，已手動調色的主題則維持手動數值。
3. Preview 的 readonly guard 對滑鼠與鍵盤啟動都持續有效。
4. 非 TXT 的 preview / edit 行為維持不變。
