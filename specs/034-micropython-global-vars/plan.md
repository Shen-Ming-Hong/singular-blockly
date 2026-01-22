# Implementation Plan: MicroPython 全域變數提升

**Branch**: `034-micropython-global-vars` | **Date**: 2026-01-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/034-micropython-global-vars/spec.md`

## Summary

將使用者變數從 `main()` 函式提升到全域區段 `[3] Global Variables`，讓自訂函式可存取。透過追蹤變數賦值位置，在函式內有賦值時自動插入 `global` 宣告。

## Technical Context

**Language/Version**: JavaScript (ES6+) — WebView 瀏覽器環境  
**Primary Dependencies**: Blockly 12.3.1 (Generator API)  
**Storage**: N/A（生成器不持久化狀態）  
**Testing**: 手動測試 + 現有生成器測試確認無回歸  
**Target Platform**: VSCode WebView (Chromium)  
**Project Type**: VSCode Extension (WebView JavaScript)  
**Performance Goals**: 生成程式碼時間 < 100ms（現有效能已足夠）  
**Constraints**: 不改變生成程式碼的輸出結構、保持向後相容  
**Scale/Scope**: 修改 4 個 JS 檔案 (index.js, variables.js, functions.js, loops.js)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                         | 狀態      | 說明                                                    |
| ---------------------------- | --------- | ------------------------------------------------------- |
| I. Simplicity                | ✅ Pass   | 最小修改：新增 2 個追蹤變數 + 修改 3 個積木生成器       |
| II. Modularity               | ✅ Pass   | 追蹤邏輯集中在 index.js，積木生成器只呼叫 API           |
| III. Avoid Over-Development  | ✅ Pass   | 只實作必要功能，不處理巢狀函式等進階情境                |
| IV. Flexibility              | ✅ Pass   | 使用既有的 `addVariable()` API，易於擴展                |
| VI. Structured Logging       | ✅ Pass   | 使用 `console.log('[blockly] ...')` 格式                |
| VII. Test Coverage           | ⚠️ Manual | WebView 生成器使用手動測試（符合 UI Testing Exception） |
| VIII. Pure Functions         | ✅ Pass   | 追蹤狀態在 `init()`/`finish()` 管理，函式內無副作用     |
| IX. Traditional Chinese Docs | ✅ Pass   | 本文件使用繁體中文                                      |

## Project Structure

### Documentation (this feature)

```text
specs/034-micropython-global-vars/
├── plan.md              # 本檔案
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
├── contracts/           # N/A（無 API 合約）
└── tasks.md             # Phase 2 輸出
```

### Source Code (repository root)

```text
media/blockly/generators/micropython/
├── index.js             # 核心生成器：新增追蹤結構 + 修改 finish()
├── variables.js         # 修改 variables_set：呼叫 addVariable() + 追蹤賦值
├── functions.js         # 修改函式生成：設定 currentFunction_ + 插入 global
└── loops.js             # 確認迴圈變數不觸發 addVariable()（現況已正確）
```

**Structure Decision**: 直接修改現有 MicroPython 生成器目錄下的 4 個 JS 檔案，無需新增檔案。

## Complexity Tracking

> 無違規需要說明。本功能遵循所有憲法原則。
