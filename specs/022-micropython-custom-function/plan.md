# Implementation Plan: MicroPython Custom Function Generator

**Branch**: `022-micropython-custom-function` | **Date**: 2025-12-31 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/022-micropython-custom-function/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

為 `arduino_function` 和 `arduino_function_call` 積木提供 MicroPython 程式碼生成器，使 CyberBrick Python 模式下的自訂函數功能正常運作。目前使用者在 CyberBrick 主板選擇自訂函數積木時，會出現 "MicroPython generator does not know how to generate code" 錯誤。

**技術方案**:

1. 在 `media/blockly/generators/micropython/functions.js` 新增 `arduino_function` 和 `arduino_function_call` 的 MicroPython 生成器
2. 將 `arduino_function` 加入 `allowedTopLevelBlocks_` 清單，確保函數定義在頂層生成
3. 使用 `micropythonGenerator.addFunction()` 註冊函數到 functions\_ 區塊
4. Python 函數忽略參數型別（Arduino 的 int/float/String/bool 在 Python 中無需宣告）

## Technical Context

**Language/Version**: JavaScript (ES6+), MicroPython 目標程式碼  
**Primary Dependencies**: Blockly 12.3.1, 現有 `micropythonGenerator` 生成器框架  
**Storage**: N/A（純程式碼生成，無儲存需求）  
**Testing**: 手動測試（WebView 互動），程式碼生成結果驗證  
**Target Platform**: VS Code Extension WebView (Browser Context)  
**Project Type**: VSCode Extension（Extension Host + WebView 雙層架構）  
**Performance Goals**: 程式碼生成 <1 秒（100 個區塊）  
**Constraints**: 生成的 Python 程式碼必須符合語法規範，可直接在 CyberBrick REPL 執行  
**Scale/Scope**: 影響檔案數量 1-2 個（`functions.js`, 可能 `index.js`）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態    | 備註                                               |
| ------------------------------------- | ------- | -------------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ 通過 | 沿用現有生成器模式，程式碼簡潔明瞭                 |
| II. Modularity and Extensibility      | ✅ 通過 | 新增生成器不影響現有 Arduino 生成器                |
| III. Avoid Over-Development           | ✅ 通過 | 僅實作 spec 中定義的必要功能（無回傳值函數）       |
| IV. Flexibility and Adaptability      | ✅ 通過 | 支援中文函數名稱（Python 3 Unicode 識別符）        |
| V. Research-Driven Development        | ✅ 通過 | 已研究現有 `arduino_function` 積木結構與生成器模式 |
| VI. Structured Logging                | ✅ 通過 | WebView 環境使用 `console.log('[blockly]')` 格式   |
| VII. Comprehensive Test Coverage      | ✅ 通過 | UI 測試例外適用，將使用手動測試驗證                |
| VIII. Pure Functions                  | ✅ 通過 | 生成器為純函數，相同輸入產生相同輸出               |
| IX. Traditional Chinese Documentation | ✅ 通過 | 所有文件使用繁體中文                               |
| X. Professional Release Management    | N/A     | 此為 bug fix，不涉及新版本發布                     |

**Gate Result**: ✅ 全部通過，可進行 Phase 0 研究

## Project Structure

### Documentation (this feature)

```text
specs/022-micropython-custom-function/
├── plan.md              # 本文件
├── research.md          # Phase 0: 技術研究
├── data-model.md        # Phase 1: 資料模型定義
├── quickstart.md        # Phase 1: 快速入門指南
├── contracts/           # Phase 1: API 合約（本功能不需要）
└── tasks.md             # Phase 2: 任務分解（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
media/blockly/
├── blocks/
│   └── functions.js           # 函數積木定義（已存在，無需修改）
└── generators/
    ├── arduino/
    │   └── functions.js       # Arduino 函數生成器（參考用）
    └── micropython/
        ├── index.js           # MicroPython 生成器主檔（需修改 allowedTopLevelBlocks_）
        └── functions.js       # MicroPython 函數生成器（需新增 arduino_function 支援）
```

**Structure Decision**: 使用現有專案結構，僅修改 `generators/micropython/` 目錄下的檔案。
無需新增目錄或變更架構。

## Complexity Tracking

> 無違反憲法原則，此區塊留空。
