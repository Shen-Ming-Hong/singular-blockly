# Implementation Plan: Blockly 積木 JSON 序列化修復

**Branch**: `014-block-serialization-fix` | **Date**: 2025-12-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-block-serialization-fix/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復 5 個 encoder 積木（`encoder_setup`, `encoder_read`, `encoder_reset`, `encoder_pid_setup`, `encoder_pid_compute`）的 JSON 序列化問題。這些積木目前只有 XML 序列化 hooks（`mutationToDom`/`domToMutation`），缺少 Blockly 12.x 優先使用的 JSON hooks（`saveExtraState`/`loadExtraState`），導致連接到其他積木的 value blocks 在保存後變成獨立積木，程式碼生成到錯誤位置造成編譯失敗。

**技術方案**:

1. 為 5 個 encoder 積木添加 `saveExtraState` / `loadExtraState` JSON 序列化 hooks
2. 保留現有 XML hooks 確保向後相容舊版 `main.json`
3. 在 `arduinoGenerator` 中實作 `scrubNakedValue` 防護機制

## Technical Context

**Language/Version**: JavaScript (ES2022) / TypeScript 5.9.3  
**Primary Dependencies**: Blockly 12.3.1, VS Code Extension API 1.96.0+  
**Storage**: JSON 檔案 (`{workspace}/blockly/main.json`)  
**Testing**: Mocha/Sinon（VS Code Extension 測試框架）+ 手動 WebView 測試  
**Target Platform**: VS Code Extension (Windows/macOS/Linux)  
**Project Type**: Single（VS Code Extension + WebView）  
**Performance Goals**: 序列化/反序列化 ≤100ms，程式碼生成 ≤50ms  
**Constraints**: 向後相容舊版 `main.json`（XML extraState 格式）  
**Scale/Scope**: 本次修復 5 個 encoder 積木（後續版本處理 servo、function 等）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                  | 狀態    | 說明                                                          |
| ------------------------------------- | ------- | ------------------------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ PASS | 採用與現有 XML hooks 對稱的 JSON hooks 設計，維護者可輕鬆理解 |
| II. Modularity and Extensibility      | ✅ PASS | 修改僅限於 `motors.js` 積木定義，不影響其他模組               |
| III. Avoid Over-Development           | ✅ PASS | 本次僅修復 5 個 encoder 積木，其他積木延後處理                |
| IV. Flexibility and Adaptability      | ✅ PASS | 同時支援 JSON 和 XML 序列化，向後相容舊版檔案                 |
| V. Research-Driven Development        | ✅ PASS | 已透過 MCP 工具驗證 Blockly 12.x 序列化 API                   |
| VI. Structured Logging                | ✅ PASS | 沿用現有 `log.info/warn` 模式                                 |
| VII. Comprehensive Test Coverage      | ⚠️ 例外 | WebView 測試使用手動測試（符合 Constitution 例外條款）        |
| VIII. Pure Functions                  | ✅ PASS | `saveExtraState` 是純函數，無副作用                           |
| IX. Traditional Chinese Documentation | ✅ PASS | 本計畫以繁體中文撰寫                                          |
| X. Professional Release Management    | N/A     | 不涉及版本發布                                                |

**Gate 結果**: ✅ 通過（1 項例外已符合規範說明）

## Project Structure

### Documentation (this feature)

```text
specs/014-block-serialization-fix/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Single project (VS Code Extension)
media/
├── blockly/
│   ├── blocks/
│   │   └── motors.js          # 修改：添加 saveExtraState/loadExtraState
│   └── generators/
│       └── arduino/
│           └── index.js       # 修改：添加 scrubNakedValue 方法
└── js/
    └── blocklyEdit.js         # 不需修改（序列化由 Blockly API 處理）

src/
├── test/
│   └── serialization.test.ts  # 新增：序列化單元測試（如需要）
└── webview/
    └── messageHandler.ts      # 不需修改
```

**Structure Decision**: 採用 Single project 結構。修改集中於 `media/blockly/` 目錄下的積木定義和程式碼生成器，符合現有專案架構。

## Complexity Tracking

本功能無 Constitution 違規需要額外證明。

| 違規項目 | 說明                       |
| -------- | -------------------------- |
| 無       | 所有原則均已通過，無需追蹤 |

---

## Phase 1 完成後的 Constitution 再評估

_Re-check after Phase 1 design_

| 原則                                  | 狀態    | Phase 1 變更說明                               |
| ------------------------------------- | ------- | ---------------------------------------------- |
| I. Simplicity and Maintainability     | ✅ PASS | 設計維持簡單，JSON hooks 與 XML hooks 結構對稱 |
| II. Modularity and Extensibility      | ✅ PASS | 資料模型清晰，未來可輕鬆擴展到其他積木         |
| III. Avoid Over-Development           | ✅ PASS | 僅定義必要的 3 種 ExtraState 類型              |
| IV. Flexibility and Adaptability      | ✅ PASS | 雙格式支援已在資料模型中詳細記錄               |
| V. Research-Driven Development        | ✅ PASS | 研究報告完整記錄 API 驗證結果                  |
| VIII. Pure Functions                  | ✅ PASS | `saveExtraState` 定義為純函數                  |
| IX. Traditional Chinese Documentation | ✅ PASS | 所有文件均使用繁體中文                         |

**Phase 1 Gate 結果**: ✅ 通過，可進入 Phase 2 任務分解

---

## 生成的產物

| 檔案                           | Phase | 說明                    |
| ------------------------------ | ----- | ----------------------- |
| [plan.md](plan.md)             | Setup | 實作計畫（本檔案）      |
| [research.md](research.md)     | 0     | 技術研究報告            |
| [data-model.md](data-model.md) | 1     | ExtraState 資料模型定義 |
| [quickstart.md](quickstart.md) | 1     | 開發者快速入門指南      |
