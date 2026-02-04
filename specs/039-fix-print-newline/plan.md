# Implementation Plan: 修復 CyberBrick Print 積木換行控制

**Branch**: `039-fix-print-newline` | **Date**: 2026年2月4日 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/039-fix-print-newline/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復 `text_print` 積木在 MicroPython 程式碼產生器中的換行控制功能。目前不論 NEW_LINE checkbox 是否勾選,產生的程式碼都會自動換行。修復方式為在 Generator 函數中讀取 checkbox 值,並根據狀態決定是否添加 `end=""` 參數到 `print()` 函數。

**技術方法**:

- 讀取 `block.getFieldValue('NEW_LINE')` 並與 `'TRUE'` 比較
- 使用三元運算子條件式生成: `print(${msg}${newLine ? '' : ', end=""'})`
- 參考 Arduino generator 的實作模式確保跨平台一致性
- 採用文件化測試 + 手動驗證的測試策略

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension), JavaScript ES2020 (Generator), MicroPython (Target Platform)  
**Primary Dependencies**: Blockly 12.3.1, VSCode API 1.105.0+, Mocha + Sinon (測試)  
**Storage**: 檔案系統 (blockly/main.json for workspace state, main.py for generated code)  
**Testing**: Mocha + Sinon (文件化測試) + 手動驗證 (Extension Development Host + CyberBrick 硬體)  
**Target Platform**: VSCode Extension (Node.js) + WebView (Browser) + CyberBrick 硬體 (MicroPython)
**Project Type**: 單一專案 (VSCode Extension with WebView architecture)  
**Performance Goals**: 即時程式碼生成 (<100ms per block), 無感知的 workspace 儲存 (<50ms)  
**Constraints**: 必須與 Arduino 版本行為一致 (跨平台等價性), 符合 Python 語法規範, 15 種語言 i18n 支援  
**Scale/Scope**: 單一積木修復, 影響 1 個檔案 (`media/blockly/generators/micropython/text.js`), 新增 2 行程式碼

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Phase 0 Check (Pre-Research) - ✅ PASSED

| Principle                   | Status         | Notes                                              |
| --------------------------- | -------------- | -------------------------------------------------- |
| I. Simplicity               | ✅ PASS        | 修復僅需新增 2 行程式碼,邏輯清晰簡單               |
| II. Modularity              | ✅ PASS        | Generator 函數是獨立模組,修改不影響其他部分        |
| III. Avoid Over-Development | ✅ PASS        | 僅修復必要功能,無額外特性                          |
| IV. Flexibility             | ✅ PASS        | 支援 Arduino 和 MicroPython 雙平台                 |
| V. Research-Driven          | 🔄 IN PROGRESS | 需完成 Phase 0 研究                                |
| VI. Structured Logging      | N/A            | Generator 不使用 logging                           |
| VII. Test Coverage          | ⚠️ MODIFIED    | 採用文件化測試策略 (符合憲章 UI Testing Exception) |
| VIII. Pure Functions        | ✅ PASS        | Generator 是純函數,無副作用                        |
| IX. Traditional Chinese     | ✅ PASS        | 所有規劃文件使用繁體中文                           |
| X. Release Management       | N/A            | 未到發布階段                                       |
| XI. Agent Skills            | N/A            | 不涉及 skills 開發                                 |

**Gate Decision**: ✅ **PASS** - 可進入 Phase 0 研究階段

**Justifications**:

- **Principle VII (Test Coverage)**: 採用憲章認可的文件化測試模式,因為 Blockly Generator 在 WebView 環境執行,完整自動化測試成本過高且容易誤導。參考 `src/test/suite/code-generation.test.ts` 的現有模式。

---

### Phase 1 Check (Post-Design) - ✅ PASSED

| Principle            | Status  | Notes                                                                                             |
| -------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| V. Research-Driven   | ✅ PASS | 已完成 [research.md](research.md): MicroPython API、Blockly Field API、Arduino 參考實作、測試策略 |
| VII. Test Coverage   | ✅ PASS | 已設計文件化測試 + 手動驗證流程,符合專案慣例                                                      |
| VIII. Pure Functions | ✅ PASS | Generator 設計確認為純函數: `(block) => string`,無全域狀態修改                                    |

**Gate Decision**: ✅ **PASS** - 可進入 Phase 2 實作階段

**Design Verification**:

- ✅ [data-model.md](data-model.md) 完整定義實體關係
- ✅ [contracts/](contracts/) 定義 Block 和 Generator 介面契約
- ✅ [quickstart.md](quickstart.md) 提供開發者指南
- ✅ Agent 上下文已更新 (`.github/agents/copilot-instructions.md`)

**No Violations** - 無需填寫 Complexity Tracking 表格

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# VSCode Extension 單一專案結構 (Two-Context System)

src/
├── extension.ts              # Extension 入口
├── mcp/                       # MCP Server
│   ├── mcpServer.ts
│   └── tools/
├── services/                  # 業務邏輯層
│   ├── fileService.ts
│   ├── logging.ts
│   └── ...
├── webview/                   # WebView 管理
│   ├── webviewManager.ts
│   └── messageHandler.ts
├── test/
│   ├── suite/                 # 單元測試
│   │   ├── code-generation.test.ts   # 文件化測試參考
│   │   └── text-print-generation.test.ts  # 本功能測試 (新增)
│   └── helpers/
│       └── mocks.ts
└── types/                     # TypeScript 類型定義
    └── arduino.ts

media/
├── blockly/
│   ├── blocks/
│   │   └── arduino.js         # text_print 積木定義 (不修改)
│   └── generators/
│       ├── arduino/
│       │   └── text.js        # Arduino Generator (參考)
│       └── micropython/
│           └── text.js        # 🎯 修改目標檔案
├── html/
│   └── blocklyEdit.html       # WebView HTML
├── js/
│   └── blocklyEdit.js         # WebView JavaScript
└── locales/                   # 15 種語言翻譯 (不修改)
    ├── en/messages.js
    ├── zh-hant/messages.js
    └── ...
```

**Structure Decision**: 採用 **單一專案結構** (VSCode Extension),因為這是一個 VSCode Extension 專案,使用 Extension Host (Node.js) + WebView (Browser) 的雙上下文架構。修改僅影響 WebView 環境中的 MicroPython Generator 檔案。

**關鍵檔案定位**:

- **修改目標**: `media/blockly/generators/micropython/text.js` (唯一需要修改的檔案)
- **測試檔案**: `src/test/suite/text-print-generation.test.ts` (新增文件化測試)
- **參考實作**: `media/blockly/generators/arduino/text.js` (Arduino 版本,功能正常)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No Violations** - 本功能完全符合憲章所有相關原則,無需複雜度例外說明。
