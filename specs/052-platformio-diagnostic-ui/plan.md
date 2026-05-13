# 實作計劃：PlatformIO 診斷 UI

**分支**：`052-platformio-diagnostic-ui` | **日期**：2026-05-13 | **規格**：[spec.md](./spec.md)  
**輸入**：[specs/052-platformio-diagnostic-ui/spec.md](./spec.md)

## 摘要

目前分支已先落地 PlatformIO 路徑 fallback 與 upload button spinner regression 修正；本次規劃以這些變更為 **既有基線**，新增一個由 **獨立 command** 開啟的 **WebView Editor Panel**，讓使用者可在不開始 upload 流程的情況下，直接查看 `pio`、`penv` 根目錄、`python`、`pip`、`mpremote` 五項的完整診斷清單，以及對應的狀態、來源、原因與下一步建議。

在重新檢視 `src/extension.ts`、`package.json` / `package.nls*`、`LocaleService`、`executableResolver.ts`、`ArduinoUploader`、`MicropythonUploader`、既有 WebView pattern 與目前 UI 風格後，第一版最穩定且符合專案憲法的實作路徑是：

1. 保留獨立 command `singular-blockly.checkPlatformioStatus`，但將其行為改為**開啟／揭露診斷 panel**
2. 新增 **`PlatformioDiagnosticService`**，以 `executableResolver.ts` 與現有 uploader path fallback 為唯一真相來源
3. 新增 **`src/webview/platformioDiagnosticPanel.ts`**，負責單例 panel lifecycle 與 Extension Host ↔ WebView 訊息流
4. 新增 **`media/html/platformioDiagnostic.html`**、**`media/css/platformioDiagnostic.css`**、**`media/js/platformioDiagnostic.js`**，以既有 `blocklyEdit` / sample / backup / TXT test panel 的設計語言呈現完整清單
5. 第一版只保留 **`重新測試`** 與 **`複製診斷摘要`** 兩個操作；手動設定 `pio` / `penv` / `python` / `pip` / `mpremote` 路徑明確延後到下一次 SDD

此方案的重點不是再發明一套 path resolution，而是把既有判定規則**更清楚、更持久地顯示出來**；通知訊息僅作為輕量回饋，而不是主要 UI。既有 upload button icon 修正與 executableResolver / uploader fallback 修正都必須透過回歸驗證明確保護。

---

## 技術背景

| 項目 | 細節 |
|------|------|
| **UI 載體** | VS Code `WebviewPanel`（Editor Panel）+ 專用 HTML / CSS / JS |
| **語言/版本** | TypeScript 5.9.3（Extension Host）；HTML / CSS / Browser JS（WebView）；JSON（`package.nls*`） |
| **主要依賴** | VS Code API 1.105.0+、既有 `LocaleService`、`logging`、`executableResolver.ts`、`arduinoUploader.ts`、`micropythonUploader.ts`、Mocha + Sinon + `@vscode/test-electron` |
| **儲存** | N/A（診斷結果不持久化；保留於記憶體中的 panel state，必要時寫入剪貼簿） |
| **測試** | `npm run compile`、`npm run lint`、`npm run validate:i18n`、service / extension / panel tests、手動 smoke test |
| **目標平台** | VS Code 1.105.0+（macOS / Windows / Linux） |
| **專案類型** | VS Code Extension（Extension Host + WebView） |
| **效能目標** | panel shell 應立即開啟；單次診斷目標 10 秒內完成；單一工具版本探測需有 timeout，避免 panel 卡在 loading |
| **限制** | 必須保留既有 path fallback 與 upload button icon 修正行為；第一版不做自動修復、不隱藏部分失敗、不提供手動設定工具路徑；command title 與 panel runtime 文案分屬不同 i18n 管線 |
| **規模/範圍** | 1 個獨立 command、1 個 panel host、1 個新 service、1 個新 types module、3 個新 WebView 資產、5 個固定診斷項目、15 語系 command title + 15 語系 runtime 文案、數個 targeted tests |

---

## 憲法檢查

*閘門：本次為既有 PlatformIO 能力的可見性擴充，需確認仍符合專案憲法。*

| 憲法原則 | 評估 | 狀態 |
|---------|------|------|
| I. 簡單性與可維護性 | 雖改為 WebView panel，但資訊密度與持續性操作明確需要獨立載體；第一版仍只保留 `重新測試` / `複製診斷摘要` 兩個操作 | ✅ 通過 |
| II. 模組化與可擴展性 | `PlatformioDiagnosticService`、`PlatformioDiagnosticPanel`、WebView assets 與 types 分層清楚；未來可擴充更多 diagnostics 而不污染 upload flow | ✅ 通過 |
| III. 避免過度開發 | 明確不把手動 override、自動修復、PlatformIO extension 狀態、upload 綁定納入 v1 | ✅ 通過 |
| V. 研究驅動開發 | 已比對既有 `blocklyEdit` / modal / TXT test panel UI 語言、`LocaleService`、`executableResolver.ts`、uploaders 與測試樣板 | ✅ 通過 |
| VI. 結構化日誌 | 診斷 service、panel host 與命令層延續 `log()` 模式，不新增 ad-hoc console 輸出 | ✅ 通過 |
| VII. 完整測試覆蓋率 | 將補 service、panel lifecycle / message flow、command registration 與手動 smoke test | ✅ 通過（待實作） |
| VIII. 純函式與模組化 | 路徑解析、summary builder 與 reason / nextStep 格式化盡量維持純函式；副作用限於 probe command、panel message、clipboard | ✅ 通過 |
| IX. 繁體中文文件標準 | 本 `plan.md`、`research.md`、`data-model.md`、`quickstart.md`、contracts 皆以繁體中文撰寫 | ✅ 通過 |

**結論**：無需憲法例外，本次可直接進入實作規劃。

---

## 專案結構

### 文件（本功能）

```text
specs/052-platformio-diagnostic-ui/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── platformio-diagnostic-command.md
│   └── platformio-diagnostic-report.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 主要原始碼影響面

```text
package.json
package.nls*.json

src/
├── extension.ts
├── services/
│   ├── localeService.ts
│   ├── executableResolver.ts            # 既有 PlatformIO executable 解析基線
│   ├── arduinoUploader.ts               # 既有 pio fallback 行為
│   ├── micropythonUploader.ts           # 既有 python/pip/mpremote/penv 行為
│   ├── serialMonitorService.ts          # 既有 PlatformIO Python 消費者
│   └── platformioDiagnosticService.ts   # 本次新增
├── types/
│   ├── i18nKeys.ts
│   └── platformioDiagnostic.ts          # 本次新增
├── webview/
│   └── platformioDiagnosticPanel.ts     # 本次新增
└── test/
    ├── extension.activate.test.ts
    ├── services/
    │   ├── arduinoUploader.test.ts
    │   └── platformioDiagnosticService.test.ts
    └── webview/
        └── platformioDiagnosticPanel.test.ts

media/
├── html/
│   ├── blocklyEdit.html                 # 既有樣式參考
│   └── platformioDiagnostic.html        # 本次新增
├── css/
│   ├── blocklyEdit.css                  # 既有樣式參考 / baseline guard
│   └── platformioDiagnostic.css         # 本次新增
├── js/
│   ├── blocklyEdit.js                   # upload button regression baseline
│   └── platformioDiagnostic.js          # 本次新增
└── locales/
    └── {15語系}/messages.js
```

### 已落地基線（本次規劃不重做）

```text
src/services/executableResolver.ts
src/services/arduinoUploader.ts
src/services/micropythonUploader.ts
src/services/serialMonitorService.ts
media/js/blocklyEdit.js
media/css/blocklyEdit.css
src/test/services/arduinoUploader.test.ts
```

**結構決策**：本功能維持單一 VS Code Extension 結構，但將診斷 UI 升級為 **獨立 WebView Editor Panel**。`src/extension.ts` 只負責 command 入口與 panel 開啟／揭露；`PlatformioDiagnosticService` 提供唯一診斷真相；`src/webview/platformioDiagnosticPanel.ts` 管理單例 panel 與 postMessage 流；`media/html/platformioDiagnostic.html`、`media/css/platformioDiagnostic.css`、`media/js/platformioDiagnostic.js` 僅負責呈現。這樣能在不污染 upload 流程的前提下，沿用既有 WebView pattern、LocaleService 與 light / dark theme parity，同時把已落地的 path fallback 與 upload button icon 修正視為穩定基線。

---

## 複雜度追蹤

本次無需憲法例外，**不新增額外複雜度豁免**。

---

## 第 0 階段：研究摘要

*完整內容詳見 [research.md](./research.md)*

| 議題 | 決策 | 信心度 |
|------|------|--------|
| 第一版 UI 載體 | 採獨立 WebView Editor Panel，由獨立 command 開啟／揭露 | 高 |
| 替代方案取捨 | 明確拒絕 Quick Pick、notification-only、綁 upload 流程 | 高 |
| 診斷 service 邊界 | 新增 `PlatformioDiagnosticService`，不擴充 `DiagnosticService` | 高 |
| 路徑解析真相來源 | 以 `executableResolver.ts` 與現行 uploader 語意為基線 | 高 |
| 固定診斷項目 | `pio`、`penv`、`python`、`pip`、`mpremote` | 高 |
| panel 操作集合 | 僅保留 `重新測試` 與 `複製診斷摘要` | 高 |
| i18n 管線 | `package.nls*` 處理 command title；panel runtime 文案沿用 `LocaleService` | 高 |
| UI 風格依據 | 對齊 `blocklyEdit` / sample / backup / TXT test panel 設計語言 | 高 |
| 測試策略 | service + panel lifecycle / message flow + manual smoke | 高 |
| 已落地變更處理 | 視為既有基線，不在本 feature 內回退或重做 | 高 |

---

## 第 1 階段：設計與合約摘要

*完整設計詳見 [data-model.md](./data-model.md) 與 [contracts/](./contracts/)*

### 核心實體摘要

| 實體 | 位置 | 說明 |
|------|------|------|
| `PlatformioDiagnosticSession` | `specs/.../data-model.md`（待對應 `src/types/platformioDiagnostic.ts`） | 一次完整診斷的整體狀態與五個固定項目結果 |
| `PlatformioDiagnosticItem` | 同上 | 單一診斷項目的可用性、來源、path、`penv` 關聯、`reason` 與 `nextStep` |
| `PlatformioDiagnosticPanelState` | 同上 | WebView panel 所需的 loading / ready / error render state |
| `ClipboardSummary` | 同上 | 提供 `複製診斷摘要` 的純文字摘要 |

### 合約摘要

- **`contracts/platformio-diagnostic-command.md`**：定義 `singular-blockly.checkPlatformioStatus` 的 command 入口、panel open / reveal lifecycle、Extension Host ↔ WebView message actions（`retest` / `copySummary`）與錯誤處理契約
- **`contracts/platformio-diagnostic-report.md`**：定義 panel 內完整清單 / 卡片欄位、狀態、來源、`reason`、`nextStep`、scope section 與 clipboard summary 契約

### i18n 與 theme 邊界摘要

- **Command Palette 標題**：`package.json` + `package.nls*.json`
- **Panel runtime 文案**：`src/types/i18nKeys.ts` + `media/locales/{15語系}/messages.js` + `LocaleService`
- **Panel 視覺依據**：`media/html/blocklyEdit.html`、`media/css/blocklyEdit.css` 與既有 sample / backup / TXT test panel 呈現方式

---

## 實作階段規劃

### A 階段：共享基礎與 panel shell

**目標**：建立 command、service、types 與 panel host 的骨架，讓後續故事都建立在同一個 panel 架構上。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| A-1 | `package.json`、`package.nls*.json` | 新增 `singular-blockly.checkPlatformioStatus` command contribution 與 15 語系 title |
| A-2 | `src/types/platformioDiagnostic.ts` | 定義 item/session/panel state/clipboard summary 型別 |
| A-3 | `src/services/platformioDiagnosticService.ts` | 建立診斷 service skeleton、summary builder 與 copy helper 邊界 |
| A-4 | `src/webview/platformioDiagnosticPanel.ts` | 建立單例 panel host、HTML 載入與基本 postMessage 骨架 |
| A-5 | `media/html/platformioDiagnostic.html`、`media/css/platformioDiagnostic.css`、`media/js/platformioDiagnostic.js` | 建立與既有 repo 視覺語言一致的 panel shell |

**驗收標準**：Command 能開啟一個 loading 狀態的 panel，且 panel file boundaries 與 message channel 已建立。

---

### B 階段：完整清單與首次 render（US1 對應）

**目標**：讓使用者從獨立 panel 中看到五個固定項目的完整清單，而不是只看到通知摘要。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| B-1 | `src/services/platformioDiagnosticService.ts` | 以 `executableResolver.ts` / uploader fallback 為基線收集五個固定項目結果 |
| B-2 | `src/services/platformioDiagnosticService.ts` | 補齊 `overallStatus`、`source`、`isFromDetectedPenv`、`reason`、`nextStep`、`scopeNotice` |
| B-3 | `src/webview/platformioDiagnosticPanel.ts` | 在 panel 首次建立時推送 loading / ready state；再次執行 command 只 reveal 既有 panel，不自動重跑診斷 |
| B-4 | `media/js/platformioDiagnostic.js` | render 摘要區、工具清單區、scope 區與兩個主要操作 |
| B-5 | `media/css/platformioDiagnostic.css` | 以 8px 圓角、輕量陰影、compact header、明確狀態色與 `theme-dark` parity 調整視覺 |
| B-6 | `src/extension.ts` | 將 `singular-blockly.checkPlatformioStatus` 接到 panel open / reveal，而不是 upload 流程 |

**驗收標準**：panel 能顯示五個固定項目的完整清單、狀態、來源、原因與必要時的下一步建議。

---

### C 階段：面板互動流（US2 / US3 對應）

**目標**：在同一個 panel 內完成重新測試與複製摘要的閉環。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| C-1 | `media/js/platformioDiagnostic.js` | 發送 `platformioDiagnostic:ready`、`platformioDiagnostic:retest`、`platformioDiagnostic:copySummary` 訊息 |
| C-2 | `src/webview/platformioDiagnosticPanel.ts` | 接收 WebView 訊息、切換 loading / ready / error 狀態，並維持單一 panel 實例 |
| C-3 | `src/extension.ts`、`src/services/platformioDiagnosticService.ts` | 讓 `重新測試` 重新產生 fresh session，讓 `複製診斷摘要` 使用最新 render session |

**驗收標準**：使用者可在 panel 內完成 `重新測試` 與 `複製診斷摘要`，且 panel 狀態會正確更新。

---

### D 階段：i18n 與視覺一致性收斂

**目標**：讓 panel 文案、狀態語意與視覺風格完整融入現有 repo。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| D-1 | `src/types/i18nKeys.ts`、`media/locales/{15語系}/messages.js` | 新增 summary / status / reason / nextStep / action / scope 文案鍵 |
| D-2 | `src/webview/platformioDiagnosticPanel.ts`、`src/services/localeService.ts` | 由 Extension Host 透過 `LocaleService` 準備 localized strings，再傳入 WebView |
| D-3 | `media/html/platformioDiagnostic.html`、`media/css/platformioDiagnostic.css` | 對齊 `blocklyEdit` / sample / backup / TXT test panel 的卡片與按鈕語言 |
| D-4 | `media/html/blocklyEdit.html`、`media/css/blocklyEdit.css` | 作為 style reference 與視覺 parity 比對基準，不應被 panel 方案重新定義 |

**驗收標準**：panel 在 light / dark theme 下都與 repo 現有 UI 風格一致，且不混用錯誤的 i18n 管線。

---

### E 階段：測試、回歸與文件同步

**目標**：驗證 panel lifecycle、service 真相來源、UI consistency 與既有基線都受到保護。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| E-1 | `src/test/services/platformioDiagnosticService.test.ts` | 覆蓋預設 path、PATH fallback、sibling `penv`、`reason` / `nextStep`、`mpremote` 缺失、version probe 失敗 |
| E-2 | `src/test/extension.activate.test.ts`、`src/test/webview/platformioDiagnosticPanel.test.ts` | 覆蓋 command registration、panel open / reveal、message flow、retest / copySummary |
| E-3 | `specs/052-platformio-diagnostic-ui/*.md` | 規格、計畫、資料模型、contracts、quickstart、tasks、checklist 同步 |
| E-4 | `npm run compile`、`npm run lint`、`npm run validate:i18n`、相關 tests | 執行完整驗證 |
| E-5 | `media/js/blocklyEdit.js`、`media/css/blocklyEdit.css` | 進行 upload button spinner regression smoke test |

**驗收標準**：service、command、panel、i18n 與文件同步完成，且 compile / lint / validation / tests 通過，upload icon regression 未復發。

---

## 建議實作順序

```text
A 階段（共享基礎 / panel shell）
  ↓
B 階段（完整清單 / 初次 render）
  ↓
C 階段（retest / copySummary 互動流）
  ↓
D 階段（i18n / 視覺一致性）
  ↓
E 階段（測試 / 回歸 / 文件同步）
```

---

## 主要風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|---------|
| panel 外觀與 repo 既有 WebView 風格脫節 | 高 | 明確以 `media/html/blocklyEdit.html`、`media/css/blocklyEdit.css`、sample / backup / TXT test panel 為設計依據；以 8px 圓角、輕量陰影、primary / secondary button、light / dark parity 為驗收要點 |
| 重複執行命令導致多個 panel 或 stale state | 中 | 由 `PlatformioDiagnosticPanel` 管理單例 panel，命令只做 open / reveal，重測統一走 message pipeline |
| panel 內資料與 uploader 真相來源漂移 | 高 | `PlatformioDiagnosticService` 必須直接沿用 `executableResolver.ts` 與既有 uploader fallback 語意 |
| `LocaleService` 與 command title i18n 管線混用造成遺漏 | 高 | 在 plan / tasks 中明確拆開 `package.nls*` 與 runtime 文案的職責，並用 `validate:i18n` 檢查 |
| 使用者把「工具鏈可用」誤解成「upload 一定成功」 | 高 | 摘要區與 clipboard summary 都固定包含 scope reminder |
| 既有 upload button spinner / icon regression 被 panel UI 間接踩壞 | 中 | 明確把 `media/js/blocklyEdit.js` / `media/css/blocklyEdit.css` 視為 baseline guard，手動 smoke test 必做 |
| manual path override scope creep | 高 | 在 spec、research、tasks、quickstart 全部重申「下一次 SDD 候選」；本次不新增設定欄位或命令 |

---

## 完成標準（對齊 Success Criteria）

| SC | 驗證方式 |
|----|---------|
| SC-001：使用者可在 1 分鐘內開啟診斷並看懂現況 | 手動 UX smoke test：從 Command Palette 執行命令並確認獨立 panel 開啟、完整清單可讀 |
| SC-002：95% 以上診斷可對五個固定項目產生明確狀態與 next step | service 單元測試 + representative scenario 驗證 |
| SC-003：診斷結果能指出「找不到 PlatformIO」的主要原因 | panel / clipboard summary 檢查：`pio` 缺失、`mpremote` 缺失、version probe 失敗、無系統 Python 但 `penv` 可用 |
| SC-004：使用者能在同一 panel 內完成 retest 與 copy | panel lifecycle / message flow tests + 手動 smoke test |
| SC-005：支援往返次數下降 | 釋出後以 issue / support 樣本觀察；實作階段先確保 clipboard summary 足以支援遠端協助 |
