# Quickstart：驗證編輯器主題 surface 一致性

## 前置條件

- 使用 VS Code / VS Code Insiders 開啟 `/Users/user/Documents/singular-blockly`。
- 安裝專案依賴。
- 以 Extension Development Host 啟動 Singular Blockly extension。
- 能開啟 Blockly editor WebView。

## 自動化驗證

在實作完成後執行下列檢查：

```bash
npm run compile
npm run lint
npm test
```

若本輪新增或修改任何 visible text，另外執行：

```bash
npm run validate:i18n
```

若新增 source-contract test，建議至少確認它涵蓋：

- TXT connection modal input 不再含 inline `--vscode-input-*` base style。
- Sample Browser P1 selectors 不再用 host editor/panel base token 作為主要 surface color。
- TXT virtual controls editor chrome 不再由 `body.vscode-light/dark` 決定 base light/dark token。
- 高對比、focus ring、font token 等 allowlist 不被誤判。

## 手動驗證矩陣

> 記錄時請保留截圖或簡短 pass/fail note。高對比是 smoke check；light/dark 交錯情境是 P1 completion gate。即時更新的通過標準是：不 reload WebView、不關閉再開啟 surface，且 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 即顯示新 editor theme。

| 情境 | VS Code host theme | Blockly editor theme | 必驗 surfaces | 預期結果 |
|---|---|---|---|---|
| M1 | Dark | Light | TXT modal、Sample Browser、TXT virtual controls | 三者呈現淺色 editor surface，不被 host 深色污染 |
| M2 | Light | Dark | TXT modal、Sample Browser、TXT virtual controls | 三者呈現深色 editor surface，不被 host 淺色污染 |
| M3 | Dark | Dark | TXT modal、Sample Browser、TXT virtual controls | 同色情境正常，無回歸或低對比 |
| M4 | Light | Light | TXT modal、Sample Browser、TXT virtual controls | 同色情境正常，無回歸或低對比 |
| M5 | High Contrast | Light 或 Dark | P1 surfaces smoke check | 主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失 |

## 手動流程 A：TXT connection modal

1. 開啟 Blockly editor。
2. 將 VS Code host theme 設為 Dark。
3. 將 Blockly editor theme 設為 Light。
4. 開啟 TXT controller connection modal。
5. 檢查：
   - Modal shell 背景與文字符合 editor light theme。
   - Host、Username、Password、Remote path input 為 editor light field style。
   - Input 文字與 placeholder 可讀。
   - `#txtSshHint` 說明文字可讀，不呈現 host 深色主題殘留。
   - 按鈕與 status/hint 不混用 host 深色背景。
6. 在 modal 保持開啟且 input 有內容時切換 Blockly editor theme 到 Dark。
7. 確認：
   - Modal 不關閉。
   - Input 內容保留。
   - `updateTheme(theme)` 完成後下一次瀏覽器 repaint 時，Modal、input、hint、button 顏色切到 editor dark theme。
8. 反向切回 Light，再確認一次。

## 手動流程 B：Sample Browser

1. 開啟 Blockly editor。
2. 開啟 Sample Browser modal。
3. 在 M1 / M2 情境下分別檢查：
   - Modal shell、header、body 背景符合 editor theme。
   - Offline notice、loading spinner/status、empty notice 可讀。
   - Category header、sample card、card hover/focus 狀態不使用 host theme base color。
   - Card 內標題、描述、按鈕在 light/dark editor theme 都可讀。
4. 在 Sample Browser 保持開啟時切換 Blockly editor theme。
5. 確認 modal 不關閉、scroll position 盡量保留、可見 card/notice 在 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 換色。

## 手動流程 C：TXT virtual controls editor chrome

1. 開啟含 TXT virtual controls 的 workspace，或使用可觸發 virtual controls panel 的測試專案。
2. 在 M1 / M2 情境下檢查：
   - Panel shell、header、tabs、toolbar、splitter、canvas chrome、inspector 依 editor theme 顯示。
   - Canvas 或 panel 中的 hint/warning/status 可讀。
   - Invalid reference / badge / warning chrome 不被 host theme base color 污染。
   - 使用者自訂 control/button 顏色保留，不被 editor theme token 覆蓋。
3. 保持 virtual controls 開啟並切換 editor theme。
4. 確認 chrome 在 `updateTheme(theme)` 完成後下一次瀏覽器 repaint 換色，控制項配置與自訂顏色不重設。

## 手動流程 D：secondary overlays smoke check

1. 若本輪未修改 shadow suggestion hint，只需開啟 smoke check 並記錄是否有明顯低對比。
2. 若本輪修改 `media/css/shadowBlock.css` 或相關 overlay：
   - 在 M1 / M2 情境下觸發 shadow suggestion hint。
   - 確認 hint 跟 editor theme，而不是 host theme。
   - 在 hint 顯示時切換 editor theme，確認即時更新。

## 手動流程 E：排除頁面不回歸

1. 開啟 PlatformIO diagnostic UI 或相關 standalone host-themed page。
2. 確認本輪 editor-owned token 變更沒有意外改壞 standalone page。
3. 若該頁仍使用 `--vscode-*` host tokens，這是允許例外，不應被 057 source-contract 當成 failure。

## 驗證紀錄格式

可在 PR 或任務紀錄使用下列格式：

```text
057 manual matrix:
- M1 VS Code Dark + Editor Light: PASS/FAIL, notes:
- M2 VS Code Light + Editor Dark: PASS/FAIL, notes:
- M3 VS Code Dark + Editor Dark: PASS/FAIL, notes:
- M4 VS Code Light + Editor Light: PASS/FAIL, notes:
- M5 High Contrast smoke: PASS/FAIL/NOT RUN, notes:

Surfaces:
- TXT connection modal: PASS/FAIL, notes:
- Sample Browser: PASS/FAIL, notes:
- TXT virtual controls chrome: PASS/FAIL, notes:
- Secondary overlays if touched: PASS/FAIL/NOT TOUCHED, notes:
```

## 完成定義

- 自動化驗證通過，或已記錄不可執行原因。
- P1 manual matrix 通過。
- 高對比 smoke check 通過：主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失，且沒有阻礙核心操作的可讀性問題。
- 若有 touched feedback text 變更，15 語系驗證通過。
- Implementation 沒有引入 WebView reload 來套用 editor theme。
