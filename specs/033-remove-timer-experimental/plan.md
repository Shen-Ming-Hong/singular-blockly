# Implementation Plan: 移除 CyberBrick Timer 實驗標記

**Branch**: `033-remove-timer-experimental` | **Date**: 2026-01-21 | **Spec**: `E:\singular-blockly\specs\033-remove-timer-experimental\spec.md`
**Input**: Feature specification from `E:\singular-blockly\specs\033-remove-timer-experimental\spec.md`

**備註**：此模板由 `/speckit.plan` 產生，執行流程請參考 `.specify/templates/agent-file-template.md`。

## Summary

依規格移除 CyberBrick 的 `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff` 兩個 Timer 積木實驗標記，讓工具箱與工作區不再顯示實驗提示或視覺標記，同時保留其他實驗積木的提示行為；文件更新延後至 PR 發布。

## Technical Context

**Language/Version**: TypeScript（ES2023）＋ WebView JavaScript  
**Primary Dependencies**: Blockly 12.3.1、VS Code API 1.105.0+、@modelcontextprotocol/sdk 1.24.3  
**Storage**: N/A（沿用既有工作區 JSON/記憶體狀態）  
**Testing**: Mocha + Sinon + @vscode/test-electron；WebView 互動採手動驗證  
**Target Platform**: VS Code Extension（桌面版）  
**Project Type**: VS Code 擴充功能（單一專案）  
**Performance Goals**: 維持現有 UI 互動流暢度，無新增效能目標  
**Constraints**: 不影響其他實驗積木提示；僅處理兩個 Timer 積木；文件更新延後 PR  
**Scale/Scope**: 僅限 `cyberbrick_ticks_ms`/`cyberbrick_ticks_diff` 兩個積木類型

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 原則 I（簡潔可維護）：變更僅移除實驗標記來源，符合
- 原則 II（模組化）：不改動核心架構，符合
- 原則 III（避免過度開發）：僅處理指定積木範圍，符合
- 原則 V（研究驅動）：無新增外部依賴，依現有程式碼與規格決策，符合
- 原則 VII（測試覆蓋）：WebView 手動測試在規格中明確列出，符合例外條款
- 原則 IX（繁中規格）：本計畫與產出文件皆為繁體中文，符合
- Phase 1 設計後複檢：通過

## Project Structure

### Documentation (this feature)

```text
specs/033-remove-timer-experimental/
├── plan.md              # 本檔案 (/speckit.plan)
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
├── contracts/           # Phase 1 輸出
└── tasks.md             # Phase 2 輸出 (/speckit.tasks)
```

### Source Code (repository root)

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

**Structure Decision**: 本功能屬單一 VS Code 擴充專案，沿用 `src/` 與 `media/` 既有結構，無需新增子專案或新層級。

## Complexity Tracking

無（未發現憲法違反，無需額外說明）。
