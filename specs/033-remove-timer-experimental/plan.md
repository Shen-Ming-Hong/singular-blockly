# 實作計畫：移除 CyberBrick Timer 實驗標記

**分支**：`033-remove-timer-experimental` | **日期**：2026-01-21 | **規格**：`E:\singular-blockly\specs\033-remove-timer-experimental\spec.md`
**輸入**：功能規格來源 `E:\singular-blockly\specs\033-remove-timer-experimental\spec.md`

**備註**：此模板由 `/speckit.plan` 產生，執行流程請參考 `.specify/templates/agent-file-template.md`。

## 摘要

依規格移除 CyberBrick 的 `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff` 兩個 Timer 積木實驗標記，讓工具箱與工作區不再顯示實驗提示或視覺標記，同時保留其他實驗積木的提示行為；文件更新延後至 PR 發布。

## 技術脈絡

**語言/版本**：TypeScript（ES2023）＋ WebView JavaScript  
**主要依賴**：Blockly 12.3.1、VS Code API 1.105.0+、@modelcontextprotocol/sdk 1.24.3  
**儲存**：不適用（沿用既有工作區 JSON/記憶體狀態）  
**測試**：Mocha + Sinon + @vscode/test-electron；WebView 互動採手動驗證  
**目標平台**：VS Code 擴充功能（桌面版）  
**專案類型**：VS Code 擴充功能（單一專案）  
**效能目標**：維持現有 UI 互動流暢度，無新增效能目標  
**限制**：不影響其他實驗積木提示；僅處理兩個 Timer 積木；文件更新延後 PR  
**範圍**：僅限 `cyberbrick_ticks_ms`/`cyberbrick_ticks_diff` 兩個積木類型

## 憲法檢核

*門檻：在第 0 階段研究前必須通過；第 1 階段設計後需再檢核。*

- 原則 I（簡潔可維護）：變更僅移除實驗標記來源，符合
- 原則 II（模組化）：不改動核心架構，符合
- 原則 III（避免過度開發）：僅處理指定積木範圍，符合
- 原則 V（研究驅動）：無新增外部依賴，依現有程式碼與規格決策，符合
- 原則 VII（測試覆蓋）：WebView 手動測試在規格中明確列出，符合例外條款
- 原則 IX（繁中規格）：本計畫與產出文件皆為繁體中文，符合
- 第 1 階段設計後複檢：通過

## 專案結構

### 文件（本功能）

```text
specs/033-remove-timer-experimental/
├── plan.md              # 本檔案 (/speckit.plan)
├── research.md          # 第 0 階段輸出
├── data-model.md        # 第 1 階段輸出
├── quickstart.md        # 第 1 階段輸出
├── contracts/           # 第 1 階段輸出
└── tasks.md             # 第 2 階段輸出 (/speckit.tasks)
```

### 原始碼（repo 根目錄）

```text
src/
├── webview/
├── mcp/
└── test/

media/
├── blockly/
│   └── blocks/
│       └── cyberbrick.js
└── js/
    └── experimentalBlockMarker.js

scripts/
└── generate-block-dictionary.js

src/mcp/
└── block-dictionary.json
```

**結構決策**：本功能屬單一 VS Code 擴充專案，沿用 `src/` 與 `media/` 既有結構，無需新增子專案或新層級。

## 複雜度追蹤

無（未發現憲法違反，無需額外說明）。
