# 快速驗證：TXT 虛擬控制主題一致性

> 本快速驗證文件用於後續 implementation 完成後驗證；plan 階段不要求執行。

## 1. 建立測試資料

1. 開啟 TXT 專案並顯示 TXT Virtual Controls panel。
2. 建立至少 3 顆 virtual buttons：
   - `Auto Theme`: 不手動調整顏色，用來確認亮色與暗色會自動使用不同的可讀初始色。
   - `Light Manual`: 在亮色模式手動調整背景與文字色，暗色模式不調整。
   - `Both Manual`: 分別在亮色與暗色模式手動調整不同背景與文字色。
3. 儲存專案，確認 `blockly/main.json` 中已手動調整過的按鈕含有對應 `style.themeStyles.light` 或 `style.themeStyles.dark` 記錄。
4. 額外準備至少一份舊版 TXT 備份或既有 `txtVirtualControls` 備份檔，供後續 preview 與相容性驗證使用。

## 2. 編輯模式主題驗證

針對以下主題依序檢查：

- 亮色
- 暗色
- 高對比深色
- 高對比淺色

每個主題都檢查：

1. Panel header、canvas、hint 都可讀。
2. 選取按鈕後，inspector 的識別字 label/value、名稱輸入欄、背景色 input 與文字色 input 都可讀，暗色主題下不得出現白底淡字。
3. `Auto Theme` 在亮色與暗色下會顯示不同且可讀的主題初始色。
4. `Light Manual` 在亮色下顯示亮色手動色；切到暗色後顯示暗色主題初始色。
5. `Both Manual` 在亮色與暗色下分別顯示各自手動調整過的顏色。
6. 選取、執行中、按下中、keyboard focus 都有非單一顏色 cue。
7. 切換主題後，不需要重新開啟 panel，按鈕有效配色、inspector 欄位與狀態 cue 會更新。
8. 畫面不應出現額外配色提示、配色警示圖示或配色提示清單。

## 3. 預覽模式驗證

1. 開啟一份舊版 TXT 備份或含 `txtVirtualControls` 的既有備份。
2. 在 preview 中確認 TXT Virtual Controls panel 顯示 readonly badge / hint。
3. 針對亮色、暗色、高對比深色、高對比淺色重複檢查：
   - 虛擬按鈕顏色依目前主題顯示有效樣式：有該主題手動記錄時用手動色，沒有時用主題初始色。
   - 按鈕不能被編輯或按下。
   - 若按鈕可透過鍵盤聚焦，Enter/Space 不會觸發任何 runtime 或 save message。
4. 明確確認舊備份中的既有按鈕顏色不需手動轉換即可載入。
5. 檢查既有 preview warnings（legacy、empty、invalid、missing-reference）仍能正常顯示；不應新增額外配色提示。

## 4. 非 TXT 回歸驗證

1. 開啟 CyberBrick 或 Arduino 專案 edit 畫面。
2. 開啟 CyberBrick 或 Arduino backup preview。
3. 確認沒有出現 TXT panel 或新的 TXT-only focus/keyboard 行為。
4. 確認既有 Blockly 編輯、preview、theme switch 行為不變。

## 5. 建議執行的自動化檢查

Implementation 後建議執行：

```bash
npm run compile
npm run lint
npm run validate:i18n
npm test
```

若測試成本需控制，可先跑與 TXT preview / virtual controls 相關的 Mocha tests，再於合併前跑完整 `npm test`。

## 6. 驗收紀錄模板

**驗收紀錄（2026-05-23）**：使用者已完成手動測試並確認通過。覆蓋重點包含亮色／暗色主題切換、TXT virtual controls panel/canvas 可讀性、暗色 edit inspector 識別字與輸入欄可讀性、主題初始色自動切換、主題別手動配色保留、preview 唯讀語意，以及不再顯示額外配色提示。

| 案例 | 主題 | 畫面 | 結果 | 證據 |
|------|------|------|------|------|
| M1 | 亮色 | Edit | 通過 | 使用者手動測試確認 |
| M2 | 暗色 | Edit | 通過 | 使用者手動測試確認 |
| M3 | 高對比深色 | Edit | 通過 | 使用者手動測試確認 |
| M4 | 高對比淺色 | Edit | 通過 | 使用者手動測試確認 |
| M5 | 亮色 | Preview | 通過 | 使用者手動測試確認 |
| M6 | 暗色 | Preview | 通過 | 使用者手動測試確認 |
| M7 | 高對比深色 | Preview | 通過 | 使用者手動測試確認 |
| M8 | 高對比淺色（舊備份） | Preview | 通過 | 使用者手動測試確認 |
| M9 | 任意主題 | 非 TXT | 通過 | 使用者手動測試確認 |
| M10 | 暗色 | Edit inspector | 通過 | 使用者確認識別字、名稱輸入欄與顏色輸入欄可讀 |
