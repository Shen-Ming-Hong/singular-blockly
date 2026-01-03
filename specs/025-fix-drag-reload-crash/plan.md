# Implementation Plan: 修復拖曳時 FileWatcher 重載崩潰問題

**Branch**: `025-fix-drag-reload-crash` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/025-fix-drag-reload-crash/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

修復 FileWatcher 在拖曳期間觸發 loadWorkspace 導致積木消失和 UI 鎖定的競態條件問題。主要變更包括：

1. 在拖曳期間延遲 FileWatcher 重載請求，待拖曳結束後執行
2. 新增剪貼簿操作鎖定機制，防止在 Ctrl+C/V/X 處理期間觸發不完整儲存
3. 將自動儲存 debounce 時間從 150ms 調整為 300ms
4. 更新 Blockly Variable API 為新版（`workspace.getVariableMap().getVariableById()`）以消除棄用警告
5. 強化 Extension 端的內部更新保護機制，使用計數器替代布林旗標並延長保護視窗至 2000ms

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) / JavaScript ES2022 (WebView)  
**Primary Dependencies**: Blockly 12.3.1, VSCode API 1.105.0+, MCP SDK 1.24.3  
**Storage**: JSON 檔案 (`main.json` 工作區狀態, `.bak` 備份)  
**Testing**: 手動測試為主（WebView 互動），VSCode Test CLI 用於 Extension 側  
**Target Platform**: VSCode Extension (跨平台: Windows, macOS, Linux)
**Project Type**: Two-Context System (Extension Host + WebView)  
**Performance Goals**: 拖曳操作流暢 (60fps)，自動儲存延遲 <500ms  
**Constraints**: 不得破壞現有備份機制，不得影響 Undo Stack，記憶體占用維持現況  
**Scale/Scope**: 單一 WebView 編輯器，主要影響 `blocklyEdit.js` 和 `functions.js`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                           | 狀態    | 說明                                                     |
| ---------------------------------------------- | ------- | -------------------------------------------------------- |
| I. Simplicity and Maintainability              | ✅ PASS | 新增旗標和計時器是直接的解決方案，易於理解和維護         |
| II. Modularity and Extensibility               | ✅ PASS | 變更集中在 `blocklyEdit.js` 的事件處理器，不影響其他模組 |
| III. Avoid Over-Development                    | ✅ PASS | 只實作解決問題所需的最小功能集                           |
| IV. Flexibility and Adaptability               | ✅ PASS | 透過旗標控制行為，未來可調整參數                         |
| V. Research-Driven Development                 | ✅ PASS | 需研究 Blockly API 拖曳事件和 v13 變數 API 變更          |
| VI. Structured Logging                         | ✅ PASS | 使用現有 `log.*` 方法記錄狀態變更                        |
| VII. Comprehensive Test Coverage               | ✅ PASS | 符合 WebView UI Testing Exception，將使用手動測試        |
| VIII. Pure Functions and Modular Architecture  | ✅ PASS | 狀態檢查邏輯可提取為純函數                               |
| IX. Traditional Chinese Documentation Standard | ✅ PASS | 所有文件使用繁體中文                                     |
| X. Professional Release Management             | N/A     | 非發布相關變更                                           |

## Project Structure

### Documentation (this feature)

```text
specs/025-fix-drag-reload-crash/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Two-Context System: VSCode Extension + WebView
media/
├── js/
│   └── blocklyEdit.js       # 主要修改：拖曳鎖定、剪貼簿操作、loadWorkspace 延遲
├── blockly/
│   └── blocks/
│       └── functions.js     # 修改：更新棄用的 Variable API 呼叫

src/
└── webview/
    ├── webviewManager.ts    # 修改：內部更新計數器機制、FileWatcher 保護視窗延長
    └── messageHandler.ts    # 可能需要修改：FileWatcher 觸發源標記
```

**Structure Decision**: 此功能主要在 WebView 層 (`blocklyEdit.js`) 實作競態條件保護。Extension 側 (`messageHandler.ts`) 可能需要在發送 `loadWorkspace` 訊息時加入來源標記，以便 WebView 區分 FileWatcher 觸發和其他來源。Extension 側的 `webviewManager.ts` 需要強化內部更新保護機制，使用計數器替代布林旗標以處理連續快速儲存和檔案系統延遲的情況。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

無違規，無需填寫。
