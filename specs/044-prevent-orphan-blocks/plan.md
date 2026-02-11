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
│   ├── en/messages.js                  # 修改：新增 ORPHAN_BLOCK_WARNING 鍵值
│   ├── zh-hant/messages.js             # 修改：新增 ORPHAN_BLOCK_WARNING 鍵值
│   └── [其他 13 個語系]/messages.js     # 修改：新增 ORPHAN_BLOCK_WARNING 鍵值
└── js/
    └── blocklyEdit.js                  # 可能修改：workspace change listener 觸發 orphan 檢查

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