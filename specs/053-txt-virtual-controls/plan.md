# 實作計劃：TXT 虛擬控制畫布

**分支**：`053-add-txt-virtual-controls` | **日期**：2026-05-21 | **規格**：[spec.md](./spec.md)  
**輸入**：[specs/053-txt-virtual-controls/spec.md](./spec.md)

## 摘要

本功能要在現有 TXT 專案中加入一個類似 ROBO Pro 的**虛擬控制畫布**，讓學生可在空白畫布中建立、命名、拖曳與配色按鈕，並在程式執行時把這些按鈕當成即時輸入來源。第一版只支援 `button` 控制元件，但必須完整覆蓋以下能力：

1. **同一個 Blockly WebView 內**提供可編輯的虛擬控制畫布
2. 以 `stableId + displayName + identifier` 模型處理名稱、安全參照與穩定綁定
3. 在執行時透過**獨立於 `io_server.py` 的 companion runtime**同步按鈕狀態
4. 刪除後保留失效引用並阻止程式開始執行，避免隱性錯誤

依據既有 TXT 架構、`TxtUploader` / `TxtTestService` lifecycle 與前一份 TXT spec 的研究，本次最可行的路徑是：

- 在 `blockly/main.json` 既有封裝下新增 `txtVirtualControls`
- 在 `blocklyEdit.html/js/css` 中新增 TXT 專用畫布 UI，而不是開新 panel
- 以新的 TXT value block 橋接「畫布按鈕」與「程式可讀狀態」
- 新增 TXT companion runtime 與 generated helper，讓執行中程式以 `stableId` 讀取目前狀態

---

## Technical Context

**Language/Version**: TypeScript 5.9.3（Extension Host）、JavaScript ES2020（WebView）、Python 3.6+（TXT runtime）  
**Primary Dependencies**: Blockly 12.3.1、VS Code API 1.105.0+、node-ssh、ftrobopy、Python 標準函式庫 `http.server` / `json` / `time`  
**Storage**: `blockly/main.json`（擴充 `txtVirtualControls`）、workspace settings / SecretStorage、TXT `/tmp/singular_blockly/virtual_controls_state.json`  
**Testing**: Mocha + Sinon + `@vscode/test-electron`、契約測試、WebView 手動驗證、TXT 真機驗證  
**Target Platform**: VS Code 1.105.0+（macOS / Windows / Linux）與 fischertechnik TXT Controller（ftCommunity Python 3.6+）  
**Project Type**: 單一 VS Code Extension + 單一 Blockly WebView + TXT companion runtime  
**Performance Goals**: 虛擬按鈕狀態變更在 0.5 秒內成為程式可觀察輸入；拖曳在教學規模下維持流暢；開始/停止執行時模式切換可預測  
**Constraints**: 不新增新的 VS Code WebviewPanel；第一版只支援 button；失效引用必須阻止開始執行；執行期輸入通道必須與 `io_server.py` 分離；需補齊 15 語系訊息  
**Scale/Scope**: 每個 TXT 專案一份虛擬控制版面；支援多顆按鈕與多個引用 block；範圍限於 TXT workflow，不影響 Arduino / CyberBrick 主流程

---

## Constitution Check

*GATE：已在 Phase 0 研究前檢查，並在本次設計後複查。結果：通過。*

| 憲法原則 | 評估 | 狀態 |
|---------|------|------|
| I. 簡單性與可維護性 | 延用單一 WebView 與既有 save/load 結構；將新複雜度集中在明確的 UI / runtime / block bridge 邊界 | ✅ 通過 |
| II. 模組化與可擴展性 | UI、Host service、runtime、generator 分層清楚；未來可再加入 slider / toggle | ✅ 通過 |
| III. 避免過度開發 | 第一版只做 button，不預先做多控制型別與複雜 layout engine | ✅ 通過 |
| IV. 彈性與適應性 | `stableId + displayName + identifier` 模型可支援後續更多控制元件與 rename 流程 | ✅ 通過 |
| V. 研究驅動開發 | 已比對既有 TXT upload/test lifecycle、spec 051 研究結果與目前 WebView 架構 | ✅ 通過 |
| VI. 結構化日誌 | Host 端沿用 `log()`；WebView 維持既有 logging 模式 | ✅ 通過 |
| VII. 完整測試覆蓋率 | Host/service 與資料邏輯可自動化；drag / preview / 真機互動採手動驗證補足 | ✅ 通過 |
| VIII. 純函式與模組化 | 識別字正規化、invalid reference preflight 與 runtime snapshot 映射可抽成純 helper | ✅ 通過 |
| IX. 繁體中文文件標準 | plan / research / data-model / quickstart / contracts 皆以繁體中文撰寫 | ✅ 通過 |
| XI. Agent Skills Architecture | 本次規劃成果已同步到 spec artifacts，並更新 agent context plan 參照 | ✅ 通過 |

---

## Project Structure

### Documentation（本功能）

```text
specs/053-txt-virtual-controls/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── txt-virtual-controls-postmessage.md
│   ├── txt-virtual-controls-runtime-api.md
│   └── txt-virtual-controls-blocks.md
└── tasks.md
```

### Source Code（repository root）

```text
media/
├── html/
│   └── blocklyEdit.html
├── css/
│   └── blocklyEdit.css
├── js/
│   └── blocklyEdit.js
├── blockly/
│   ├── blocks/
│   │   └── txt.js
│   └── generators/
│       └── txt/
│           ├── index.js
│           └── txt.js
├── toolbox/
│   └── categories/
│       └── txt.json
└── locales/
    └── {15 locales}/messages.js

src/
├── webview/
│   └── messageHandler.ts
├── services/
│   ├── txtUploader.ts
│   ├── txtTestService.ts
│   └── txtVirtualControlRuntimeService.ts      # new
├── types/
│   ├── txt.ts
│   └── txtVirtualControls.ts                   # new
└── test/
    ├── suite/
    └── ... related service / contract tests

txt-runtime/
├── io_server.py
└── virtual_controls_runtime.py                 # new
```

**Structure Decision**：沿用現有「單一 VS Code extension + 單一 Blockly WebView」結構；虛擬控制畫布放進既有 WebView，Program Mode 另加 companion runtime，但不讓它與 Test Panel runtime 共用同一個責任面。

---

## Complexity Tracking

| 議題 | 為何需要 | 被拒絕的更簡方案 |
|------|----------|------------------|
| 新增 TXT companion runtime | `TxtUploader` 與 `TxtTestService` 目前已證明 Program Mode / Test Mode lifecycle 不可混用；需要獨立執行期通道 | 重用 `io_server.py` 會直接碰撞現有 upload / test lifecycle |
| `stableId + displayName + identifier` 三層模型 | 要同時滿足學生友善命名、安全程式參照、rename 穩定引用與 delete 後失效警告 | 只用 `displayName` 或 `identifier` 都無法同時滿足 clarify 要求 |

---

## Phase 0：研究摘要

*完整內容詳見 [research.md](./research.md)*

| 議題 | 決策 | 信心度 |
|------|------|--------|
| UI 承載面 | 同一個 Blockly WebView 中新增 TXT 虛擬控制畫布 | 高 |
| 持久化位置 | `blockly/main.json` 根層級新增 `txtVirtualControls` | 高 |
| 引用模型 | blocks 綁 `stableId`，generator 解析目前 `identifier` | 高 |
| 執行期輸入通道 | 使用獨立 companion runtime，不重用 `io_server.py` | 高 |
| 狀態共享 | runtime 寫 canonical state file，generated helper 讀取 | 中高 |
| 失效引用策略 | 阻止開始執行，前後端雙重 preflight | 高 |
| 測試策略 | 單元/契約 + 手動 WebView / 真機驗證混合 | 高 |

---

## Phase 1：設計與契約摘要

*完整設計詳見 [data-model.md](./data-model.md) 與 [contracts/](./contracts/)*

### 核心實體摘要

| 實體 | 說明 |
|------|------|
| `TxtVirtualControlsDocument` | 專案保存的虛擬控制文件根節點 |
| `TxtVirtualButton` | 單一按鈕的 identity、位置、尺寸與配色 |
| `TxtVirtualControlReference` | Blockly block 與虛擬按鈕之間的綁定資料 |
| `InvalidVirtualControlReference` | 刪除後仍保留在工作區中的失效引用診斷資料 |
| `VirtualControlRuntimeSession` | 執行期間 companion runtime 的 session 摘要 |
| `VirtualControlRuntimeSnapshot` | 執行期間每顆按鈕目前 pressed 狀態 |

### 契約檔案摘要

| 契約檔案 | 用途 |
|----------|------|
| `contracts/txt-virtual-controls-postmessage.md` | WebView ↔ Host 的保存、執行與 pressed-state 訊息合約 |
| `contracts/txt-virtual-controls-runtime-api.md` | Extension Host ↔ TXT companion runtime 的 HTTP 合約 |
| `contracts/txt-virtual-controls-blocks.md` | Blockly 虛擬按鈕狀態積木的 block / generator / invalid-ref 合約 |

### 設計常數（本次明確決定）

- companion runtime 監聽埠：`runtimePort + 1`
- canonical state file：`/tmp/singular_blockly/virtual_controls_state.json`
- 第一版橋接積木：`txt_virtual_button_state`
- 執行模式：`editing` ↔ `running`

---

## 實作階段規劃

### Phase A：保存模型與 Host / WebView 封裝擴充

**目標**：讓 `blockly/main.json` 可以安全保存虛擬控制資料，並讓 `init` / `loadWorkspace` / `saveWorkspace` 路徑都帶上 `txtVirtualControls`。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| A-1 | `src/webview/messageHandler.ts` | 擴充 `handleSaveWorkspace()` / `handleRequestInitialState()` 的 `txtVirtualControls` 讀寫 |
| A-2 | `src/types/txtVirtualControls.ts`（new） | 新增保存與 runtime snapshot 型別 |
| A-3 | `media/js/blocklyEdit.js` | 維護單一 in-memory `txtVirtualControls` document，並整合到 `saveWorkspace` / `loadWorkspace` |
| A-4 | `src/test/` | 補 `blockly/main.json` 擴充封裝與 migration / fallback 測試 |

**驗收標準**：重新開啟專案後，按鈕名稱、位置、尺寸、顏色與綁定資訊可完整還原。

---

### Phase B：同 WebView 內的虛擬控制畫布 UI

**目標**：在不新增 VS Code panel 的前提下，提供可新增、拖曳、改名、改色與預覽的 TXT 虛擬控制畫布。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| B-1 | `media/html/blocklyEdit.html` | 新增 TXT 虛擬控制入口按鈕與畫布 DOM / dialog 結構 |
| B-2 | `media/css/blocklyEdit.css` | 新增空白畫布、按鈕樣式、顏色預覽、執行時鎖位樣式 |
| B-3 | `media/js/blocklyEdit.js` | 實作建立按鈕、drag、rename、刪除、調色盤、尺寸即時調整 |
| B-4 | `media/locales/*/messages.js` | 新增畫布 UI 文案、警告與 placeholder |

**驗收標準**：未執行時可編輯與拖曳；按鈕大小會隨名稱動態調整；顏色改動即時反映。

---

### Phase C：Blockly 積木橋接與失效引用 UX

**目標**：讓程式可以讀取虛擬按鈕狀態，並在 rename/delete 後維持穩定綁定與清楚警告。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| C-1 | `media/blockly/blocks/txt.js` | 新增 `txt_virtual_button_state` block 與 invalid reference warning |
| C-2 | `media/blockly/generators/txt/txt.js` | 生成 `_txt_virtual_button_state(stableId)` helper 呼叫 |
| C-3 | `media/blockly/generators/txt/index.js` | 在 TXT generator finish/init 流程中注入 helper 與必要 imports |
| C-4 | `media/toolbox/categories/txt.json` | 把虛擬按鈕狀態積木加入 TXT toolbox |
| C-5 | `media/js/blocklyEdit.js` | 建立 stableId dropdown 資料源、rename 同步、delete 後 invalid ref 標示 |
| C-6 | `src/webview/messageHandler.ts` + WebView | 執行前 preflight：只要有 invalid reference 就阻止開始執行 |

**驗收標準**：rename 不破壞綁定；delete 只讓 block 失效，不自動刪掉 block；invalid reference 會阻止開始執行。

---

### Phase D：TXT companion runtime 與執行期互動通道

**目標**：讓執行中的 TXT 程式能在 Program Mode 讀到虛擬按鈕 press / release 狀態，同時不干擾既有 Test Panel runtime。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| D-1 | `txt-runtime/virtual_controls_runtime.py`（new） | 建立 companion runtime，提供 session / snapshot API |
| D-2 | `src/services/txtVirtualControlRuntimeService.ts`（new） | Host 端 lifecycle 管理、HTTP 同步與錯誤封裝 |
| D-3 | `src/services/txtUploader.ts` | 在 TXT 執行流程前後整合 companion runtime 啟停與 session reset |
| D-4 | `src/webview/messageHandler.ts` | 處理 `txtVirtualControlStateChanged` 並轉送到 runtime service |
| D-5 | `media/js/blocklyEdit.js` | `running` 模式下送出 press / release 事件；`editing` 模式禁止送出 |
| D-6 | `media/blockly/generators/txt/txt.js` | 產生讀取 canonical state file 的 Python helper |

**驗收標準**：程式執行期間可觀察到按鈕按下/放開；停止後回到編輯模式；Test Panel lifecycle 仍獨立存在。

---

### Phase E：測試、文件、i18n 與回歸驗證

**目標**：確保資料一致性、UI 互動、TXT lifecycle 與多語系都達標，且沒有回歸 TXT / 其他板子既有功能。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| E-1 | `src/test/` | 補 identifier 正規化、preflight、save/load、runtime snapshot 轉換測試 |
| E-2 | `specs/053-txt-virtual-controls/*` | 維護 research / data-model / contracts / quickstart 與實作一致 |
| E-3 | `media/locales/*/messages.js` | 驗證 15 語系 key 完整 |
| E-4 | build / validation 命令 | `npm run compile`、`npm run lint`、`npm run validate:i18n`、必要測試 |
| E-5 | 手動驗證 | 拖曳、顏色預覽、執行時 press / release、失效引用阻擋、重開還原 |

**驗收標準**：規格與程式一致，i18n 驗證通過，既有 TXT upload/test 流程與其他板子功能無回歸。

---

## 主要風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|---------|
| WebView state 與 `blockly/main.json` 不一致 | 中 | 保存時統一從單一 `txtVirtualControls` document 輸出，避免多份真相 |
| rename / delete 後 block UI 與 generator 不同步 | 高 | 以 `stableId` 為唯一綁定鍵，並在載入 / rename / delete 三個時點統一重建 reference diagnostics |
| Companion runtime 與 `io_server.py` lifecycle 再次互撞 | 中高 | 明確切分 Program Mode / Test Mode service，不共用同一 runtime 或同一 port |
| 執行中 UI mode 切換不一致 | 中 | 以 `txtUploadResult`、`txtExecutionStopped`、runtime error 統一驅動 `running → editing` 回退 |
| WebView drag/preview 難以完全自動化 | 高 | 把資料一致性與 preflight 做自動化測試，drag / preview 以 quickstart 情境手動驗證 |

---

## 完成標準（對齊 Success Criteria）

| SC | 驗證方式 |
|----|---------|
| SC-001：3 分鐘內建立並排好 4 顆按鈕 | 依 quickstart 手動驗證 |
| SC-002：第一次嘗試能成功觸發程式反應 | 真機 / 模擬互動驗證 |
| SC-003：0.5 秒內可觀察到按鈕輸入 | runtime snapshot / 真機觀察 |
| SC-004：重開專案 100% 還原位置與顏色 | save/load regression 驗證 |
| SC-005：90% 無效名稱與重名情境可被系統吸收 | identifier 正規化與 UI 提示測試 |
| SC-006：不離開編輯器即可完成虛擬按鈕教學 | 同一 WebView 內完整流程手動驗證 |
| SC-007：第一次就能用調色盤改色並看懂變化 | UI 手動驗證 |
| SC-008：未執行時能直覺拖曳調整位置 | WebView 手動驗證 |
| SC-009：執行時鎖定位、停止後恢復編輯 | TXT 執行 lifecycle 驗證 |
