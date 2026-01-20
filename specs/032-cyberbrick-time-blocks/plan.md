# Implementation Plan: CyberBrick 時間回傳值積木

**Branch**: `032-cyberbrick-time-blocks` | **Date**: 2026-01-20 | **Spec**: E:/singular-blockly/specs/032-cyberbrick-time-blocks/spec.md
**Input**: Feature specification from `/specs/032-cyberbrick-time-blocks/spec.md`

## Summary

新增兩個 CyberBrick 時間回傳值積木（取得目前毫秒數、計算時間差），並同步更新 MicroPython 產碼、工具箱、15 語系文字、產品文件與 MCP 積木字典。研究階段確認官方計時行為與在地化用詞依據，設計階段補齊資料模型與字典契約，最後完成可驗證的快速上手流程。

## Technical Context

**Language/Version**: TypeScript (ES2023)、Node.js 22.16.0+  
**Primary Dependencies**: Blockly 12.3.1、@blockly/theme-modern 7.0.1、VS Code API  
**Storage**: Workspace 檔案（blockly/main.json）、產生碼檔案、MCP 字典 JSON  
**Testing**: Mocha + Sinon + @vscode/test-electron  
**Target Platform**: VS Code 擴充套件（VS Code >= 1.105.0）、Webview + Extension Host  
**Project Type**: single（VS Code extension + webview）  
**Performance Goals**: 維持既有 Blockly 互動流暢度（拖曳/搜尋無可感知延遲）  
**Constraints**: 15 語系 i18n 一致性、僅 CyberBrick 可見、MCP 字典須同步更新  
**Scale/Scope**: 2 個新積木、1 個時間類別區塊、1 個產碼檔案、15 語系訊息、1 份文件與 1 份 MCP 字典更新

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- 原則 I（簡潔可維護）：通過，採用既有積木結構與命名慣例。
- 原則 II（模組化與可擴充）：通過，新增積木不影響既有模組。
- 原則 III（避免過度開發）：通過，僅新增必要的兩個積木與支援資產。
- 原則 V（研究驅動）：通過，研究官方計時行為與在地化詞彙來源。
- 原則 VII（測試覆蓋）：通過，規劃 MCP 字典與產碼檢核的測試與手動驗證。
- 原則 IX（繁體中文文件）：通過，所有規格與計畫文件維持繁體中文。

**Phase 1 後復核**：通過（研究與設計產物符合原則要求）。

## Project Structure

### Documentation (this feature)

```text
E:/singular-blockly/specs/032-cyberbrick-time-blocks/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
E:/singular-blockly/
├── src/
│   ├── mcp/
│   │   ├── blockDictionary.ts
│   │   └── block-dictionary.json
│   └── test/
│       └── mcp/
├── media/
│   ├── blockly/blocks/cyberbrick.js
│   ├── blockly/generators/micropython/cyberbrick.js
│   ├── toolbox/categories/cyberbrick_core.json
│   └── locales/
├── docs/specifications/03-hardware-support/cyberbrick-micropython.md
└── scripts/generate-block-dictionary.js
```

**Structure Decision**: 單一 VS Code 擴充專案結構，依既有 `media/` 與 `src/` 分工擴充 CyberBrick 積木與 MCP 字典。

## Complexity Tracking

無違反憲法原則之必要複雜度，無需追蹤。
