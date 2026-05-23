# 契約：TXT 主題驗證矩陣

## 必要主題

| 主題案例 | 必要覆蓋範圍 | 預期結果 |
|------------|-------------------|-----------------|
| 亮色 | edit + preview | Panel/canvas/button/inspector/focus 可讀；未手動調色按鈕使用亮色初始色。 |
| 暗色 | edit + preview | Panel/canvas/button/inspector/focus 可讀；未手動調色按鈕使用暗色初始色；識別字與輸入欄不得殘留亮色底。 |
| 高對比深色 | edit + preview | Border/outline/focus/readonly cues 清楚可見，且不依賴陰影。 |
| 高對比淺色 | edit + preview | Border/outline/focus/readonly cues 清楚可見，且不依賴陰影。 |

## 必要控制配置

| 配置 | 範例 | 預期結果 |
|-------|---------|-----------------|
| 未手動調色 | 新增按鈕後不調整背景與文字色 | 亮色使用亮色初始色，暗色使用暗色初始色。 |
| 只在亮色調色 | `themeStyles.light` 有記錄，`themeStyles.dark` 缺少記錄 | 亮色顯示手動色；暗色顯示暗色初始色。 |
| 只在暗色調色 | `themeStyles.dark` 有記錄，`themeStyles.light` 缺少記錄 | 暗色顯示手動色；亮色顯示亮色初始色。 |
| 亮暗皆調色 | `themeStyles.light` 與 `themeStyles.dark` 都有記錄 | 切換主題與重新開啟後各自保留手動色。 |
| 舊備份 | 只有 `style.backgroundColor` / `style.textColor` | 可直接載入；缺少目前主題手動記錄時使用目前主題的有效樣式規則。 |
| 預覽唯讀 | 備份預覽中的任意配置 | 按鈕不可編輯 / 按下；readonly badge / hint 清楚可見。 |
| 非 TXT 預覽 | CyberBrick / Arduino 備份 | 不出現 TXT panel / style / interaction 變化。 |

## 必要狀態檢查

| 畫面 | 狀態 | 預期提示 |
|---------|-------|--------------|
| Edit | normal | 按鈕依目前主題套用有效配色；邊界可見。 |
| Edit | selected | 有明顯的非單一顏色選取提示，例如較粗的 border/outline。 |
| Edit | running | 可辨識執行中狀態，且不只依賴顏色。 |
| Edit | pressed | 按下狀態可見，且高對比下仍清楚。 |
| Edit | focus-visible | 鍵盤焦點環在 TXT 控制元素上清楚可見。 |
| Edit | inspector | 識別字 value、名稱輸入欄與顏色輸入欄在目前主題下可讀且邊界清楚。 |
| Preview | readonly | Badge / hint / title / ARIA 能傳達僅供預覽。 |
| Preview | focus-visible | 若 preview button 可聚焦，焦點 cue 清楚可見且啟動會被阻擋。 |

## 證據需求

在 implementation 簽核前，至少記錄：

- 已檢查的主題名稱與畫面。
- 每個高對比變體的截圖或書面觀察。
- 已確認未手動調色按鈕會在亮色與暗色使用不同初始色。
- 已確認單一主題手動調色不會覆蓋另一主題。
- 已確認亮暗皆手動調色的按鈕在切換與重新開啟後保留兩組數值。
- 已確認暗色 edit inspector 的識別字、名稱輸入欄與顏色輸入欄不出現白底淡字。
- 已確認非 TXT preview 維持原有行為。

## 建議的手動矩陣

| ID | 主題 | 畫面 | 配置 | 通過標準 |
|----|-------|---------|-------|---------------|
| M1 | 亮色 | Edit | 未手動調色 | 顯示亮色初始色；selected / focus cues 可見。 |
| M2 | 暗色 | Edit | 未手動調色 | 顯示暗色初始色；不需重新開啟 panel。 |
| M2A | 暗色 | Edit inspector | 任意已選取按鈕 | 識別字、名稱輸入欄與顏色輸入欄可讀且不殘留亮色 token。 |
| M3 | 高對比深色 | Edit | 只在亮色調色 | Border / outline 可見；暗色側使用暗色有效樣式。 |
| M4 | 高對比淺色 | Edit | 亮暗皆調色 | 狀態 cue 與兩組手動色都可辨識。 |
| M5 | 亮色 | Preview | 只在暗色調色 | Preview 顯示亮色初始色；Readonly hint 可見；不可啟動。 |
| M6 | 暗色 | Preview | 只在暗色調色 | Preview 顯示暗色手動色；無 mutation message。 |
| M7 | 高對比深色 | Preview | 亮暗皆調色 | Readonly + focus cues 可見；目前主題有效色正確。 |
| M8 | 高對比淺色 | Preview | 舊備份 | 可載入；不需手動轉換；顏色資料不遺失。 |
| M9 | 任意主題 | 非 TXT 預覽 | CyberBrick / Arduino 備份 | 不顯示 TXT 專屬 panel 或 keyboard guard。 |
