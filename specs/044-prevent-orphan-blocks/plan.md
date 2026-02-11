# Implementation Plan: 防止孤立積木產生無效程式碼

**Branch**: `044-prevent-orphan-blocks` | **Date**: 2025-07-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/044-prevent-orphan-blocks/spec.md`

## 摘要

本功能旨在防止孤立（orphan）控制/流程類積木（如 `while`、`for`、`if`、`break`、`continue`）在未嵌入合法容器（`setup()`/`loop()`/自訂函式）時產生無效的 C++ 或 MicroPython 程式碼。技術方案包含三層防護：

1. **Generator 層過濾**：在 Arduino generator 新增 `workspaceToCode` 覆寫，使用 `allowedTopLevelBlocks_` 清單過濾頂層積木（MicroPython 已有此機制）
2. **個別積木深層防護**：在控制流程積木的 `forBlock` 中加入 `isInAllowedContext()` helper 檢查
3. **使用者介面回饋**：透過 `block.setWarningText()` 在孤立積木上顯示多語系警告訊息

## 技術上下文

**語言/版本**: TypeScript 5.x（Extension 端）、JavaScript ES6+（WebView/Generators 端）
**主要依賴**: Blockly 12.x、VSCode Extension API 1.x
**儲存**: 檔案式（workspace XML/JSON）
**測試**: Mocha + Chai（VSCode Extension 測試框架）；WebView 互動功能依憲法第 VII 原則使用手動測試
**目標平台**: VSCode Extension（跨平台：Windows、macOS、Linux）
**專案類型**: 單一專案（VSCode Extension + WebView）
**效能目標**: 積木放置後 1 秒內顯示/清除警告（SC-003）
**限制**: 須在 WebView 沙盒環境內運作；不引入額外外部依賴
**規模/範圍**: 15 個語系（bg、cs、de、en、es、fr、hu、it、ja、ko、pl、pt-br、ru、tr、zh-hant）、2 種 generator 模式（Arduino C++ / MicroPython）

## 憲法檢查

*閘門：必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。*

### 初始檢查（Phase 0 前）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 簡潔性與可維護性 | ✅ 通過 | 新增 `isInAllowedContext()` helper 為純粹的單一職責函式；`workspaceToCode` 覆寫遵循 MicroPython generator 現有模式 |
| II. 模組化與擴展性 | ✅ 通過 | 使用可設定的 `allowedTopLevelBlocks_` 陣列，未來新增積木類型時只需更新清單 |
| III. 避免過度開發 | ✅ 通過 | 僅實作規格書明確要求的功能，無投機性設計 |
| IV. 靈活性與適應性 | ✅ 通過 | 使用資料驅動的允許清單，而非硬編碼判斷邏輯 |
| V. 研究驅動開發 | ✅ 通過 | 已驗證 Blockly 12.x `getSurroundParent()` API 與 `setWarningText()` API |
| VI. 結構化日誌 | ✅ 通過 | 維持現有 `log.debug` 模式記錄積木註冊 |
| VII. 全面測試覆蓋 | ✅ 通過 | WebView 拖放互動依憲法例外使用手動測試；核心判斷邏輯（`isInAllowedContext`）可獨立單元測試 |
| VIII. 純函式與模組架構 | ✅ 通過 | `isInAllowedContext()` 為純函式（輸入積木，輸出布林值）；無副作用 |
| IX. 繁體中文文件標準 | ✅ 通過 | 所有規格文件、計畫文件以繁體中文撰寫 |
| X. 專業版本管理 | N/A | 本功能不涉及版本發布流程 |
| XI. Agent Skills 架構 | N/A | 本功能不涉及 Agent Skills |

**閘門結果**: ✅ 全部通過，無違規需要記錄

## 專案結構

### 文件結構（本功能）

```text
specs/044-prevent-orphan-blocks/
├── plan.md              # 本文件（/speckit.plan 指令輸出）
├── research.md          # Phase 0 輸出（/speckit.plan 指令）
├── data-model.md        # Phase 1 輸出（/speckit.plan 指令）
├── quickstart.md        # Phase 1 輸出（/speckit.plan 指令）
├── contracts/           # Phase 1 輸出（/speckit.plan 指令）
└── tasks.md             # Phase 2 輸出（/speckit.tasks 指令 - 非 /speckit.plan 建立）
```

### 原始碼結構（Repository 根目錄）

```text
media/
├── blockly/
│   ├── blocks/
│   │   └── loops.js                    # 修改：新增 orphan block 警告 onchange 邏輯
│   ├── generators/
│   │   ├── arduino/
│   │   │   ├── index.js                # 修改：新增 workspaceToCode 覆寫 + isInAllowedContext helper
│   │   │   ├── loops.js                # 修改：各 forBlock 加入 context guard
│   │   │   └── logic.js                # 修改：controls_if forBlock 加入 context guard
│   │   └── micropython/
│   │       ├── index.js                # 修改：新增 isInAllowedContext helper（workspaceToCode 已有過濾）
│   │       ├── loops.js                # 修改：各 forBlock 加入 context guard
│   │       └── logic.js                # 修改：controls_if forBlock 加入 context guard
│   └── themes/                         # 不修改
├── locales/
│   ├── en/messages.js                  # 修改：新增 ORPHAN_BLOCK_WARNING_ARDUINO / ORPHAN_BLOCK_WARNING_MICROPYTHON 鍵值（見 spec FR-008）
│   ├── zh-hant/messages.js             # 修改：新增 ORPHAN_BLOCK_WARNING_ARDUINO / ORPHAN_BLOCK_WARNING_MICROPYTHON 鍵值
│   └── [其他 13 個語系]/messages.js     # 修改：新增 ORPHAN_BLOCK_WARNING_ARDUINO / ORPHAN_BLOCK_WARNING_MICROPYTHON 鍵值
└── js/
    └── blocklyEdit.js                  # 預計不修改：block.onchange 已涵蓋觸發場景（見合約 block-warning-events.md §3）

src/
├── test/
│   └── suite/
│       └── orphan-block-guard.test.ts  # 新增：isInAllowedContext 單元測試
└── [其他現有檔案]                       # 不修改
```

**結構決策**: 採用現有的 VSCode Extension + WebView 單一專案結構。所有修改均在既有的 `media/blockly/generators/`、`media/blockly/blocks/`、`media/locales/` 目錄內進行，符合專案的 File Organization 標準。

## 複雜度追蹤

> 憲法檢查無違規，此區段無需填寫。

*無違規需要記錄。*

## 憲法檢查（Phase 1 設計後重新評估）

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. 簡潔性與可維護性 | ✅ 通過 | `isInAllowedContext()` 為 10 行以內的簡潔函式；guard 模式統一且易理解 |
| II. 模組化與擴展性 | ✅ 通過 | `allowedTopLevelBlocks_` 與 `ALLOWED_CONTAINERS` 為獨立可設定的陣列；新增積木類型僅需更新清單 |
| III. 避免過度開發 | ✅ 通過 | 三層防護各自有明確職責，無冗餘設計 |
| IV. 靈活性與適應性 | ✅ 通過 | 資料驅動的容器清單支援未來新增 generator 模式 |
| V. 研究驅動開發 | ✅ 通過 | 已驗證 Blockly 12.x `getSurroundParent()`、`setWarningText()`、`onchange` 行為 |
| VI. 結構化日誌 | ✅ 通過 | 跳過的孤立積木以程式碼註解記錄，不使用 console.log |
| VII. 全面測試覆蓋 | ✅ 通過 | `isInAllowedContext` 可獨立單元測試；WebView 拖放測試依 UI Testing Exception 使用手動測試 |
| VIII. 純函式與模組架構 | ✅ 通過 | `isInAllowedContext()` 為純函式；guard 模式無副作用 |
| IX. 繁體中文文件標準 | ✅ 通過 | 所有設計文件（plan.md、research.md、data-model.md、quickstart.md）均以繁體中文撰寫 |
| X. 專業版本管理 | N/A | 不涉及版本發布 |
| XI. Agent Skills 架構 | N/A | 不涉及 Agent Skills |

**Phase 1 閘門結果**: ✅ 全部通過，設計方案與憲法完全一致。

## 產出物清單

| 產出物 | 檔案路徑 | Phase |
|--------|----------|-------|
| 實施計畫 | `specs/044-prevent-orphan-blocks/plan.md` | — |
| 研究報告 | `specs/044-prevent-orphan-blocks/research.md` | Phase 0 |
| 資料模型 | `specs/044-prevent-orphan-blocks/data-model.md` | Phase 1 |
| Generator 介面合約 | `specs/044-prevent-orphan-blocks/contracts/generator-interfaces.md` | Phase 1 |
| 積木警告事件合約 | `specs/044-prevent-orphan-blocks/contracts/block-warning-events.md` | Phase 1 |
| 快速開始指南 | `specs/044-prevent-orphan-blocks/quickstart.md` | Phase 1 |
| Agent 上下文更新 | `.github/agents/copilot-instructions.md` | Phase 1 |

---

## 審查備註與待辦事項（Review Pass 2025-07-15）

> 以下為 plan.md 審查後發現的差異、補充說明與待解決事項，供 `/speckit.tasks` 與實作階段參考。

### RN-001：i18n 鍵名稱 — spec 要求 generator-specific，下游產出物仍用單一鍵

**嚴重度**: 高（spec 違規）

spec.md FR-008 明確要求：

> 「因警告訊息為 generator-specific，需為 Arduino 與 MicroPython 各建立獨立的 i18n 鍵，例如 `ORPHAN_BLOCK_WARNING_ARDUINO` 與 `ORPHAN_BLOCK_WARNING_MICROPYTHON`」

但以下產出物仍使用單一 `ORPHAN_BLOCK_WARNING` 鍵：

| 產出物 | 影響位置 |
|--------|----------|
| research.md | §6 翻譯鍵值設計 |
| data-model.md | §5 OrphanBlockWarning 實體 |
| contracts/generator-interfaces.md | 合約 5 i18n 鍵值 |
| contracts/block-warning-events.md | 合約 1 onchange 回呼範例 |
| quickstart.md | 開發指南範例 + 語系翻譯範例 |

**TODO**: 實作階段須依 spec FR-008 使用雙鍵：
- `ORPHAN_BLOCK_WARNING_ARDUINO`：「此積木必須放在 setup()、loop() 或函式內才能產生程式碼。」
- `ORPHAN_BLOCK_WARNING_MICROPYTHON`：「此積木必須放在 main() 或函式內才能產生程式碼。」

block.onchange 回呼需偵測當前 generator 模式以選擇正確的 i18n 鍵。

---

### RN-002：積木類型名稱差異 — `controls_flow_statements` vs `singular_flow_statements`

**嚴重度**: 中（名稱映射）

spec.md FR-003 與 Clarification Session 2 Q2 使用 `controls_flow_statements`，但程式碼中的實際積木類型為 `singular_flow_statements`（定義於 `media/blockly/blocks/loops.js:31-90`）。

research.md、data-model.md、block-warning-events.md 已正確使用 `singular_flow_statements`。

**結論**: 實作時使用 `singular_flow_statements`。spec 中的 `controls_flow_statements` 應理解為概念名稱；此為專案自訂積木，非 Blockly 內建的 `controls_flow_statements`。

---

### RN-003：`controls_if` 為 Blockly 內建積木 — 需透過 Extension/Mixin 機制整合 onchange

**嚴重度**: 中（實作方案）

block-warning-events.md 已註明「controls_if | Blockly 內建 | 無自訂 | 透過 Extension 新增」，但未具體說明技術方案。

可行方案（依優先順序）：
1. **直接掛載**：`Blockly.Blocks['controls_if'].onchange = function() { ... }`（在 blocks/loops.js 載入後執行）
2. **Blockly Extension**：`Blockly.Extensions.register('orphan_warning', function() { this.setOnChange(...) })` 並在 JSON 定義中註冊
3. **Mixin**：`Blockly.Extensions.registerMixin('orphan_warning_mixin', { onchange: ... })`

**TODO**: 實作時確認 Blockly 12.x 是否允許在積木已初始化後覆寫 `onchange`；若不允許則需使用 Extension 方案。

---

### RN-004：`controls_duration` 超出 spec FR-003 列舉範圍

**嚴重度**: 低（增強項目）

research.md §5 與 data-model.md §3 將 `controls_duration`（Arduino 專用計時迴圈）納入受防護積木，但 spec FR-003 的列舉清單未包含此積木。

**結論**: `controls_duration` 為合理的增強項目（Arduino 專用迴圈積木，語義上與 `controls_whileUntil` 等效）。實作時應一併加入 guard，但需在 tasks.md 中標註為「spec 增強」。

---

### RN-005：`isInAllowedContext` 雙重放置 — 全域 vs Generator 方法

**嚴重度**: 中（架構決策）

目前合約中存在兩種呼叫方式：

| 使用場景 | 呼叫方式 | 容器清單 | 來源 |
|----------|----------|----------|------|
| Generator forBlock guard | `window.arduinoGenerator.isInAllowedContext(block)` | Generator-specific | contracts/generator-interfaces.md |
| Block onchange 警告 | `window.isInAllowedContext(block)` | 合併清單 | contracts/block-warning-events.md |

**分析**: 兩種方式均合理 —— Generator 內的 guard 只需檢查自身容器清單；Block 的 onchange 無法預知當前 generator 模式，故使用合併清單（若積木在任一 generator 的合法容器內即可）。

**TODO**: 實作時確認此設計意圖：
- `window.isInAllowedContext(block)` — 全域版本，合併 Arduino + MicroPython 容器清單，供 block.onchange 使用
- `window.arduinoGenerator.isInAllowedContext(block)` — Generator 版本，僅含自身容器，供 forBlock guard 使用
- 兩者可共用核心邏輯，差異僅在容器清單參數

---

### RN-006：缺少的測試案例

plan.md 僅規劃了 `isInAllowedContext` 單元測試（`orphan-block-guard.test.ts`），但以下場景亦需涵蓋：

| # | 測試場景 | 類型 | 優先度 |
|---|----------|------|--------|
| T1 | `isInAllowedContext` — 多層嵌套（loop > if > while）回傳 true | 單元 | P1 |
| T2 | `isInAllowedContext` — 嵌套孤立（orphan if > while）回傳 false | 單元 | P1 |
| T3 | `isInAllowedContext` — 直接在合法容器中回傳 true | 單元 | P1 |
| T4 | `isInAllowedContext` — 頂層積木（無父層）回傳 false | 單元 | P1 |
| T5 | `isInAllowedContext` — 不同容器類型（procedures_defnoreturn, arduino_function）| 單元 | P1 |
| T6 | `workspaceToCode` 過濾 — 孤立積木被跳過 | 單元 | P1 |
| T7 | `workspaceToCode` 過濾 — 被跳過積木產生正確註解格式 | 單元 | P2 |
| T8 | `workspaceToCode` 過濾 — `alwaysGenerateBlocks_` 不受影響 | 單元 | P1 |
| T9 | forBlock guard — 孤立時回傳空字串 | 單元 | P1 |
| T10 | forBlock guard — 合法位置時回傳有效程式碼 | 單元 | P1 |
| T11 | `controls_duration` guard（Arduino 專用）| 單元 | P2 |
| T12 | Generator-specific 警告訊息文字驗證 | 單元 | P2 |
| T13 | `singular_flow_statements` onchange 整合 — 孤立警告優先於迴圈警告 | 手動 | P2 |
| T14 | 複製貼上孤立積木後觸發警告 | 手動 | P2 |
| T15 | Undo/Redo 後警告狀態正確更新 | 手動 | P2 |

---

### RN-007：`blocklyEdit.js` 修改判定

plan.md 原標記 `blocklyEdit.js` 為「可能修改」。根據 block-warning-events.md 合約 3 的結論：

> 「不需要額外的 workspace change listener — Blockly 的 onchange 機制已涵蓋所有需要的觸發場景」

**結論**: `blocklyEdit.js` 預計不需要修改。已更新專案結構中的註解。若實作時發現特定事件（如 generator 模式切換）需要 workspace listener，再行評估。

---

### RN-008：合約中 onchange 的 generator 模式偵測未規範

block-warning-events.md 合約 1 的 onchange 範例使用固定的 i18n 鍵與固定的 fallback 訊息（提及 setup/loop）。但依 RN-001（generator-specific i18n），onchange 需知道當前 generator 模式以選擇正確的鍵值。

**TODO**: 實作時需確認如何在 block.onchange 內偵測當前 generator 模式。可行方案：
1. 檢查 `window.arduinoGenerator` 或 `window.micropythonGenerator` 是否為活躍 generator
2. 使用全域變數（如 `window.currentGeneratorType`）
3. 由 `blocklyEdit.js` 在 generator 切換時設定模式標記