# 快速啟動指南：PlatformIO 診斷 UI

**功能分支**：`052-platformio-diagnostic-ui`  
**適用對象**：接手本次 PlatformIO 診斷 panel 實作的開發者

---

## 開發環境設定

### 1. 安裝依賴

```bash
cd /path/to/singular-blockly
npm install
```

### 2. 啟動開發模式

```bash
npm run watch
```

然後在 VS Code 按 `F5` 啟動 Extension Development Host。

### 3. 驗證基礎建置

```bash
npm run compile
npm run lint
npm test
npm run validate:i18n
```

---

## 本次功能應先讀的文件

| 類型 | 檔案 | 用途 |
|------|------|------|
| 規格 | [spec.md](./spec.md) | 使用者故事、完整清單、原因／下一步與成功標準 |
| 計畫 | [plan.md](./plan.md) | panel 架構、檔案邊界、phase、風險與驗證策略 |
| 研究 | [research.md](./research.md) | 為什麼改採獨立 panel、為何拒絕 Quick Pick / notification-only / 綁 upload 流程 |
| 模型 | [data-model.md](./data-model.md) | `PlatformioDiagnosticSession`、`PlatformioDiagnosticItem`、`PlatformioDiagnosticPanelState` |
| 契約 | [contracts/platformio-diagnostic-command.md](./contracts/platformio-diagnostic-command.md) | command 開 panel、panel lifecycle、message actions 契約 |
| 契約 | [contracts/platformio-diagnostic-report.md](./contracts/platformio-diagnostic-report.md) | panel 區塊、完整清單欄位、`reason` / `nextStep`、clipboard summary 契約 |

---

## 第一批應盤點的程式碼入口

### Panel 主架構

1. `src/extension.ts`
2. `src/webview/platformioDiagnosticPanel.ts`
3. `src/services/platformioDiagnosticService.ts`
4. `src/services/localeService.ts`
5. `src/types/platformioDiagnostic.ts`
6. `src/types/i18nKeys.ts`

### Panel 資產

7. `media/html/platformioDiagnostic.html`
8. `media/css/platformioDiagnostic.css`
9. `media/js/platformioDiagnostic.js`

### Command / i18n

10. `package.json`
11. `package.nls.json` 與 `package.nls.zh-hant.json`

### 風格參考與基線保護

12. `media/html/blocklyEdit.html`
13. `media/css/blocklyEdit.css`
14. `media/js/blocklyEdit.js`
15. `src/services/executableResolver.ts`
16. `src/services/arduinoUploader.ts`
17. `src/services/micropythonUploader.ts`

> 前 11 個檔案決定 panel 架構與資料流；後 6 個檔案是視覺語言與回歸保護基線，尤其不能讓 upload button spinner regression 死灰復燃。

---

## 目前已存在的基線（不要重做）

這些檔案的修正已先落地，後續新功能以它們為基線：

- `src/services/executableResolver.ts`
- `src/services/arduinoUploader.ts`
- `src/services/micropythonUploader.ts`
- `src/services/serialMonitorService.ts`
- `media/js/blocklyEdit.js`
- `media/css/blocklyEdit.css`
- `src/test/services/arduinoUploader.test.ts`

本次新增的是**可見性與診斷 panel UX**，不是重新發明路徑解析或重新處理 upload button spinner。

另外，本次實作必須把既有 upload button icon 修正視為回歸保護基線；手動設定工具路徑則留待下一次 SDD，不納入本次 v1。

---

## 第一個應完成的使用者情境

### 情境：從 Command Palette 開啟獨立 PlatformIO 診斷 panel

1. 使用者開啟命令面板
2. 執行對應 `singular-blockly.checkPlatformioStatus` 的 PlatformIO 診斷命令
3. 系統開啟獨立診斷 panel（Editor Panel）
4. panel 顯示摘要區、完整工具清單與 scope 提醒
5. 使用者可在同一個 panel 內：
   - `重新測試`
   - `複製診斷摘要`

**預期重點**：

- `python` / `pip` / `mpremote` 要顯示它們是否來自偵測到的 `penv`
- 每個 warning / error 項目都要有清楚的 `reason` 與 `nextStep`
- 主要資訊必須保留在 panel 內，不可退化成 Quick Pick 或 notification-only
- 重複執行 command 時應 reveal 既有 panel，而不是再長出第二個診斷視窗

---

## 重要驗證情境

### 1. 獨立 panel 入口與 reopen / reveal

**前提**：使用者未進入 upload 流程

**預期**：

- 從 Command Palette 就能直接打開診斷 panel
- 再次執行同一個 command 時會 reveal 既有 panel
- 不需依賴 upload 錯誤後才看得到診斷結果

### 2. 完整清單與清楚的下一步建議

**預期**：

- panel 一次顯示 `pio`、`penv`、`python`、`pip`、`mpremote`
- 每個項目都有狀態、來源、path
- warning / error 項目都有清楚的 `reason` 與 `nextStep`

### 3. PATH fallback 可見化

**前提**：預設 `~/.platformio/penv/...` 不存在，但 PATH 內找得到 `pio`

**預期**：

- `pio` 顯示為可用
- 來源標記顯示 `PATH 搜尋`
- 若 `python` / `pip` / `mpremote` 來自同層 `penv`，也要如實標示

### 4. `penv` 工具鏈完整可用，但沒有系統 Python

**前提**：系統沒有可用 `python`，但 PlatformIO `penv` 內的 `python` / `pip` / `mpremote` 都存在

**預期**：

- panel 仍可顯示 CyberBrick 相關工具鏈可用
- 不可因為「沒有系統 Python」就直接判定整體不可用

### 5. `pio` 可用，但 `mpremote` 缺失

**預期**：

- 整體狀態為 `degraded`
- `mpremote` 項目清楚標示缺失或版本探測失敗
- `nextStep` 明確引導使用者檢查 detected `penv` 或重新安裝 `mpremote`

### 6. 重新測試與複製摘要

**預期**：

- `重新測試` 會讓 panel 回到 loading，然後顯示最新結果
- `複製診斷摘要` 會輸出固定格式純文字，含整體狀態、五項結果、`reason` / `nextStep` 精簡資訊與 scope 提醒

### 7. Theme / visual consistency

**預期**：

- panel 與 `blocklyEdit` / sample / backup / TXT test panel 保持相同設計語言
- 具備 8px 等級圓角、輕量陰影、compact header / controls-container
- `重新測試` / `複製診斷摘要` 沿用既有 primary / secondary button 語言
- light / dark theme 都有對應樣式，不會出現突兀的第三種設計系統

### 8. upload button icon 回歸保護

**前提**：使用者已開啟 Blockly Editor，並在同一個工作階段中執行過 PlatformIO 診斷 command、切換板子或重新回到編輯器。

**預期**：

- `#uploadButton` 不會被非預期加上會觸發旋轉的狀態 class
- upload icon 不會在未開始上傳時自動旋轉
- `media/js/blocklyEdit.js` 與 `media/css/blocklyEdit.css` 的既有修正維持有效

### 9. manual path override 仍不在本次範圍

**預期**：

- panel 中不出現 `pio` / `penv` / `python` / `pip` / `mpremote` 的手動輸入欄位
- `package.json` 與 panel UI 不新增手動 override 設定入口

### 10. 開啟速度與診斷完成時間

**預期**：

- [ ] 第一次執行診斷 command 後，panel shell 會在約 1 秒內顯示 loading UI，而不是長時間沒有任何可見回應
- [ ] 當 panel 已存在時，再次執行 command 會立即 reveal 既有 panel，而不是等待新的診斷完成後才顯示介面
- [ ] 在代表性的較慢情境下，單次診斷會於 10 秒內完成；若某個 probe timeout，panel 也會離開 loading 並回報可理解的失敗／降級結果，而不是卡住

---

## 建議實作順序

```text
1. 新增 types/data model（src/types/platformioDiagnostic.ts）
2. 新增 PlatformioDiagnosticService
3. 新增 src/webview/platformioDiagnosticPanel.ts
4. 建立 media/html|css|js/platformioDiagnostic.*
5. 在 extension.ts 註冊 command 並接到 open / reveal panel
6. 補 package.nls.* 與 runtime i18n 文案
7. 補 service / panel / extension 測試
8. 跑 compile / lint / validate:i18n / targeted tests / 手動 smoke test
```

---

## 驗證命令建議

```bash
npm run compile
npm run lint
npm run validate:i18n
npm test
```

若要縮小驗證範圍，可先聚焦：

- `src/test/services/platformioDiagnosticService.test.ts`
- `src/test/extension.activate.test.ts`
- `src/test/webview/platformioDiagnosticPanel.test.ts`

---

## 注意事項

1. **命令標題的本地化走 `package.nls*`**，不是 `LocaleService`
2. **panel runtime 文案應由 `LocaleService` 準備後傳入 WebView**
3. **不要把 `mpremote` 當成純系統工具**；對 CyberBrick 流程來說，它預設屬於 detected `penv` 工具鏈
4. **第一版主要 UI 載體是獨立診斷 panel**，不是 Quick Pick 或 notification-only
5. **通知只做輕量回饋**；主要結果必須留在 panel 內
6. **部分失敗也要產出完整清單**；只有頂層例外才算真正 panel error state
7. **第一版不做手動設定工具路徑**；若需要 `pio` / `penv` / `python` / `pip` / `mpremote` 覆寫功能，請留待下一次 SDD
