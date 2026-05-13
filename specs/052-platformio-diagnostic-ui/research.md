# 研究報告：PlatformIO 診斷 UI

**功能分支**：`052-platformio-diagnostic-ui`  
**研究日期**：2026-05-13  
**狀態**：完成（已改以獨立診斷 panel 方案收斂）

---

## 研究議題一：第一版 UI 載體應該是什麼？

**結論**：第一版應採用 **獨立 WebView Editor Panel**，並由 **獨立 command** 開啟或揭露；不採 Quick Pick，也不以通知摘要作為主要載體。

**依據**：

- 使用者需要一次看見五個固定項目的完整清單、狀態、來源、原因與下一步建議，資訊密度已超過 Quick Pick 與通知訊息的可讀範圍。
- 使用者已明確要求入口保持獨立，避免把「主動診斷」綁死在 upload 流程失敗之後。
- 診斷結果需要可停留、可回看、可重新測試，這類持續性操作更適合獨立 panel，而不是會消失的通知訊息。
- WebView Editor Panel 能容納完整清單、固定操作列與 light / dark theme 視覺一致性，符合本次 UX 目標。
- 通知仍有角色，但應退回到輕量回饋用途，例如複製摘要成功、頂層錯誤提醒，而不是負責承載整份報告。

**被拒絕的替代方案**：

- **Quick Pick**：一次只適合聚焦少量選項，不適合顯示完整診斷清單、原因與下一步建議。
- **notification-only**：通知太短暫，也缺乏穩定的版面結構，無法支撐完整資訊閱讀與重測操作。
- **綁進 upload 流程**：會把診斷變成被動補救，而不是讓使用者在上傳前主動排查。

---

## 研究議題二：視覺設計要與哪些既有 UI 對齊？

**結論**：新診斷 panel 必須延續目前專案既有的 WebView / panel / modal 設計語言，特別是 `blocklyEdit`、sample modal、backup modal 與 TXT test panel 的共同風格，而不是另起一套新的診斷儀表板樣式。

**已確認的設計語言事實**：

- `media/css/blocklyEdit.css` 與 `media/html/blocklyEdit.html` 採用 **8px 圓角卡片／下拉／對話框**、**輕量 box-shadow** 與 **compact header / controls-container**。
- 既有按鈕語言包含 **`primary-btn`（綠）**、**`secondary-btn`（藍）**，以及圓形 icon button 控制列。
- 現有 sample modal / backup modal / TXT test panel 都使用 **標題列 + 分段卡片／區塊 + 明確狀態顏色 + `theme-dark` 覆蓋** 的呈現方式。
- 這套設計在 light / dark theme 下都有對應樣式，並以可讀性優先，而不是追求華麗但脫離 repo 脈絡的裝飾。

**設計含義**：

1. 診斷 panel 應以 **摘要區 + 完整工具清單 + 範圍提醒** 的分段卡片方式呈現。
2. 主要操作應沿用現有按鈕語言：`重新測試` 採主要操作樣式，`複製診斷摘要` 採次要操作樣式。
3. 狀態色應延續既有成功／警告／錯誤的語意，不另建一套命名與色彩規則。
4. dark theme 不應只是反色，而應與既有 `theme-dark` 覆蓋方式保持視覺一致。

**被拒絕的替代方案**：

- **另建全新診斷品牌樣式**：會讓使用者感覺像跳到另一個產品，不符合 repo 既有風格語言。
- **純系統預設 HTML 樣式**：雖然實作最省，但會讓 panel 與既有 webview/modal 脫節，降低整體質感與可讀性。

---

## 研究議題三：診斷邏輯與 panel 邊界應如何切分？

**結論**：應新增 **專用的 `PlatformioDiagnosticService`** 與 **專用的 panel host 類別**，而不是把邏輯直接塞進 `extension.ts` 或擴充現有 MCP `DiagnosticService`。

**依據**：

- `src/services/diagnosticService.ts` 的責任重心是 MCP / Node.js 診斷，與 PlatformIO / `penv` / `mpremote` 的檢查領域不同。
- 診斷資料收集、摘要格式化與 panel lifecycle 本來就是兩層責任：service 負責「真相」，panel 負責「呈現」。
- 若把 panel lifecycle、postMessage 與工具鏈解析邏輯混在 `extension.ts`，後續很難維持測試與可讀性。

**設計含義**：

- `PlatformioDiagnosticService` 應成為診斷資料、reason / nextStep 與 clipboard summary 的單一來源。
- panel host 應只處理開啟／揭露、狀態推送與動作訊息回傳。
- WebView 端的 JS 應只負責 rendering 與使用者互動，不自創另一套診斷規則。

---

## 研究議題四：PlatformIO / `penv` 的路徑解析應以哪裡為準？

**結論**：診斷結果必須以 **`src/services/executableResolver.ts`** 與目前 uploader 的解析語意為唯一真相來源，將現有 fallback 行為視為既有基線，不得在 panel 內重寫第二套路徑判定規則。

**依據**：

- `src/services/executableResolver.ts` 已處理預設 PlatformIO 路徑、PATH / common bin 搜尋、`realpath` 後 executable directory 等跨平台問題。
- `src/services/arduinoUploader.ts` 與 `src/services/micropythonUploader.ts` 已落地 `pio` / `penv` / `python` / `pip` / `mpremote` 的 fallback 修正。
- 使用者已明確要求這些修正當作既有基線，新的 UI 只負責把它們說清楚，而不是重新設計。

**設計含義**：

1. 診斷 panel 只應「呈現目前解析結果」，不應偷偷發明另一套更簡化的搜尋邏輯。
2. `python` / `pip` / `mpremote` 需清楚標示是否屬於偵測到的 `penv` 工具鏈。
3. 報告必須同時顯示實際 path 與來源語意，避免使用者誤會系統仍沿用舊位置。

---

## 研究議題五：第一版範圍與操作應收斂到哪裡？

**結論**：第一版固定顯示五個項目，並只保留兩個操作：`重新測試`、`複製診斷摘要`。手動設定工具路徑明確延後至下一次 SDD。

**固定項目順序**：

1. `pio`
2. `penv` 根目錄
3. `python`
4. `pip`
5. `mpremote`

**依據**：

- 這五項剛好覆蓋 Arduino / CyberBrick 使用者最常遇到的工具鏈斷點。
- 使用者已指定第一版操作維持簡潔，不要把 panel 擴張成設定中心。
- 一旦加入手動 override，就會牽涉設定儲存、優先順序、還原與多工具鏈同步，明顯超出本次 v1 範圍。

**被拒絕的替代方案**：

- **加入手動設定 `pio` / `penv` / `python` / `pip` / `mpremote` 路徑**：保留到下一次 SDD。
- **加入更多按鈕（自動修復、開啟設定、開啟終端機等）**：第一版先不要，避免 panel 變成操作過度複雜的控制台。

---

## 研究議題六：本功能的 i18n 與 theme 應如何處理？

**結論**：需要區分 command title 與 panel runtime 文案兩條管線，並在 panel 端沿用 LocaleService 與既有 theme parity 規則。

### A. Command title / contribution

- 來源：`package.json` + `package.nls.json` + `package.nls.*.json`
- 用途：Command Palette 入口標題

### B. Panel runtime 文案

- 來源：`LocaleService` 對應的 runtime 文案鍵
- 用途：摘要標題、狀態、原因、下一步、按鈕、scope notice、錯誤訊息
- 交付方式：由 Extension Host 先取得 localized strings，再傳給 WebView 作為初始 payload 或 render state

**依據**：

- 使用者明確要求 plan 需說明如何沿用 LocaleService。
- panel 雖為 WebView，但仍應共享 extension 端已存在的本地化來源與語意，而不是另建第三套文字管線。
- theme 處理需與目前 `blocklyEdit` / modal 的 light / dark parity 一致，避免出現「功能對了、但 UI 像外掛的外掛」的視覺割裂。

---

## 研究議題七：第一版的驗證策略應如何配置？

**結論**：以 **service 測試 + command / panel lifecycle 測試 + WebView message flow 測試 + 手動 smoke test** 為主。

**應覆蓋的核心案例**：

1. command 可開啟 panel，重複執行只會 reveal 既有 panel。
2. panel 會顯示五個固定項目的完整清單，而不是只顯示摘要通知。
3. `reason` / `nextStep` 在 warning / error 情況下清楚可讀。
4. `重新測試` 會重新執行診斷並更新狀態。
5. `複製診斷摘要` 會輸出固定格式純文字。
6. panel 在 light / dark theme 下都保持既有 UI 語言。
7. `media/js/blocklyEdit.js` / `media/css/blocklyEdit.css` 的 upload button icon regression 不會回來搗亂。

---

## 研究議題八：目前已落地的修正應如何在文件中定位？

**結論**：以下內容應在 052 文件內被明確記錄為 **既有基線**，並列入回歸保護，而不是被重新視為本功能待設計範圍：

- `src/services/executableResolver.ts`
- `src/services/arduinoUploader.ts`
- `src/services/micropythonUploader.ts`
- `src/services/serialMonitorService.ts`
- `media/js/blocklyEdit.js`
- `media/css/blocklyEdit.css`
- `src/test/services/arduinoUploader.test.ts`

**原因**：

- 這些修正已先落地，且使用者要求文件必須把它們當作回歸保護基線。
- 052 的新增價值是**看見與理解**診斷結果，而不是重做 path fallback 與 upload icon state machine。

---

## 研究摘要表

| 議題 | 決策 | 信心度 |
|------|------|--------|
| 第一版 UI 載體 | 採獨立 WebView Editor Panel，由獨立 command 開啟／揭露 | 高 |
| 替代方案取捨 | 明確拒絕 Quick Pick、notification-only、綁 upload 流程 | 高 |
| 視覺一致性 | 對齊 `blocklyEdit`、sample modal、backup modal、TXT test panel 的既有設計語言 | 高 |
| 診斷 service 邊界 | 新增 `PlatformioDiagnosticService`，不擴充 MCP `DiagnosticService` | 高 |
| 路徑解析真相來源 | 以 `executableResolver.ts` 與現行 uploader 語意為基線 | 高 |
| 固定診斷範圍 | `pio`、`penv`、`python`、`pip`、`mpremote` | 高 |
| 第一版操作 | 僅保留 `重新測試` 與 `複製診斷摘要` | 高 |
| i18n / theme 策略 | command title 走 `package.nls*`；panel runtime 文案沿用 `LocaleService`；維持 light / dark parity | 高 |
| 測試策略 | service + panel lifecycle + message flow + 手動 smoke | 高 |
| 已落地變更處理 | 視為既有基線，要求回歸保護 | 高 |
| 手動設定工具路徑 | 明確延後到下一次 SDD，不納入本次 v1 | 高 |
