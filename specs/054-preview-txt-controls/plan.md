# 實作計劃：TXT 預覽虛擬控制畫布

**分支**：`054-preview-txt-controls` | **日期**：2026-05-22 | **規格**：[spec.md](./spec.md)  
**輸入**：[specs/054-preview-txt-controls/spec.md](./spec.md)

## 摘要

本功能要讓 TXT 專案或備份在 preview 視窗中，除了顯示既有 Blockly 唯讀工作區之外，也能顯示保存時的 TXT 虛擬控制畫布。Preview 必須維持「唯讀投影」語意：使用者可以捲動畫布、縮放 / 平移 Blockly 工作區，並調整虛擬控制面板與 Blockly 預覽區的左右佔比；但不能改名、改色、拖曳、增刪、按壓或保存任何虛擬控制內容。

技術路線是擴充既有 backup preview pipeline：

1. `webviewManager.ts` 從備份 JSON 讀出 `txtVirtualControls`，並對舊資料 / 部分損壞資料做防禦性正規化。
2. `previewMessages.ts` 擴充 `txt` board 與 preview-only `txtVirtualControls` / `previewWarnings` 合約。
3. `blocklyPreview.html` / `blocklyPreview.js` / `blocklyEdit.css` 新增 preview 專用 readonly presenter，避免重用 editor 的可編輯控制器。
4. `webviewPreview.test.ts` 補足 TXT board、payload、降級與非 TXT 無回歸測試。

---

## Technical Context

**Language/Version**: TypeScript 5.9.3（Extension Host）、JavaScript ES2020（Preview WebView）、HTML/CSS（VS Code WebView）  
**Primary Dependencies**: VS Code API 1.105.0+、Blockly 12.3.1、既有 `FileService` / `LocaleService` / `SettingsManager`、Mocha + Sinon 測試框架  
**Storage**: 不新增永久儲存；讀取既有 `blockly/main.json` / backup JSON 中的 `workspace`、`board`、`txtVirtualControls` 欄位；左右佔比與捲動狀態只保存在 preview 視窗記憶體中  
**Testing**: Mocha + Sinon + `@vscode/test-electron`；以 `src/test/webviewPreview.test.ts` 做 host/message contract 測試，WebView 互動使用手動驗證補足  
**Target Platform**: VS Code 1.105.0+（macOS / Windows / Linux）  
**Project Type**: 單一 VS Code Extension + Extension Host / WebView 雙 context 架構  
**Performance Goals**: 對最多 50 個虛擬控制按鈕的代表性 TXT 備份，readonly presenter 僅做 O(n) DOM render，不啟動 TXT runtime、不做輪詢、不新增長時間背景工作；手動驗證時從 `loadWorkspaceState` 到畫布可見的載入時間目標為 1 秒內，若測試環境無法可靠計時則需記錄實測環境與結果。  
**Constraints**: Preview 不得發送 `saveWorkspace`、`txtUpload`、`txtVirtualControlStateChanged`；不得將左右佔比或捲動狀態寫回備份；非 TXT preview 不得顯示、啟用或佔用 TXT 虛擬控制 panel 版面，若 HTML template 靜態包含 panel DOM，必須保持 hidden / inert / `aria-hidden`；必須支援舊備份與部分損壞資料降級  
**Scale/Scope**: 單一 preview panel 顯示單一備份；虛擬控制第一版沿用既有 TXT button model，不新增新控制元件類型；範圍限於 preview，不修改 TXT runtime 或 editor 編輯功能

---

## Constitution Check

*GATE：已在 Phase 0 研究前檢查，並在 Phase 1 設計後複查。結果：通過。*

| 憲法原則 | 評估 | 狀態 |
|---------|------|------|
| I. Simplicity and Maintainability | 沿用現有 preview pipeline，不新增第二個 editor 或 panel；readonly presenter 職責單一 | ✅ 通過 |
| II. Modularity and Extensibility | Host 正規化、message contract、preview presenter 與 CSS 覆蓋分層清楚 | ✅ 通過 |
| III. Avoid Over-Development | 不新增 runtime、不持久化 splitter、不做 preview 編輯功能 | ✅ 通過 |
| IV. Flexibility and Adaptability | `PreviewWarning` 與 readonly projection 可支援後續更多控制型別與提示 | ✅ 通過 |
| V. Research-Driven Development | 已盤點既有 preview/TXT 程式碼與 053 設計文件；不依賴外部新 API | ✅ 通過 |
| VI. Structured Logging | Extension Host 沿用 `log()`；WebView 端沿用既有 preview log bridge | ✅ 通過 |
| VII. Comprehensive Test Coverage | Host/message 行為自動化；WebView 互動依憲法例外採手動驗證補足 | ✅ 通過 |
| VIII. Pure Functions and Modular Architecture | 資料正規化與 warning 建立應抽成可測 helper，避免 DOM 與解析邏輯耦合 | ✅ 通過 |
| IX. Traditional Chinese Documentation Standard | spec、plan、research、data-model、contracts、quickstart 皆以繁體中文撰寫 | ✅ 通過 |
| X. Professional Release Management | 本功能不涉及 release；不建立 tag；後續若發布需遵循既有流程 | ✅ 通過 |
| XI. Agent Skills Architecture | 本次產物遵循 SpecKit workflow，並更新 agent context 參照 | ✅ 通過 |

---

## Project Structure

### Documentation（本功能）

```text
specs/054-preview-txt-controls/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── txt-preview-postmessage.md
│   └── txt-preview-readonly-rendering.md
└── checklists/
    └── requirements.md
```

### Source Code（repository root）

```text
src/
├── types/
│   └── previewMessages.ts              # 擴充 txt board、txtVirtualControls 與 previewWarnings 合約
├── webview/
│   └── webviewManager.ts               # 讀取備份、映射 txt board、正規化 preview payload
└── test/
    └── webviewPreview.test.ts          # 擴充 TXT preview 與降級回歸測試

media/
├── html/
│   └── blocklyPreview.html             # 新增 TXT readonly panel DOM 與 TXT blocks/generator 資源 placeholder
├── js/
│   └── blocklyPreview.js               # 新增 readonly presenter、空狀態、warning、splitter session state
├── css/
│   └── blocklyEdit.css                 # 新增 .preview-mode 下 TXT panel / button / splitter 覆蓋樣式
└── locales/
    └── {15 locales}/messages.js        # 若新增 preview 文案，補齊所有語系
```

**Structure Decision**：沿用單一 extension 專案與既有 preview WebView；不新增新的 service、runtime、WebviewPanel 或永久資料檔。Preview 端只做唯讀投影與 session-local 版面狀態。

---

## Complexity Tracking

本設計未違反憲章原則；不需額外複雜度豁免。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0：研究摘要

*完整內容詳見 [research.md](./research.md)*

| 議題 | 決策 | 信心度 |
|------|------|--------|
| UI 承載面 | 擴充既有 backup preview panel，不新增第二個 editor/panel | 高 |
| 訊息契約 | 維持 `setBoard` → `loadWorkspaceState`，擴充 `txtVirtualControls` 與 `previewWarnings` | 高 |
| 唯讀互動 | 使用 preview 專用 readonly presenter；僅允許捲動與左右佔比調整 | 高 |
| 舊資料降級 | Host 先正規化，再讓 preview 顯示空狀態 / 部分恢復 / warning | 高 |
| Invalid reference | Preview 採非阻斷揭露，不承擔執行 gate | 高 |
| Splitter 狀態 | 只屬於目前 preview session，不做持久化 | 高 |
| 測試策略 | 自動化契約測試 + 手動互動驗證混合 | 高 |

---

## Phase 1：設計與契約摘要

*完整設計詳見 [data-model.md](./data-model.md) 與 [contracts/](./contracts/)*

### 核心資料模型

| 實體 | 說明 |
|------|------|
| `TxtPreviewLoadPayload` | Host 傳給 preview 的載入根模型，包含 workspace、TXT 控制文件與 warning |
| `ReadonlyPreviewVirtualControlsDocument` | Preview 使用的唯讀投影文件 |
| `ReadonlyPreviewVirtualControl` | 單一虛擬控制元件的唯讀渲染資料 |
| `PreviewWarning` | 舊資料、部分損壞與失效引用的非阻斷提示 |
| `PreviewLayoutSessionState` | 當前 preview 視窗的暫時左右佔比與捲動狀態 |

### 契約檔案

| 契約檔案 | 用途 |
|----------|------|
| `contracts/txt-preview-postmessage.md` | 定義 preview Host ↔ WebView 訊息擴充與禁止訊息 |
| `contracts/txt-preview-readonly-rendering.md` | 定義 readonly DOM、互動邊界、splitter 與 warning 呈現 |

---

## 實作階段規劃

### Phase A：Preview contract 與 Host 載入擴充

**目標**：讓 TXT 備份資料能以型別安全方式從 Host 傳到 preview。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| A-1 | `src/types/previewMessages.ts` | 新增 `txt` board，擴充 `LoadWorkspaceStateMessage` 的 `txtVirtualControls` / `previewWarnings` |
| A-2 | `src/webview/webviewManager.ts` | `mapBoardValue()` 支援 TXT；`loadBackupContent()` 讀取並正規化 `txtVirtualControls` |
| A-3 | `src/webview/webviewManager.ts` | 對缺失、空文件、部分損壞資料建立 `PreviewWarning[]` |
| A-4 | `src/test/webviewPreview.test.ts` | 補 TXT board mapping、payload 發送、舊備份 fallback 測試 |

**驗收標準**：TXT backup preview 會收到 `board: 'txt'` 與對應 `txtVirtualControls` / `previewWarnings`；非 TXT preview payload 不受影響。

---

### Phase B：Preview HTML / 資源注入 / 基礎 DOM

**目標**：讓 preview HTML 具備 TXT blocks/generator 資源與虛擬控制 panel 結構。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| B-1 | `media/html/blocklyPreview.html` | 新增 TXT 虛擬控制 panel、canvas、empty state、warning list、splitter DOM |
| B-2 | `src/webview/webviewManager.ts` | `getPreviewContent()` 注入 TXT blocks/generator 與必要 modules URI |
| B-3 | `media/css/blocklyEdit.css` | 新增 `.preview-mode` 下 TXT panel / splitter / button 基礎樣式 |
| B-4 | `src/test/webviewPreview.test.ts` | 驗證 preview HTML 會注入 TXT 相關資源 placeholder |

**驗收標準**：TXT preview 可正確載入 TXT blocks，且在 TXT board 下顯示虛擬控制 panel；非 TXT board 不顯示 panel。

---

### Phase C：Readonly presenter 與唯讀互動防守

**目標**：在 preview 中渲染保存的虛擬控制畫布，但禁止所有內容編輯。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| C-1 | `media/js/blocklyPreview.js` | 新增 `loadTxtVirtualControlsPreview()` 與 readonly render helper |
| C-2 | `media/js/blocklyPreview.js` | 顯示 saved position / size / style / displayName |
| C-3 | `media/js/blocklyPreview.js` | 阻止 drag、rename、color、delete、press/release、contextmenu 等內容改動 |
| C-4 | `media/js/blocklyPreview.js` | 實作 splitter 與 canvas scroll 的 session state；關閉後不持久化 |
| C-5 | `media/css/blocklyEdit.css` | 用視覺樣式清楚標示 preview readonly 狀態 |

**驗收標準**：使用者能看見完整虛擬控制版面、可捲動與調整左右佔比，但無法改變任何內容或送出保存 / runtime 訊息。

---

### Phase D：空狀態、部分恢復與 warning 呈現

**目標**：讓舊備份、空文件與部分損壞資料都有可理解的 preview 結果。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| D-1 | `media/js/blocklyPreview.js` | 缺少 `txtVirtualControls` 時顯示空狀態訊息 |
| D-2 | `media/js/blocklyPreview.js` | 渲染 `previewWarnings` 與 placeholder / warning list |
| D-3 | `media/locales/*/messages.js` | 新增空狀態、唯讀提示與 warning 文案；補齊所有語系 |
| D-4 | `src/test/webviewPreview.test.ts` | 補舊備份、空 controls、部分損壞資料測試 |

**驗收標準**：舊備份不崩潰、空資料清楚顯示、部分損壞資料保留可恢復內容並揭露問題。

---

### Phase E：回歸驗證與文件對齊

**目標**：確保 TXT preview 新能力不破壞既有 preview / editor / TXT runtime。

| 子任務 | 檔案 / 命令 | 說明 |
|--------|-------------|------|
| E-1 | `src/test/webviewPreview.test.ts` | 補非 TXT preview 無回歸測試 |
| E-2 | `npm run compile` | 驗證 TypeScript / webpack 編譯 |
| E-3 | `npm run lint` | 驗證 `src/` lint |
| E-4 | `npm run validate:i18n` | 驗證新增文案完整 |
| E-5 | `npm test` 或目標測試 | 驗證 preview 與相關回歸 |
| E-6 | `quickstart.md` | 記錄手動驗證結果與已知限制 |

**驗收標準**：自動化驗證通過；手動驗證確認 readonly、splitter、空狀態、部分損壞與非 TXT 無回歸。

---

## 主要風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|----------|
| Preview 誤用 editor 可編輯邏輯 | 高 | 建立 preview 專用 readonly presenter，不直接引用 editor controller |
| `txt` board 未納入 preview 型別 / mapping | 高 | 先修改 `previewMessages.ts` 與 `mapBoardValue()`，用測試鎖住 |
| 舊備份缺少 `txtVirtualControls` 導致崩潰 | 中高 | Host 正規化 + preview 空狀態雙重防守 |
| 部分損壞資料造成整體 preview 失敗 | 中高 | 可恢復內容優先顯示，問題轉成 `PreviewWarning` |
| Splitter 調整被誤保存 | 中 | 僅放在 WebView 記憶體，不發送任何保存訊息 |
| CSS 共用導致 preview 看起來可編輯 | 中 | `.preview-mode` 覆蓋 cursor、hover、selected、pointer 行為與視覺提示 |
| 新增文案造成 i18n 缺漏 | 中 | 修改 15 語系並執行 `npm run validate:i18n` |

---

## 完成標準（對齊 Success Criteria）

| SC | 驗證方式 |
|----|----------|
| SC-001 | 含 `txtVirtualControls` 的 TXT 備份 preview 手動驗證 + host payload 測試 |
| SC-002 | 嘗試拖曳 / 改名 / 改色 / 增刪 / 按壓後確認資料不變 |
| SC-003 | quickstart 唯讀辨識 checklist：preview badge、readonly 文案、不可編輯游標 / 提示、splitter aria 說明、warning 可讀語意皆通過，且至少 2 位 reviewer 不需查看實作細節即可判定是唯讀預覽 |
| SC-004 | 舊版 TXT 備份無 `txtVirtualControls` 測試與手動驗證 |
| SC-005 | 部分損壞資料測試與 warning 呈現手動驗證 |
| SC-006 | 超出可視範圍的唯讀捲動與左右佔比調整手動驗證 |
| SC-007 | 調整左右佔比後重開 preview 回到預設比例手動驗證 |

---

## Post-Design Constitution Check

Phase 1 設計後複查仍通過：

- 未新增不必要 runtime 或永久狀態，符合簡單性與避免過度開發。
- 訊息契約、資料模型、readonly rendering contract 分離，符合模組化與可測試性。
- 所有 spec artifacts 皆以繁體中文撰寫。
- WebView 互動採手動驗證補足，並以 host/message 測試覆蓋可自動化部分，符合憲法 Principle VII 的 WebView 例外。